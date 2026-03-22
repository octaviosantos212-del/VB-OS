import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const project = db.prepare(`SELECT p.*, c.name as client_name, c.contact_name, c.contact_email, c.contact_phone, c.decision_maker
    FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?`).get(id);
  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });

  const deliverables = db.prepare(`SELECT d.*, u.name as assigned_name FROM deliverables d LEFT JOIN users u ON d.assigned_to = u.id WHERE d.project_id = ? ORDER BY d.created_at`).all(id);
  const tasks = db.prepare(`SELECT t.*, u.name as assigned_name FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE t.project_id = ? ORDER BY t.sort_order, t.created_at`).all(id);
  const comments = db.prepare(`SELECT cm.*, u.name as user_name, u.role as user_role FROM comments cm JOIN users u ON cm.user_id = u.id WHERE cm.project_id = ? ORDER BY cm.created_at DESC`).all(id);
  const alerts = db.prepare(`SELECT * FROM alerts WHERE project_id = ? AND resolved = 0 ORDER BY created_at DESC`).all(id);

  return NextResponse.json({ project, deliverables, tasks, comments, alerts });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const db = getDb();

  // Check if advancing phase - validate checklists
  if (data.status) {
    const phaseOrder = ['pre_sale', 'pre_event', 'event', 'post_event', 'delivery', 'closed'];
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    const currentIdx = phaseOrder.indexOf(project.status);
    const newIdx = phaseOrder.indexOf(data.status);

    if (newIdx > currentIdx) {
      // Check if PPM is required before event
      if (data.status === 'event' && !project.ppm_completed) {
        return NextResponse.json({ error: 'PPM deve ser completado antes do evento' }, { status: 400 });
      }
      // Check required checklists
      const incompleteRequired = db.prepare(
        "SELECT COUNT(*) as cnt FROM tasks WHERE project_id = ? AND phase = ? AND checklist_required = 1 AND status != 'done'"
      ).get(id, project.status) as any;
      if (incompleteRequired.cnt > 0) {
        return NextResponse.json({ error: `Existem ${incompleteRequired.cnt} itens obrigatórios pendentes na fase atual` }, { status: 400 });
      }
    }
  }

  // Build dynamic update
  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['name', 'status', 'risk', 'risk_reasons', 'complexity', 'package_type', 'city', 'venue',
    'start_date', 'end_date', 'event_days', 'delivery_deadline', 'revenue', 'variable_cost',
    'has_integra', 'has_sameday', 'ppm_completed', 'ppm_data', 'notes', 'is_exception', 'exception_approved'];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  // Recalc margin if revenue or cost changes
  if (data.revenue !== undefined || data.variable_cost !== undefined) {
    const project = db.prepare('SELECT revenue, variable_cost FROM projects WHERE id = ?').get(id) as any;
    const rev = data.revenue ?? project.revenue;
    const cost = data.variable_cost ?? project.variable_cost;
    const margin = rev > 0 ? Math.round(((rev - cost) / rev) * 100) : 0;
    fields.push('margin_percent = ?');
    values.push(margin);
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

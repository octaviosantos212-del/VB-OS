import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const clientId = searchParams.get('client_id');
  const month = searchParams.get('month');

  let query = `SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE 1=1`;
  const params: any[] = [];

  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (clientId) { query += ' AND p.client_id = ?'; params.push(clientId); }
  if (month) { query += " AND strftime('%Y-%m', p.start_date) = ?"; params.push(month); }

  if (user.role === 'freelancer') {
    query += ` AND p.id IN (SELECT DISTINCT project_id FROM tasks WHERE assigned_to = ?)`;
    params.push(user.id);
  }

  query += ' ORDER BY p.start_date DESC';
  const projects = db.prepare(query).all(...params);
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'producer'].includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const data = await req.json();
  const db = getDb();
  const id = uuid();

  // Calculate margin
  const revenue = data.revenue || 0;
  const cost = data.variable_cost || 0;
  const margin = revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100) : 0;

  // Check acceptance criteria
  let isException = 0;
  if (margin < 35) isException = 1;

  db.prepare(`INSERT INTO projects (id, name, client_id, template_id, status, risk, complexity, package_type,
    city, venue, start_date, end_date, event_days, delivery_deadline, revenue, variable_cost, margin_percent,
    has_integra, has_sameday, is_exception, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, data.name, data.client_id, data.template_id, 'pre_sale', data.risk || 'low',
      data.complexity || 'S', data.package_type || 'ONE_SHOT', data.city, data.venue,
      data.start_date, data.end_date, data.event_days || 1, data.delivery_deadline,
      revenue, cost, margin, data.has_integra ? 1 : 0, data.has_sameday ? 1 : 0, isException, user.id);

  // Clone template deliverables and tasks if template_id provided
  if (data.template_id) {
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(data.template_id) as any;
    if (template) {
      const deliverables = JSON.parse(template.default_deliverables || '[]');
      for (const d of deliverables) {
        db.prepare('INSERT INTO deliverables (id, project_id, type, title, sla_days) VALUES (?, ?, ?, ?, ?)')
          .run(uuid(), id, d.type, d.title, d.sla_days || 10);
      }
      // If has_integra, add integra tasks
      if (data.has_integra) {
        const hasIntegraDeliverable = deliverables.some((d: any) => d.type === 'integra');
        if (!hasIntegraDeliverable) {
          db.prepare('INSERT INTO deliverables (id, project_id, type, title, sla_days) VALUES (?, ?, ?, ?, ?)')
            .run(uuid(), id, 'integra', 'Íntegra Completa', 20);
        }
      }
      const tasks = JSON.parse(template.default_tasks || '[]');
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        db.prepare('INSERT INTO tasks (id, project_id, phase, title, priority, is_checklist_item, checklist_required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(uuid(), id, t.phase, t.title, t.priority || 'medium', t.checklist_required ? 1 : 0, t.checklist_required ? 1 : 0, i + 1);
      }
      // If has_integra, add integra editing tasks
      if (data.has_integra) {
        db.prepare('INSERT INTO tasks (id, project_id, phase, title, priority, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuid(), id, 'post_event', 'Edição da íntegra', 'medium', 100);
        db.prepare('INSERT INTO tasks (id, project_id, phase, title, priority, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuid(), id, 'delivery', 'Upload da íntegra', 'medium', 101);
      }
    }
  }

  // Generate alerts
  if (isException) {
    db.prepare('INSERT INTO alerts (id, project_id, type, message, severity) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), id, 'exception', `Projeto com margem abaixo de 35% (${margin}%). Requer aprovação do Admin.`, 'critical');
  }

  // Check monthly capacity
  if (data.start_date) {
    const monthStr = data.start_date.substring(0, 7);
    const monthProjects = db.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(event_days), 0) as total_days FROM projects WHERE strftime('%Y-%m', start_date) = ?").get(monthStr) as any;
    if (monthProjects.cnt >= 8) {
      db.prepare('INSERT INTO alerts (id, project_id, type, message, severity) VALUES (?, ?, ?, ?, ?)')
        .run(uuid(), id, 'capacity', `Alerta de capacidade: ${monthProjects.cnt + 1} eventos no mês ${monthStr}`, 'critical');
    }
    if (monthProjects.total_days + (data.event_days || 1) > 6) {
      db.prepare('INSERT INTO alerts (id, project_id, type, message, severity) VALUES (?, ?, ?, ?, ?)')
        .run(uuid(), id, 'capacity', `Alerta de capacidade: ${monthProjects.total_days + (data.event_days || 1)} dias de evento no mês ${monthStr}`, 'warning');
    }
  }

  return NextResponse.json({ id }, { status: 201 });
}

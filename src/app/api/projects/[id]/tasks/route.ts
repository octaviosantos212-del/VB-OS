import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id: projectId } = await params;
  const data = await req.json();
  const db = getDb();
  const taskId = uuid();

  db.prepare(`INSERT INTO tasks (id, project_id, phase, title, description, assigned_to, deadline, priority, is_checklist_item, checklist_required, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    taskId, projectId, data.phase, data.title, data.description || null,
    data.assigned_to || null, data.deadline || null, data.priority || 'medium',
    data.is_checklist_item ? 1 : 0, data.checklist_required ? 1 : 0, data.sort_order || 0
  );

  return NextResponse.json({ id: taskId }, { status: 201 });
}

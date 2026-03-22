import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id: projectId } = await params;
  const { content, task_id } = await req.json();
  const db = getDb();
  const commentId = uuid();

  db.prepare('INSERT INTO comments (id, task_id, project_id, user_id, content) VALUES (?, ?, ?, ?, ?)')
    .run(commentId, task_id || null, projectId, user.id, content);

  return NextResponse.json({ id: commentId }, { status: 201 });
}

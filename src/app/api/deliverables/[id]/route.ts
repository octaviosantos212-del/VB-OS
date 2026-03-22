import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const db = getDb();

  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['title', 'status', 'link', 'deadline', 'assigned_to', 'notes'];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE deliverables SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return NextResponse.json({ ok: true });
}

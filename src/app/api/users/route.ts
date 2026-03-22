import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  const users = db.prepare('SELECT id, name, email, role, active FROM users WHERE active = 1 ORDER BY name').all();
  return NextResponse.json({ users });
}

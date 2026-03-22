import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { compareSync } from 'bcryptjs';
import { createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email) as any;
  if (!user || !compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }
  const token = await createToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set('vb-token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 3600, path: '/' });
  return res;
}

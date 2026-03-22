import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const monthStr = `${year}-${String(m).padStart(2, '0')}`;
    const data = db.prepare(`SELECT COUNT(*) as event_count, COALESCE(SUM(event_days), 0) as total_days
      FROM projects WHERE strftime('%Y-%m', start_date) = ?`).get(monthStr) as any;

    const projects = db.prepare(`SELECT p.id, p.name, p.start_date, p.end_date, p.event_days, p.status, p.complexity, c.name as client_name
      FROM projects p LEFT JOIN clients c ON p.client_id = c.id
      WHERE strftime('%Y-%m', p.start_date) = ? ORDER BY p.start_date`).all(monthStr);

    // Post-production load: count unfinished deliverables with deadline in this month
    const postProdLoad = db.prepare(`SELECT COUNT(*) as cnt FROM deliverables
      WHERE strftime('%Y-%m', deadline) = ? AND status NOT IN ('delivered', 'approved')`).get(monthStr) as any;

    months.push({
      month: monthStr,
      event_count: data.event_count,
      total_days: data.total_days,
      post_prod_pending: postProdLoad.cnt,
      over_capacity_events: data.event_count > 8,
      over_capacity_days: data.total_days > 6,
      projects,
    });
  }

  return NextResponse.json({ year, months });
}

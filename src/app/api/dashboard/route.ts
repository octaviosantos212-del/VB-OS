import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const db = getDb();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Upcoming events (next 30 days)
  const upcoming = db.prepare(`SELECT p.*, c.name as client_name FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.start_date >= date('now') AND p.start_date <= date('now', '+30 days')
    AND p.status NOT IN ('closed')
    ORDER BY p.start_date`).all();

  // Overdue deliverables
  const overdueDeliverables = db.prepare(`SELECT d.*, p.name as project_name FROM deliverables d
    JOIN projects p ON d.project_id = p.id
    WHERE d.deadline < date('now') AND d.status NOT IN ('delivered', 'approved')
    ORDER BY d.deadline`).all();

  // Active projects by status
  const statusCounts = db.prepare(`SELECT status, COUNT(*) as count FROM projects
    WHERE status != 'closed' GROUP BY status`).all();

  // Month capacity
  const monthCapacity = db.prepare(`SELECT COUNT(*) as event_count, COALESCE(SUM(event_days), 0) as total_days
    FROM projects WHERE strftime('%Y-%m', start_date) = ?`).get(currentMonth);

  // Active alerts
  const alerts = db.prepare(`SELECT a.*, p.name as project_name FROM alerts a
    LEFT JOIN projects p ON a.project_id = p.id
    WHERE a.resolved = 0 ORDER BY
    CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, a.created_at DESC`).all();

  // Pending tasks this week
  const pendingTasks = db.prepare(`SELECT t.*, p.name as project_name, u.name as assigned_name
    FROM tasks t JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.status IN ('todo', 'in_progress') AND t.deadline <= date('now', '+7 days')
    ORDER BY t.deadline`).all();

  return NextResponse.json({
    upcoming,
    overdueDeliverables,
    statusCounts,
    monthCapacity,
    alerts,
    pendingTasks,
    currentMonth,
  });
}

'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { STATUS_LABELS, STATUS_COLORS, RISK_COLORS, RISK_LABELS, formatDate, daysUntil } from '@/lib/utils';
import { AlertTriangle, Calendar, Clock, Package, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const cap = data.monthCapacity as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/projects/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Novo Projeto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar className="text-blue-600" size={20} />} label="Eventos no Mês" value={cap?.event_count || 0}
          alert={cap?.event_count > 8} alertText="Capacidade excedida!" />
        <StatCard icon={<Clock className="text-orange-600" size={20} />} label="Dias de Evento" value={cap?.total_days || 0}
          alert={cap?.total_days > 6} alertText="Acima do limite!" />
        <StatCard icon={<Package className="text-red-600" size={20} />} label="Entregas Atrasadas" value={data.overdueDeliverables?.length || 0}
          alert={(data.overdueDeliverables?.length || 0) > 0} />
        <StatCard icon={<TrendingUp className="text-green-600" size={20} />} label="Projetos Ativos"
          value={(data.statusCounts || []).reduce((s: number, r: any) => s + r.count, 0)} />
      </div>

      {/* Alerts */}
      {data.alerts?.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-semibold">Alertas ({data.alerts.length})</h2>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {data.alerts.map((a: any) => (
              <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{a.message}</p>
                  {a.project_name && <p className="text-xs text-gray-500 mt-0.5">{a.project_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Proximos Eventos</h2>
          </div>
          <div className="divide-y">
            {data.upcoming?.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum evento nos proximos 30 dias</p>}
            {data.upcoming?.map((p: any) => {
              const days = daysUntil(p.start_date);
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.client_name} | {p.city} | {formatDate(p.start_date)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                      {days !== null && days <= 7 && <span className="text-xs text-orange-600 font-medium">{days}d</span>}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Overdue Deliverables */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-red-700">Entregas Atrasadas</h2>
          </div>
          <div className="divide-y">
            {data.overdueDeliverables?.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhuma entrega atrasada</p>}
            {data.overdueDeliverables?.map((d: any) => (
              <div key={d.id} className="px-4 py-3">
                <p className="font-medium text-sm text-gray-900">{d.title}</p>
                <p className="text-xs text-gray-500">{d.project_name} | Prazo: {formatDate(d.deadline)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending tasks this week */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Tarefas da Semana</h2>
        </div>
        <div className="divide-y max-h-80 overflow-y-auto">
          {data.pendingTasks?.length === 0 && <p className="p-4 text-sm text-gray-500">Nenhuma tarefa pendente esta semana</p>}
          {data.pendingTasks?.map((t: any) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500">{t.project_name} {t.assigned_name ? `| ${t.assigned_name}` : ''}</p>
              </div>
              <div className="text-xs text-gray-500">{formatDate(t.deadline)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, alert, alertText }: {
  icon: React.ReactNode; label: string; value: number; alert?: boolean; alertText?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${alert ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
      {alert && alertText && <p className="text-xs text-red-600 mt-2 font-medium">{alertText}</p>}
    </div>
  );
}

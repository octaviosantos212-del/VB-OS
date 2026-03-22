'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { cn, STATUS_LABELS, STATUS_COLORS, formatDate } from '@/lib/utils';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function CapacityPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/capacity?year=${year}`).then(r => r.json()).then(setData);
  }, [year]);

  if (!data) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Capacidade</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)} className="p-1.5 hover:bg-gray-200 rounded"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-lg">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-1.5 hover:bg-gray-200 rounded"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.months.map((m: any, idx: number) => (
          <div key={m.month} className={cn(
            'bg-white rounded-xl border shadow-sm',
            (m.over_capacity_events || m.over_capacity_days) && 'border-red-300'
          )}>
            <div className={cn(
              'p-3 border-b rounded-t-xl flex items-center justify-between',
              (m.over_capacity_events || m.over_capacity_days) ? 'bg-red-50' : 'bg-gray-50'
            )}>
              <h3 className="font-semibold text-sm">{MONTH_NAMES[idx]}</h3>
              {(m.over_capacity_events || m.over_capacity_days) && <AlertTriangle size={16} className="text-red-500" />}
            </div>
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div>
                  <p className={cn('text-xl font-bold', m.over_capacity_events ? 'text-red-600' : '')}>{m.event_count}</p>
                  <p className="text-xs text-gray-500">Eventos</p>
                </div>
                <div>
                  <p className={cn('text-xl font-bold', m.over_capacity_days ? 'text-red-600' : '')}>{m.total_days}</p>
                  <p className="text-xs text-gray-500">Dias</p>
                </div>
                <div>
                  <p className="text-xl font-bold">{m.post_prod_pending}</p>
                  <p className="text-xs text-gray-500">Pos-prod</p>
                </div>
              </div>
              {m.projects.length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  {m.projects.map((proj: any) => (
                    <div key={proj.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1">{proj.name}</span>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge className={STATUS_COLORS[proj.status] + ' text-[10px]'}>{STATUS_LABELS[proj.status]}</Badge>
                        <span className="text-gray-400">{proj.event_days}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {m.projects.length === 0 && <p className="text-xs text-gray-400 text-center">Nenhum evento</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="font-semibold text-sm mb-2">Limites de Capacidade</h3>
        <div className="flex gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>Mais de 8 eventos/mes ou 6 dias de evento/mes = alerta</span>
          </div>
        </div>
      </div>
    </div>
  );
}

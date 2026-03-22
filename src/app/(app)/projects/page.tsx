'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { STATUS_LABELS, STATUS_COLORS, RISK_COLORS, RISK_LABELS, COMPLEXITY_LABELS, formatDate } from '@/lib/utils';
import { Search, Filter, ChevronRight, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/projects?${params}`).then(r => r.json()).then(d => { setProjects(d.projects || []); setLoading(false); });
  }, [statusFilter]);

  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
        <Link href="/projects/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Novo Projeto
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, cliente ou cidade..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white">
          <option value="">Todos os Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {filtered.length === 0 && <p className="p-8 text-center text-gray-500">Nenhum projeto encontrado</p>}
          {filtered.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <Badge className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    <Badge className={RISK_COLORS[p.risk]}>{RISK_LABELS[p.risk]}</Badge>
                    <Badge className="bg-gray-100 text-gray-700">{COMPLEXITY_LABELS[p.complexity]}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>{p.client_name || 'Sem cliente'}</span>
                    <span>{p.city}</span>
                    <span>{formatDate(p.start_date)}{p.end_date && p.end_date !== p.start_date ? ` - ${formatDate(p.end_date)}` : ''}</span>
                    <span>{p.event_days}d</span>
                    {p.margin_percent > 0 && (
                      <span className={p.margin_percent < 35 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        Margem: {p.margin_percent}%
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 flex-shrink-0 ml-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

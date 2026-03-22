'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '', client_id: '', template_id: '', city: '', venue: '',
    start_date: '', end_date: '', event_days: 1, delivery_deadline: '',
    complexity: 'S', package_type: 'ONE_SHOT', risk: 'low',
    revenue: 0, variable_cost: 0, has_integra: false, has_sameday: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch('/api/clients').then(r => r.json()).then(d => setClients(d.clients || []));
  }, []);

  const margin = form.revenue > 0 ? Math.round(((form.revenue - form.variable_cost) / form.revenue) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setError('Erro ao criar projeto'); setSubmitting(false); return; }
    const { id } = await res.json();
    router.push(`/projects/${id}`);
  };

  const onTemplateChange = (templateId: string) => {
    setForm(f => ({ ...f, template_id: templateId }));
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      setForm(f => ({ ...f, complexity: tmpl.complexity, event_days: tmpl.default_days }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select value={form.template_id} onChange={e => onTemplateChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Sem template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.complexity})</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ex: TechSummit 2026" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Selecionar...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pacote</label>
            <select value={form.package_type} onChange={e => setForm(f => ({ ...f, package_type: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="ONE_SHOT">One Shot</option>
              <option value="PROGRAM">Programa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicio</label>
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Evento</label>
            <input type="number" min={1} value={form.event_days} onChange={e => setForm(f => ({ ...f, event_days: +e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Entrega</label>
            <input type="date" value={form.delivery_deadline} onChange={e => setForm(f => ({ ...f, delivery_deadline: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complexidade</label>
            <select value={form.complexity} onChange={e => setForm(f => ({ ...f, complexity: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="S">Simples</option>
              <option value="M">Medio</option>
              <option value="L">Grande</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risco</label>
            <select value={form.risk} onChange={e => setForm(f => ({ ...f, risk: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="low">Baixo</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3">Margem Estimada</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Receita (R$)</label>
              <input type="number" min={0} value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: +e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Custo Variavel (R$)</label>
              <input type="number" min={0} value={form.variable_cost} onChange={e => setForm(f => ({ ...f, variable_cost: +e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Margem</label>
              <div className={`px-3 py-2 border rounded-lg text-sm font-bold ${margin < 35 ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                {margin}%
              </div>
            </div>
          </div>
          {margin < 35 && margin > 0 && <p className="text-xs text-red-600 mt-2">Margem abaixo de 35%. Projeto sera marcado como excecao e requer aprovacao do Admin.</p>}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3">Entregaveis Extras</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_integra} onChange={e => setForm(f => ({ ...f, has_integra: e.target.checked }))} className="rounded" />
              Integra Completa
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_sameday} onChange={e => setForm(f => ({ ...f, has_sameday: e.target.checked }))} className="rounded" />
              Reels / Sameday
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Criando...' : 'Criar Projeto'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

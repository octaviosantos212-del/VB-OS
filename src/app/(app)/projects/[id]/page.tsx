'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/Badge';
import { useUser } from '@/components/AuthProvider';
import {
  STATUS_LABELS, STATUS_COLORS, RISK_LABELS, RISK_COLORS, COMPLEXITY_LABELS,
  PHASE_LABELS, TASK_STATUS_LABELS, DELIVERABLE_STATUS_LABELS, DELIVERABLE_TYPE_LABELS,
  formatDate, daysUntil, isOverdue, cn
} from '@/lib/utils';
import {
  AlertTriangle, CheckCircle2, Circle, Clock, ExternalLink, MessageSquare,
  ChevronDown, ChevronRight, Send, ArrowLeft, Play, Square, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'deliverables' | 'ppm' | 'comments'>('overview');
  const [comment, setComment] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const load = () => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(setData);
  };

  useEffect(() => { load(); fetch('/api/users').then(r => r.json()).then(d => setUsers(d.users || [])); }, [id]);

  if (!data) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const p = data.project;
  const phases = ['pre_sale', 'pre_event', 'event', 'post_event', 'delivery', 'closing'];
  const currentPhaseIdx = phases.indexOf(p.status === 'closed' ? 'closing' : p.status);

  const advancePhase = async () => {
    const nextIdx = currentPhaseIdx + 1;
    if (nextIdx >= phases.length) return;
    const nextStatus = phases[nextIdx] === 'closing' ? 'closed' : phases[nextIdx];
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erro ao avancar fase');
      return;
    }
    load();
  };

  const updateTask = async (taskId: string, updates: any) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    load();
  };

  const updateDeliverable = async (delId: string, updates: any) => {
    await fetch(`/api/deliverables/${delId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    load();
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/projects/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    });
    setComment('');
    load();
  };

  const tabs = [
    { key: 'overview', label: 'Visao Geral' },
    { key: 'tasks', label: `Tarefas (${data.tasks?.length || 0})` },
    { key: 'deliverables', label: `Entregaveis (${data.deliverables?.length || 0})` },
    { key: 'ppm', label: 'PPM' },
    { key: 'comments', label: `Chat (${data.comments?.length || 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/projects')} className="mt-1 p-1 hover:bg-gray-200 rounded">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
            <Badge className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
            <Badge className={RISK_COLORS[p.risk]}>{RISK_LABELS[p.risk]}</Badge>
            <Badge className="bg-gray-100 text-gray-700">{COMPLEXITY_LABELS[p.complexity]}</Badge>
            {p.is_exception && !p.exception_approved && <Badge className="bg-red-100 text-red-800">Excecao - Pendente</Badge>}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {p.client_name || 'Sem cliente'} | {p.city} | {p.venue} | {formatDate(p.start_date)}{p.end_date !== p.start_date ? ` - ${formatDate(p.end_date)}` : ''} | {p.event_days}d
          </p>
        </div>
        {p.status !== 'closed' && ['admin', 'producer'].includes(user?.role || '') && (
          <button onClick={advancePhase} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap">
            <Play size={14} /> Avancar Fase
          </button>
        )}
      </div>

      {/* Alerts */}
      {data.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          {data.alerts.map((a: any) => (
            <div key={a.id} className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle size={14} /> {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Phase Timeline */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between">
          {phases.map((phase, idx) => (
            <div key={phase} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                  idx < currentPhaseIdx ? 'bg-green-600 text-white' :
                  idx === currentPhaseIdx ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-500'
                )}>
                  {idx < currentPhaseIdx ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <span className="text-xs mt-1 text-gray-600 text-center">{PHASE_LABELS[phase]}</span>
              </div>
              {idx < phases.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-2', idx < currentPhaseIdx ? 'bg-green-500' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold">Detalhes do Projeto</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Cliente" value={p.client_name || '-'} />
              <Row label="Contato" value={p.contact_name ? `${p.contact_name} (${p.contact_email})` : '-'} />
              <Row label="Decisor" value={p.decision_maker || '-'} />
              <Row label="Pacote" value={p.package_type === 'PROGRAM' ? 'Programa' : 'One Shot'} />
              <Row label="Integra" value={p.has_integra ? 'Sim' : 'Nao'} />
              <Row label="Sameday/Reels" value={p.has_sameday ? 'Sim' : 'Nao'} />
              <Row label="Prazo de Entrega" value={formatDate(p.delivery_deadline)} />
              {p.delivery_deadline && (
                <Row label="Dias restantes" value={`${daysUntil(p.delivery_deadline)} dias`}
                  valueClass={isOverdue(p.delivery_deadline) ? 'text-red-600 font-bold' : ''} />
              )}
              <Row label="PPM Completo" value={p.ppm_completed ? 'Sim' : 'Nao'}
                valueClass={!p.ppm_completed ? 'text-amber-600' : 'text-green-600'} />
            </dl>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h3 className="font-semibold">Margem Estimada</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Receita" value={`R$ ${(p.revenue || 0).toLocaleString('pt-BR')}`} />
              <Row label="Custo Variavel" value={`R$ ${(p.variable_cost || 0).toLocaleString('pt-BR')}`} />
              <Row label="Margem" value={`${p.margin_percent}%`}
                valueClass={p.margin_percent < 35 ? 'text-red-600 font-bold text-lg' : 'text-green-600 font-bold text-lg'} />
            </dl>
            {p.is_exception && (
              <div className={cn('p-3 rounded-lg text-sm', p.exception_approved ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                {p.exception_approved ? 'Excecao aprovada pelo Admin' : 'Excecao: margem abaixo de 35%. Aprovacao do Admin necessaria.'}
                {!p.exception_approved && user?.role === 'admin' && (
                  <button onClick={() => fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exception_approved: 1 }) }).then(load)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs">Aprovar Excecao</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <TasksView tasks={data.tasks} users={users} projectId={id} onUpdate={load} />
      )}

      {activeTab === 'deliverables' && (
        <DeliverablesView deliverables={data.deliverables} users={users} onUpdate={updateDeliverable} />
      )}

      {activeTab === 'ppm' && (
        <PPMView project={p} projectId={id} onUpdate={load} />
      )}

      {activeTab === 'comments' && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-4 border-b flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Adicionar comentario..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm" onKeyDown={e => e.key === 'Enter' && sendComment()} />
            <button onClick={sendComment} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send size={16} /></button>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {(data.comments || []).length === 0 && <p className="p-4 text-sm text-gray-500">Nenhum comentario ainda</p>}
            {(data.comments || []).map((c: any) => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.user_name}</span>
                  <span className="text-xs text-gray-400 capitalize">{c.user_role}</span>
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={cn('font-medium', valueClass)}>{value}</dd>
    </div>
  );
}

function TasksView({ tasks, users, projectId, onUpdate }: { tasks: any[]; users: any[]; projectId: string; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', phase: 'pre_event', priority: 'medium', assigned_to: '', deadline: '' });

  const phases = ['pre_sale', 'pre_event', 'event', 'post_event', 'delivery', 'closing'];
  const statusCycle = ['todo', 'in_progress', 'done'];

  const addTask = async () => {
    if (!newTask.title) return;
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    setNewTask({ title: '', phase: 'pre_event', priority: 'medium', assigned_to: '', deadline: '' });
    setAdding(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(!adding)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">+ Tarefa</button>
      </div>
      {adding && (
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input placeholder="Titulo da tarefa" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
            className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
          <select value={newTask.phase} onChange={e => setNewTask(t => ({ ...t, phase: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
            {phases.map(ph => <option key={ph} value={ph}>{PHASE_LABELS[ph]}</option>)}
          </select>
          <select value={newTask.assigned_to} onChange={e => setNewTask(t => ({ ...t, assigned_to: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Responsavel</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input type="date" value={newTask.deadline} onChange={e => setNewTask(t => ({ ...t, deadline: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          <select value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
            <option value="low">Baixa</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option>
          </select>
          <button onClick={addTask} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Adicionar</button>
        </div>
      )}
      {phases.map(phase => {
        const phaseTasks = tasks.filter(t => t.phase === phase);
        if (phaseTasks.length === 0) return null;
        return (
          <div key={phase} className="bg-white rounded-xl border shadow-sm">
            <div className="p-3 border-b bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-sm">{PHASE_LABELS[phase]} ({phaseTasks.length})</h3>
            </div>
            <div className="divide-y">
              {phaseTasks.map(t => {
                const nextStatus = statusCycle[(statusCycle.indexOf(t.status) + 1) % statusCycle.length];
                return (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                    <button onClick={() => { fetch(`/api/tasks/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) }).then(onUpdate); }}
                      className="flex-shrink-0">
                      {t.status === 'done' ? <CheckCircle2 size={18} className="text-green-600" /> :
                        t.status === 'in_progress' ? <Loader2 size={18} className="text-blue-600" /> :
                        <Circle size={18} className="text-gray-300" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900')}>
                        {t.checklist_required && <span className="text-red-500 mr-1">*</span>}
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {t.assigned_name && <span className="text-xs text-gray-500">{t.assigned_name}</span>}
                        {t.deadline && <span className={cn('text-xs', isOverdue(t.deadline) && t.status !== 'done' ? 'text-red-600' : 'text-gray-400')}>{formatDate(t.deadline)}</span>}
                      </div>
                    </div>
                    <Badge className={
                      t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      t.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }>{t.priority}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeliverablesView({ deliverables, users, onUpdate }: { deliverables: any[]; users: any[]; onUpdate: (id: string, data: any) => void }) {
  const statusOrder = ['pending', 'in_progress', 'review', 'approved', 'delivered'];
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState('');

  return (
    <div className="bg-white rounded-xl border shadow-sm divide-y">
      {deliverables.length === 0 && <p className="p-8 text-center text-gray-500">Nenhum entregavel</p>}
      {deliverables.map(d => (
        <div key={d.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{d.title}</span>
                <Badge className="bg-gray-100 text-gray-600">{DELIVERABLE_TYPE_LABELS[d.type] || d.type}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {d.assigned_name && <span>Resp: {d.assigned_name}</span>}
                <span>SLA: {d.sla_days}d</span>
                {d.deadline && <span className={isOverdue(d.deadline) && d.status !== 'delivered' ? 'text-red-600 font-medium' : ''}>Prazo: {formatDate(d.deadline)}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={d.status} onChange={e => onUpdate(d.id, { status: e.target.value })}
                className="text-xs px-2 py-1 border rounded-lg bg-white">
                {statusOrder.map(s => <option key={s} value={s}>{DELIVERABLE_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {editingLink === d.id ? (
              <>
                <input value={linkValue} onChange={e => setLinkValue(e.target.value)} placeholder="Cole o link (Drive, Frame.io, etc)"
                  className="flex-1 px-2 py-1 border rounded text-sm" />
                <button onClick={() => { onUpdate(d.id, { link: linkValue }); setEditingLink(null); }}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Salvar</button>
                <button onClick={() => setEditingLink(null)} className="px-2 py-1 border rounded text-xs">Cancelar</button>
              </>
            ) : (
              <button onClick={() => { setEditingLink(d.id); setLinkValue(d.link || ''); }}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <ExternalLink size={12} /> {d.link ? 'Editar link' : 'Adicionar link'}
              </button>
            )}
            {d.link && editingLink !== d.id && (
              <a href={d.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-xs">{d.link}</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PPMView({ project, projectId, onUpdate }: { project: any; projectId: string; onUpdate: () => void }) {
  const [ppm, setPpm] = useState(() => {
    try { return JSON.parse(project.ppm_data || '{}'); } catch { return {}; }
  });
  const [saving, setSaving] = useState(false);

  const fields = [
    { key: 'schedule', label: 'Cronograma / Agenda do Evento', type: 'textarea' },
    { key: 'stage', label: 'Palco / Layout do Espaco', type: 'textarea' },
    { key: 'key_moments', label: 'Momentos-Chave para Captacao', type: 'textarea' },
    { key: 'restrictions', label: 'Restricoes (horarios, acessos, etc)', type: 'textarea' },
    { key: 'creative_brief', label: 'Briefing Criativo', type: 'textarea' },
    { key: 'deliverables_notes', label: 'Notas sobre Entregaveis', type: 'textarea' },
    { key: 'team', label: 'Equipe e Responsaveis', type: 'textarea' },
    { key: 'contacts', label: 'Contatos (cliente, local, fornecedores)', type: 'textarea' },
    { key: 'dress_code', label: 'Dress Code', type: 'text' },
    { key: 'capture_points', label: 'Pontos de Captacao', type: 'textarea' },
    { key: 'logistics', label: 'Logistica (transporte, hospedagem, alimentacao)', type: 'textarea' },
  ];

  const save = async (markComplete: boolean) => {
    setSaving(true);
    const body: any = { ppm_data: JSON.stringify(ppm) };
    if (markComplete) body.ppm_completed = 1;
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">PPM - Pre-Producao Meeting</h3>
        {project.ppm_completed ? (
          <Badge className="bg-green-100 text-green-800">Completo</Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>
        )}
      </div>
      {fields.map(f => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea value={ppm[f.key] || ''} onChange={e => setPpm((p: any) => ({ ...p, [f.key]: e.target.value }))}
              rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
          ) : (
            <input value={ppm[f.key] || ''} onChange={e => setPpm((p: any) => ({ ...p, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          )}
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </button>
        {!project.ppm_completed && (
          <button onClick={() => save(true)} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            Marcar PPM como Completo
          </button>
        )}
      </div>
    </div>
  );
}

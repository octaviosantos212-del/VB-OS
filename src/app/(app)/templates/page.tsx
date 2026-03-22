'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { COMPLEXITY_LABELS } from '@/lib/utils';
import { FileBox, ChevronDown, ChevronRight, CheckSquare } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
      <p className="text-sm text-gray-500">Modelos prontos para criar projetos rapidamente. Selecione um template ao criar um novo projeto.</p>

      <div className="space-y-4">
        {templates.map(t => {
          const isExpanded = expanded === t.id;
          const preEvent = JSON.parse(t.checklist_pre_event || '[]');
          const event = JSON.parse(t.checklist_event || '[]');
          const postEvent = JSON.parse(t.checklist_post_event || '[]');
          const deliverables = JSON.parse(t.default_deliverables || '[]');
          const tasks = JSON.parse(t.default_tasks || '[]');

          return (
            <div key={t.id} className="bg-white rounded-xl border shadow-sm">
              <button onClick={() => setExpanded(isExpanded ? null : t.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                  <FileBox size={20} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      <Badge className="bg-blue-100 text-blue-800">{COMPLEXITY_LABELS[t.complexity]}</Badge>
                      <Badge className="bg-gray-100 text-gray-700">{t.default_days}d</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>

              {isExpanded && (
                <div className="border-t p-4 grid lg:grid-cols-2 gap-6">
                  <ChecklistSection title="Checklist Pre-Evento" items={preEvent} />
                  <ChecklistSection title="Checklist Evento" items={event} />
                  <ChecklistSection title="Checklist Pos-Evento" items={postEvent} />
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Entregaveis Padrao</h4>
                    <ul className="space-y-1">
                      {deliverables.map((d: any, i: number) => (
                        <li key={i} className="text-sm text-gray-700 flex items-center justify-between">
                          <span>{d.title}</span>
                          <span className="text-xs text-gray-400">SLA: {d.sla_days}d</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:col-span-2">
                    <h4 className="font-semibold text-sm mb-2">Tarefas Padrao ({tasks.length})</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
                      {tasks.map((t: any, i: number) => (
                        <div key={i} className="text-sm text-gray-700 flex items-center gap-1">
                          <span className="text-xs text-gray-400">[{t.phase}]</span>
                          {t.title}
                          {t.checklist_required && <span className="text-red-500">*</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
            <CheckSquare size={14} className="text-gray-300 flex-shrink-0" /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const STATUS_LABELS: Record<string, string> = {
  pre_sale: 'Pré-venda',
  pre_event: 'Pré-evento',
  event: 'Evento',
  post_event: 'Pós-evento',
  delivery: 'Entrega',
  closed: 'Encerrado',
};

export const STATUS_COLORS: Record<string, string> = {
  pre_sale: 'bg-purple-100 text-purple-800',
  pre_event: 'bg-blue-100 text-blue-800',
  event: 'bg-yellow-100 text-yellow-800',
  post_event: 'bg-orange-100 text-orange-800',
  delivery: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const RISK_LABELS: Record<string, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

export const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export const COMPLEXITY_LABELS: Record<string, string> = {
  S: 'Simples',
  M: 'Médio',
  L: 'Grande',
};

export const PHASE_LABELS: Record<string, string> = {
  pre_sale: 'Pré-venda',
  pre_event: 'Pré-evento',
  event: 'Evento',
  post_event: 'Pós-evento',
  delivery: 'Entrega',
  closing: 'Encerramento',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluído',
  blocked: 'Bloqueado',
};

export const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em produção',
  review: 'Em revisão',
  approved: 'Aprovado',
  delivered: 'Entregue',
};

export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  brandmovie: 'Brandmovie',
  testimonials: 'Depoimentos',
  sameday: 'Reels/Sameday',
  integra: 'Íntegra',
  raw: 'Brutos',
  delivery_folder: 'Pasta de Entrega',
};

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  const d = daysUntil(date);
  return d !== null && d < 0;
}

export function calculateMargin(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 100);
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

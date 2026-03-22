'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from './AuthProvider';
import {
  LayoutDashboard, FolderKanban, ClipboardList, CalendarDays,
  FileBox, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projetos', icon: FolderKanban },
  { href: '/templates', label: 'Templates', icon: FileBox },
  { href: '/capacity', label: 'Capacidade', icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-60 bg-gray-900 text-white flex flex-col transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-xl font-bold tracking-tight">VB-OS</h1>
          <p className="text-xs text-gray-400 mt-1">Gestão de Eventos</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-gray-400 capitalize">{user.role}</div>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-gray-400 hover:text-white">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>
    </>
  );
}

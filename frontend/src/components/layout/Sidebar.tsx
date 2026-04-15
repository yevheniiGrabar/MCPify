import { cn } from '@/lib/utils'
import {
  BarChart3,
  CreditCard,
  LayoutGrid,
  Plug,
  Settings,
  Zap,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/services', icon: Plug, label: 'Services' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface-card border-r border-zinc-800 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">MCPify</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-600 px-3">MCPify v0.1.0</p>
      </div>
    </aside>
  )
}

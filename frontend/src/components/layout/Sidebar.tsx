import { cn } from '@/lib/utils'
import {
  BarChart3,
  CreditCard,
  LayoutGrid,
  Plug,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/services', icon: Plug, label: 'Services' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      style={{ width: collapsed ? 72 : 280 }}
      className="fixed left-0 top-0 h-screen bg-surface-card border-r border-zinc-800 flex flex-col z-10 transition-[width] duration-300 ease-in-out overflow-hidden"
    >
      {/* Logo — exact h-16 to align with header */}
      <div className="h-16 flex items-center border-b border-zinc-800 flex-shrink-0 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              'font-mono font-bold text-lg tracking-tight whitespace-nowrap transition-[opacity,width] duration-300 ease-in-out overflow-hidden',
              collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
            )}
          >
            <span className="text-zinc-500">{`{ `}</span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">mcpfy</span>
            <span className="text-zinc-500">{` }`}</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap transition-[opacity,width] duration-300 ease-in-out overflow-hidden',
                collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
              )}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'px-3 py-4 border-t border-zinc-800 transition-opacity duration-300',
          collapsed ? 'opacity-0' : 'opacity-100'
        )}
      >
        <p className="text-xs text-zinc-600 px-3 whitespace-nowrap">MCPify v0.1.0</p>
      </div>
    </aside>
  )
}

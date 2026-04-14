import { cn } from '@/lib/utils'
import {
  BarChart3,
  CreditCard,
  LayoutGrid,
  Plug,
  Settings,
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
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Plug className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-gray-900">MCPify</span>
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
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 px-3">MCPify v0.1.0</p>
      </div>
    </aside>
  )
}

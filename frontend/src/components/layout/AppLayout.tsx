import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const toggle = () => setCollapsed((c) => !c)

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <Header collapsed={collapsed} onToggle={toggle} />
      <main
        style={{ marginLeft: collapsed ? 72 : 280 }}
        className="pt-16 min-h-screen transition-[margin] duration-300 ease-in-out"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

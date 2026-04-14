import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className="ml-[280px] pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

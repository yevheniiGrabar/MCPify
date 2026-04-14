import { useCurrentUser, useLogout } from '@/api/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { LogOut, Search, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="fixed top-0 left-[280px] right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search..."
          className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">
                {initials ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => void navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout.mutate()}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

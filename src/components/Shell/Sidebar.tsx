import { TableProperties, Wrench, Activity, Drill } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PageId = 'drilling' | 'surveys' | 'bha' | 'diagnostics'

interface NavItem {
  id: PageId
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'drilling',    label: 'Бурение',       icon: <Drill className="h-4 w-4" /> },
  { id: 'surveys',     label: 'Инклинометрия', icon: <TableProperties className="h-4 w-4" /> },
  { id: 'bha',         label: 'КНБК',          icon: <Wrench className="h-4 w-4" /> },
  { id: 'diagnostics', label: 'Диагностика',   icon: <Activity className="h-4 w-4" /> },
]

interface TopNavProps {
  active: PageId
  onChange: (id: PageId) => void
}

export function TopNav({ active, onChange }: TopNavProps) {
  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map(item => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
            )}
          >
            <span className={isActive ? 'text-lime-400' : 'text-muted-foreground'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

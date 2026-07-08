import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  )
}

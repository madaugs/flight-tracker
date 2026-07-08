import { cn } from '@/lib/utils'

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-block w-5 h-5 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin',
        className
      )}
    />
  )
}

import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-sm text-red-400">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

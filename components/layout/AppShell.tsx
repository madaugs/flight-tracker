import Sidebar from './Sidebar'
import TopBar from './TopBar'
import BottomNav from './BottomNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

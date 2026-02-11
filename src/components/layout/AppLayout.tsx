import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PwaUpdateToast } from '../ui/PwaUpdateToast'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <PwaUpdateToast />
      <div className="pb-20"> {/* Add padding bottom for BottomNav */}
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

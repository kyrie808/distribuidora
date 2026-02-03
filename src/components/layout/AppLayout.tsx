import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '../ui/Toast'

export function AppLayout() {
    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/30 font-sans">
            <Outlet />
            <BottomNav />
            <ToastContainer />
        </div>
    )
}

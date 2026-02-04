import { ArrowLeft, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'

interface HeaderProps {
    title: string
    showBack?: boolean
    showMenu?: boolean // New prop to show Menu icon instead of Back
    rightAction?: React.ReactNode
    centerTitle?: boolean
    transparent?: boolean
    className?: string
}

export function Header({
    title,
    showBack = false,
    showMenu = false,
    rightAction,
    centerTitle = false,
    transparent = false,
    className
}: HeaderProps) {
    const navigate = useNavigate()

    return (
        <header className={cn(
            "sticky top-0 z-40 px-6 py-4 h-auto flex items-center justify-between transition-all duration-300",
            transparent ? 'bg-transparent' : 'bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md',
            !transparent && 'shadow-none',
            className
        )}>
            {/* Left Action (Back or Menu) */}
            <div className="flex items-center z-10">
                {showBack && (
                    <button
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors -ml-2 text-foreground"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                )}

                {showMenu && !showBack && (
                    <button
                        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors -ml-2 text-foreground"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                )}

                {/* Spacer if no left action, but typically we want the title to just align naturally if not centered */}
            </div>

            {/* Title */}
            <div className={cn(
                "flex-1 flex pointer-events-none px-4",
                centerTitle ? 'justify-center items-center absolute inset-0' : 'justify-start'
            )}>
                <h1 className={cn(
                    "text-lg font-bold tracking-tight text-gray-900 dark:text-white",
                    centerTitle ? "text-center" : ""
                )}>
                    {title}
                </h1>
            </div>

            {/* Right Action */}
            <div className="flex items-center gap-2 z-10 shrink-0">
                {rightAction}
            </div>
        </header>
    )
}

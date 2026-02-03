import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

interface HeaderProps {
    title: string
    showBack?: boolean
    rightAction?: React.ReactNode
}

export function Header({ title, showBack = false, rightAction }: HeaderProps) {
    const navigate = useNavigate()

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-16 flex items-center justify-between safe-top">
            <div className="flex items-center gap-2">
                {showBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 h-10 w-10 text-gray-600"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {title}
                </h1>
            </div>

            {rightAction && (
                <div className="flex items-center gap-2">
                    {rightAction}
                </div>
            )}
        </header>
    )
}

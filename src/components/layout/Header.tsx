import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
    title: string
    showBack?: boolean
    rightAction?: React.ReactNode
}

export function Header({ title, showBack = false, rightAction }: HeaderProps) {
    const navigate = useNavigate()

    return (
        <header className="sticky top-0 z-40 bg-primary-500 text-white px-4 py-4 safe-top">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <h1 className="text-xl font-semibold">{title}</h1>
                </div>

                {rightAction}
            </div>
        </header>
    )
}

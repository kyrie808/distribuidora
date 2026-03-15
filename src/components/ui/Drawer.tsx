import { createPortal } from 'react-dom'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
    if (!isOpen) return null

    return createPortal(
        <>
            {/* Mobile: full-screen slide-in panel */}
            <div className="fixed inset-0 z-[9998] md:hidden flex justify-end">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative w-[85vw] max-w-sm bg-card h-[100dvh] shadow-2xl transform transition-transform animate-slide-in-right overflow-hidden z-[9999]">
                    <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-accent transition-colors"
                            aria-label="Fechar"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="font-semibold text-base">{title}</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto flex flex-col">
                        {children}
                    </div>
                </div>
            </div>
            {/* Desktop: fixed sidebar */}
            <aside className="hidden md:flex fixed right-0 top-0 w-96 flex-col border-l border-border bg-card h-screen z-[9999]">
                <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-accent transition-colors"
                        aria-label="Fechar"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-semibold text-base">{title}</h2>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col">
                    {children}
                </div>
            </aside>
        </>,
        document.body
    )
}

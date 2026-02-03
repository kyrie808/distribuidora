import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
    children: ReactNode
    className?: string
    noPadding?: boolean
}

export function PageContainer({
    children,
    className = '',
    noPadding = false,
}: PageContainerProps) {
    return (
        <main
            className={cn(
                "flex-1 min-h-[calc(100vh-4rem)] bg-gray-50", // background gray-50
                // Fixed Header spacing (h-16 = 4rem)
                "pt-20",
                // Fixed BottomNav spacing (h-20 approx)
                "pb-24",
                noPadding ? '' : 'px-4',
                className
            )}
        >
            {children}
        </main>
    )
}

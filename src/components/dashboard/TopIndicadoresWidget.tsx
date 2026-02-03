import { Medal, Trophy } from 'lucide-react'
import { useTopIndicadores } from '@/hooks/useTopIndicadores'
import type { IndicadorStats } from '@/hooks/useTopIndicadores'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function TopIndicadoresWidget() {
    const { topIndicadores, loading } = useTopIndicadores()

    if (loading) return <div className="h-40 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />

    if (topIndicadores.length === 0) return null

    return (
        <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-2 px-1">
                <Trophy className="size-4 text-semantic-yellow" />
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    Top Indicadores
                </h2>
            </div>

            {/* Apple-like Horizontal Scroll / Grid */}
            <div className="grid grid-cols-1 gap-3">
                {topIndicadores.map((indicador, index) => (
                    <TopIndicadorCard key={indicador.indicadorId} indicador={indicador} index={index} />
                ))}
                {/* 
                   Alternatively, for a true "Apple Like" experience with only a few items, 
                   a vertical stack might be cleaner if we only show Top 3.
                 */}
            </div>
        </div>
    )
}

function TopIndicadorCard({ indicador, index }: { indicador: IndicadorStats, index: number }) {
    // Apple-like gradients for top 3
    const getGradient = (ranking: number) => {
        switch (ranking) {
            case 1: return "bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 border-yellow-400" // Gold
            case 2: return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 border-gray-400" // Silver
            case 3: return "bg-gradient-to-r from-orange-300 to-orange-400 text-orange-900 border-orange-400" // Bronze (using orange as bronze proxy)
            default: return "bg-white dark:bg-surface-dark text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
        }
    }

    const isTop3 = index < 3
    const gradientClass = isTop3 ? getGradient(index + 1) : getGradient(99)

    return (
        <Card className={cn(
            "relative overflow-hidden border transition-all hover:scale-[1.01]",
            isTop3 ? "border-0 shadow-lg" : "shadow-sm"
        )}>
            <div className={cn("absolute inset-0 opacity-20", gradientClass)}></div> {/* Background tint */}

            <CardContent className={cn("flex items-center justify-between p-4 relative z-10", isTop3 ? "" : "bg-white/50 dark:bg-surface-dark/50")}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "flex items-center justify-center size-10 rounded-full font-bold text-lg shadow-inner",
                        isTop3 ? "bg-white/30 backdrop-blur-sm text-black" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    )}>
                        {index + 1}
                    </div>
                    <div>
                        <h3 className={cn("font-bold text-sm", isTop3 ? "text-black dark:text-white mix-blend-hard-light" : "text-gray-900 dark:text-white")}>
                            {indicador.nome}
                        </h3>
                        <p className={cn("text-xs font-medium opacity-80", isTop3 ? "text-black dark:text-white" : "text-gray-500")}>
                            {indicador.totalIndicados} clientes convertidos
                        </p>
                    </div>
                </div>

                {index === 0 && <Medal className="size-6 text-yellow-600 dark:text-yellow-400 drop-shadow-md" />}
            </CardContent>
        </Card >
    )
}

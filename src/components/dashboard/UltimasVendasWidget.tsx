import { ShoppingCart, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDashboardFilter } from '@/hooks/useDashboardFilter'
import { Card, CardContent } from '@/components/ui/Card'
import { useVendas } from '@/hooks/useVendas'
import { formatCurrency, formatRelativeDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'

export function UltimasVendasWidget() {
    // Fetch recent sales, respects global dashboard filter
    const { startDate, endDate } = useDashboardFilter()
    const { vendas, loading } = useVendas({ startDate, endDate })
    const navigate = useNavigate()

    // Take top 5
    const latestSales = vendas.slice(0, 5)

    if (loading) return <div className="h-[300px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />

    if (latestSales.length === 0) return null

    return (
        <div className="flex flex-col gap-3 mt-8">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="size-4 text-primary" />
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                        Últimas Vendas
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/vendas')}
                    className="text-xs font-medium text-primary hover:text-green-600 transition-colors flex items-center gap-1"
                >
                    Ver todas
                    <ArrowRight className="size-3" />
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {latestSales.map((venda) => (
                    <Card
                        key={venda.id}
                        className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-surface-dark"
                    >
                        <CardContent className="p-4 flex items-center justify-between relative">
                            {/* Left Side: Indicator & Name */}
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "size-2 rounded-full",
                                    venda.status === 'entregue' ? "bg-semantic-green shadow-[0_0_8px_rgba(34,197,94,0.5)]" :
                                        venda.status === 'cancelada' ? "bg-semantic-red" : "bg-semantic-yellow"
                                )} />

                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1 group-hover:text-primary transition-colors">
                                        {venda.contato?.nome || 'Cliente não identificado'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {formatRelativeDate(venda.data)}
                                    </p>
                                </div>
                            </div>

                            {/* Right Side: Status Tag & Amount */}
                            <div className="flex items-center gap-4">
                                {!venda.pago && venda.status !== 'cancelada' && (
                                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-[10px] font-bold text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800">
                                        <Clock className="size-3" />
                                        Não pago
                                    </span>
                                )}

                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(venda.total)}
                                </span>
                            </div>

                            {/* Hover effect gradient line */}
                            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary to-green-400 group-hover:w-full transition-all duration-500 ease-out" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

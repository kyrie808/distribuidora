import { useNavigate } from 'react-router-dom'
import { RotateCw, MessageCircle, Eye, ShoppingCart } from 'lucide-react'
import { formatPhone } from '@/utils/formatters'
import { DashboardCarousel } from './DashboardCarousel'
import { useRecompra } from '@/hooks/useRecompra'
import { Card, CardContent } from '@/components/ui/Card'

interface AlertasRecompraWidgetProps {
    data?: any[]
    loading?: boolean
}

export function AlertasRecompraWidget({ data, loading: externalLoading }: AlertasRecompraWidgetProps) {
    const navigate = useNavigate()
    // Skip hook if data is provided
    const { contatos, loading: internalLoading } = useRecompra(!data)

    const loading = data ? externalLoading : internalLoading
    const rawAlerts = data || contatos

    // Normalize data if it comes from JSON view / different structure
    const alertas = data
        ? data.map(a => ({
            contato: { id: a.contato_id, nome: a.nome, telefone: a.telefone },
            diasSemCompra: a.dias_sem_compra,
            status: 'atrasado'
        }))
        : rawAlerts.filter(c => c.status === 'atrasado')

    const handleWhatsApp = (telefone: string, nome: string) => {
        const message = `Olá, ${nome}! Notei que faz um tempinho desde sua última compra. Estamos com promoções especiais hoje!`
        const url = `https://wa.me/55${formatPhone(telefone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    if (loading) return <div className="h-40 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />

    if (alertas.length === 0) {
        return (
            <DashboardCarousel
                title="Alertas de Recompra"
                icon={RotateCw}
                count={0}
                onViewAll={() => navigate('/clientes')}
                emptyState={
                    <div className="w-full flex flex-col items-center justify-center p-6 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                        <ShoppingCart className="size-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Todos os clientes abastecidos!</p>
                    </div>
                }
            >
                {null}
            </DashboardCarousel>
        )
    }

    return (
        <DashboardCarousel
            title="Alertas de Recompra"
            icon={RotateCw}
            count={alertas.length}
            onViewAll={() => navigate('/clientes')}
        >
            {alertas.map((alerta) => (
                <div key={alerta.contato.id} className="min-w-[260px] snap-center">
                    <Card className="h-full bg-white dark:bg-surface-dark border-l-4 border-l-orange-500 border-y-gray-100 hover:border-y-gray-200 dark:border-y-gray-800 dark:hover:border-y-gray-700 shadow-sm transition-all">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                                        {alerta.contato.nome}
                                    </h3>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 mt-1">
                                        {alerta.diasSemCompra} dias sem comprar
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => navigate(`/clientes/${alerta.contato.id}`)}
                                        className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
                                    >
                                        <Eye className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleWhatsApp(alerta.contato.telefone, alerta.contato.nome)}
                                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors px-3 py-2 rounded-lg"
                            >
                                <MessageCircle className="size-3.5" />
                                Oferecer Recompra
                            </button>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </DashboardCarousel>
    )
}

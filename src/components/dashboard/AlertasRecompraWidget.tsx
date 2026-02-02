import { useNavigate } from 'react-router-dom'
import {
    Bell,
    ChevronRight,
    AlertCircle,
} from 'lucide-react'
import { Card, Badge } from '../ui'
import type { ContatoRecompra } from '../../hooks/useRecompra'

interface AlertasRecompraWidgetProps {
    contatos: ContatoRecompra[]
    atrasados: number
    loading?: boolean
}

export function AlertasRecompraWidget({ contatos, atrasados, loading }: AlertasRecompraWidgetProps) {
    const navigate = useNavigate()
    const alertasUrgentes = contatos.filter((c) => c.status === 'atrasado').slice(0, 5)

    if (loading) {
        return (
            <Card className="h-full min-h-[300px] animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                </div>
            </Card>
        )
    }

    return (
        <section className="h-full">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-danger-500" />
                    Alertas de Recompra
                    {atrasados > 0 && (
                        <Badge variant="danger">{atrasados}</Badge>
                    )}
                </h2>
                <button
                    onClick={() => navigate('/recompra')}
                    className="text-sm text-primary-500 font-medium flex items-center gap-1"
                >
                    Ver todos <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {alertasUrgentes.length === 0 ? (
                <Card className="text-center py-8 text-gray-500 h-full flex flex-col items-center justify-center min-h-[200px]">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum cliente atrasado</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {alertasUrgentes.map((item) => (
                        <Card
                            key={item.contato.id}
                            hover
                            onClick={() => navigate(`/contatos/${item.contato.id}`)}
                            className="cursor-pointer border-l-4 border-l-danger-400"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="h-4 w-4 text-danger-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{item.contato.nome}</p>
                                        <p className="text-xs text-gray-500">
                                            {item.diasSemCompra} dias sem comprar
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    )
}

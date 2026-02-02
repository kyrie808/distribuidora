import { useNavigate } from 'react-router-dom'
import {
    DollarSign,
    ChevronRight,
    Calendar,
    MessageCircle,
    Clock,
} from 'lucide-react'
import { Card, Badge, Button } from '../ui'
import { useAlertasFinanceiros } from '../../hooks/useAlertasFinanceiros'
import { formatCurrency, formatPhone } from '../../utils/formatters'
import { format } from 'date-fns'


export function AlertasFinanceiroWidget() {
    const navigate = useNavigate()
    const { alertas, loading, totalAtrasado, totalHoje } = useAlertasFinanceiros()

    // Priorizar: Atrasados > Hoje > Próximos
    const alertasPrioritarios = alertas.slice(0, 5)

    const handleWhatsAppClick = (e: React.MouseEvent, phone: string, nome: string, valor: number, data: Date, status: string) => {
        e.stopPropagation() // Don't trigger card click

        const tel = formatPhone(phone).replace(/\D/g, '')
        const valorFmt = formatCurrency(valor)
        const dateFmt = format(data, 'dd/MM')

        let msg = ''
        if (status === 'atrasado') {
            msg = `Olá ${nome}, vi que seu pagamento de ${valorFmt} venceu dia ${dateFmt}. Podemos acertar?`
        } else if (status === 'hoje') {
            msg = `Olá ${nome}, lembrete do seu pagamento de ${valorFmt} que vence hoje!`
        } else {
            msg = `Olá ${nome}, lembrete do seu pagamento de ${valorFmt} para dia ${dateFmt}.`
        }

        window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
    }

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
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    Contas a Receber
                    {(totalAtrasado > 0 || totalHoje > 0) && (
                        <Badge variant="warning">
                            !
                        </Badge>
                    )}
                </h2>
                <div className="flex items-center gap-2">
                    {totalAtrasado > 0 && (
                        <span className="text-xs font-bold text-danger-600 bg-danger-50 px-2 py-1 rounded-md">
                            -{formatCurrency(totalAtrasado)}
                        </span>
                    )}
                    <button
                        onClick={() => navigate('/vendas?pagamento=nao_pago&metodo=fiado')}
                        className="text-sm text-primary-500 font-medium flex items-center gap-1"
                    >
                        Ver todos <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {alertasPrioritarios.length === 0 ? (
                <Card className="text-center py-8 text-gray-500 h-full flex flex-col items-center justify-center min-h-[200px]">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma pendência urgente</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {alertasPrioritarios.map((item) => (
                        <Card
                            key={item.venda.id}
                            hover
                            onClick={() => navigate(`/vendas/${item.venda.id}`)}
                            className={`cursor-pointer border-l-4 ${item.status === 'atrasado' ? 'border-l-danger-500 bg-danger-50/30' :
                                item.status === 'hoje' ? 'border-l-warning-500 bg-warning-50/30' :
                                    'border-l-primary-400'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1 mr-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-gray-900 truncate">
                                            {item.venda.contato?.nome || 'Cliente'}
                                        </p>
                                        <span className={`text-xs font-bold ${item.status === 'atrasado' ? 'text-danger-600' :
                                            item.status === 'hoje' ? 'text-warning-600' : 'text-gray-600'
                                            }`}>
                                            {formatCurrency(item.venda.total)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            {item.status === 'atrasado' ? (
                                                <Clock className="h-3 w-3 text-danger-500" />
                                            ) : (
                                                <Calendar className="h-3 w-3" />
                                            )}
                                            {item.status === 'atrasado' ? `Venceu ${format(item.dataPrevista, 'dd/MM')}` :
                                                item.status === 'hoje' ? 'Vence HOJE' :
                                                    `Vence ${format(item.dataPrevista, 'dd/MM')}`}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full text-success-600 hover:text-success-700 hover:bg-success-50"
                                    onClick={(e) => handleWhatsAppClick(
                                        e,
                                        item.venda.contato?.telefone || '',
                                        item.venda.contato?.nome || '',
                                        item.venda.total,
                                        item.dataPrevista,
                                        item.status
                                    )}
                                    title="Cobrar no WhatsApp"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    )
}

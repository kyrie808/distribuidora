import { useNavigate } from 'react-router-dom'
import {
    DollarSign,
    ChevronRight,
    Calendar,
    MessageCircle,
    Clock,
} from 'lucide-react'
import { Card, CardContent, Button } from '../ui'
import { useAlertasFinanceiros } from '../../hooks/useAlertasFinanceiros'
import { formatCurrency, formatPhone } from '../../utils/formatters'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function AlertasFinanceiroWidget() {
    const navigate = useNavigate()
    const { alertas, loading, totalAtrasado, totalHoje } = useAlertasFinanceiros()

    // Priorizar: Atrasados > Hoje > Próximos
    const alertasPrioritarios = alertas.slice(0, 5)

    const handleWhatsAppClick = (e: React.MouseEvent, phone: string, nome: string, valor: number, data: Date, status: string) => {
        e.stopPropagation()

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
            <Card className="h-full min-h-[300px] flex flex-col justify-center items-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </Card>
        )
    }

    return (
        <section className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    Contas a Receber
                    {(totalAtrasado > 0 || totalHoje > 0) && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </h2>
                <div className="flex items-center gap-2">
                    {totalAtrasado > 0 && (
                        <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                            -{formatCurrency(totalAtrasado)}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 h-auto p-0"
                        onClick={() => navigate('/vendas?pagamento=nao_pago&metodo=fiado')}
                    >
                        Ver todos <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {alertasPrioritarios.length === 0 ? (
                <Card className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 border-dashed">
                    <DollarSign className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhuma pendência urgente</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {alertasPrioritarios.map((item) => (
                        <Card
                            key={item.venda.id}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md border-l-4",
                                item.status === 'atrasado' ? "border-l-destructive bg-destructive/5" :
                                    item.status === 'hoje' ? "border-l-warning bg-warning/5" :
                                        "border-l-primary"
                            )}
                            onClick={() => navigate(`/vendas/${item.venda.id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="min-w-0 flex-1 mr-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-bold text-gray-900 truncate text-base">
                                            {item.venda.contato?.nome || 'Cliente'}
                                        </p>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            item.status === 'atrasado' ? "text-destructive" :
                                                item.status === 'hoje' ? "text-warning-600" : "text-primary"
                                        )}>
                                            {formatCurrency(item.venda.total)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            {item.status === 'atrasado' ? (
                                                <Clock className="h-3.5 w-3.5 text-destructive" />
                                            ) : (
                                                <Calendar className="h-3.5 w-3.5" />
                                            )}
                                            <span className={cn(
                                                "font-medium",
                                                item.status === 'atrasado' && "text-destructive",
                                                item.status === 'hoje' && "text-warning-600"
                                            )}>
                                                {item.status === 'atrasado' ? `Venceu ${format(item.dataPrevista, 'dd/MM')}` :
                                                    item.status === 'hoje' ? 'Vence HOJE' :
                                                        `Vence ${format(item.dataPrevista, 'dd/MM')}`}
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-sm"
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    )
}

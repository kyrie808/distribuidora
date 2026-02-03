import { MessageCircle, AlertTriangle } from 'lucide-react'
import { Card } from '../ui/Card'
import { useAlertasFinanceiros } from '../../hooks/useAlertasFinanceiros'
import { formatCurrency, formatRelativeDate, formatPhone } from '../../utils/formatters'

export function AlertasFinanceiroWidget() {
    const { alertas, loading } = useAlertasFinanceiros()

    if (loading) {
        return (
            <Card className="p-4 bg-card border-white/5 animate-pulse">
                <div className="h-20 bg-white/5 rounded-xl"></div>
            </Card>
        )
    }

    if (alertas.length === 0) return null

    // Display only the most critical or recent alert for the widget view
    const topAlert = alertas[0]

    const handleWhatsApp = (telefone: string, nome: string, valor: number) => {
        const message = `Olá ${nome}, tudo bem? Estou entrando em contato referente ao valor de ${formatCurrency(valor)} que está em aberto.`
        const url = `https://wa.me/55${formatPhone(telefone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    // Safely access properties
    // The hook structure returns alerts where the top-level object has 'venda', 'diasAtraso', 'status', 'dataPrevista'
    // 'contato' and properties of 'venda' like 'total' are nested inside 'venda'
    const nomeContato = topAlert.venda.contato?.nome || 'Cliente'
    const telefoneContato = topAlert.venda.contato?.telefone || ''
    const valorPendente = topAlert.venda.total
    const dataVencimento = topAlert.dataPrevista

    return (
        <Card className="relative overflow-hidden border-l-4 border-l-destructive border-t border-r border-b border-white/5 bg-gradient-to-br from-card to-destructive/5 shadow-sm hover:scale-[1.01] transition-transform duration-300">
            <div className="flex flex-1 flex-col justify-between p-4 gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base font-bold text-foreground leading-tight">{nomeContato}</h3>
                        <div className="flex items-center gap-1 mt-1 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">
                                Fiado Vencido ({formatRelativeDate(dataVencimento)})
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{formatCurrency(valorPendente)}</p>
                        <p className="text-xs text-muted-foreground">Pendente</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                        Vencimento: {new Date(dataVencimento).toLocaleDateString()}
                    </span>
                    <button
                        onClick={() => handleWhatsApp(telefoneContato, nomeContato, valorPendente)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-green-500/20 active:scale-95"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Cobrar
                    </button>
                </div>
            </div>

            {/* Background Pulse Effect for Critical Alert */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <AlertTriangle className="h-32 w-32 text-destructive animate-pulse" />
            </div>
        </Card>
    )
}

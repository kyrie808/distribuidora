import { useNavigate } from 'react-router-dom'
import {
    Bell,
    ChevronRight,
    AlertCircle,
} from 'lucide-react'
import { Card, CardContent, Button } from '../ui'
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
            <Card className="h-full min-h-[300px] flex flex-col justify-center items-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </Card>
        )
    }

    return (
        <section className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-destructive" />
                    Alertas de Recompra
                    {atrasados > 0 && (
                        <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                    )}
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 h-auto p-0"
                    onClick={() => navigate('/recompra')}
                >
                    Ver todos <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {alertasUrgentes.length === 0 ? (
                <Card className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 border-dashed">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p>Nenhum cliente atrasado</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {alertasUrgentes.map((item) => (
                        <Card
                            key={item.contato.id}
                            className="cursor-pointer border-l-4 border-l-destructive hover:shadow-md transition-shadow bg-destructive/5"
                            onClick={() => navigate(`/contatos/${item.contato.id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-destructive/20 shadow-sm flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-destructive" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate text-base">{item.contato.nome}</p>
                                        <p className="text-sm text-destructive font-medium">
                                            {item.diasSemCompra} dias sem comprar
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    )
}

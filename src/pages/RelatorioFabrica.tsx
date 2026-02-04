import { useState, useEffect } from 'react'
import {
    Calendar,
    Package,
    Send,
    RefreshCw,
    ClipboardList,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Button, LoadingScreen, Input } from '../components/ui'
import { useRelatorioFabrica, getDefaultDates } from '../hooks/useRelatorioFabrica'
import { useToast } from '../components/ui/Toast'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatDateBR(dateStr: string): string {
    try {
        return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
        return dateStr
    }
}

function formatDateShort(dateStr: string): string {
    try {
        return format(parseISO(dateStr), 'dd/MM', { locale: ptBR })
    } catch {
        return dateStr
    }
}

export function RelatorioFabrica() {
    const toast = useToast()
    const { relatorio, loading, error, gerarRelatorio } = useRelatorioFabrica()

    // Default dates
    const defaultDates = getDefaultDates()
    const [dataInicio, setDataInicio] = useState(defaultDates.dataInicio)
    const [dataFim, setDataFim] = useState(defaultDates.dataFim)

    // Auto-generate on first load
    useEffect(() => {
        gerarRelatorio(dataInicio, dataFim)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only on mount

    const handleGerar = () => {
        if (!dataInicio || !dataFim) {
            toast.error('Selecione as datas')
            return
        }
        gerarRelatorio(dataInicio, dataFim)
    }

    const handleEnviarWhatsApp = () => {
        if (!relatorio || relatorio.produtos.length === 0) {
            toast.error('Nenhum produto no relatório')
            return
        }

        // Montar mensagem formatada em português
        let mensagem = `📋 *PEDIDO GILMAR DISTRIBUIDOR*\n`
        mensagem += `Período: ${formatDateShort(relatorio.dataInicio)} - ${formatDateShort(relatorio.dataFim)}/${format(parseISO(relatorio.dataFim), 'yyyy')}\n\n`

        for (const produto of relatorio.produtos) {
            mensagem += `📦 ${produto.nome}: ${produto.quantidade} un\n`
        }

        mensagem += `─────────────────\n`
        mensagem += `Total: ${relatorio.total} unidades`

        // Abrir WhatsApp
        const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`
        window.open(url, '_blank')
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                <Header
                    title="Relatório Fábrica"
                    showBack
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                />
                <PageContainer className="pt-0 pb-32 bg-transparent px-4">
                    {/* Seletor de Período */}
                    <Card className="mb-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Selecione o Período</h3>
                                <p className="text-sm text-gray-500">Vendas realizadas no período</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <Input
                                label="Data Início"
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                            />
                            <Input
                                label="Data Fim"
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                            />
                        </div>

                        <Button
                            variant="primary"
                            className="w-full"
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                            onClick={handleGerar}
                            isLoading={loading}
                        >
                            Gerar Relatório
                        </Button>
                    </Card>

                    {/* Loading */}
                    {loading && <LoadingScreen message="Gerando relatório..." />}

                    {/* Error */}
                    {error && (
                        <Card className="bg-danger-50 text-danger-600 mb-4">
                            <p>{error}</p>
                        </Card>
                    )}

                    {/* Resultado */}
                    {!loading && relatorio && (
                        <div className="space-y-3">
                            {relatorio.produtos.length === 0 ? (
                                <Card className="text-center py-8 text-gray-500">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma venda no período selecionado</p>
                                </Card>
                            ) : (
                                <>
                                    {/* Cards por Produto */}
                                    {relatorio.produtos.map((produto) => (
                                        <Card key={produto.produtoId}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{produto.nome}</p>
                                                    <p className="text-sm text-gray-500">Código: {produto.codigo}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-primary-600">{produto.quantidade}</p>
                                                    <p className="text-xs text-gray-500">unidades</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    {/* Card de Resumo */}
                                    <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                                <ClipboardList className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">RESUMO DO PEDIDO</p>
                                                <p className="text-sm opacity-80">
                                                    Período: {formatDateBR(relatorio.dataInicio)} - {formatDateBR(relatorio.dataFim)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold">{relatorio.total}</p>
                                                <p className="text-sm opacity-80">unidades</p>
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Botão Enviar WhatsApp */}
                                    <Button
                                        variant="accent"
                                        className="w-full"
                                        leftIcon={<Send className="h-4 w-4" />}
                                        onClick={handleEnviarWhatsApp}
                                    >
                                        📤 Enviar via WhatsApp
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </PageContainer>
            </div>
        </div>
    )
}

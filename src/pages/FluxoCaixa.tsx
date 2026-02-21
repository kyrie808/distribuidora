import { useState } from 'react'
import { PageContainer } from '../components/layout/PageContainer'
import { Header } from '../components/layout/Header'
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    DollarSign,
    Clock,
    Receipt,
    TrendingUp,
    Filter
} from 'lucide-react'
import { MonthPicker } from '../components/dashboard/MonthPicker'
import { useFluxoCaixa } from '../hooks/useFluxoCaixa'
import { useExtrato } from '../hooks/useExtrato'
import { useContasReceber } from '../hooks/useContasReceber'
import { useLancamentos } from '../hooks/useLancamentos'
import { useContas } from '../hooks/useContas'
import { formatCurrency } from '../utils/formatters'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { LancamentoModal } from '../components/features/financeiro/LancamentoModal'
import { TransferenciaModal } from '../components/features/financeiro/TransferenciaModal'
import { useToast } from '../components/ui/Toast'
import { Modal, ModalActions, Button } from '../components/ui'

export function FluxoCaixa() {
    const toast = useToast()
    const [selectedMonth, setSelectedMonth] = useState(new Date())
    const { resumo, isLoading: loadingResumo } = useFluxoCaixa(selectedMonth)
    const { extrato, isLoading: loadingExtrato } = useExtrato(selectedMonth)
    const { contasReceber, isLoading: loadingReceber } = useContasReceber()
    const { marcarVendaPaga } = useLancamentos()
    const { contas } = useContas()

    // Modal States
    const [isEntradaOpen, setIsEntradaOpen] = useState(false)
    const [isSaidaOpen, setIsSaidaOpen] = useState(false)
    const [isTransferenciaOpen, setIsTransferenciaOpen] = useState(false)
    const [isFabOpen, setIsFabOpen] = useState(false)

    // Quitar Venda State
    const [vendaParaQuitar, setVendaParaQuitar] = useState<any>(null)

    // Month Picker Helper
    const selectedMonthStr = selectedMonth.toLocaleString('pt-BR', { month: 'short' })
        .replace('.', '')
        .toUpperCase()

    const handleMonthSelect = (monthName: string) => {
        const monthsMap: { [key: string]: number } = {
            'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
            'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
        }
        const m = monthsMap[monthName]
        if (m !== undefined) {
            setSelectedMonth(new Date(selectedMonth.getFullYear(), m, 1))
        }
    }

    const handleQuitar = async (vendaId: string) => {
        try {
            // Default to first account for quick marking, or show modal
            // User requested a simple "Quitar" button in FluxoCaixa. 
            // For better UX, we'll prompt for the account.
            setVendaParaQuitar(contasReceber.find((v: any) => v.id === vendaId))
        } catch (error) {
            toast.error('Erro ao preparar quitação')
        }
    }

    const confirmQuitar = async (contaSlug: string) => {
        if (!vendaParaQuitar) return
        try {
            // Encontrar o ID da conta pelo slug ou nome aproximado
            const conta = contas.find((c: any) =>
                c.nome.toLowerCase().includes(contaSlug.toLowerCase())
            )

            if (!conta) {
                toast.error('Conta não encontrada')
                return
            }

            await marcarVendaPaga({
                vendaId: vendaParaQuitar.id,
                contaId: conta.id,
                dataPagamento: format(new Date(), 'yyyy-MM-dd')
            })
            toast.success('Venda quitada com sucesso!')
            setVendaParaQuitar(null)
        } catch (error) {
            toast.error('Erro ao quitar venda')
        }
    }

    return (
        <PageContainer>
            <Header title="Fluxo de Caixa" showBack />

            {/* Navegação Mensal */}
            <div className="px-4 pt-4 pb-2">
                <MonthPicker
                    selectedMonth={selectedMonthStr}
                    onMonthSelect={handleMonthSelect}
                />
            </div>

            <div className="px-4 py-4 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                            <TrendingUp size={18} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Entradas</p>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                            {loadingResumo ? '...' : formatCurrency(resumo?.total_entradas || 0)}
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3">
                            <ArrowDownLeft size={18} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Saídas</p>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                            {loadingResumo ? '...' : formatCurrency(resumo?.total_saidas || 0)}
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                            <DollarSign size={18} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Lucro Estimado</p>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                            {loadingResumo ? '...' : formatCurrency(resumo?.lucro_estimado || 0)}
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                            <Clock size={18} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium">A Receber</p>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                            {loadingResumo ? '...' : formatCurrency(resumo?.total_a_receber || 0)}
                        </h3>
                    </div>
                </div>

                {/* Contas a Receber (Vendas Entregues pendentes) */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                            <Clock size={16} /> Contas a Receber
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {loadingReceber ? (
                            <div className="animate-pulse flex space-x-4 bg-white p-4 rounded-xl">
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                                </div>
                            </div>
                        ) : contasReceber.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
                                <p className="text-sm">Nenhum valor pendente de recebimento</p>
                            </div>
                        ) : (
                            contasReceber.map((venda: any) => (
                                <div key={venda.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group active:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 line-clamp-1">{venda.contato?.nome}</h4>
                                            <p className="text-xs text-slate-500">
                                                {venda.data_prevista_pagamento ? `Vence em ${format(new Date(venda.data_prevista_pagamento + 'T12:00:00'), 'dd/MM')}` : 'Sem data'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">{formatCurrency(venda.total)}</p>
                                        <button
                                            onClick={() => handleQuitar(venda.id)}
                                            className="text-[10px] text-violet-600 font-bold uppercase mt-1 hover:underline"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Extrato Mensal */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
                            <Receipt size={16} /> Extrato do Mês
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {loadingExtrato ? (
                            <div className="p-8 text-center text-slate-400">Carregando extrato...</div>
                        ) : extrato.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Filter size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Nenhum lançamento este mês</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {extrato.map((item) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                item.tipo === 'receita' ? "bg-emerald-50 text-emerald-600" :
                                                    item.tipo === 'despesa' ? "bg-red-50 text-red-600" :
                                                        "bg-blue-50 text-blue-600"
                                            )}>
                                                {item.tipo === 'receita' ? <ArrowUpRight size={20} /> :
                                                    item.tipo === 'despesa' ? <ArrowDownLeft size={20} /> :
                                                        <ArrowRightLeft size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{item.descricao}</h4>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                                                    {format(new Date(item.data + 'T12:00:00'), 'dd/MM')} • {item.categoria_nome || 'Lançamento'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-bold text-sm",
                                                item.tipo === 'receita' ? "text-emerald-600" :
                                                    item.tipo === 'despesa' ? "text-red-600" :
                                                        "text-slate-900"
                                            )}>
                                                {item.tipo === 'despesa' ? '-' : ''}{formatCurrency(item.valor || 0)}
                                            </p>
                                            <span className="text-[10px] text-slate-400 capitalize">{item.origem}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Backdrop for FAB */}
            {isFabOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
                    onClick={() => setIsFabOpen(false)}
                />
            )}

            {/* Floating Action Buttons Area */}
            <div className="fixed right-6 bottom-24 flex flex-col items-end gap-3 z-50">
                {/* FAB Menu Options */}
                <div className={cn(
                    "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom",
                    isFabOpen ? "scale-100 opacity-100 mb-2" : "scale-0 opacity-0 h-0 pointer-events-none"
                )}>
                    {/* Transferência */}
                    <div className="flex items-center gap-3">
                        <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
                            Transferência
                        </span>
                        <button
                            onClick={() => { setIsTransferenciaOpen(true); setIsFabOpen(false); }}
                            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                        >
                            <ArrowRightLeft size={24} />
                        </button>
                    </div>

                    {/* Saída */}
                    <div className="flex items-center gap-3">
                        <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
                            Saída
                        </span>
                        <button
                            onClick={() => { setIsSaidaOpen(true); setIsFabOpen(false); }}
                            className="w-12 h-12 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                        >
                            <ArrowDownLeft size={24} />
                        </button>
                    </div>

                    {/* Entrada */}
                    <div className="flex items-center gap-3">
                        <span className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 text-xs font-bold text-slate-600">
                            Entrada
                        </span>
                        <button
                            onClick={() => { setIsEntradaOpen(true); setIsFabOpen(false); }}
                            className="w-12 h-12 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                        >
                            <ArrowUpRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Main FAB */}
                <button
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={cn(
                        "w-14 h-14 text-white rounded-full shadow-lg shadow-violet-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all",
                        isFabOpen ? "bg-slate-800 rotate-45 shadow-none" : "bg-violet-600"
                    )}
                >
                    {isFabOpen ? <Plus size={24} /> : <Plus size={24} />}
                </button>
            </div>

            {/* Modals */}
            <LancamentoModal
                type="entrada"
                isOpen={isEntradaOpen}
                onClose={() => setIsEntradaOpen(false)}
            />
            <LancamentoModal
                type="saida"
                isOpen={isSaidaOpen}
                onClose={() => setIsSaidaOpen(false)}
            />
            <TransferenciaModal
                isOpen={isTransferenciaOpen}
                onClose={() => setIsTransferenciaOpen(false)}
            />

            {/* Modal Quitar Venda Quick Confirm */}
            <Modal
                isOpen={!!vendaParaQuitar}
                onClose={() => setVendaParaQuitar(null)}
                title="Confirmar Quitação"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Como o cliente <strong>{vendaParaQuitar?.contato?.nome}</strong> pagou o valor de <strong>{formatCurrency(vendaParaQuitar?.total || 0)}</strong>?
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                        <Button
                            variant="secondary"
                            className="justify-start gap-3 h-12"
                            onClick={() => confirmQuitar('pix')} // Assuming IDs match slugs for simple POC or we should fetch contas
                        >
                            <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                                <ArrowUpRight size={18} />
                            </div>
                            Pix
                        </Button>
                        <Button
                            variant="secondary"
                            className="justify-start gap-3 h-12"
                            onClick={() => confirmQuitar('dinheiro')}
                        >
                            <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <DollarSign size={18} />
                            </div>
                            Dinheiro
                        </Button>
                    </div>
                </div>
                <ModalActions>
                    <Button variant="ghost" onClick={() => setVendaParaQuitar(null)}>Cancelar</Button>
                </ModalActions>
            </Modal>
        </PageContainer>
    )
}

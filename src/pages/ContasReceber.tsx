import { useState, useMemo, useEffect } from 'react'
import {
    Search,
    Filter,
    Calendar,
    Phone,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Clock,
    CalendarDays
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { vendaService } from '../services/vendaService'
import type { DomainVenda } from '../types/domain'
import { formatCurrency } from '../utils/formatters'
import { differenceInDays, parseISO, isPast, isToday as isTodayFns, addDays, isBefore } from 'date-fns'
import { cn } from '../utils/cn'
import { useToast } from '../components/ui/Toast'
import { cashFlowService } from '../services/cashFlowService'
import { Modal, ModalActions, Select } from '../components/ui'
import type { Conta } from '../types/database'

type StatusFilter = 'todos' | 'vencidos' | 'hoje' | 'semana'

export function ContasReceber() {
    const [vendas, setVendas] = useState<DomainVenda[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<StatusFilter>('todos')
    const [searchTerm, setSearchTerm] = useState('')
    const [contas, setContas] = useState<Conta[]>([])
    const [selectedVenda, setSelectedVenda] = useState<DomainVenda | null>(null)
    const [selectedContaId, setSelectedContaId] = useState('')
    const [isQuitting, setIsQuitting] = useState(false)
    const navigate = useNavigate()
    const toast = useToast()

    const fetchVendas = async () => {
        try {
            setIsLoading(true)
            // Fetch all delivered but unpaid sales
            const data = await vendaService.getVendas(undefined, undefined, false)
            setVendas(data.filter(v => v.status === 'entregue' && !v.pago && v.origem !== 'catalogo' && v.formaPagamento !== 'brinde'))
        } catch (error) {
            console.error('Erro ao carregar contas a receber:', error)
            toast.error('Não foi possível carregar as contas a receber')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchVendas()
        fetchContas()
    }, [])

    const fetchContas = async () => {
        try {
            const data = await cashFlowService.getContas()
            setContas(data)
            if (data.length > 0) setSelectedContaId(data[0].id)
        } catch (error) {
            console.error('Erro ao carregar contas:', error)
        }
    }

    const filteredVendas = useMemo(() => {
        let result = vendas

        if (searchTerm) {
            result = result.filter(v =>
                v.contato?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.total.toString().includes(searchTerm)
            )
        }

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        if (filter === 'vencidos') {
            result = result.filter(v =>
                v.dataPrevistaPagamento &&
                isBefore(parseISO(v.dataPrevistaPagamento), hoje)
            )
        } else if (filter === 'hoje') {
            result = result.filter(v =>
                v.dataPrevistaPagamento &&
                isTodayFns(parseISO(v.dataPrevistaPagamento))
            )
        } else if (filter === 'semana') {
            const umaSemana = addDays(hoje, 7)
            result = result.filter(v =>
                v.dataPrevistaPagamento &&
                isPast(parseISO(v.dataPrevistaPagamento)) === false &&
                isBefore(parseISO(v.dataPrevistaPagamento), umaSemana)
            )
        }

        // Sort: Vencidos first, then by date, nulls last
        return [...result].sort((a, b) => {
            if (!a.dataPrevistaPagamento) return 1
            if (!b.dataPrevistaPagamento) return -1
            return a.dataPrevistaPagamento.localeCompare(b.dataPrevistaPagamento)
        })
    }, [vendas, filter, searchTerm])

    const handleQuitar = (venda: DomainVenda) => {
        setSelectedVenda(venda)
    }

    const confirmQuitar = async () => {
        if (!selectedVenda || !selectedContaId) return

        try {
            setIsQuitting(true)
            await vendaService.quitarVenda(selectedVenda.id, selectedVenda.formaPagamento, selectedContaId)
            toast.success('Venda quitada com sucesso')
            setSelectedVenda(null)
            fetchVendas()
        } catch (error) {
            console.error('Erro ao quitar venda:', error)
            toast.error('Não foi possível quitar a venda')
        } finally {
            setIsQuitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-32">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4 px-4 h-16 max-w-5xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                            Contas a Receber
                        </h1>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Gestão de Inadimplência
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 space-y-6">
                {/* Search & Filters */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou valor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-medium"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {[
                            { id: 'todos', label: 'Todos', icon: Filter },
                            { id: 'vencidos', label: 'Vencidos', icon: AlertCircle },
                            { id: 'hoje', label: 'Vencem Hoje', icon: Clock },
                            { id: 'semana', label: 'Essa Semana', icon: CalendarDays },
                        ].map((btn) => {
                            const Icon = btn.icon
                            const isSelected = filter === btn.id
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => setFilter(btn.id as StatusFilter)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                                        isSelected
                                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg"
                                            : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {btn.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-zinc-500 uppercase animate-pulse">Carregando pendências...</p>
                        </div>
                    ) : filteredVendas.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center space-y-4 bg-white dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                <CheckCircle2 className="w-8 h-8 text-zinc-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-zinc-900 dark:text-white">Nenhuma conta encontrada</h3>
                                <p className="text-sm text-zinc-500">Tudo em dia por aqui!</p>
                            </div>
                        </div>
                    ) : (
                        filteredVendas.map((venda) => {
                            const dataPrevista = venda.dataPrevistaPagamento ? parseISO(venda.dataPrevistaPagamento) : null
                            const hoje = new Date()
                            hoje.setHours(0, 0, 0, 0)

                            let badgeStyle = "bg-zinc-100 text-zinc-500 border-zinc-200" // Sem data
                            let label = "Sem Data"
                            let atraso = 0

                            if (dataPrevista) {
                                if (isBefore(dataPrevista, hoje)) {
                                    badgeStyle = "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                    label = "Vencido"
                                    atraso = differenceInDays(hoje, dataPrevista)
                                } else if (isTodayFns(dataPrevista)) {
                                    badgeStyle = "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30"
                                    label = "Vence Hoje"
                                } else {
                                    badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                    label = "Futuro"
                                }
                            }

                            return (
                                <div
                                    key={venda.id}
                                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-lg text-zinc-400">
                                                    {venda.contato?.nome?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3
                                                        className="font-black text-zinc-900 dark:text-white leading-tight cursor-pointer hover:text-primary-500 transition-colors"
                                                        onClick={() => navigate(`/contatos/${venda.contatoId}`)}
                                                    >
                                                        {venda.contato?.nome || 'Cliente não identificado'}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-bold uppercase tracking-tight">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(venda.data).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        {venda.contato?.telefone && (
                                                            <a
                                                                href={`https://wa.me/55${venda.contato.telefone.replace(/\D/g, '')}`}
                                                                target="_blank"
                                                                className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold uppercase tracking-tight hover:underline"
                                                            >
                                                                <Phone className="w-3 h-3" />
                                                                WhatsApp
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase border", badgeStyle)}>
                                                {label} {atraso > 0 ? `(${atraso}d)` : ''}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Valor Pendente</span>
                                                <span className="text-xl font-black text-zinc-900 dark:text-white">
                                                    {formatCurrency(venda.total)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Previsão</span>
                                                <span className={cn(
                                                    "text-base font-bold",
                                                    atraso > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"
                                                )}>
                                                    {venda.dataPrevistaPagamento
                                                        ? new Date(venda.dataPrevistaPagamento).toLocaleDateString('pt-BR')
                                                        : 'Não definida'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1 rounded-2xl h-12"
                                                onClick={() => navigate(`/vendas/${venda.id}`)}
                                            >
                                                Detalhes
                                            </Button>
                                            <Button
                                                className="flex-[1.5] rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                                                onClick={() => handleQuitar(venda)}
                                            >
                                                Quitar Agora
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Modal de Quitação */}
                <Modal
                    isOpen={!!selectedVenda}
                    onClose={() => !isQuitting && setSelectedVenda(null)}
                    title="Confirmar Recebimento"
                    size="sm"
                >
                    {selectedVenda && (
                        <div className="space-y-4">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-zinc-500 uppercase">Cliente</span>
                                    <span className="text-sm font-black text-zinc-900 dark:text-white">{selectedVenda.contato?.nome}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-zinc-500 uppercase">Valor</span>
                                    <span className="text-lg font-black text-primary-600 dark:text-primary-400">{formatCurrency(selectedVenda.total)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1">
                                    Conta de Destino
                                </label>
                                <Select
                                    value={selectedContaId}
                                    onChange={(e) => setSelectedContaId(e.target.value)}
                                    className="w-full"
                                    options={contas.map(ct => ({ value: ct.id, label: ct.nome }))}
                                />
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                                    Este recebimento será registrado automaticamente no Fluxo de Caixa como entrada na conta selecionada.
                                </p>
                            </div>

                            <ModalActions>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedVenda(null)}
                                    disabled={isQuitting}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={confirmQuitar}
                                    isLoading={isQuitting}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                                >
                                    Confirmar Recebimento
                                </Button>
                            </ModalActions>
                        </div>
                    )}
                </Modal>
            </main>
        </div>
    )
}

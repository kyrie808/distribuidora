import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    MapPin,
    Edit,
    Trash2,
    Eye,
    User,
    Building2,
    BadgeCheck,
    MessageCircle,
    ShoppingCart,
    Crown,
    Award,
    TrendingUp,
    Fingerprint,
    ChevronDown,
    Phone,
    Copy,
    Mail,
    Target
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, LoadingScreen, Modal, ModalActions } from '../components/ui'
import { ContatoFormModal } from '../components/contatos'
import { useContato, useContatos } from '../hooks/useContatos'
import { useToast } from '../components/ui/Toast'
import {
    formatDate,
    getWhatsAppLink,
    formatCurrency
} from '../utils/formatters'
import { useVendas } from '../hooks/useVendas'
import { calcularNivelCliente } from '../utils/calculations'
import { useIndicacoes } from '../hooks/useIndicacoes'
import { cn } from '@/lib/utils'

// --- VISUAL COMPONENTS (STICH STYLE) ---





function GamificationBadge({ icon: Icon, label, colorClass }: { icon: any, label: string, colorClass: string }) {
    return (
        <div className={cn(
            "flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full border px-3 transition-colors",
            colorClass
        )}>
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
        </div>
    )
}

interface ReceiptCardProps {
    venda: any;
    onEdit?: (id: string, e: React.MouseEvent) => void;
    onView?: (id: string, e: React.MouseEvent) => void;
    onDelete?: (id: string, e: React.MouseEvent) => void;
}

function ReceiptCard({ venda, onEdit, onView, onDelete }: ReceiptCardProps) {
    return (
        <div
            className="group relative bg-white/5 border-l-[4px] border-l-primary hover:border-l-primary-400 p-4 rounded-r-xl transition-all hover:bg-white/10 mb-3 shadow-sm border-y border-r border-white/5"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-500 font-mono tracking-widest">#{venda.id.slice(0, 8).toUpperCase()}</span>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground tabular-nums">
                        {formatCurrency(venda.total)}
                    </span>
                    {venda.pago ? (
                        <span className="bg-semantic-green/10 text-semantic-green text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-semantic-green/20">Pago</span>
                    ) : (
                        <span className="bg-semantic-yellow/10 text-semantic-yellow text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-semantic-yellow/20">A Receber</span>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div className="flex-1 pr-4">
                    <div className="space-y-1">
                        {venda.itens.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-400 flex items-center justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                <span className="line-clamp-1">
                                    <span className="text-gray-500 font-mono mr-2">{item.quantidade}x</span>
                                    {item.produto?.nome || 'Produto'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 pl-2">
                    <p className="text-sm font-bold text-gray-400 font-mono mb-1">{formatDate(venda.data)}</p>
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-primary hover:text-primary-400 hover:bg-primary/10 rounded-lg"
                            onClick={(e) => onView && onView(venda.id, e)}
                            title="Ver Detalhes"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {venda.status !== 'cancelada' && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg"
                                onClick={(e) => onEdit && onEdit(venda.id, e)}
                                title="Editar"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {venda.status === 'cancelada' && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                onClick={(e) => onDelete && onDelete(venda.id, e)}
                                title="Excluir"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN COMPONENTS ---

function VendasHistorico({ contatoId }: { contatoId: string }) {
    const navigate = useNavigate()
    const { vendas: todasVendas, loading, error, deleteVenda } = useVendas()

    // Filter locally
    const vendas = todasVendas.filter(v => v.contatoId === contatoId)
    const [vendaToDelete, setVendaToDelete] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!vendaToDelete) return
        await deleteVenda(vendaToDelete)
        setVendaToDelete(null)
    }

    if (loading) return <div className="text-center py-8 text-gray-400 text-sm">Carregando histórico...</div>
    if (error) return <div className="text-center py-8 text-red-400 text-sm">Erro ao carregar histórico</div>
    if (vendas.length === 0) return <div className="text-center py-8 text-gray-400 text-sm opacity-60">Nenhuma compra registrada 🍃</div>

    return (
        <div className="mt-2">
            {vendas.map((venda) => (
                <div key={venda.id}>
                    <ReceiptCard
                        venda={venda}
                        onView={(id, e) => {
                            e.stopPropagation();
                            navigate(`/vendas/${id}`);
                        }}
                        onEdit={(id, e) => {
                            e.stopPropagation();
                            navigate(`/vendas/${id}/editar`);
                        }}
                        onDelete={(id, e) => {
                            e.stopPropagation();
                            setVendaToDelete(id);
                        }}
                    />
                </div>
            ))}

            <Modal
                isOpen={!!vendaToDelete}
                onClose={() => setVendaToDelete(null)}
                title="Excluir Venda"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">Confirma exclusão desta venda cancelada?</p>
                    <ModalActions>
                        <Button variant="secondary" onClick={() => setVendaToDelete(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete}>Excluir</Button>
                    </ModalActions>
                </div>
            </Modal>
        </div>
    )
}

export function ContatoDetalhe() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const { contato, loading, error, refetch } = useContato(id)
    const { deleteContato } = useContatos({ realtime: false })
    const { vendas: vendasRaw } = useVendas()
    const todasVendas = vendasRaw.filter(v => v.contatoId === id)
    const { getIndicadorById } = useIndicacoes()

    const vendasValidas = todasVendas.filter(v => v.status !== 'cancelada')
    const indicadorInfo = getIndicadorById(id || '')
    const indicacoesConvertidas = indicadorInfo?.indicacoesConvertidas || 0
    const nivelCliente = calcularNivelCliente(vendasValidas.length, indicacoesConvertidas)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isAddressExpanded, setIsAddressExpanded] = useState(false)

    const handleDelete = async () => {
        if (!contato) return
        setIsDeleting(true)
        const success = await deleteContato(contato.id)
        setIsDeleting(false)
        if (success) {
            toast.success('Contato excluído!')
            navigate('/contatos')
        } else {
            toast.error('Erro ao excluir contato')
        }
    }

    const handleWhatsApp = () => {
        if (!contato) return
        window.open(getWhatsAppLink(contato.telefone), '_blank')
    }

    if (loading) return <> <Header title="..." showBack /><LoadingScreen /> </>
    if (error || !contato) return <> <Header title="Erro" showBack /><PageContainer><div className="text-red-500">Contato não encontrado</div></PageContainer> </>

    const AvatarIcon = contato.tipo === 'B2B' ? Building2 : User

    // Configuração de Levels
    const isGold = nivelCliente.nivel === 'ouro'
    const isSilver = nivelCliente.nivel === 'prata'
    const nextLevel = nivelCliente.proximoNivel
    const progressPercent = nextLevel === 'Ouro'
        ? Math.min(100, (vendasValidas.length / 10) * 100) // Exemplo hipotético de 10 pra ouro
        : Math.min(100, (vendasValidas.length / 3) * 100) // 3 pra prata

    return (
        <div className="bg-secondary dark:bg-background font-display text-foreground min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background pb-24">

                <Header
                    title="Perfil do Cliente"
                    showBack
                    className="sticky top-0 z-30"
                    rightAction={
                        <button onClick={() => setIsEditModalOpen(true)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-foreground transition-colors">
                            <Edit className="h-5 w-5" />
                        </button>
                    }
                />

                <PageContainer className="relative z-10 pt-4 px-4 space-y-6 bg-transparent pb-4">

                    {/* HERO SECTION */}
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="relative mb-4 group cursor-pointer">
                            <div className={cn(
                                "flex items-center justify-center w-28 h-28 rounded-full border-4 shadow-xl transition-transform group-hover:scale-105",
                                isGold ? "bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-300/50" :
                                    isSilver ? "bg-gradient-to-br from-slate-300 to-slate-500 border-slate-300/50" :
                                        "bg-gradient-to-br from-violet-600 to-indigo-600 border-violet-400/30"
                            )}>
                                <AvatarIcon className="h-12 w-12 text-white drop-shadow-md" />
                            </div>
                            {/* Verified Badge - Only for active 'Cliente' */}
                            {contato.status === 'cliente' && (
                                <div className="absolute bottom-0 right-0 bg-violet-600 p-1.5 rounded-full border-[3px] border-background-light dark:border-background-dark shadow-md z-10" title="Cliente Verificado">
                                    <BadgeCheck className="h-4 w-4 text-white" />
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-center text-foreground tracking-tight mb-1">
                            {contato.nome} {contato.apelido && <span className="text-muted-foreground font-medium text-lg ml-2">● ({contato.apelido})</span>}
                        </h1>

                        <div className="flex items-center gap-2 mb-6">
                            <span className={cn(
                                "text-sm font-medium tracking-wide uppercase",
                                isGold ? "text-yellow-500" : isSilver ? "text-gray-400" : "text-violet-400"
                            )}>
                                MEMBRO {nivelCliente.nivel.toUpperCase()}
                            </span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                            <span className="text-sm text-gray-500">Desde {new Date(contato.criadoEm).getFullYear()}</span>
                        </div>

                        {/* Primary Actions */}
                        <div className="flex w-full gap-3 max-w-sm">
                            <Button
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-0 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
                                leftIcon={<MessageCircle className="h-4 w-4" />}
                                onClick={handleWhatsApp}
                            >
                                WhatsApp
                            </Button>
                            <Button
                                className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-bold border-0 shadow-lg shadow-black/5 transition-all hover:scale-[1.02]"
                                leftIcon={<ShoppingCart className="h-4 w-4" />}
                                onClick={() => navigate('/nova-venda', { state: { contatoId: contato.id } })}
                            >
                                Nova Venda
                            </Button>
                        </div>
                    </div>

                    {/* BADGES ROW */}
                    <div className="flex flex-wrap justify-center gap-3 py-2">
                        {isGold && <GamificationBadge icon={Crown} label="Status VIP" colorClass="bg-yellow-500/10 text-yellow-500 border-yellow-500/20" />}
                        {contato.tipo === 'B2B' && <GamificationBadge icon={Building2} label="Empresa" colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20" />}
                    </div>

                    {/* INFO PANELS */}
                    {/* INFO PANELS (SYSTEM DESIGN) */}
                    <div className="space-y-3">
                        {/* Contact Intel Card (Collapsible) */}
                        <div className="flex flex-col bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
                            {/* Header (Clickable) */}
                            <div
                                onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className={cn("flex items-center justify-center h-10 w-10 rounded-full bg-violet-500/10 text-violet-500 transition-transform duration-300", isAddressExpanded && "rotate-180 bg-violet-500 text-white")}>
                                    <Fingerprint className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Informação de Contato
                                    </p>
                                    {!isAddressExpanded && (
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5 animate-fade-in">
                                            {[contato.endereco, contato.bairro].filter(Boolean).join(', ') || 'Sem endereço'}
                                        </p>
                                    )}
                                </div>
                                <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform duration-300", isAddressExpanded && "rotate-180")} />
                            </div>

                            {/* Expanded Content */}
                            <div className={cn(
                                "grid transition-all duration-500 ease-in-out",
                                isAddressExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}>
                                <div className="overflow-hidden">
                                    <div className="px-5 pb-5 pt-0 space-y-4">
                                        {/* Map Preview (Tactical Style) */}
                                        <div className="relative w-full h-48 bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-inner group">
                                            {/* Tactical Overlay */}
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20 pointer-events-none z-10" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />

                                            {/* Map Iframe */}
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                scrolling="no"
                                                marginHeight={0}
                                                marginWidth={0}
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent([contato.endereco, contato.bairro, 'São Paulo'].join(', '))}&t=m&z=15&ie=UTF8&iwloc=&output=embed&style=feature:all|element:all|saturation:-100|visibility:simplified`}
                                                className="opacity-60 grayscale contrast-125 hover:opacity-80 hover:grayscale-0 transition-all duration-500"
                                            />

                                            {/* Center Pin */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                                <div className="relative">
                                                    <div className="absolute -inset-4 bg-violet-500/30 rounded-full animate-ping" />
                                                    <MapPin className="h-8 w-8 text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] fill-violet-950" />
                                                </div>
                                            </div>

                                            {/* Lat/Long Badge */}
                                            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full">
                                                <span className="text-[10px] font-mono text-violet-300">
                                                    LAT: -23.5505 // LONG: -46.6333
                                                </span>
                                            </div>
                                        </div>

                                        {/* Contact Actions */}
                                        <div className="grid gap-3">
                                            {/* Address Row */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group/addr">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Localização</p>
                                                        {[contato.endereco, contato.bairro].filter(Boolean).length > 0 ? (
                                                            <p className="text-sm font-mono text-foreground tracking-wider line-clamp-1">
                                                                {[contato.endereco, contato.bairro].filter(Boolean).join(', ')}
                                                            </p>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-mono text-gray-400 italic">endereço não cadastrado</p>
                                                                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500/50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {[contato.endereco, contato.bairro].filter(Boolean).length > 0 && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover/addr:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const fullAddress = [contato.endereco, contato.bairro, 'São Paulo'].filter(Boolean).join(', ');
                                                                window.open(`https://www.google.com/maps/search/?api=1&query=${fullAddress}`, '_blank');
                                                            }}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                            title="Abrir no Maps"
                                                        >
                                                            <MapPin className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText([contato.endereco, contato.bairro].filter(Boolean).join(', '));
                                                                toast.success('Endereço copiado!');
                                                            }}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                            title="Copiar Endereço"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Phone Row */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group/phone">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-violet-500/10 rounded-full text-violet-500">
                                                        <Phone className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Mobile Uplink</p>
                                                        {contato.telefone ? (
                                                            <p className="text-sm font-mono text-foreground tracking-wider">{contato.telefone}</p>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-mono text-gray-400 italic">sem telefone</p>
                                                                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500/50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {contato.telefone && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(contato.telefone);
                                                            toast.success('Telefone copiado!');
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors opacity-0 group-hover/phone:opacity-100"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Email Row */}
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 group/email">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-full", contato.email ? "bg-violet-500/10 text-violet-500" : "bg-gray-500/10 text-gray-400")}>
                                                        <Mail className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Secure Comms</p>
                                                        {contato.email ? (
                                                            <p className="text-sm font-mono text-foreground tracking-wider">{contato.email}</p>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-mono text-gray-400 italic">não possui email cadastrado</p>
                                                                <span className="flex h-1.5 w-1.5 rounded-full bg-orange-500/50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {contato.email && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(contato.email || '');
                                                            toast.success('Email copiado!');
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors opacity-0 group-hover/email:opacity-100"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Card */}
                        {contato.observacoes && (
                            <div className="flex items-start gap-4 p-5 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                                <Award className="h-6 w-6 text-semantic-yellow shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                        Observações
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {contato.observacoes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LOYALTY JOURNEY */}
                    {nextLevel && (
                        <div className="mt-6 px-2">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
                                <TrendingUp className="h-5 w-5 text-primary-500" />
                                Jornada de Fidelidade
                            </h3>

                            <div className="grid grid-cols-[40px_1fr] gap-x-2 relative">
                                {/* Timeline Line (Tactical) */}
                                <div className="absolute left-[19px] top-8 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-gray-800 to-transparent pointer-events-none" />

                                {/* Current Node */}
                                <div className="flex flex-col items-center z-10">
                                    <div className="flex items-center justify-center size-8 rounded-full bg-accent/10 border border-accent text-accent shadow-[0_0_15px_theme(colors.accent.DEFAULT)] animate-pulse-slow">
                                        <Crown className="h-4 w-4" />
                                    </div>
                                </div>

                                <div className="pb-8">
                                    {/* Progress Header */}
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Status Atual</p>
                                            <p className="text-lg font-bold text-foreground flex items-center gap-2">
                                                Próximo Nível: <span className="text-primary">{nextLevel}</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-bold text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{Math.round(progressPercent)}%</span>
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Concluído</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar (Glow) */}
                                    <div className="relative w-full h-3 bg-surface-dark rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div
                                            className="bg-gradient-to-r from-green-600 via-primary to-green-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_theme(colors.primary.DEFAULT)] relative overflow-hidden"
                                            style={{ width: `${progressPercent}%` }}
                                        >
                                            {/* Shimmer Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer" />
                                        </div>
                                    </div>

                                    {/* Mission/Goal Intel */}
                                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-surface-dark to-surface-dark/50 border border-white/5 relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-gray-400">
                                                <Target className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                                                    Objetivo da Missão
                                                </p>
                                                <p className="text-sm text-gray-300">
                                                    Realize mais <span className="font-bold text-white">{nivelCliente.comprasFaltando}</span> compras para desbloquear o status <span className="text-primary font-bold">{nextLevel}</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Goal Node removed (integrated into timeline) */}
                        </div>
                    )}

                    {/* SALES HISTORY */}
                    <div className="mt-4">
                        <div className="flex justify-between items-end mb-4 px-2">
                            <h3 className="text-lg font-bold text-foreground">Histórico de Compras</h3>
                            <span className="text-xs text-primary-400 font-bold uppercase tracking-wider">
                                Total: {formatCurrency(todasVendas.reduce((acc, v) => v.status !== 'cancelada' ? acc + v.total : acc, 0))}
                            </span>
                        </div>

                        <VendasHistorico contatoId={contato.id} />
                    </div>

                    {/* DANGER ZONE */}
                    <div className="pt-4 pb-0">
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir Contato
                        </Button>
                    </div>

                    {/* MODALS */}
                    <ContatoFormModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        contato={contato}
                        onSuccess={() => refetch()}
                    />

                    <Modal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        title="Excluir Contato"
                        size="sm"
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Tem certeza que deseja excluir <strong>{contato.nome}</strong>?
                                <br />
                                <span className="text-sm text-gray-500">
                                    Esta ação removerá todo o histórico e não pode ser desfeita.
                                </span>
                            </p>
                            <ModalActions>
                                <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                                <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>Excluir Definitivamente</Button>
                            </ModalActions>
                        </div>
                    </Modal>

                </PageContainer>
            </div >
        </div >
    )
}


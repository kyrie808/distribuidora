import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    DollarSign,
    User,
    Trash2,
    Printer,
    CheckCheck,
    MessageCircle,

    Hourglass,
    Truck,
    RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Button, LoadingScreen, Modal, ModalActions, Badge } from '../components/ui'
import { useVenda, useVendas } from '../hooks/useVendas'
import type { PagamentoFormData } from '../schemas/venda'
import { useToast } from '../components/ui/Toast'
import { PaymentSidebar } from '../components/features/vendas/PaymentSidebar'
import {
    formatCurrency,
    formatDate,
} from '../utils/formatters'
import { VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '../constants'

export function VendaDetalhe() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const { venda, loading, error, refetch } = useVenda(id)
    const { deleteVenda, addPagamento, updateVendaStatus, deleteUltimoPagamento } = useVendas({ realtime: false })

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showRevertModal, setShowRevertModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [loadingAction, setLoadingAction] = useState(false)

    // Handlers
    const handleDelete = async () => {
        if (!venda) return
        setIsDeleting(true)
        const success = await deleteVenda(venda.id)
        if (success) {
            toast.success('Venda excluída com sucesso')
            navigate('/vendas')
        } else {
            toast.error('Erro ao excluir venda')
            setIsDeleting(false)
        }
    }

    const handlePaymentConfirm = async (data: PagamentoFormData): Promise<boolean> => {
        if (!venda) return false
        const success = await addPagamento(venda.id, data)
        if (success) {
            await refetch()
            setShowPaymentModal(false)
            toast.success('Pagamento registrado!')
            return true
        } else {
            toast.error('Erro ao registrar pagamento')
            return false
        }
    }

    const handleEntregar = async () => {
        if (!venda) return

        if (venda.status === 'entregue') {
            setShowRevertModal(true)
            return
        }

        const success = await updateVendaStatus(venda.id, 'entregue')
        if (success) {
            await refetch()
            toast.success('Venda marcada como entregue!')
        } else {
            toast.error('Erro ao atualizar status')
        }
    }

    const handleRevertDelivery = async () => {
        if (!venda) return
        const success = await updateVendaStatus(venda.id, 'pendente')
        if (success) {
            await refetch()
            setShowRevertModal(false)
            toast.success('Entrega revertida para pendente')
        } else {
            toast.error('Erro ao reverter status')
        }
    }

    const handleDesfazerPagamento = async () => {
        if (!venda) return
        if (!confirm('Deseja realmente desfazer o último pagamento?')) return

        setLoadingAction(true)
        const success = await deleteUltimoPagamento(venda.id)
        if (success) {
            await refetch()
            toast.success('Pagamento desfeito com sucesso!')
        } else {
            toast.error('Erro ao desfazer pagamento')
        }
        setLoadingAction(false)
    }

    const handleShare = async () => {
        if (!venda) return
        const text = `
🛒 *Pedido #${venda.id.slice(0, 6)}*
👤 Cliente: ${venda.contato?.nome}
📅 Data: ${formatDate(venda.data)}
💰 Total: ${formatCurrency(venda.total)}
📦 Status: ${VENDA_STATUS_LABELS[venda.status]}
        `.trim()

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Pedido #${venda.id.slice(0, 6)}`,
                    text: text
                })
            } catch (err) {
                console.error('Share failed', err)
            }
        } else {
            navigator.clipboard.writeText(text)
            toast.success('Copiado para área de transferência!')
        }
    }

    if (loading) return <LoadingScreen message="Carregando detalhes..." />
    if (error || !venda) return (
        <div className="p-4 text-center">
            <p className="text-red-500 mb-4">{error || 'Venda não encontrada'}</p>
            <Button onClick={() => navigate('/vendas')}>Voltar</Button>
        </div>
    )

    // Custom Styles for Stitch Design (Themed)
    const neonShadow = "dark:drop-shadow-[0_0_10px_rgba(19,236,19,0.5)]"
    const glassPanel = "bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-100 dark:border-border"

    return (
        <div className="bg-secondary dark:bg-background font-display text-gray-900 dark:text-gray-200 min-h-screen flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-white">

            {/* STICKY HEADER - Uses Standard Component */}
            <Header
                title={`PEDIDO #${venda.id.slice(0, 6)}`}
                showBack

                className="bg-secondary/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-100 dark:border-border"
            />

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col pt-6 px-4 pb-32 w-full max-w-md mx-auto">

                {/* RECEIPT CONTAINER */}
                <div className="relative w-full mb-8">
                    {/* Receipt Body */}
                    <div className="bg-white dark:bg-card pt-8 px-6 pb-6 rounded-t-xl relative border-x border-t border-gray-200 dark:border-border shadow-xl dark:shadow-2xl">

                        {/* Hero Section */}
                        <div className="flex flex-col items-center mb-8">
                            <span className="text-xs font-mono text-gray-400 dark:text-primary/60 tracking-[0.2em] mb-2 uppercase">Valor Total</span>
                            <h1 className={`text-4xl font-mono font-bold text-gray-900 dark:text-primary tracking-tight mb-6 ${neonShadow}`}>
                                {formatCurrency(venda.total)}
                            </h1>

                            {/* Status Badge */}
                            {/* Status & Payment Badges */}
                            {/* Status Badges */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                {venda.pago && venda.status === 'entregue' ? (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-500">
                                        <Badge
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(19,236,19,0.4)] flex items-center gap-2 border-none"
                                        >
                                            <CheckCheck className="w-5 h-5" />
                                            <span className="tracking-widest font-bold text-sm">CONCLUÍDO</span>
                                        </Badge>
                                    </div>
                                ) : (
                                    <>
                                        {/* Delivery Status */}
                                        <Badge
                                            variant={
                                                venda.status === 'entregue' ? 'success' :
                                                    venda.status === 'cancelada' ? 'destructive' :
                                                        'warning'
                                            }
                                            className={cn(
                                                "px-4 py-1.5 text-xs tracking-wide uppercase shadow-sm transition-colors",
                                                venda.status === 'entregue' && "bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success)/0.8)] shadow-lg shadow-success/40 dark:shadow-success/20"
                                            )}
                                        >
                                            {VENDA_STATUS_LABELS[venda.status]}
                                        </Badge>

                                        {/* Payment Status (Pending) */}
                                        {!venda.pago && venda.status !== 'cancelada' && (
                                            <Badge
                                                variant="warning"
                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-500/30"
                                            >
                                                <Hourglass className="w-3.5 h-3.5" />
                                                <span>Pagamento Pendente</span>
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>

                            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-4">
                                {formatDate(venda.data)}
                            </p>
                        </div>

                        {/* Dashed Separator */}
                        <div className="w-full border-b-2 border-dashed border-gray-200 dark:border-border my-6 relative">
                            <div className="absolute -left-[30px] -top-[10px] w-5 h-5 rounded-full bg-secondary dark:bg-background"></div>
                            <div className="absolute -right-[30px] -top-[10px] w-5 h-5 rounded-full bg-secondary dark:bg-background"></div>
                        </div>

                        {/* Items List */}
                        <div className="flex flex-col space-y-4">
                            {venda.itens.map((item) => (
                                <div key={item.id} className="flex justify-between items-start group">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-white transition-colors">
                                            {item.produto?.nome || 'Produto Removido'}
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                                            QTD: x{item.quantidade}
                                        </span>
                                    </div>
                                    <span className="text-sm font-mono text-gray-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary transition-colors">
                                        {formatCurrency(item.subtotal)}
                                    </span>
                                </div>
                            ))}

                            {/* Divider */}
                            <div className="border-b border-dashed border-gray-200 dark:border-border w-full my-4"></div>

                            {/* Summary Footer */}
                            {venda.taxaEntrega > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Taxa de Entrega</span>
                                    <span className="font-mono text-gray-700 dark:text-gray-300">{formatCurrency(venda.taxaEntrega)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400">Desconto</span>
                                <span className="font-mono text-green-600 dark:text-primary">- {formatCurrency(0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Serrated Bottom Edge (SVG) */}
                    <div className="h-4 w-full relative overflow-hidden">
                        <svg className="absolute top-0 left-0 w-full h-4 text-white dark:text-card fill-current drop-shadow-sm dark:drop-shadow-xl" preserveAspectRatio="none" viewBox="0 0 100 10">
                            <polygon points="0,0 100,0 100,10 98,0 96,10 94,0 92,10 90,0 88,10 86,0 84,10 82,0 80,10 78,0 76,10 74,0 72,10 70,0 68,10 66,0 64,10 62,0 60,10 58,0 56,10 54,0 52,10 50,0 48,10 46,0 44,10 42,0 40,10 38,0 36,10 34,0 32,10 30,0 28,10 26,0 24,10 22,0 20,10 18,0 16,10 14,0 12,10 10,0 8,10 6,0 4,10 2,0 0,10"></polygon>
                        </svg>
                    </div>
                    {/* Shadow under receipt */}
                    <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/10 dark:bg-black/40 blur-lg rounded-[100%] z-[-1]"></div>
                </div>

                {/* Main Action Buttons (Moved) */}
                <div className="flex gap-3 mb-6">
                    {(venda.status === 'pendente' || venda.status === 'entregue') && (
                        <Button
                            className="flex-1"
                            variant={venda.status === 'entregue' ? "secondary" : "primary"}
                            onClick={handleEntregar}
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            {venda.status === 'entregue' ? 'Voltar para Pendente' : 'Entregar'}
                        </Button>
                    )}

                    {!venda.pago && venda.status !== 'cancelada' && (
                        <Button
                            className="flex-1"
                            variant="primary"
                            onClick={() => setShowPaymentModal(true)}
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Quitar
                        </Button>
                    )}

                    {venda.pago && venda.status !== 'cancelada' && (
                        <Button
                            className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 border-transparent"
                            variant="outline"
                            onClick={handleDesfazerPagamento}
                            disabled={loadingAction}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Desfazer Pagamento
                        </Button>
                    )}
                </div>

                {/* CLIENT INFO CARD */}
                <div className={`${glassPanel} rounded-xl p-5 flex items-center justify-between shadow-sm mb-6`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-border overflow-hidden">
                            <User className="h-6 w-6 text-gray-600 dark:text-white dark:opacity-80" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-gray-900 dark:text-white font-medium text-base">{venda.contato?.nome}</h3>
                            <p className="text-xs text-gray-500 truncate max-w-[140px]">{venda.contato?.telefone}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.open(`https://wa.me/55${venda.contato?.telefone.replace(/\D/g, '')}`, '_blank')}
                        className="relative group flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-primary/20 border border-green-200 dark:border-primary/50 text-green-600 dark:text-primary hover:bg-green-500 dark:hover:bg-primary hover:text-white dark:hover:text-black transition-all duration-300 p-0"
                    >
                        <MessageCircle className="h-5 w-5 relative z-10" />
                    </Button>
                </div>

                {/* META INFO GRID */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`${glassPanel} rounded-lg p-3 flex flex-col gap-1`}>
                        <span className="text-[10px] text-gray-500 uppercase font-mono">ID Venda</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">#{venda.id.slice(0, 8)}</span>
                    </div>
                    <div className={`${glassPanel} rounded-lg p-3 flex flex-col gap-1`}>
                        <span className="text-[10px] text-gray-500 uppercase font-mono">Pagamento</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                            {FORMA_PAGAMENTO_LABELS[venda.formaPagamento] || venda.formaPagamento}
                        </span>
                    </div>
                </div>

                {/* ACTION BUTTONS (Inline) */}
                <div className="mt-8 mb-6 flex flex-col gap-3">
                    {/* Main Action Buttons Moved Up */}

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-gray-200 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                            onClick={handleShare}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Compartilhar
                        </Button>

                        {/* Action Buttons */}


                        {venda.status !== 'cancelada' ? (
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </Button>
                        )}
                    </div>


                </div>

            </main>

            {/* Payment Sidebar - Desktop & Mobile */}
            {showPaymentModal && venda && (
                <>
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:flex w-96 flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-screen sticky top-0">
                        <PaymentSidebar
                            onBack={() => setShowPaymentModal(false)}
                            onConfirm={handlePaymentConfirm}
                            vendaId={venda.id}
                            total={venda.total}
                            valorPago={venda.valorPago || 0}
                            historico={venda.pagamentos}
                            customerName={venda.contato?.nome || 'Cliente'}
                        />
                    </aside>

                    {/* Mobile Drawer */}
                    <div className="fixed inset-0 z-[60] md:hidden flex justify-end">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowPaymentModal(false)}
                        />
                        <div className="relative w-[85vw] max-w-sm bg-white dark:bg-gray-800 h-[100dvh] shadow-2xl transform transition-transform animate-slide-in-right overflow-hidden">
                            <PaymentSidebar
                                onBack={() => setShowPaymentModal(false)}
                                onConfirm={handlePaymentConfirm}
                                vendaId={venda.id}
                                total={venda.total}
                                valorPago={venda.valorPago || 0}
                                historico={venda.pagamentos}
                                customerName={venda.contato?.nome || 'Cliente'}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Excluir Venda"
                size="sm"
            >
                <p className="text-gray-600 mb-4 dark:text-gray-300">
                    Tem certeza que deseja excluir esta venda?
                    <br />
                    <span className="text-sm text-gray-500">
                        Esta ação não pode ser desfeita.
                    </span>
                </p>
                <ModalActions>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                        Excluir
                    </Button>
                </ModalActions>
            </Modal>

            {/* Revert Delivery Modal */}
            <Modal
                isOpen={showRevertModal}
                onClose={() => setShowRevertModal(false)}
                title="Reverter Entrega"
                size="sm"
            >
                <p className="text-gray-600 mb-4 dark:text-gray-300">
                    Deseja desfazer a entrega e marcar esta venda como <strong>Pendente</strong> novamente?
                </p>
                <ModalActions>
                    <Button variant="secondary" onClick={() => setShowRevertModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleRevertDelivery}>
                        Confirmar
                    </Button>
                </ModalActions>
            </Modal>

        </div>
    )
}

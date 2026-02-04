import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    DollarSign,
    User,
    Package,
    Share2,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, Card, Badge, LoadingScreen, Modal, ModalActions } from '../components/ui'
import { useVenda, useVendas } from '../hooks/useVendas'
import type { PagamentoFormData } from '../schemas/venda'
import { useToast } from '../components/ui/Toast'
import { PaymentModal } from '../components/features/vendas/PaymentModal'
import {
    formatCurrency,
    formatDate,
    formatRelativeDate,
} from '../utils/formatters'
import { VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '../constants'

export function VendaDetalhe() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const { venda, loading, error, refetch } = useVenda(id)
    const { updateVendaStatus, deleteVenda, addPagamento } = useVendas({ realtime: false })

    const [isUpdating, setIsUpdating] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Handlers
    const handleStatusChange = async (newStatus: 'pendente' | 'entregue' | 'cancelada') => {
        if (!venda) return
        setIsUpdating(true)
        const success = await updateVendaStatus(venda.id, newStatus)
        if (success) {
            await refetch()
            toast.success(`Status atualizado para ${VENDA_STATUS_LABELS[newStatus]}`)
        } else {
            toast.error('Erro ao atualizar status')
        }
        setIsUpdating(false)
    }

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

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                <Header
                    title={`Venda #${venda.id.slice(0, 6)}`}
                    showBack
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                    rightAction={
                        <Button variant="ghost" size="sm" onClick={handleShare}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                    }
                />
                <PageContainer className="pt-0 pb-32 bg-transparent px-4">
                    {/* Status Card */}
                    <Card className="mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-500">Status do Pedido</span>
                            <Badge variant={
                                venda.status === 'entregue' ? 'success' :
                                    venda.status === 'cancelada' ? 'danger' : 'warning'
                            }>
                                {VENDA_STATUS_LABELS[venda.status]}
                            </Badge>
                        </div>

                        {/* Status Actions */}
                        <div className="flex gap-2">
                            {venda.status === 'pendente' && (
                                <>
                                    <Button
                                        className="flex-1"
                                        onClick={() => handleStatusChange('entregue')}
                                        isLoading={isUpdating}
                                        variant="success"
                                    >
                                        Marcar Entregue
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => handleStatusChange('cancelada')}
                                        isLoading={isUpdating}
                                        variant="danger"
                                    >
                                        Cancelar
                                    </Button>
                                </>
                            )}
                            {venda.status === 'entregue' && (
                                <Button
                                    className="flex-1"
                                    onClick={() => handleStatusChange('pendente')}
                                    isLoading={isUpdating}
                                    variant="secondary"
                                >
                                    Reabrir Pedido
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Cliente */}
                    <Card className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="h-5 w-5 text-primary-500" />
                            Cliente
                        </h3>
                        <div className="space-y-1">
                            <p className="text-lg">{venda.contato?.nome}</p>
                            <p className="text-gray-500">{venda.contato?.telefone}</p>
                            {venda.contato?.origem && (
                                <Badge variant="gray" className="mt-1">
                                    {venda.contato.origem === 'indicacao' ? 'Indicação' : venda.contato.origem}
                                </Badge>
                            )}
                        </div>
                    </Card>

                    {/* Itens */}
                    <Card className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary-500" />
                            Itens
                        </h3>
                        <div className="space-y-3">
                            {venda.itens.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {item.produto?.nome || 'Produto Removido'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantidade}x {formatCurrency(item.precoUnitario)}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                        {formatCurrency(item.subtotal)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(venda.itens.reduce((acc, i) => acc + i.subtotal, 0))}</span>
                            </div>
                            {venda.taxaEntrega > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxa de Entrega</span>
                                    <span>{formatCurrency(venda.taxaEntrega)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-primary-600 pt-2">
                                <span>Total</span>
                                <span>{formatCurrency(venda.total)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Pagamento */}
                    <Card className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary-500" />
                            Pagamento
                        </h3>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">
                                {FORMA_PAGAMENTO_LABELS[venda.formaPagamento] || venda.formaPagamento}
                            </span>
                            {venda.pago ? (
                                <Badge variant="success">Pago</Badge>
                            ) : (
                                <Badge variant="warning">Pendente</Badge>
                            )}
                        </div>

                        {!venda.pago && (
                            <Button
                                className="w-full"
                                onClick={() => setShowPaymentModal(true)}
                            >
                                Registrar Pagamento
                            </Button>
                        )}

                        {venda.pagamentos.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Histórico</p>
                                <div className="space-y-2">
                                    {venda.pagamentos.map(pag => (
                                        <div key={pag.id} className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                {formatDate(pag.data)} ({pag.metodo})
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(pag.valor)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Actions */}
                    <div className="text-center pb-8">
                        <Button
                            variant="ghost"
                            className="text-red-500 w-full hover:bg-red-50 hover:text-red-600"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            Excluir Venda
                        </Button>
                        <p className="text-xs text-gray-400 mt-4">
                            Criado em: {formatRelativeDate(venda.criadoEm)}
                        </p>
                    </div>

                    {/* Modals */}
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        onConfirm={handlePaymentConfirm}
                        vendaId={venda.id}
                        total={venda.total}
                        valorPago={venda.valorPago || 0}
                        historico={venda.pagamentos}
                        customerName={venda.contato?.nome || 'Cliente'}
                    />

                    <Modal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        title="Excluir Venda"
                        size="sm"
                    >
                        <p className="text-gray-600 mb-4">
                            Tem certeza que deseja excluir esta venda?
                        </p>
                        <ModalActions>
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>Excluir</Button>
                        </ModalActions>
                    </Modal>

                </PageContainer>
            </div>
        </div>
    )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Calendar,
    Clock,
    CreditCard,
    User,
    Package,
    Check,
    X,
    Trash2,
    MessageCircle,
    DollarSign,
    RotateCcw,
    Edit,
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
    formatPhone,
    getWhatsAppLink,
} from '../utils/formatters'
import { VENDA_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from '../constants'

export function VendaDetalhe() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const { venda, loading, error, refetch } = useVenda(id)
    const { updateVendaStatus, updateVendaPago, deleteVenda, addPagamento } = useVendas({ realtime: false })

    const [isUpdating, setIsUpdating] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleMarkAsDelivered = async () => {
        if (!venda) return

        setIsUpdating(true)
        const success = await updateVendaStatus(venda.id, 'entregue')
        setIsUpdating(false)

        if (success) {
            toast.success('Venda marcada como entregue!')
            await refetch()
        } else {
            toast.error('Erro ao atualizar status')
        }
    }

    const handleMarkAsPending = async () => {
        if (!venda) return

        setIsUpdating(true)
        const success = await updateVendaStatus(venda.id, 'pendente')
        setIsUpdating(false)

        if (success) {
            toast.success('Venda marcada como pendente')
            await refetch()
        } else {
            toast.error('Erro ao atualizar status')
        }
    }

    // Toggle Payment Status (Legacy/Full Payment Toggle)
    const handleTogglePago = async () => {
        if (!venda) return

        setIsUpdating(true)
        const newPago = !venda.pago
        const success = await updateVendaPago(venda.id, newPago)
        setIsUpdating(false)

        if (success) {
            toast.success(newPago ? 'Venda marcada como paga' : 'Pagamento desmarcado')
            await refetch()
        } else {
            toast.error('Erro ao atualizar pagamento')
        }
    }

    const handleCancelSale = async () => {
        if (!venda) return

        setIsUpdating(true)
        const success = await updateVendaStatus(venda.id, 'cancelada')
        setIsUpdating(false)

        if (success) {
            toast.success('Venda cancelada')
            await refetch()
        } else {
            toast.error('Erro ao cancelar venda')
        }
    }

    const handlePaymentConfirm = async (data: PagamentoFormData): Promise<boolean> => {
        const success = await addPagamento(data)
        if (success) {
            setShowPaymentModal(false)
            toast.success('Pagamento registrado')
            await refetch()
            return true
        }
        return false
    }

    const handleDelete = async () => {
        if (!venda) return

        setIsDeleting(true)
        const success = await deleteVenda(venda.id)
        setIsDeleting(false)

        if (success) {
            toast.success('Venda excluída')
            navigate('/vendas')
        } else {
            toast.error('Erro ao excluir venda')
        }
    }

    const handleWhatsApp = () => {
        if (venda?.contato) {
            window.open(getWhatsAppLink(venda.contato.telefone), '_blank')
        }
    }

    const getStatusBadgeVariant = (status: string): 'success' | 'danger' | 'warning' => {
        switch (status) {
            case 'entregue':
                return 'success'
            case 'cancelada':
                return 'danger'
            default:
                return 'warning'
        }
    }

    if (loading) {
        return (
            <>
                <Header title="Carregando..." showBack />
                <PageContainer>
                    <LoadingScreen />
                </PageContainer>
            </>
        )
    }

    if (error || !venda) {
        return (
            <>
                <Header title="Erro" showBack />
                <PageContainer>
                    <div className="bg-danger-50 text-danger-600 p-4 rounded-lg">
                        {error || 'Venda não encontrada'}
                    </div>
                </PageContainer>
            </>
        )
    }

    const valorPago = venda.valor_pago || 0
    const restante = Math.max(0, venda.total - valorPago)
    const isPartial = valorPago > 0 && !venda.pago

    return (
        <>
            <Header
                title={`Venda #${venda.id.slice(0, 8)}`}
                showBack
                rightAction={
                    venda.status !== 'cancelada' && (
                        <button
                            onClick={() => navigate(`/vendas/${venda.id}/editar`)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white font-medium"
                            title="Editar Venda"
                        >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                        </button>
                    )
                }
            />
            <PageContainer>
                {/* Status Card */}
                <Card className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(venda.status)} className="text-sm py-1 px-3">
                                {VENDA_STATUS_LABELS[venda.status]}
                            </Badge>
                            {venda.forma_pagamento === 'brinde' ? (
                                <Badge variant="gray" className="text-sm py-1 px-3 bg-blue-50 text-blue-700 border-blue-200 ring-blue-200">
                                    🎁 Brinde
                                </Badge>
                            ) : venda.pago ? (
                                <Badge variant="success" className="text-sm py-1 px-3">
                                    💰 Pago
                                </Badge>
                            ) : isPartial ? (
                                <Badge className="text-sm py-1 px-3 bg-yellow-100 text-yellow-800 border-yellow-200 ring-yellow-200">
                                    🕒 Parcial
                                </Badge>
                            ) : (
                                <Badge variant="warning" className="text-sm py-1 px-3">
                                    ⏳ Pendente
                                </Badge>
                            )}
                        </div>
                        <span className="text-sm text-gray-500">
                            {formatRelativeDate(venda.criado_em)}
                        </span>
                    </div>

                    <div className="text-center py-4">
                        <p className="text-4xl font-bold text-primary-600 mb-1">
                            {formatCurrency(Number(venda.total))}
                        </p>
                        <p className="text-gray-500">{venda.itens.length} item(s)</p>
                    </div>

                    {/* Status de Entrega */}
                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Package className="h-3 w-3" /> Status de Entrega
                        </p>
                        {venda.status === 'cancelada' ? (
                            <Button
                                variant="secondary"
                                className="w-full"
                                leftIcon={<RotateCcw className="h-4 w-4" />}
                                onClick={handleMarkAsPending}
                                isLoading={isUpdating}
                            >
                                Restaurar Venda (voltar para Pendente)
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                {venda.status === 'pendente' ? (
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        leftIcon={<Check className="h-4 w-4" />}
                                        onClick={handleMarkAsDelivered}
                                        isLoading={isUpdating}
                                    >
                                        Marcar Entregue
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        leftIcon={<RotateCcw className="h-4 w-4" />}
                                        onClick={handleMarkAsPending}
                                        isLoading={isUpdating}
                                    >
                                        Voltar para Pendente
                                    </Button>
                                )}
                                <Button
                                    variant="danger"
                                    onClick={handleCancelSale}
                                    disabled={isUpdating}
                                    title="Cancelar venda"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Status Financeiro & Pagamentos */}
                    {venda.forma_pagamento !== 'brinde' && (
                        <div className="pt-4 mt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Financeiro
                                </p>
                                {!venda.pago && (
                                    <span className="text-xs font-semibold text-danger-600">
                                        Restante: {formatCurrency(restante)}
                                    </span>
                                )}
                            </div>

                            {/* Barra de Progresso */}
                            {!venda.pago && (
                                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                                    <div
                                        className="bg-primary-500 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, (valorPago / venda.total) * 100)}%` }}
                                    ></div>
                                </div>
                            )}

                            {/* Botões de Ação */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {!venda.pago && (
                                    <Button
                                        variant="success"
                                        className="w-full"
                                        leftIcon={<DollarSign className="h-4 w-4" />}
                                        onClick={() => setShowPaymentModal(true)}
                                        isLoading={isUpdating}
                                    >
                                        Registrar
                                    </Button>
                                )}
                                <Button
                                    variant={venda.pago ? "secondary" : "ghost"}
                                    className={`w-full ${!venda.pago ? 'border border-gray-200' : ''}`}
                                    leftIcon={venda.pago ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                    onClick={handleTogglePago}
                                    isLoading={isUpdating}
                                >
                                    {venda.pago ? 'Reabrir' : 'Quitar'}
                                </Button>
                            </div>

                            {/* Histórico de Pagamentos */}
                            {venda.pagamentos && venda.pagamentos.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-2">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Histórico</p>
                                    {venda.pagamentos.map((pag, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-medium">
                                                    {formatCurrency(Number(pag.valor))}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(pag.data)} • {pag.metodo}
                                                </span>
                                                {pag.observacao && (
                                                    <span className="text-xs text-gray-400 italic">"{pag.observacao}"</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-sm font-medium text-gray-700">Total Pago</span>
                                        <span className="text-sm font-bold text-success-600">{formatCurrency(valorPago)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Client Info */}
                {venda.contato && (
                    <Card className="mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{venda.contato.nome}</p>
                                    <p className="text-sm text-gray-500">{formatPhone(venda.contato.telefone)}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleWhatsApp}
                                    className="p-2 bg-accent-50 text-accent-600 rounded-full hover:bg-accent-100"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => navigate(`/contatos/${venda.contato?.id}`)}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                                >
                                    <User className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Order Details */}
                <Card className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-3">Detalhes do Pedido</h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Data</p>
                                <p className="font-medium">{formatDate(venda.data)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Forma de Pagamento</p>
                                <p className="font-medium">{FORMA_PAGAMENTO_LABELS[venda.forma_pagamento]}</p>
                            </div>
                        </div>

                        {venda.data_entrega && (
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Data de Entrega</p>
                                    <p className="font-medium">{formatDate(venda.data_entrega)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Items */}
                <Card className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-3">Itens do Pedido</h3>

                    <div className="space-y-3">
                        {venda.itens.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {item.produto?.nome || 'Produto'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {item.quantidade}x {formatCurrency(Number(item.preco_unitario))}
                                    </p>
                                </div>
                                <p className="font-medium">{formatCurrency(Number(item.subtotal))}</p>
                            </div>
                        ))}
                    </div>

                    {Number(venda.taxa_entrega) > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-900">Taxa de Entrega</span>
                            <span className="font-medium">{formatCurrency(Number(venda.taxa_entrega))}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-primary-600">{formatCurrency(Number(venda.total))}</span>
                    </div>
                </Card>

                {/* Observações */}
                {venda.observacoes && (
                    <Card className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                        <p className="text-gray-600 whitespace-pre-wrap">{venda.observacoes}</p>
                    </Card>
                )}

                {/* Delete Button */}
                <Button
                    variant="danger"
                    className="w-full"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setShowDeleteModal(true)}
                >
                    Excluir Venda
                </Button>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Excluir Venda"
                    size="sm"
                >
                    <p className="text-gray-600 mb-4">
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

                {/* MODAL DE PAGAMENTO */}
                {venda && (
                    <PaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        onConfirm={handlePaymentConfirm}
                        vendaId={venda.id}
                        total={venda.total}
                        valorPago={venda.valor_pago || 0}
                        historico={venda.pagamentos || []}
                        customerName={venda.contato?.nome || 'Cliente'}
                    />
                )}
            </PageContainer>
        </>
    )
}

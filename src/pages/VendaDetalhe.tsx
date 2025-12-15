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
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, Card, Badge, LoadingScreen, Modal, ModalActions } from '../components/ui'
import { useVenda, useVendas } from '../hooks/useVendas'
import { useToast } from '../components/ui/Toast'
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
    const { venda, loading, error } = useVenda(id)
    const { updateVendaStatus, updateVendaPago, deleteVenda } = useVendas({ realtime: false })

    const [isUpdating, setIsUpdating] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleMarkAsDelivered = async () => {
        if (!venda) return

        setIsUpdating(true)
        const success = await updateVendaStatus(venda.id, 'entregue')
        setIsUpdating(false)

        if (success) {
            toast.success('Venda marcada como entregue!')
            window.location.reload()
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
            window.location.reload()
        } else {
            toast.error('Erro ao atualizar status')
        }
    }

    const handleTogglePago = async () => {
        if (!venda) return

        setIsUpdating(true)
        const newPago = !venda.pago
        const success = await updateVendaPago(venda.id, newPago)
        setIsUpdating(false)

        if (success) {
            toast.success(newPago ? 'Venda marcada como paga' : 'Pagamento desmarcado')
            window.location.reload()
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
            window.location.reload()
        } else {
            toast.error('Erro ao cancelar venda')
        }
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

    return (
        <>
            <Header title={`Venda #${venda.id.slice(0, 8)}`} showBack />
            <PageContainer>
                {/* Status Card */}
                <Card className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(venda.status)} className="text-sm py-1 px-3">
                                {VENDA_STATUS_LABELS[venda.status]}
                            </Badge>
                            {venda.pago && (
                                <Badge variant="success" className="text-sm py-1 px-3">
                                    💰 Pago
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

                    {/* Status de Pagamento */}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Status de Pagamento
                        </p>
                        <Button
                            variant={venda.pago ? "secondary" : "primary"}
                            className="w-full"
                            leftIcon={venda.pago ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            onClick={handleTogglePago}
                            isLoading={isUpdating}
                        >
                            {venda.pago ? 'Desmarcar Pago' : 'Marcar como Pago'}
                        </Button>
                    </div>
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
                    variant="ghost"
                    className="w-full text-danger-500 hover:bg-danger-50"
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
            </PageContainer>
        </>
    )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Phone,
    MapPin,
    Edit,
    Trash2,
    MessageCircle,
    User,
    Building2,
    Calendar,
    Share2,
    ShoppingCart,
    ChevronRight,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, Card, Badge, LoadingScreen, Modal, ModalActions } from '../components/ui'
import { ContatoFormModal, ClienteNome } from '../components/contatos'
import { useContato, useContatos } from '../hooks/useContatos'
import { useToast } from '../components/ui/Toast'
import {
    formatPhone,
    formatDate,
    formatRelativeDate,
    getWhatsAppLink,
} from '../utils/formatters'
import {
    CONTATO_STATUS_LABELS,
    CONTATO_STATUS_COLORS,
    CONTATO_TIPO_LABELS,
    CONTATO_ORIGEM_LABELS,
    SUBTIPOS_B2B_LABELS,
} from '../constants'
import { useVendas } from '../hooks/useVendas'
import { formatCurrency } from '../utils/formatters'
import { calcularNivelCliente } from '../utils/calculations'
import { useIndicacoes } from '../hooks/useIndicacoes'

function VendasHistorico({ contatoId }: { contatoId: string }) {
    const navigate = useNavigate()
    const { vendas, loading, error } = useVendas({
        filtros: { contatoId, status: 'todos', periodo: 'todos', forma_pagamento: 'todos' }
    })

    if (loading) return <div className="text-center py-4 text-gray-500">Carregando histórico...</div>
    if (error) return <div className="text-center py-4 text-danger-500">Erro ao carregar histórico</div>
    if (vendas.length === 0) return <div className="text-center py-4 text-gray-500">Nenhuma compra registrada</div>

    return (
        <div className="space-y-3">
            {vendas.map((venda) => (
                <div
                    key={venda.id}
                    onClick={() => navigate(`/vendas/${venda.id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer transition-colors hover:bg-gray-100 active:bg-gray-200"
                >
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {formatDate(venda.data)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {venda.itens.reduce((acc, item) => acc + item.quantidade, 0)} {venda.itens.reduce((acc, item) => acc + item.quantidade, 0) === 1 ? 'item' : 'itens'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">
                                {formatCurrency(venda.total)}
                            </div>
                            <Badge variant={CONTATO_STATUS_COLORS[venda.status === 'entregue' ? 'cliente' : 'lead'] as any}>
                                {venda.status}
                            </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ContatoDetalhe() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const { contato, indicador, loading, error, refetch } = useContato(id)
    const { deleteContato } = useContatos({ realtime: false })
    const { vendas: todasVendas } = useVendas({ filtros: { contatoId: id, status: 'todos', periodo: 'todos', forma_pagamento: 'todos' } })
    const { getIndicadorById } = useIndicacoes()

    // Calcular nível do cliente (apenas vendas não canceladas)
    const vendasValidas = todasVendas.filter(v => v.status !== 'cancelada')
    const indicadorInfo = getIndicadorById(id || '')
    const indicacoesConvertidas = indicadorInfo?.indicacoesConvertidas || 0
    const nivelCliente = calcularNivelCliente(vendasValidas.length, indicacoesConvertidas)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

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

    if (error || !contato) {
        return (
            <>
                <Header title="Erro" showBack />
                <PageContainer>
                    <div className="bg-danger-50 text-danger-600 p-4 rounded-lg">
                        {error || 'Contato não encontrado'}
                    </div>
                </PageContainer>
            </>
        )
    }

    const statusColor = CONTATO_STATUS_COLORS[contato.status] as 'success' | 'warning' | 'gray'
    const TipoIcon = contato.tipo === 'B2B' ? Building2 : User

    return (
        <>
            <Header
                title="Detalhes"
                showBack
                rightAction={
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                }
            />
            <PageContainer>
                {/* Header Card */}
                <Card className="mb-4">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${contato.tipo === 'B2B' ? 'bg-accent-100 text-accent-600' : 'bg-primary-100 text-primary-600'}
            `}>
                            <TipoIcon className="h-8 w-8" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <ClienteNome
                                    contato={{ ...contato, indicador }}
                                    className="text-xl"
                                />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={statusColor}>
                                    {CONTATO_STATUS_LABELS[contato.status]}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                    {CONTATO_TIPO_LABELS[contato.tipo]}
                                </span>
                                {contato.tipo === 'B2B' && contato.subtipo && (
                                    <span className="text-sm text-gray-400">
                                        • {SUBTIPOS_B2B_LABELS[contato.subtipo] || contato.subtipo}
                                    </span>
                                )}
                            </div>

                            {/* Badge de Nível */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{nivelCliente.emoji}</span>
                                <span className={`font-medium ${nivelCliente.nivel === 'ouro' ? 'text-yellow-600' :
                                    nivelCliente.nivel === 'prata' ? 'text-gray-500' :
                                        'text-orange-600'
                                    }`}>
                                    {nivelCliente.label}
                                </span>
                            </div>

                            {/* Barra de Progresso */}
                            {nivelCliente.proximoNivel && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progresso</span>
                                        <span>Faltam {nivelCliente.comprasFaltando} compras para {nivelCliente.proximoNivel === 'Ouro' ? '🥇' : '🥈'} {nivelCliente.proximoNivel}</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${nivelCliente.nivel === 'prata' ? 'bg-gray-400' : 'bg-orange-400'
                                                }`}
                                            style={{
                                                width: `${nivelCliente.nivel === 'prata'
                                                    ? ((vendasValidas.length - 3) / 3) * 100
                                                    : (vendasValidas.length / 3) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            <a
                                href={`tel:${contato.telefone.replace(/\D/g, '')}`}
                                className="inline-flex items-center gap-2 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors group"
                            >
                                <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <span>
                                    {formatPhone(contato.telefone)}
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                        <Button
                            variant="success"
                            className="flex-1"
                            leftIcon={<MessageCircle className="h-4 w-4" />}
                            onClick={handleWhatsApp}
                        >
                            WhatsApp
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex-1"
                            leftIcon={<ShoppingCart className="h-4 w-4" />}
                            onClick={() => navigate('/nova-venda', { state: { contatoId: contato.id } })}
                        >
                            Nova Venda
                        </Button>
                    </div>
                </Card>

                {/* Info Cards */}
                <div className="space-y-3 mb-4">
                    {/* Origem */}
                    <Card padding="sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                                <Share2 className="h-5 w-5 text-primary-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Origem</p>
                                <p className="font-medium text-gray-900">
                                    {CONTATO_ORIGEM_LABELS[contato.origem]}
                                </p>
                                {indicador && (
                                    <button
                                        onClick={() => navigate(`/contatos/${indicador.id}`)}
                                        className="text-sm text-primary-500 hover:text-primary-600"
                                    >
                                        Indicado por: {indicador.nome}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Endereço */}
                    {(contato.endereco || contato.bairro) && (
                        <Card padding="sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-success-50 rounded-full flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-success-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Endereço</p>
                                    <p className="font-medium text-gray-900">
                                        {[contato.endereco, contato.bairro].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Data de cadastro */}
                    <Card padding="sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Cadastrado em</p>
                                <p className="font-medium text-gray-900">
                                    {formatDate(contato.criado_em)}
                                    <span className="text-gray-500 font-normal ml-1">
                                        ({formatRelativeDate(contato.criado_em)})
                                    </span>
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Observações */}
                    {contato.observacoes && (
                        <Card>
                            <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                            <p className="text-gray-600 whitespace-pre-wrap">{contato.observacoes}</p>
                        </Card>
                    )}
                </div>

                {/* Histórico de Compras */}
                <Card className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-4">Histórico de Compras</h3>
                    <VendasHistorico contatoId={contato.id} />
                </Card>

                {/* Delete Button */}
                <Button
                    variant="ghost"
                    className="w-full text-danger-500 hover:bg-danger-50"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setIsDeleteModalOpen(true)}
                >
                    Excluir Contato
                </Button>

                {/* Edit Modal */}
                <ContatoFormModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    contato={contato}
                    onSuccess={() => refetch()}
                />

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Excluir Contato"
                    size="sm"
                >
                    <p className="text-gray-600 mb-4">
                        Tem certeza que deseja excluir <strong>{contato.nome}</strong>?
                        <br />
                        <span className="text-sm text-gray-500">
                            Esta ação não pode ser desfeita.
                        </span>
                    </p>
                    <ModalActions>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
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

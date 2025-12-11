import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Share2,
    Trophy,
    Users,
    TrendingUp,
    Gift,
    ChevronRight,
    MessageCircle,
    User,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Badge, EmptyState, LoadingScreen, Modal, ModalActions, Button } from '../components/ui'
import { ClienteNome } from '../components/contatos'
import { useIndicacoes, type IndicadorComIndicados } from '../hooks/useIndicacoes'
import { formatCurrency, formatPhone, getWhatsAppLink } from '../utils/formatters'
import { CONTATO_STATUS_LABELS } from '../constants'

export function Indicacoes() {
    const navigate = useNavigate()
    const { indicadores, loading, error, totalIndicacoes, totalConversoes, taxaConversao } = useIndicacoes()

    const [selectedIndicador, setSelectedIndicador] = useState<IndicadorComIndicados | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    const handleViewDetail = (indicador: IndicadorComIndicados) => {
        setSelectedIndicador(indicador)
        setShowDetailModal(true)
    }

    const handleWhatsAppRecompensa = (indicador: IndicadorComIndicados) => {
        const mensagem = `Olá ${indicador.indicador.nome}! 🎉\n\nVocê tem ${formatCurrency(indicador.recompensaAcumulada)} em recompensas acumuladas por suas ${indicador.indicacoesConvertidas} indicações que viraram clientes!\n\nObrigado por indicar a Mont Massas! 🧀`
        window.open(getWhatsAppLink(indicador.indicador.telefone, mensagem), '_blank')
    }

    const getStatusVariant = (status: string): 'success' | 'warning' | 'gray' => {
        switch (status) {
            case 'cliente':
                return 'success'
            case 'lead':
                return 'warning'
            default:
                return 'gray'
        }
    }

    return (
        <>
            <Header title="Indicações" />
            <PageContainer>
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card className="text-center">
                        <Users className="h-5 w-5 mx-auto mb-1 text-primary-500" />
                        <p className="text-2xl font-bold text-gray-900">{totalIndicacoes}</p>
                        <p className="text-xs text-gray-500">Indicações</p>
                    </Card>
                    <Card className="text-center">
                        <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success-500" />
                        <p className="text-2xl font-bold text-gray-900">{totalConversoes}</p>
                        <p className="text-xs text-gray-500">Convertidas</p>
                    </Card>
                    <Card className="text-center">
                        <Trophy className="h-5 w-5 mx-auto mb-1 text-accent-500" />
                        <p className="text-2xl font-bold text-gray-900">{taxaConversao.toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">Conversão</p>
                    </Card>
                </div>

                {/* Loading */}
                {loading && <LoadingScreen message="Carregando indicações..." />}

                {/* Error */}
                {error && (
                    <div className="bg-danger-50 text-danger-600 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && indicadores.length === 0 && (
                    <EmptyState
                        icon={<Share2 className="h-16 w-16" />}
                        title="Nenhuma indicação registrada"
                        description="Quando cadastrar contatos por indicação, eles aparecerão aqui"
                    />
                )}

                {/* Ranking */}
                {!loading && !error && indicadores.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Ranking de Indicadores
                        </h3>

                        {indicadores.map((item, index) => (
                            <Card
                                key={item.indicador.id}
                                hover
                                onClick={() => handleViewDetail(item)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Position */}
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : index === 1
                                                ? 'bg-gray-200 text-gray-700'
                                                : index === 2
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {index + 1}º
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <ClienteNome
                                            contato={item.indicador}
                                            className="font-medium text-gray-900 truncate"
                                        />
                                        <p className="text-sm text-gray-500">
                                            {item.totalIndicacoes} indicações • {item.indicacoesConvertidas} clientes
                                        </p>
                                    </div>

                                    {/* Reward */}
                                    {item.recompensaAcumulada > 0 && (
                                        <div className="text-right">
                                            <Badge variant="success" className="mb-1">
                                                <Gift className="h-3 w-3 mr-1" />
                                                {formatCurrency(item.recompensaAcumulada)}
                                            </Badge>
                                        </div>
                                    )}

                                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Detalhes do Indicador"
                    size="lg"
                >
                    {selectedIndicador && (
                        <div className="space-y-4">
                            {/* Indicador Info */}
                            <Card className="bg-primary-50 border-primary-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1">
                                        <ClienteNome
                                            contato={selectedIndicador.indicador}
                                            className="font-semibold text-gray-900 text-lg"
                                        />
                                        <p className="text-sm text-gray-600">
                                            {formatPhone(selectedIndicador.indicador.telefone)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleWhatsAppRecompensa(selectedIndicador)}
                                        className="p-2 bg-accent-500 text-white rounded-full hover:bg-accent-600"
                                    >
                                        <MessageCircle className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-lg font-bold text-gray-900">
                                            {selectedIndicador.totalIndicacoes}
                                        </p>
                                        <p className="text-xs text-gray-500">Indicações</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-lg font-bold text-success-600">
                                            {selectedIndicador.indicacoesConvertidas}
                                        </p>
                                        <p className="text-xs text-gray-500">Clientes</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-lg font-bold text-accent-600">
                                            {formatCurrency(selectedIndicador.recompensaAcumulada)}
                                        </p>
                                        <p className="text-xs text-gray-500">Recompensa</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Indicados List */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">
                                    Pessoas indicadas ({selectedIndicador.indicados.length})
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-auto">
                                    {selectedIndicador.indicados.map((indicado) => (
                                        <div
                                            key={indicado.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <ClienteNome
                                                    contato={indicado as any}
                                                    className="font-medium text-gray-900"
                                                />
                                                <p className="text-sm text-gray-500">
                                                    {indicado.totalCompras} compra(s)
                                                </p>
                                            </div>
                                            <Badge variant={getStatusVariant(indicado.status)}>
                                                {CONTATO_STATUS_LABELS[indicado.status] || indicado.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <ModalActions>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                            Fechar
                        </Button>
                        {selectedIndicador && (
                            <Button
                                onClick={() => navigate(`/contatos/${selectedIndicador.indicador.id}`)}
                            >
                                Ver Perfil
                            </Button>
                        )}
                    </ModalActions>
                </Modal>
            </PageContainer>
        </>
    )
}

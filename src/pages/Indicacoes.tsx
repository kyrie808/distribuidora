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
import { KpiCard } from '../components/dashboard/KpiCard'
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
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-8">
                <Header
                    title="Indicações"
                    showBack
                    centerTitle
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                />
                <PageContainer className="pt-0 pb-16 bg-transparent px-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <KpiCard
                            title="Indicações"
                            value={totalIndicacoes.toString()}
                            progress={100}
                            trend="Total"
                            trendDirection="up"
                            icon={Users}
                            progressColor="bg-primary"
                            trendColor="green"
                            iconColor="text-primary"
                            variant="compact"
                        />
                        <KpiCard
                            title="Convertidas"
                            value={totalConversoes.toString()}
                            progress={totalIndicacoes > 0 ? (totalConversoes / totalIndicacoes) * 100 : 0}
                            trend={totalIndicacoes > 0 ? `${((totalConversoes / totalIndicacoes) * 100).toFixed(0)}%` : '0%'}
                            trendDirection="up"
                            icon={TrendingUp}
                            progressColor="bg-semantic-green"
                            trendColor="green"
                            iconColor="text-semantic-green"
                            variant="compact"
                        />
                        <KpiCard
                            title="Conversão"
                            value={`${taxaConversao.toFixed(0)}%`}
                            progress={taxaConversao}
                            trend={taxaConversao > 50 ? 'Alta' : 'Média'}
                            trendDirection={taxaConversao > 50 ? 'up' : 'down'}
                            icon={Trophy}
                            progressColor={taxaConversao > 50 ? 'bg-semantic-green' : 'bg-accent'}
                            trendColor={taxaConversao > 50 ? 'green' : 'yellow'}
                            iconColor={taxaConversao > 50 ? 'text-semantic-green' : 'text-accent'}
                            variant="compact"
                        />
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
                        <div>
                            <div className="mb-4">
                                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-1">
                                    <Trophy className="h-5 w-5 text-accent" />
                                    Ranking de Indicadores
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Top indicadores do mês</p>

                                <div className="space-y-3">
                                    {indicadores.map((item, index) => (
                                        <Card
                                            key={item.indicador.id}
                                            hover
                                            onClick={() => handleViewDetail(item)}
                                            className={`cursor-pointer transition-all duration-300 group p-4 ${index === 0 ? 'ring-2 ring-semantic-yellow/20 dark:ring-semantic-yellow/30 shadow-lg shadow-semantic-yellow/10' :
                                                index === 1 ? 'ring-1 ring-gray-300/50 dark:ring-gray-600/50' :
                                                    index === 2 ? 'ring-1 ring-accent/20 dark:ring-accent/30' : ''
                                                } hover:shadow-xl hover:scale-[1.02]`}
                                        >
                                            <div className="flex items-center gap-5">
                                                {/* Position Badge with Gradient */}
                                                <div className="relative flex-shrink-0">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-transform duration-300 group-hover:scale-110 ${index === 0
                                                            ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 shadow-yellow-500/30'
                                                            : index === 1
                                                                ? 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-gray-800 shadow-gray-400/30'
                                                                : index === 2
                                                                    ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 text-orange-900 shadow-orange-500/30'
                                                                    : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-600 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {index + 1}º
                                                    </div>
                                                    {/* Shine effect for top 3 */}
                                                    {index < 3 && (
                                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 to-transparent opacity-60" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <ClienteNome
                                                        contato={item.indicador}
                                                        className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors"
                                                    />
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                            <Users className="h-3.5 w-3.5" />
                                                            <span className="font-medium">{item.totalIndicacoes}</span>
                                                            <span className="text-xs">indicações</span>
                                                        </p>
                                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                                        <p className="text-sm text-semantic-green dark:text-semantic-green flex items-center gap-1">
                                                            <TrendingUp className="h-3.5 w-3.5" />
                                                            <span className="font-medium">{item.indicacoesConvertidas}</span>
                                                            <span className="text-xs">clientes</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Reward Badge - Premium Style */}
                                                {item.recompensaAcumulada > 0 && (
                                                    <div className="flex-shrink-0">
                                                        <div className="px-3 py-1.5 bg-gradient-to-r from-semantic-green to-emerald-600 text-white rounded-full shadow-md shadow-semantic-green/30 flex items-center gap-1.5 group-hover:shadow-lg group-hover:shadow-semantic-green/40 transition-shadow">
                                                            <Gift className="h-4 w-4" />
                                                            <span className="font-bold text-sm">{formatCurrency(item.recompensaAcumulada)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
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
                                <Card className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary dark:text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <ClienteNome
                                                contato={selectedIndicador.indicador}
                                                className="font-semibold text-gray-900 dark:text-gray-100 text-lg"
                                            />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {formatPhone(selectedIndicador.indicador.telefone)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleWhatsAppRecompensa(selectedIndicador)}
                                            className="p-2 bg-accent text-white rounded-full hover:bg-accent/90 dark:hover:bg-accent/80 transition-colors"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {selectedIndicador.totalIndicacoes}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Indicações</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                                            <p className="text-lg font-bold text-semantic-green dark:text-semantic-green">
                                                {selectedIndicador.indicacoesConvertidas}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Clientes</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                                            <p className="text-lg font-bold text-accent dark:text-accent">
                                                {formatCurrency(selectedIndicador.recompensaAcumulada)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Recompensa</p>
                                        </div>
                                    </div>
                                </Card>

                                {/* Indicados List */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Pessoas indicadas ({selectedIndicador.indicados.length})
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-auto">
                                        {selectedIndicador.indicados.map((indicado) => (
                                            <div
                                                key={indicado.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                            >
                                                <div>
                                                    <ClienteNome
                                                        contato={indicado as any}
                                                        className="font-medium text-gray-900 dark:text-gray-100"
                                                    />
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
            </div>
        </div>
    )
}

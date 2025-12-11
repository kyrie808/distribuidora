import { useState, useMemo } from 'react'
import { Plus, Search, Filter, X, Users } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, EmptyState, LoadingScreen, Badge } from '../components/ui'
import { ContatoCard, ContatoFormModal } from '../components/contatos'
import { useContatos } from '../hooks/useContatos'
import {
    CONTATO_STATUS_LABELS,
    CONTATO_TIPO_LABELS,
} from '../constants'

type StatusFilter = 'todos' | 'lead' | 'cliente' | 'inativo'
type TipoFilter = 'todos' | 'B2C' | 'B2B'

export function Contatos() {
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
    const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos')
    const [showFilters, setShowFilters] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { contatos, loading, error, getNomeIndicador } = useContatos()

    // Filter contacts locally for instant feedback
    const filteredContatos = useMemo(() => {
        return contatos.filter((contato) => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase()
                const matchesName = contato.nome.toLowerCase().includes(search)
                const matchesPhone = contato.telefone.includes(search)
                if (!matchesName && !matchesPhone) return false
            }

            // Status filter
            if (statusFilter !== 'todos' && contato.status !== statusFilter) {
                return false
            }

            // Tipo filter
            if (tipoFilter !== 'todos' && contato.tipo !== tipoFilter) {
                return false
            }

            return true
        })
    }, [contatos, searchTerm, statusFilter, tipoFilter])

    const hasActiveFilters = statusFilter !== 'todos' || tipoFilter !== 'todos'

    const clearFilters = () => {
        setStatusFilter('todos')
        setTipoFilter('todos')
    }

    // Stats
    const totalContatos = contatos.length
    const totalClientes = contatos.filter((c) => c.status === 'cliente').length
    const totalLeads = contatos.filter((c) => c.status === 'lead').length

    return (
        <>
            <Header
                title="Contatos"
                rightAction={
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${hasActiveFilters ? 'bg-white/20' : 'hover:bg-white/10'
                            }`}
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                }
            />
            <PageContainer>
                {/* Stats */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    <Badge variant="gray" className="whitespace-nowrap">
                        {totalContatos} contatos
                    </Badge>
                    <Badge variant="success" className="whitespace-nowrap">
                        {totalClientes} clientes
                    </Badge>
                    <Badge variant="warning" className="whitespace-nowrap">
                        {totalLeads} leads
                    </Badge>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                            <X className="h-4 w-4 text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900">Filtros</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary-500 hover:text-primary-600"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="todos">Todos</option>
                                    {Object.entries(CONTATO_STATUS_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo Filter */}
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Tipo</label>
                                <select
                                    value={tipoFilter}
                                    onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="todos">Todos</option>
                                    {Object.entries(CONTATO_TIPO_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && <LoadingScreen message="Carregando contatos..." />}

                {/* Error */}
                {error && (
                    <div className="bg-danger-50 text-danger-600 p-4 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && filteredContatos.length === 0 && (
                    <EmptyState
                        icon={<Users className="h-16 w-16" />}
                        title={searchTerm || hasActiveFilters ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                        description={
                            searchTerm || hasActiveFilters
                                ? 'Tente ajustar os filtros ou termo de busca'
                                : 'Adicione seu primeiro contato para começar a gerenciar seus clientes'
                        }
                        action={
                            !searchTerm && !hasActiveFilters ? (
                                <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
                                    Novo Contato
                                </Button>
                            ) : undefined
                        }
                    />
                )}

                {/* Contact List */}
                {!loading && !error && filteredContatos.length > 0 && (
                    <div className="space-y-3">
                        {filteredContatos.map((contato) => (
                            <ContatoCard 
                                key={contato.id} 
                                contato={contato} 
                                nomeIndicador={getNomeIndicador(contato.indicado_por_id)}
                            />
                        ))}
                    </div>
                )}

                {/* FAB for new contact */}
                {!loading && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="fixed right-4 bottom-24 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                )}

                {/* Form Modal */}
                <ContatoFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </PageContainer>
        </>
    )
}

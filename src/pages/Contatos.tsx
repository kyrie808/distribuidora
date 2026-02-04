import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Diamond, Flame, History, Users, X, UserCheck } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { EmptyState, LoadingScreen } from '../components/ui'
import { ContatoCard, ContatoFormModal, ContactStoryFilter } from '../components/contatos'
import { useContatos } from '../hooks/useContatos'

// Types for the filter stories
type FilterStoryId = 'all' | 'clients' | 'hot-leads' | 'inactives' | 'vips' | 'new'

export function Contatos() {
    const [searchTerm, setSearchTerm] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [activeStory, setActiveStory] = useState<FilterStoryId>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    const { contatos, loading, error, getNomeIndicador } = useContatos()

    // Calculate dynamic counts for stories
    const stats = useMemo(() => {
        return {
            all: contatos.length,
            clients: contatos.filter(c => c.status === 'cliente').length,
            hot: contatos.filter(c => c.status === 'lead').length,
            inactive: contatos.filter(c => c.status === 'inativo').length,
            vip: contatos.filter(c => c.status === 'cliente' && c.tipo === 'B2B').length // Simple logic for VIP for now
        }
    }, [contatos])

    const storyItems = [
        { id: 'all', label: 'Todos', icon: Users, count: stats.all, color: 'primary' as const },
        { id: 'clients', label: 'Clientes', icon: UserCheck, count: stats.clients, color: 'success' as const },
        { id: 'hot-leads', label: 'Leads', icon: Flame, count: stats.hot, color: 'warning' as const },
        { id: 'vips', label: 'VIPs', icon: Diamond, count: stats.vip, color: 'purple' as const },
        { id: 'inactives', label: 'Inativos', icon: History, count: stats.inactive, color: 'info' as const },
    ]

    // Filter logic
    const filteredContatos = useMemo(() => {
        let result = contatos

        // Story/Status Filter
        if (activeStory === 'clients') {
            result = result.filter(c => c.status === 'cliente')
        } else if (activeStory === 'hot-leads') {
            result = result.filter(c => c.status === 'lead')
        } else if (activeStory === 'inactives') {
            result = result.filter(c => c.status === 'inativo')
        } else if (activeStory === 'vips') {
            result = result.filter(c => c.status === 'cliente' && c.tipo === 'B2B')
        }

        // Text Search
        if (searchTerm) {
            const search = searchTerm.toLowerCase()
            result = result.filter((contato) =>
                contato.nome.toLowerCase().includes(search) ||
                contato.telefone.includes(search)
            )
        }

        return result
    }, [contatos, searchTerm, activeStory])

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                {/* Background Ambience (Stich Style) */}
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-20%] w-[70vw] h-[70vw] bg-violet-600/10 rounded-full blur-[100px] opacity-40 mix-blend-screen" />
                    <div className="absolute bottom-[-10%] right-[-20%] w-[80vw] h-[80vw] bg-blue-600/5 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
                </div>

                <Header
                    title="Gestão de Clientes"
                    centerTitle
                    showMenu={true}
                    transparent
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                    rightAction={
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-accent-foreground text-foreground ${showSearch ? 'bg-accent text-accent-foreground' : ''}`}
                        >
                            {showSearch ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                        </button>
                    }
                />

                {/* Search Bar Expandable */}
                <div className={`
                overflow-hidden transition-all duration-300 ease-in-out z-20 relative
                ${showSearch ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
            `}>
                    <div className="px-4 py-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar cliente ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-secondary/50 dark:bg-secondary/20 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-md"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                <PageContainer className="relative z-10 space-y-6 pt-0 pb-32 bg-transparent px-4">

                    {/* Story Filters Carousel */}
                    <section className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm border border-border/50">
                        <ContactStoryFilter
                            items={storyItems}
                            activeId={activeStory}
                            onSelect={(id) => setActiveStory(id as FilterStoryId)}
                        />
                    </section>

                    {/* Main List Header */}
                    {/* Main List Header */}
                    <div className="flex items-center justify-between px-1 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="size-4 text-primary font-bold flex items-center justify-center">
                                {/* Dynamic Icon based on filter */}
                                {activeStory === 'all' && <Users className="size-4" />}
                                {activeStory === 'clients' && <UserCheck className="size-4" />}
                                {activeStory === 'hot-leads' && <Flame className="size-4" />}
                                {activeStory === 'inactives' && <History className="size-4" />}
                                {activeStory === 'vips' && <Diamond className="size-4" />}
                            </div>
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                                {activeStory === 'all' ? 'Todos os Contatos' :
                                    activeStory === 'clients' ? 'Meus Clientes' :
                                        activeStory === 'hot-leads' ? 'Leads Quentes' :
                                            activeStory === 'inactives' ? 'Recuperação' : 'Clientes VIP'}
                            </h2>
                        </div>


                    </div>

                    {/* Loading State */}
                    {loading && <LoadingScreen message="Carregando contatos..." />}

                    {/* Error State */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Contact List */}
                    {!loading && !error && (
                        filteredContatos.length > 0 ? (
                            <div className="space-y-4">
                                {filteredContatos.map((contato) => (
                                    <ContatoCard
                                        key={contato.id}
                                        contato={contato}
                                        nomeIndicador={getNomeIndicador(contato)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<Users className="h-16 w-16 text-zinc-600" />}
                                title="Nenhum contato encontrado"
                                description="Tente ajustar os filtros ou adicione um novo contato."
                            />
                        )
                    )}

                    {/* FAB (Stich Style) */}
                    <div className="fixed bottom-24 right-6 z-40">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-14 w-14 rounded-full bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
                        >
                            <Plus className="h-7 w-7" />
                        </button>
                    </div>

                    <ContatoFormModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </PageContainer>
            </div>
        </div>
    )
}

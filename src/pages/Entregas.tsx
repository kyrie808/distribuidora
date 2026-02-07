import { useState, useEffect } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Entregas Components
import {
    OriginSelector,
    DeliveryList,
    OptimizationButton,
    RouteTimeline
} from '@/components/features/entregas'

// Hooks
import { useCep } from '@/hooks/useCep'
import { useToast } from '../components/ui/Toast'

// Supabase
import { supabase } from '@/lib/supabase'

// Types
interface DeliveryItem {
    id: string
    cliente_nome: string
    endereco: string
    bairro: string | null
    total: number
    latitude?: number | null
    longitude?: number | null
    data: string
}

interface RouteStop {
    id: string
    name: string
    address: string
    neighborhood: string | null
}

export function Entregas() {
    const toast = useToast()
    const { fetchCep } = useCep()

    // State
    const [pendentes, setPendentes] = useState<DeliveryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [locais, setLocais] = useState<Array<{ endereco: string; tipo: string }>>([])
    const [origin, setOrigin] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [optimizing, setOptimizing] = useState(false)
    const [route, setRoute] = useState<RouteStop[]>([])

    // Fetch pending deliveries
    useEffect(() => {
        fetchPendingSales()
        // Fetch saved locations
        supabase.from('configuracoes')
            .select('*')
            .eq('chave', 'locais_partida')
            .maybeSingle()
            .then(({ data }) => {
                if (data) {
                    const val = (data as any)?.valor
                    if (val && Array.isArray(val) && val.length > 0) {
                        // Transform to legacy format
                        const formatted = val.map((loc: any) => ({
                            endereco: loc.endereco || loc.nome,
                            tipo: loc.nome?.toLowerCase() || 'local'
                        }))
                        setLocais(formatted)
                        // Set first location as default origin
                        setOrigin(formatted[0].endereco)
                    }
                }
            })
    }, [])

    const fetchPendingSales = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('vendas')
                .select(`
                    id,
                    total,
                    data,
                    contato:contato_id (
                        id,
                        nome,
                        endereco,
                        bairro,
                        latitude,
                        longitude
                    )
                `)
                .eq('status', 'pendente')
                .order('data', { ascending: true })

            if (error) throw error

            const formatted: DeliveryItem[] = (data || []).map((v) => ({
                id: v.id,
                cliente_nome: (v.contato as any)?.nome || 'Cliente',
                endereco: (v.contato as any)?.endereco || '',
                bairro: (v.contato as any)?.bairro || null,
                total: v.total || 0,
                latitude: (v.contato as any)?.latitude || null,
                longitude: (v.contato as any)?.longitude || null,
                data: v.data
            }))

            setPendentes(formatted)
        } catch (error: any) {
            toast.error(error.message || 'Não foi possível carregar as entregas')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const handleAddressInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setOrigin(val)

        // CEP auto-complete
        if (/^\d{8}$/.test(val)) {
            const addr = await fetchCep(val)
            if (addr) {
                setOrigin(`${addr.street}, ${addr.neighborhood} - ${addr.city}, ${addr.state}`)
            }
        }
    }

    const handleOptimizeRoute = async () => {
        if (selectedIds.size === 0) {
            toast.warning('Selecione pelo menos uma entrega')
            return
        }

        setOptimizing(true)
        try {
            const selected = pendentes.filter(p => selectedIds.has(p.id))

            // Simple optimization: group by neighborhood, then by address
            const sorted = [...selected].sort((a, b) => {
                if (a.bairro && b.bairro) {
                    if (a.bairro !== b.bairro) return a.bairro.localeCompare(b.bairro)
                }
                return a.endereco.localeCompare(b.endereco)
            })

            const stops: RouteStop[] = sorted.map(s => ({
                id: s.id,
                name: s.cliente_nome,
                address: s.endereco,
                neighborhood: s.bairro
            }))

            setRoute(stops)

            toast.success(`Rota otimizada! ${stops.length} paradas organizadas por bairro`)
        } catch (error: any) {
            toast.error(error.message || 'Não foi possível otimizar a rota')
        } finally {
            setOptimizing(false)
        }
    }

    const handleNavigateGoogleMaps = () => {
        if (route.length === 0) return

        const waypoints = route.map(r => encodeURIComponent(r.address)).join('/')
        const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${waypoints}`
        window.open(url, '_blank')
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">

                {/* Header */}
                <Header
                    title="Rota Inteligente"
                    centerTitle
                    showBack
                    transparent
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                />

                <PageContainer className="relative z-10 space-y-6 pt-4 pb-32 px-4">

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-semantic-green rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* 2-Column Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Left Column: Selection & Controls */}
                                <div className="space-y-6">
                                    {/* Origin Selector */}
                                    <OriginSelector
                                        locais={locais}
                                        origin={origin}
                                        onOriginChange={setOrigin}
                                        onAddressInput={handleAddressInput}
                                    />

                                    {/* Delivery List */}
                                    <DeliveryList
                                        deliveries={pendentes}
                                        selectedIds={selectedIds}
                                        onToggleSelection={handleToggleSelection}
                                        groupByNeighborhood={true}
                                    />

                                    {/* Optimization Button */}
                                    <OptimizationButton
                                        isLoading={optimizing}
                                        selectedCount={selectedIds.size}
                                        onClick={handleOptimizeRoute}
                                        disabled={optimizing || selectedIds.size === 0}
                                    />
                                </div>

                                {/* Right Column: Route Preview */}
                                <div className="lg:sticky lg:top-24 lg:h-fit space-y-6">
                                    {route.length > 0 ? (
                                        <>
                                            {/* Route Stats Card */}
                                            <Card className="p-5 bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 rounded-xl">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Rota Gerada</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {route.length} paradas · Organizado por bairro
                                                        </p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-semantic-green/10 flex items-center justify-center">
                                                        <MapPin className="w-5 h-5 text-semantic-green" />
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={handleNavigateGoogleMaps}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 font-medium"
                                                >
                                                    Abrir no Google Maps
                                                </Button>
                                            </Card>

                                            {/* Route Timeline */}
                                            <Card className="p-5 bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 rounded-xl max-h-[600px] overflow-y-auto">
                                                <RouteTimeline stops={route} />
                                            </Card>
                                        </>
                                    ) : (
                                        <Card className="p-8 bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 rounded-xl">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                    <Clock className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aguardando rota</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                                                    Selecione as entregas e clique em "Gerar Rota Otimizada" para visualizar
                                                </p>
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </PageContainer>
            </div>
        </div>
    )
}

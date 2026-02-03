import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Venda, Contato } from '../types/database'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Header } from '../components/layout/Header'
import { Check, MapPin, Navigation, Truck } from 'lucide-react'
import { useCep } from '../hooks/useCep'
import { useToast } from '../components/ui/Toast'

// Simple definition to handle the join result
type VendaComContato = Venda & {
    contato: Contato | null
}

interface OptimizedRoute {
    id: string
    endereco: string
    cliente: string
    latitude?: number | null
    longitude?: number | null
}

export function Entregas() {
    const [pendentes, setPendentes] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingSales, setLoadingSales] = useState(true)
    const toast = useToast()

    interface LocalPartida {
        id: string
        nome: string
        endereco: string
        lat: number
        lng: number
    }
    const [locais, setLocais] = useState<LocalPartida[]>([])

    // Origin state with localStorage persistence
    const [origin, setOrigin] = useState(() => {
        return localStorage.getItem('routeOrigin') || ''
    })

    const { fetchCep } = useCep()

    const handleOriginChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setOrigin(value)
        localStorage.setItem('routeOrigin', value)

        // Auto-complete if it looks like a CEP (8 digits)
        const cleanValue = value.replace(/\D/g, '')
        if (cleanValue.length === 8) {
            const addressData = await fetchCep(cleanValue)
            if (addressData) {
                const fullAddress = `${addressData.street}, S/N - ${addressData.neighborhood}, ${addressData.city} - ${addressData.state}`
                setOrigin(fullAddress)
                localStorage.setItem('routeOrigin', fullAddress)
                toast.success('Endereço completado pelo CEP!')
            }
        }
    }

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
                    if (val && Array.isArray(val)) {
                        setLocais(val)
                    }
                }
            })
    }, [])

    const fetchPendingSales = async () => {
        setLoadingSales(true)
        try {
            const { data, error } = await supabase
                .from('vendas')
                .select(`
                    *,
                    contato:contatos(*)
                `)
                .eq('status', 'pendente')
                .order('criado_em', { ascending: true })

            if (error) throw error

            const vendas = data as unknown as VendaComContato[]

            const formatted = vendas.map(venda => ({
                id: venda.id,
                cliente_nome: venda.contato?.nome || 'Cliente Desconhecido',
                endereco: venda.contato?.endereco || 'Endereço não cadastrado',
                bairro: venda.contato?.bairro || 'Sem Bairro',
                latitude: venda.contato?.latitude,
                longitude: venda.contato?.longitude,
                total: venda.total,
                data: venda.data
            }))

            setPendentes(formatted)
            // Auto-select all by default
            setSelectedIds(formatted.map(p => p.id))
        } catch (error) {
            console.error('Erro ao buscar entregas:', error)
            toast.error('Erro ao carregar entregas pendentes')
        } finally {
            setLoadingSales(false)
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleOptimize = async () => {
        if (selectedIds.length === 0) {
            toast.error('Selecione pelo menos uma entrega')
            return
        }

        setLoading(true)
        setOptimizedRoute(null)

        const entregasParaOtimizar = pendentes.filter(p => selectedIds.includes(p.id))
        console.log('🚀 Iniciando Otimização. Itens:', entregasParaOtimizar)

        // Check if origin matches a saved location to extract coordinates
        const originLocal = locais.find(l => l.endereco === origin)

        const payload = {
            entregas: entregasParaOtimizar,
            origin: origin,
            origin_lat: originLocal?.lat || null,
            origin_lng: originLocal?.lng || null
        }
        console.log('📤 Enviando para API:', payload)

        try {
            const response = await fetch('/api/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error('Falha na resposta do servidor')
            }

            const data = await response.json()
            console.log('📥 Resposta da API:', data)

            // Robust parsing: handle if API returns pure IDs or items with ID
            // We trust the order from API but the content from local state
            const orderedIds = Array.isArray(data) ? data.map((item: any) =>
                typeof item === 'string' ? item : item.id
            ) : []

            const routeWithDetails = orderedIds
                .map((id: string): OptimizedRoute | null => {
                    const original = pendentes.find(p => p.id === id)
                    if (!original) return null
                    return {
                        id: original.id,
                        endereco: original.endereco,
                        cliente: original.cliente_nome, // Map field name to match interface
                        latitude: original.latitude,
                        longitude: original.longitude
                    }
                })
                .filter((item): item is OptimizedRoute => item !== null)

            setOptimizedRoute(routeWithDetails)
            toast.success('Rota otimizada com sucesso!')
        } catch (error) {
            console.error('Erro na otimização:', error)
            toast.error('Erro ao otimizar rota. Usando ordem original.')
            // Fallback: use original order of selected items
            setOptimizedRoute(entregasParaOtimizar.map(e => ({
                id: e.id,
                endereco: e.endereco,
                cliente: e.cliente_nome,
                latitude: e.latitude,
                longitude: e.longitude
            })))
        } finally {
            setLoading(false)
        }
    }

    const openGoogleMaps = () => {
        if (!optimizedRoute || optimizedRoute.length === 0) return

        // 1. Deduplication: Remove consecutive stops with the same address
        const uniqueRoute = optimizedRoute.reduce((acc, current) => {
            const last = acc[acc.length - 1]
            if (!last) return [current]
            if (current.endereco === last.endereco) return acc
            return [...acc, current]
        }, [] as OptimizedRoute[])

        const validStops = uniqueRoute.filter(r => r.endereco && r.endereco !== 'Endereço não cadastrado')

        if (validStops.length === 0) {
            toast.error('Nenhum endereço válido para rota')
            return
        }

        // Helper: Formatting address for URL - STRICTLY TEXT for Customers
        const formatAddress = (stop: OptimizedRoute) => {
            // We consciously IGNORE latitude/longitude for customers to prevent
            // Google Maps from snapping to the wrong street (e.g. Back of the house).
            return stop.endereco
        }

        // 2. Origin: Hybrid Strategy
        // If it's the HQ (Sede), we trust our fixed coordinates.
        // If it's a dynamic user location, we use text to be safe.
        let originValue = 'My Location'
        if (origin) {
            // Check if origin matches a saved place (Sede/Depósito)
            const originLocal = locais.find(l => l.endereco === origin)
            if (originLocal && originLocal.lat && originLocal.lng) {
                // FIXED POINT: Use precise coordinates
                originValue = `${originLocal.lat},${originLocal.lng}`
            } else {
                // DYNAMIC POINT: Use clean text address
                originValue = origin.replace(', ,', ', S/N -').replace(',,', ',')
            }
        }

        // 3. Destination (Last Point)
        const lastStop = validStops[validStops.length - 1]
        const destinationValue = formatAddress(lastStop)

        // 4. Waypoints (Intermediate Points)
        const waypointsList = validStops.slice(0, -1).map(formatAddress)

        // 5. Construct URL - Universal Standard
        // Format: https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...
        const params = new URLSearchParams()
        params.append('api', '1')
        params.append('origin', originValue)
        params.append('destination', destinationValue)
        params.append('travelmode', 'driving')

        if (waypointsList.length > 0) {
            params.append('waypoints', waypointsList.join('|'))
        }

        const url = `https://www.google.com/maps/dir/?${params.toString()}`

        console.log('🗺️ URL Google Maps (Supreme V5):', url)
        window.open(url, '_blank')
    }


    const groupedPendentes = pendentes.reduce((groups: Record<string, any[]>, item) => {
        const bairro = item.bairro || 'Sem Bairro'
        if (!groups[bairro]) groups[bairro] = []
        groups[bairro].push(item)
        return groups
    }, {})

    return (
        <div className="space-y-6 pb-20">
            <Header
                title="Rota Inteligente"
            // subtitle="Otimize suas entregas com IA" // Header doesn't have subtitle prop based on usage in Vendas.tsx
            />

            {loadingSales ? (
                <div className="text-center py-10 text-gray-400">Carregando entregas...</div>
            ) : pendentes.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Nenhuma entrega pendente encontrada.</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 p-4">
                    {/* Configuração de Rota */}
                    <div className="md:col-span-2">
                        <Card className="p-4 bg-[#1a1f2e] border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <MapPin className="h-5 w-5 text-purple-400" />
                                </div>
                                <h3 className="text-gray-200 font-medium">Ponto de Partida (Sede/Depósito)</h3>
                            </div>

                            <div className="space-y-3">
                                <select
                                    value={locais.some(l => l.endereco === origin) ? origin : 'outro'}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        if (val === 'outro') {
                                            if (locais.some(l => l.endereco === origin)) {
                                                setOrigin('')
                                            }
                                        } else {
                                            setOrigin(val)
                                            localStorage.setItem('routeOrigin', val)
                                        }
                                    }}
                                    className="w-full bg-black/20 border border-gray-700 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="" disabled>Selecione um local...</option>
                                    {locais.map(local => (
                                        <option key={local.id} value={local.endereco}>
                                            {local.nome}
                                        </option>
                                    ))}
                                    <option value="outro">Outro...</option>
                                </select>

                                {(origin === '' || !locais.some(l => l.endereco === origin)) && (
                                    <div className="animate-fadeIn">
                                        <Input
                                            placeholder="Digite o endereço de partida..."
                                            value={origin}
                                            onChange={handleOriginChange}
                                            className="w-full"
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Defina o endereço inicial para a otimização. Ele será salvo automaticamente.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Lista de Seleção */}
                    <Card className="p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Entregas Pendentes ({pendentes.length})</h3>
                            <span className="text-sm text-gray-400">{selectedIds.length} selecionados</span>
                        </div>

                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                            {Object.entries(groupedPendentes).map(([bairro, items]) => (
                                <div key={bairro} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-[#1a1f2e] py-1 z-10">
                                        {bairro}
                                    </h4>
                                    {items.map((item: any) => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleSelection(item.id)}
                                            className={`
                                                flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors
                                                ${selectedIds.includes(item.id)
                                                    ? 'bg-primary/10 border-primary/50'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'}
                                            `}
                                        >
                                            <div className={`
                                                w-5 h-5 rounded border flex items-center justify-center mt-0.5
                                                ${selectedIds.includes(item.id)
                                                    ? 'bg-primary border-primary'
                                                    : 'border-gray-500'}
                                            `}>
                                                {selectedIds.includes(item.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{item.cliente_nome}</p>
                                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{item.endereco}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleOptimize}
                            disabled={loading || selectedIds.length === 0}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Calculando Melhor Rota...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    Gerar Rota Otimizada ⚡
                                </span>
                            )}
                        </Button>
                    </Card>

                    {/* Resultado da Otimização */}
                    <Card className="p-4 space-y-4 relative overflow-hidden">
                        {!optimizedRoute ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 min-h-[200px] p-6">
                                <MapPin className="w-12 h-12 mb-3 opacity-20" />
                                <p>Selecione as entregas e clique em gerar para ver a rota otimizada aqui.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg text-emerald-400">Rota Gerada</h3>
                                </div>

                                <div className="space-y-3 relative">
                                    {/* Linha conectora vertical */}
                                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-700/50 -z-10" />

                                    {optimizedRoute.map((stop, index) => (
                                        <div key={stop.id} className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 z-10 font-bold text-emerald-500">
                                                {index + 1}
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-lg flex-1 border border-white/5">
                                                <p className="font-medium">{stop.cliente}</p>
                                                <p className="text-sm text-gray-400">{stop.endereco}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={openGoogleMaps}
                                >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Iniciar Navegação 🗺️
                                </Button>
                            </>
                        )}
                    </Card>
                </div>
            )}
        </div>
    )
}

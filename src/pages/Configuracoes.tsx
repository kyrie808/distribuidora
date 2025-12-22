import { useState, useEffect } from 'react'
import {
    Clock,
    DollarSign,
    MessageSquare,
    Save,
    RefreshCw,
    Info,
    Package,
    MapPin,
    Trash2,
    Plus,
    ChevronRight
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Button, LoadingScreen, Input } from '../components/ui'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { getCoordinates } from '../utils/geocoding'
import { useCep } from '../hooks/useCep'
import type { Json } from '../types/database'

interface LocalPartida {
    id: string
    nome: string
    endereco: string
    lat: number
    lng: number
}

export function Configuracoes() {
    const navigate = useNavigate()
    const toast = useToast()
    const { config, loading, refetch } = useConfiguracoes()

    // Local state for editing
    const [cicloB2C, setCicloB2C] = useState(15)
    const [cicloB2B, setCicloB2B] = useState(7)
    const [recompensaValor, setRecompensaValor] = useState(5)
    const [mensagemRecompra, setMensagemRecompra] = useState('')

    // Locais de Partida State
    const [locais, setLocais] = useState<LocalPartida[]>([])
    const [novoLocalNome, setNovoLocalNome] = useState('')
    const [novoLocalEndereco, setNovoLocalEndereco] = useState('')
    const [addingLocal, setAddingLocal] = useState(false)

    const { fetchCep } = useCep()

    const handleEnderecoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setNovoLocalEndereco(value)

        // Auto-complete if it looks like a CEP (8 digits)
        const cleanValue = value.replace(/\D/g, '')
        if (cleanValue.length === 8) {
            const addressData = await fetchCep(cleanValue)
            if (addressData) {
                const fullAddress = `${addressData.street}, , ${addressData.neighborhood}, ${addressData.city} - ${addressData.state}`
                setNovoLocalEndereco(fullAddress)
                toast.success('Endereço completado pelo CEP!')
            }
        }
    }

    const [saving, setSaving] = useState(false)

    // Sync with config when loaded
    useEffect(() => {
        if (!loading) {
            setCicloB2C(config.cicloRecompra.b2c)
            setCicloB2B(config.cicloRecompra.b2b)
            setRecompensaValor(config.recompensaIndicacao.valor)
            setMensagemRecompra(config.mensagemRecompra)

            // Load locais from config if available (Need to verify how `config` is structured in hook, 
            // but assuming we might need to fetch it or it is part of config object.
            // For now, let's fetch 'locais_partida' directly here if not in hook yet, 
            // OR assuming user will update useConfiguracoes later. 
            // Actually, let's just fetch it here to be safe or assuming the hook returns all configs.)
            // NOTE: The `useConfiguracoes` hook likely summarizes configs. 
            // I'll fetch 'locais_partida' separately to avoid breaking the hook type for now, or assume it's there.
            // Let's safe fetch:
            // Fetch saved locations explicitly to ensure we have them even if useConfiguracoes is shallow
            supabase.from('configuracoes')
                .select('*')
                .eq('chave', 'locais_partida')
                .maybeSingle() // Use maybeSingle to avoid 406 on no rows
                .then(({ data }) => {
                    if (data) {
                        const val = (data as any)?.valor
                        if (val && Array.isArray(val)) {
                            console.log('📍 Locais carregados:', val)
                            setLocais(val as LocalPartida[])
                        }
                    }
                })
        }
    }, [config, loading])

    const handleAddLocal = async () => {
        if (!novoLocalNome || !novoLocalEndereco) {
            toast.error('Preencha nome e endereço')
            return
        }

        setAddingLocal(true)
        try {
            const coords = await getCoordinates(novoLocalEndereco)
            if (!coords) {
                toast.error('Endereço não encontrado')
                return
            }

            const novoLocal: LocalPartida = {
                id: crypto.randomUUID(),
                nome: novoLocalNome,
                endereco: novoLocalEndereco,
                lat: coords.lat,
                lng: coords.lng
            }

            const updatedLocais = [...locais, novoLocal]
            setLocais(updatedLocais)

            // Auto-save changes to DB
            await supabase.from('configuracoes').upsert({
                chave: 'locais_partida',
                valor: updatedLocais as unknown as Json
            }, { onConflict: 'chave' })

            setNovoLocalNome('')
            setNovoLocalEndereco('')
            toast.success('Local adicionado e salvo!')
        } catch (error) {
            toast.error('Erro ao adicionar local')
            console.error(error)
        } finally {
            setAddingLocal(false)
        }
    }

    const handleRemoveLocal = async (id: string) => {
        const updatedLocais = locais.filter(l => l.id !== id)
        setLocais(updatedLocais)

        try {
            await supabase.from('configuracoes').upsert({
                chave: 'locais_partida',
                valor: updatedLocais as unknown as Json
            }, { onConflict: 'chave' })
            toast.success('Local removido!')
        } catch (error) {
            toast.error('Erro ao remover local')
            console.error(error)
        }
    }

    const handleSave = async () => {
        setSaving(true)

        try {
            // Update ciclo_recompra
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'ciclo_recompra',
                    valor: { b2c: cicloB2C, b2b: cicloB2B },
                }, { onConflict: 'chave' })

            // Update recompensa_indicacao
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'recompensa_indicacao',
                    valor: { tipo: 'desconto', valor: recompensaValor },
                }, { onConflict: 'chave' })

            // Update mensagem_recompra
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'mensagem_recompra',
                    valor: { texto: mensagemRecompra },
                }, { onConflict: 'chave' })

            // Update locais_partida
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'locais_partida',
                    valor: locais as unknown as Json
                }, { onConflict: 'chave' })

            await refetch()
            toast.success('Configurações salvas!')
        } catch (err) {
            toast.error('Erro ao salvar configurações')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setCicloB2C(config.cicloRecompra.b2c)
        setCicloB2B(config.cicloRecompra.b2b)
        setRecompensaValor(config.recompensaIndicacao.valor)
        setMensagemRecompra(config.mensagemRecompra)
        // Refresh locais from DB
        supabase.from('configuracoes').select('*').eq('chave', 'locais_partida').maybeSingle()
            .then(({ data }) => {
                const val = (data as any)?.valor
                if (val && Array.isArray(val)) {
                    setLocais(val as LocalPartida[])
                }
            })
        toast.info('Alterações descartadas')
    }

    // Check if there are unsaved changes
    const hasChanges =
        cicloB2C !== config.cicloRecompra.b2c ||
        cicloB2B !== config.cicloRecompra.b2b ||
        recompensaValor !== config.recompensaIndicacao.valor ||
        mensagemRecompra !== config.mensagemRecompra

    return (
        <>
            <Header
                title="Configurações"
                showBack
            />
            <PageContainer>
                {loading && <LoadingScreen message="Carregando configurações..." />}

                {!loading && (
                    <div className="space-y-6">
                        {/* Ciclos de Recompra */}
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Ciclos de Recompra</h3>
                                    <p className="text-sm text-gray-500">Dias até alerta de recompra</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pessoa Física (B2C)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={90}
                                            value={cicloB2C}
                                            onChange={(e) => setCicloB2C(Number(e.target.value))}
                                            className="input w-20 text-center"
                                        />
                                        <span className="text-sm text-gray-500">dias</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pessoa Jurídica (B2B)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={90}
                                            value={cicloB2B}
                                            onChange={(e) => setCicloB2B(Number(e.target.value))}
                                            className="input w-20 text-center"
                                        />
                                        <span className="text-sm text-gray-500">dias</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Recompensa por Indicação */}
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-success-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Recompensa por Indicação</h3>
                                    <p className="text-sm text-gray-500">Valor por indicação convertida</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">R$</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={recompensaValor}
                                    onChange={(e) => setRecompensaValor(Number(e.target.value))}
                                    className="input w-24 text-center"
                                />
                                <span className="text-sm text-gray-500">por cliente convertido</span>
                            </div>

                            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <p>
                                    Indicação só conta como convertida quando o indicado faz sua primeira compra.
                                </p>
                            </div>
                        </Card>

                        {/* Template de Mensagem */}
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-accent-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Mensagem de Recompra</h3>
                                    <p className="text-sm text-gray-500">Template para WhatsApp</p>
                                </div>
                            </div>

                            <textarea
                                value={mensagemRecompra}
                                onChange={(e) => setMensagemRecompra(e.target.value)}
                                rows={4}
                                className="input resize-none"
                                placeholder="Olá {{nome}}! Faz {{dias}} dias..."
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500">Variáveis:</span>
                                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{'{{nome}}'}</code>
                                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{'{{dias}}'}</code>
                            </div>
                        </Card>



                        {/* Locais de Partida */}
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Locais de Partida</h3>
                                    <p className="text-sm text-gray-500">Pontos iniciais para rotas</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {locais.map(local => (
                                    <div key={local.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{local.nome}</p>
                                            <p className="text-xs text-gray-500">{local.endereco}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Lat: {local.lat.toFixed(4)}, Lng: {local.lng.toFixed(4)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveLocal(local.id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                <div className="grid gap-2 border-t pt-4">
                                    <h4 className="text-sm font-medium">Novo Local</h4>
                                    <Input
                                        placeholder="Nome (Ex: Sede)"
                                        value={novoLocalNome}
                                        onChange={e => setNovoLocalNome(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Endereço completo ou CEP"
                                            value={novoLocalEndereco}
                                            onChange={handleEnderecoChange}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleAddLocal}
                                            disabled={addingLocal}
                                            isLoading={addingLocal}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Links de navegação */}
                        <Card
                            hover
                            onClick={() => navigate('/produtos')}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <Package className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Gerenciar Produtos</h3>
                                        <p className="text-sm text-gray-500">Adicionar, editar e desativar produtos</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                        </Card>

                        <Card
                            hover
                            onClick={() => navigate('/relatorio-fabrica')}
                            className="cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                                        <MessageSquare className="h-5 w-5 text-accent-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Relatório para Fábrica</h3>
                                        <p className="text-sm text-gray-500">Gerar pedido por período</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                leftIcon={<RefreshCw className="h-4 w-4" />}
                                onClick={handleReset}
                                disabled={!hasChanges || saving}
                            >
                                Descartar
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                leftIcon={<Save className="h-4 w-4" />}
                                onClick={handleSave}
                                isLoading={saving}
                                disabled={!hasChanges}
                            >
                                Salvar
                            </Button>
                        </div>

                        {/* App Info */}
                    </div>
                )}
            </PageContainer>
        </>
    )
}

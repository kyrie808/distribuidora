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
                valor: updatedLocais as any
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
                valor: updatedLocais as any
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
                    valor: locais as any
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
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                <Header
                    title="Configurações"
                    showBack
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                />
                <PageContainer className="pt-0 pb-32 bg-transparent px-4">
                    {loading && <LoadingScreen message="Carregando configurações..." />}

                    {!loading && (
                        <div className="space-y-6">
                            {/* Ciclos de Recompra */}
                            <Card>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ciclos de Recompra</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Dias até alerta de recompra</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Pessoa Física (B2C)
                                            </label>
                                            <div className="flex items-stretch gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCicloB2C(Math.max(1, cicloB2C - 1))}
                                                    className="px-2"
                                                >
                                                    −
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={90}
                                                    value={cicloB2C}
                                                    onChange={(e) => setCicloB2C(Number(e.target.value))}
                                                    className="w-16 text-center"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCicloB2C(Math.min(90, cicloB2C + 1))}
                                                    className="px-2"
                                                >
                                                    +
                                                </Button>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 self-center ml-1">dias</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Pessoa Jurídica (B2B)
                                            </label>
                                            <div className="flex items-stretch gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCicloB2B(Math.max(1, cicloB2B - 1))}
                                                    className="px-2"
                                                >
                                                    −
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={90}
                                                    value={cicloB2B}
                                                    onChange={(e) => setCicloB2B(Number(e.target.value))}
                                                    className="w-16 text-center"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCicloB2B(Math.min(90, cicloB2B + 1))}
                                                    className="px-2"
                                                >
                                                    +
                                                </Button>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 self-center ml-1">dias</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Recompensa por Indicação */}
                            <Card>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-success" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recompensa por Indicação</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Valor por indicação convertida</p>
                                        </div>
                                    </div>

                                    <div className="flex items-stretch gap-1">
                                        <span className="text-gray-500 dark:text-gray-400 self-center">R$</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRecompensaValor(Math.max(0, recompensaValor - 0.5))}
                                            className="px-2"
                                        >
                                            −
                                        </Button>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            value={recompensaValor}
                                            onChange={(e) => setRecompensaValor(Number(e.target.value))}
                                            className="w-20 text-center"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setRecompensaValor(recompensaValor + 0.5)}
                                            className="px-2"
                                        >
                                            +
                                        </Button>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 self-center ml-1">por cliente</span>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-muted p-2 rounded-lg">
                                        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                        <p>
                                            Indicação só conta como convertida quando o indicado faz sua primeira compra.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Template de Mensagem */}
                            <Card>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                                            <MessageSquare className="h-5 w-5 text-accent" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mensagem de Recompra</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Template para WhatsApp</p>
                                        </div>
                                    </div>

                                    <textarea
                                        value={mensagemRecompra}
                                        onChange={(e) => setMensagemRecompra(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                        placeholder="Olá {{nome}}! Faz {{dias}} dias..."
                                    />

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Variáveis:</span>
                                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{'{{nome}}'}</code>
                                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{'{{dias}}'}</code>
                                    </div>

                                    {/* Preview Live */}
                                    {mensagemRecompra && (
                                        <div className="mt-4 p-4 bg-muted/50 dark:bg-muted/20 rounded-lg border-l-4 border-l-primary">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Preview:</p>
                                            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                                {mensagemRecompra
                                                    .replace(/\{\{nome\}\}/g, 'João Silva')
                                                    .replace(/\{\{dias\}\}/g, '15')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>



                            {/* Locais de Partida */}
                            <Card>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Locais de Partida</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Pontos iniciais para rotas</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {locais.map(local => (
                                            <Card key={local.id} className="hover:shadow-md transition-all">
                                                <div className="p-4 flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                            <MapPin className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-gray-100">{local.nome}</h4>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{local.endereco}</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                                {local.lat.toFixed(4)}, {local.lng.toFixed(4)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveLocal(local.id)}
                                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 -mr-2 -mt-1"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </Card>
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
                                </div>
                            </Card>

                            {/* Links de navegação */}
                            <Card
                                hover
                                onClick={() => navigate('/produtos')}
                                className="cursor-pointer"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-violet-500/10 rounded-full flex items-center justify-center">
                                                <Package className="h-5 w-5 text-violet-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Gerenciar Produtos</h3>
                                                <p className="text-sm text-gray-500">Adicionar, editar e desativar produtos</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </Card>

                            <Card
                                hover
                                onClick={() => navigate('/relatorio-fabrica')}
                                className="cursor-pointer"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                                                <MessageSquare className="h-5 w-5 text-accent" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Relatório para Fábrica</h3>
                                                <p className="text-sm text-gray-500">Gerar pedido por período</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </div>
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
            </div>
        </div>
    )
}

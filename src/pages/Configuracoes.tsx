import { useState, useEffect } from 'react'
import {
    Save,
    RefreshCw
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, LoadingScreen } from '../components/ui'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../lib/supabase'
import { getCoordinates } from '../utils/geocoding'
import { useCep } from '../hooks/useCep'
import type { Json } from '../types/database'

// Sub-components
import { ConfiguracaoCiclo } from '../components/features/configuracoes/ConfiguracaoCiclo'
import { ConfiguracaoRecompensas } from '../components/features/configuracoes/ConfiguracaoRecompensas'
import { ConfiguracaoMensagens } from '../components/features/configuracoes/ConfiguracaoMensagens'
import { ConfiguracaoLocalizacao } from '../components/features/configuracoes/ConfiguracaoLocalizacao'
import { ConfiguracaoLinks } from '../components/features/configuracoes/ConfiguracaoLinks'

interface LocalPartida {
    id: string
    nome: string
    endereco: string
    lat: number
    lng: number
}

export function Configuracoes() {
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

            supabase.from('configuracoes')
                .select('valor')
                .eq('chave', 'locais_partida')
                .maybeSingle()
                .then(({ data }) => {
                    if (data?.valor && Array.isArray(data.valor)) {
                        setLocais(data.valor as unknown as LocalPartida[])
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
            await Promise.all([
                supabase.from('configuracoes').upsert({
                    chave: 'ciclo_recompra',
                    valor: { b2c: cicloB2C, b2b: cicloB2B },
                }, { onConflict: 'chave' }),
                supabase.from('configuracoes').upsert({
                    chave: 'recompensa_indicacao',
                    valor: { tipo: 'desconto', valor: recompensaValor },
                }, { onConflict: 'chave' }),
                supabase.from('configuracoes').upsert({
                    chave: 'mensagem_recompra',
                    valor: { texto: mensagemRecompra },
                }, { onConflict: 'chave' }),
                supabase.from('configuracoes').upsert({
                    chave: 'locais_partida',
                    valor: locais as unknown as Json
                }, { onConflict: 'chave' })
            ])

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
        supabase.from('configuracoes').select('valor').eq('chave', 'locais_partida').maybeSingle()
            .then(({ data }) => {
                if (data?.valor && Array.isArray(data.valor)) {
                    setLocais(data.valor as unknown as LocalPartida[])
                }
            })
        toast.info('Alterações descartadas')
    }

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
                        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 text-gray-900 dark:text-gray-100">
                            <ConfiguracaoCiclo 
                                cicloB2C={cicloB2C} setCicloB2C={setCicloB2C}
                                cicloB2B={cicloB2B} setCicloB2B={setCicloB2B}
                            />
                            
                            <ConfiguracaoRecompensas 
                                recompensaValor={recompensaValor} 
                                setRecompensaValor={setRecompensaValor}
                            />

                            <ConfiguracaoMensagens 
                                mensagemRecompra={mensagemRecompra}
                                setMensagemRecompra={setMensagemRecompra}
                            />

                            <ConfiguracaoLocalizacao 
                                locais={locais}
                                handleRemoveLocal={handleRemoveLocal}
                                novoLocalNome={novoLocalNome}
                                setNovoLocalNome={setNovoLocalNome}
                                novoLocalEndereco={novoLocalEndereco}
                                handleEnderecoChange={handleEnderecoChange}
                                handleAddLocal={handleAddLocal}
                                addingLocal={addingLocal}
                            />

                            <ConfiguracaoLinks />

                            <div className="flex gap-3 lg:col-span-2">
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
                        </div>
                    )}
                </PageContainer>
            </div>
        </div>
    )
}

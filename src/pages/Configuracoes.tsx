import { useState, useEffect } from 'react'
import {
    Clock,
    DollarSign,
    MessageSquare,
    Save,
    RefreshCw,
    Info,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Button, LoadingScreen } from '../components/ui'
import { useConfiguracoes } from '../hooks/useConfiguracoes'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../lib/supabase'

export function Configuracoes() {
    const toast = useToast()
    const { config, loading, refetch } = useConfiguracoes()

    // Local state for editing
    const [cicloB2C, setCicloB2C] = useState(15)
    const [cicloB2B, setCicloB2B] = useState(7)
    const [recompensaValor, setRecompensaValor] = useState(5)
    const [mensagemRecompra, setMensagemRecompra] = useState('')
    const [saving, setSaving] = useState(false)

    // Sync with config when loaded
    useEffect(() => {
        if (!loading) {
            setCicloB2C(config.cicloRecompra.b2c)
            setCicloB2B(config.cicloRecompra.b2b)
            setRecompensaValor(config.recompensaIndicacao.valor)
            setMensagemRecompra(config.mensagemRecompra)
        }
    }, [config, loading])

    const handleSave = async () => {
        setSaving(true)

        try {
            // Update ciclo_recompra
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'ciclo_recompra',
                    valor: { b2c: cicloB2C, b2b: cicloB2B },
                })

            // Update recompensa_indicacao
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'recompensa_indicacao',
                    valor: { tipo: 'desconto', valor: recompensaValor },
                })

            // Update mensagem_recompra
            await supabase
                .from('configuracoes')
                .upsert({
                    chave: 'mensagem_recompra',
                    valor: { texto: mensagemRecompra },
                })

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
                        <div className="text-center text-xs text-gray-400 py-4">
                            <p>Gilmar Distribuidor Massas v1.0</p>
                            <p>Sistema de Gestão Comercial</p>
                        </div>
                    </div>
                )}
            </PageContainer>
        </>
    )
}

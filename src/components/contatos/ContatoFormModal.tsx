import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, X, Check, Loader2 } from 'lucide-react'
import { Modal, ModalActions, Button, Input, Select } from '../ui'
import { contatoSchema, type ContatoFormData } from '../../schemas/contato'
import { useContatos } from '../../hooks/useContatos'
import { useToast } from '../ui/Toast'
import { useCep } from '../../hooks/useCep'
import { formatPhone } from '../../utils/formatters'
import {
    CONTATO_TIPO_LABELS,
    CONTATO_ORIGEM_LABELS,
    SUBTIPOS_B2B_LABELS,
    CONTATO_STATUS_LABELS,
} from '../../constants'
import type { Contato } from '../../types/database'

// Extended form data to handle split address fields locally
interface ExtendedFormData extends ContatoFormData {
    logradouro?: string
    numero?: string
    complemento?: string
    cidade?: string
    uf?: string
    cep_input?: string // Local field for the mask
}

interface ContatoFormModalProps {
    isOpen: boolean
    onClose: () => void
    contato?: Contato | null
    onSuccess?: (contato: Contato) => void
}

export function ContatoFormModal({
    isOpen,
    onClose,
    contato,
    onSuccess,
}: ContatoFormModalProps) {
    const isEditing = !!contato
    const toast = useToast()
    const { createContato, updateContato, searchContatos } = useContatos({ realtime: false })
    const { fetchCep, loading: loadingCep } = useCep()

    // Autocomplete state
    const [indicadorSearch, setIndicadorSearch] = useState('')
    const [indicadorResults, setIndicadorResults] = useState<Contato[]>([])
    const [selectedIndicador, setSelectedIndicador] = useState<Contato | null>(null)
    const [showIndicadorDropdown, setShowIndicadorDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        setFocus,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<ExtendedFormData>({
        resolver: zodResolver(contatoSchema),
        defaultValues: {
            nome: '',
            telefone: '',
            tipo: 'B2C',
            status: 'lead',
            origem: 'direto',
            subtipo: null,
            indicado_por_id: null,
            endereco: null,
            bairro: null,
            observacoes: null,
            // Extended fields
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            cidade: '',
            uf: '',
        },
    })

    const tipoValue = watch('tipo')
    const origemValue = watch('origem')
    const cepValue = watch('cep')

    // Watch for CEP changes to trigger fetch
    useEffect(() => {
        if (cepValue && cepValue.length >= 8) {
            const clean = cepValue.replace(/\D/g, '')
            if (clean.length === 8) {
                handleFetchCep(clean)
            }
        }
    }, [cepValue])

    const handleFetchCep = async (cep: string) => {
        const data = await fetchCep(cep)
        if (data) {
            setValue('logradouro', data.street)
            setValue('bairro', data.neighborhood)
            setValue('cidade', data.city)
            setValue('uf', data.state)
            // Focus on number field
            setTimeout(() => {
                setFocus('numero')
            }, 100)
        } else {
            toast.error('CEP não encontrado. Preencha o endereço manualmente.')
        }
    }

    // Reset form when modal opens/closes or contato changes
    useEffect(() => {
        if (isOpen && contato) {
            // If editing, we might have the composite address string but not the split parts
            // For now, we populate what we can. If strict splitting is needed for legacy data,
            // we'd need a parser or just accept it's "dirty" until updated.

            reset({
                nome: contato.nome,
                telefone: contato.telefone,
                tipo: contato.tipo as 'B2C' | 'B2B',
                status: contato.status as 'lead' | 'cliente' | 'inativo',
                origem: contato.origem as 'direto' | 'indicacao',
                subtipo: contato.subtipo,
                indicado_por_id: contato.indicado_por_id,
                endereco: contato.endereco,
                bairro: contato.bairro,
                observacoes: contato.observacoes,
                cep: contato.cep || '',
                // Populate logradouro with full address as fallback/legacy handling
                logradouro: contato.endereco || '',
                numero: '',
                complemento: '',
                cidade: '', // We don't have city/uf stored separately yet for legacy
                uf: '',
            })
        } else if (isOpen) {
            reset({
                nome: '',
                telefone: '',
                tipo: 'B2C',
                status: 'lead',
                origem: 'direto',
                subtipo: null,
                indicado_por_id: null,
                endereco: null,
                bairro: null,
                observacoes: null,
                cep: '',
                logradouro: '',
                numero: '',
                complemento: '',
                cidade: '',
                uf: '',
            })
            setSelectedIndicador(null)
            setIndicadorSearch('')
        }
    }, [isOpen, contato, reset])

    // Search for indicadores
    useEffect(() => {
        const searchIndicadores = async () => {
            if (indicadorSearch.length >= 2) {
                const results = await searchContatos(indicadorSearch)
                setIndicadorResults(
                    results.filter((c) => c.id !== contato?.id)
                )
                setShowIndicadorDropdown(true)
            } else {
                setIndicadorResults([])
                setShowIndicadorDropdown(false)
            }
        }

        const debounce = setTimeout(searchIndicadores, 300)
        return () => clearTimeout(debounce)
    }, [indicadorSearch, searchContatos, contato?.id])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowIndicadorDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectIndicador = (indicador: Contato) => {
        setSelectedIndicador(indicador)
        setValue('indicado_por_id', indicador.id)
        setIndicadorSearch('')
        setShowIndicadorDropdown(false)
    }

    const handleClearIndicador = () => {
        setSelectedIndicador(null)
        setValue('indicado_por_id', null)
        setIndicadorSearch('')
    }

    const onSubmit = async (data: ExtendedFormData) => {
        try {
            // Get raw values to ensure we have fields that might be stripped by Zod if schema is stale
            const rawValues = getValues()
            // Merge raw values over data for specific address fields to ensure we have them
            const formDataKeyed = { ...data, ...rawValues }

            // Construct the final address string
            // Logic: use manual inputs if provided, otherwise fallback to existing data
            let enderecoFinal = formDataKeyed.endereco

            // Only reconstruct if we have the specific fields
            if (formDataKeyed.logradouro) {
                enderecoFinal = `${formDataKeyed.logradouro}, ${formDataKeyed.numero || 'S/N'}${formDataKeyed.complemento ? ' - ' + formDataKeyed.complemento : ''}`
                if (formDataKeyed.cidade && formDataKeyed.uf) {
                    enderecoFinal += ` - ${formDataKeyed.cidade}/${formDataKeyed.uf}`
                }
            }

            const payload: ContatoFormData = {
                ...formDataKeyed, // Use the full set
                endereco: enderecoFinal,
                bairro: formDataKeyed.bairro, // Ensure bairro is passed explicitly
                cep: formDataKeyed.cep?.replace(/\D/g, '') || null // Clean CEP before saving
            }

            let result: Contato | null

            if (isEditing && contato) {
                result = await updateContato(contato.id, payload)
            } else {
                result = await createContato(payload)
            }

            if (result) {
                toast.success(isEditing ? 'Contato atualizado!' : 'Contato criado!')
                onSuccess?.(result)
                onClose()
            } else {
                toast.error('Erro ao salvar contato. Verifique se o telefone já está cadastrado.')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar contato'
            toast.error(message)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Contato' : 'Novo Contato'}
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nome e Telefone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nome *"
                        placeholder="Nome completo"
                        error={errors.nome?.message}
                        {...register('nome')}
                    />
                    <Input
                        label="Telefone *"
                        placeholder="(11) 99999-9999"
                        error={errors.telefone?.message}
                        {...register('telefone')}
                    />
                </div>

                {/* Tipo e Subtipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Tipo *"
                        options={Object.entries(CONTATO_TIPO_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        error={errors.tipo?.message}
                        {...register('tipo')}
                    />
                    {tipoValue === 'B2B' && (
                        <Select
                            label="Subtipo"
                            placeholder="Selecione..."
                            options={Object.entries(SUBTIPOS_B2B_LABELS).map(([value, label]) => ({
                                value,
                                label,
                            }))}
                            {...register('subtipo')}
                        />
                    )}
                </div>

                {/* Status e Origem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Status"
                        options={Object.entries(CONTATO_STATUS_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        {...register('status')}
                    />
                    <Select
                        label="Origem"
                        options={Object.entries(CONTATO_ORIGEM_LABELS).map(([value, label]) => ({
                            value,
                            label,
                        }))}
                        {...register('origem')}
                    />
                </div>

                {/* Indicado por (autocomplete) */}
                {origemValue === 'indicacao' && (
                    <div className="relative" ref={dropdownRef}>
                        <label className="label">Indicado por</label>
                        {selectedIndicador ? (
                            <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{selectedIndicador.nome}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatPhone(selectedIndicador.telefone)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearIndicador}
                                    className="p-1 hover:bg-primary-100 rounded"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={indicadorSearch}
                                        onChange={(e) => setIndicadorSearch(e.target.value)}
                                        placeholder="Buscar contato..."
                                        className="input pl-10"
                                    />
                                </div>
                                {showIndicadorDropdown && indicadorResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                                        {indicadorResults.map((c) => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleSelectIndicador(c)}
                                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{c.nome}</p>
                                                    <p className="text-sm text-gray-500">{formatPhone(c.telefone)}</p>
                                                </div>
                                                <Check className="h-4 w-4 text-primary-500 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Seção de Endereço Inteligente */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-gray-900">Endereço</h3>

                    {/* Linha 1: CEP */}
                    <div className="max-w-[150px] relative">
                        <Input
                            label="CEP"
                            placeholder="00000-000"
                            maxLength={9}
                            {...register('cep')}
                        />
                        {loadingCep && (
                            <div className="absolute right-3 top-[38px]">
                                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                            </div>
                        )}
                    </div>

                    {/* Linha 2: Logradouro e Número */}
                    <div className="grid grid-cols-[1fr_100px] gap-4">
                        <Input
                            label="Logradouro"
                            placeholder="Rua, Avenida, etc."
                            {...register('logradouro')}
                        />
                        <Input
                            label="Número"
                            placeholder="123"
                            {...register('numero')}
                        />
                    </div>

                    {/* Linha 3: Complemento e Bairro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Complemento"
                            placeholder="Apto 101, Casa A"
                            {...register('complemento')}
                        />
                        <Input
                            label="Bairro"
                            placeholder="Bairro"
                            {...register('bairro')}
                        />
                    </div>

                    {/* Linha 4: Cidade e UF */}
                    <div className="grid grid-cols-[1fr_80px] gap-4">
                        <Input
                            label="Cidade"
                            placeholder="Cidade"
                            readOnly
                            className="bg-gray-50"
                            {...register('cidade')}
                        />
                        <Input
                            label="UF"
                            placeholder="UF"
                            readOnly
                            className="bg-gray-50"
                            {...register('uf')}
                        />
                    </div>
                </div>

                {/* Observações */}
                <div>
                    <label className="label">Observações</label>
                    <textarea
                        className="input min-h-[80px] resize-none"
                        placeholder="Anotações sobre o contato..."
                        {...register('observacoes')}
                    />
                </div>

                <ModalActions>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {isEditing ? 'Salvar' : 'Criar Contato'}
                    </Button>
                </ModalActions>
            </form>
        </Modal>
    )
}

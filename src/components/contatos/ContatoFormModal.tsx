import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, X, Check, Loader2, User, Target, MapPin } from 'lucide-react'
import { Modal, ModalActions, Button, Input } from '../ui'
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
import type { DomainContato } from '../../types/domain'

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
    contato?: DomainContato | null
    onSuccess?: (contato: DomainContato) => void
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
    const [indicadorResults, setIndicadorResults] = useState<DomainContato[]>([])
    const [selectedIndicador, setSelectedIndicador] = useState<DomainContato | null>(null)
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
            apelido: '',
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
                apelido: contato.apelido || '',
                telefone: contato.telefone,
                tipo: contato.tipo as 'B2C' | 'B2B',
                status: contato.status as 'lead' | 'cliente' | 'inativo',
                origem: contato.origem as 'direto' | 'indicacao',
                subtipo: contato.subtipo,
                indicado_por_id: contato.indicadoPorId,
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
                apelido: '',
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

    const handleSelectIndicador = (indicador: DomainContato) => {
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

            let result: DomainContato | null

            if (isEditing && contato) {
                // Update expects Domain format (camelCase)
                const updatePayload: Partial<DomainContato> = {
                    ...payload,
                    // Map snake_case form fields to camelCase domain fields
                    indicadoPorId: payload.indicado_por_id
                }
                result = await updateContato(contato.id, updatePayload)
            } else {
                // Create expects DB format (snake_case) which mostly matches payload
                // but need to ensure types align with ContatoInsert
                result = await createContato(payload as any)
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
            size="4xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN - Identity & Classification */}
                    <div className="space-y-6">
                        {/* ID Card Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Identidade
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    label="NOME COMPLETO *"
                                    placeholder="Ex: João da Silva"
                                    error={errors.nome?.message}
                                    className="bg-muted/50 border-white/10 focus:border-primary/50 text-lg"
                                    {...register('nome')}
                                />
                                <Input
                                    label="APELIDO"
                                    placeholder="Ex: Do Zezinho"
                                    error={errors.apelido?.message}
                                    className="bg-muted/50 border-white/10"
                                    {...register('apelido')}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="TELEFONE *"
                                        placeholder="(11) 99999-9999"
                                        error={errors.telefone?.message}
                                        className="bg-muted/50 border-white/10"
                                        {...register('telefone')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Classification Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Target className="w-4 h-4" /> Classificação
                            </h3>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipo</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                                        {...register('tipo')}
                                    >
                                        {Object.entries(CONTATO_TIPO_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
                                </div>

                                {tipoValue === 'B2B' && (
                                    <div className="space-y-1 animate-in fade-in slide-in-from-left-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subtipo</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                                            {...register('subtipo')}
                                        >
                                            <option value="">Selecione...</option>
                                            {Object.entries(SUBTIPOS_B2B_LABELS).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                                        {...register('status')}
                                    >
                                        {Object.entries(CONTATO_STATUS_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Origem</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
                                        {...register('origem')}
                                    >
                                        {Object.entries(CONTATO_ORIGEM_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Indicado por (Conditional) */}
                        {origemValue === 'indicacao' && (
                            <div className="relative space-y-2 animate-in fade-in slide-in-from-top-2" ref={dropdownRef}>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Indicado Por</label>
                                {selectedIndicador ? (
                                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                        <div>
                                            <p className="font-medium text-foreground">{selectedIndicador.nome}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatPhone(selectedIndicador.telefone)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleClearIndicador}
                                            className="p-1 hover:bg-primary/20 rounded text-primary hover:text-primary-foreground transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={indicadorSearch}
                                                onChange={(e) => setIndicadorSearch(e.target.value)}
                                                placeholder="Buscar quem indicou..."
                                                className="flex h-10 w-full rounded-md border border-white/10 bg-background/50 pl-10 pr-3 py-2 text-sm focus:border-primary/50 focus:outline-none text-foreground placeholder:text-muted-foreground"
                                            />
                                        </div>
                                        {showIndicadorDropdown && indicadorResults.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-48 overflow-auto text-popover-foreground">
                                                {indicadorResults.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleSelectIndicador(c)}
                                                        className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground flex items-center justify-between transition-colors"
                                                    >
                                                        <div>
                                                            <p className="font-medium">{c.nome}</p>
                                                            <p className="text-xs opacity-70">{formatPhone(c.telefone)}</p>
                                                        </div>
                                                        <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Address & Notes */}
                    <div className="space-y-6">


                        {/* Address Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Endereço
                            </h3>

                            <div className="bg-muted/30 border border-white/5 rounded-xl p-4 space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-[140px] relative">
                                        <Input
                                            label="CEP"
                                            placeholder="00000-000"
                                            maxLength={9}
                                            className="bg-background/50 border-white/10 font-mono"
                                            {...register('cep')}
                                        />
                                        {loadingCep && (
                                            <div className="absolute right-3 top-[38px]">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            label="LOGRADOURO"
                                            placeholder="Rua, Av..."
                                            className="bg-background/50 border-white/10"
                                            {...register('logradouro')}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-[100px_1fr] gap-4">
                                    <Input
                                        label="NÚMERO"
                                        placeholder="123"
                                        className="bg-background/50 border-white/10"
                                        {...register('numero')}
                                    />
                                    <Input
                                        label="COMPLEMENTO"
                                        placeholder="Apto, Bloco..."
                                        className="bg-background/50 border-white/10"
                                        {...register('complemento')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="BAIRRO"
                                        placeholder="Bairro"
                                        className="bg-background/50 border-white/10"
                                        {...register('bairro')}
                                    />
                                    <div className="grid grid-cols-[1fr_60px] gap-2">
                                        <Input
                                            label="CIDADE"
                                            readOnly
                                            className="bg-muted text-muted-foreground border-none opacity-70"
                                            {...register('cidade')}
                                        />
                                        <Input
                                            label="UF"
                                            readOnly
                                            className="bg-muted text-muted-foreground border-none opacity-70 text-center px-0"
                                            {...register('uf')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                Observações
                            </label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                placeholder="Anotações internas sobre o cliente..."
                                {...register('observacoes')}
                            />
                        </div>
                    </div>
                </div>

                <ModalActions>
                    <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/5">
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">
                        {isEditing ? 'Salvar Alterações' : 'Criar Contato'}
                    </Button>
                </ModalActions>
            </form>
        </Modal>
    )
}


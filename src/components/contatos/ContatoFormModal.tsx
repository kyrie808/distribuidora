import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, X, Check } from 'lucide-react'
import { Modal, ModalActions, Button, Input, Select } from '../ui'
import { contatoSchema, type ContatoFormData } from '../../schemas/contato'
import { useContatos } from '../../hooks/useContatos'
import { useToast } from '../ui/Toast'
import { formatPhone } from '../../utils/formatters'
import {
    CONTATO_TIPO_LABELS,
    CONTATO_ORIGEM_LABELS,
    SUBTIPOS_B2B_LABELS,
    CONTATO_STATUS_LABELS,
} from '../../constants'
import type { Contato } from '../../types/database'

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
        formState: { errors, isSubmitting },
    } = useForm<ContatoFormData>({
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
        },
    })

    const tipoValue = watch('tipo')
    const origemValue = watch('origem')

    // Reset form when modal opens/closes or contato changes
    useEffect(() => {
        if (isOpen && contato) {
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
                // Filter out the current contato if editing
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

    const onSubmit = async (data: ContatoFormData) => {
        try {
            let result: Contato | null

            if (isEditing && contato) {
                result = await updateContato(contato.id, data)
            } else {
                result = await createContato(data)
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

                {/* Endereço e Bairro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Endereço"
                        placeholder="Rua, número..."
                        {...register('endereco')}
                    />
                    <Input
                        label="Bairro"
                        placeholder="Bairro"
                        {...register('bairro')}
                    />
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

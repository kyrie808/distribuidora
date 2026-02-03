import { useEffect, useState } from 'react'
import { X, Calendar as CalendarIcon, DollarSign, CreditCard, FileText } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { pagamentoSchema } from '../../../schemas/venda'
import type { PagamentoFormData } from '../../../schemas/venda'
import type { DomainPagamento } from '../../../types/domain'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: PagamentoFormData) => Promise<boolean>
    vendaId: string
    total: number
    valorPago: number
    historico: DomainPagamento[]
    customerName: string
}

const PAYMENT_METHODS = [
    { value: 'pix', label: 'Pix', icon: FileText }, // Changed QrCode to FileText based on new imports
    { value: 'dinheiro', label: 'Dinheiro', icon: DollarSign },
    { value: 'cartao', label: 'Cartão', icon: CreditCard },
    { value: 'fiado', label: 'Fiado', icon: CalendarIcon }, // Changed Calendar to CalendarIcon
]

export function PaymentModal({
    isOpen,
    onClose,
    onConfirm,
    vendaId,
    total,
    valorPago,
    historico,
    customerName
}: PaymentModalProps) {
    const restante = Math.max(0, total - valorPago)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<PagamentoFormData>({
        resolver: zodResolver(pagamentoSchema) as any,
        defaultValues: {
            venda_id: vendaId,
            valor: 0, // Will be set in useEffect
            data: new Date().toISOString(),
            metodo: 'pix' as const,
            observacao: ''
        }
    })

    // Reset form when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            reset({
                venda_id: vendaId,
                valor: restante,
                data: new Date().toISOString(),
                metodo: 'pix',
                observacao: ''
            })
        }
    }, [isOpen, vendaId, restante, reset])

    if (!isOpen) return null

    const handleConfirm: SubmitHandler<PagamentoFormData> = async (data) => {
        try {
            setIsSubmitting(true)
            await onConfirm(data)
            onClose()
        } catch (error) {
            console.error('Error submitting payment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentMethod = watch('metodo')

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 fade-in">
            <div className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Registrar Pagamento</h2>
                        <p className="text-sm text-zinc-500">{customerName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-4 overflow-y-auto flex-1 space-y-6">

                    {/* Summary Card */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs text-zinc-500 block mb-1">Total da Venda</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/50">
                            <span className="text-xs text-orange-600 dark:text-orange-400 block mb-1">Restante</span>
                            <span className="font-bold text-orange-700 dark:text-orange-500">
                                {restante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>

                    <form id="payment-form" onSubmit={handleSubmit(handleConfirm)} className="space-y-4">

                        {/* Valor Input */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Valor do Pagamento
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('valor', { valueAsNumber: true })}
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-lg font-semibold"
                                    placeholder="0,00"
                                />
                            </div>
                            {errors.valor && <p className="text-red-500 text-xs mt-1">{errors.valor.message}</p>}
                        </div>

                        {/* Metodo Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon
                                const isSelected = currentMethod === method.value
                                return (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setValue('metodo', method.value as any)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isSelected
                                            ? 'bg-violet-50 border-violet-500 text-violet-700 dark:bg-violet-900/20 dark:border-violet-500/50 dark:text-violet-400'
                                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 mb-1" />
                                        <span className="text-[10px] font-medium">{method.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Data & Observacao */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Data</label>
                                <input
                                    type="datetime-local"
                                    {...register('data')}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Observação (Opcional)</label>
                                <textarea
                                    {...register('observacao')}
                                    rows={2}
                                    placeholder="Ex: Enviado para conta Nubank..."
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm resize-none"
                                />
                            </div>
                        </div>
                    </form>

                    {/* History Section */}
                    {historico.length > 0 && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Histórico de Pagamentos</h3>
                            <div className="space-y-2">
                                {historico.map((pag) => (
                                    <div key={pag.id} className="flex items-start justify-between p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-900 dark:text-zinc-200">
                                                    {pag.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <span className="px-1.5 py-0.5 text-[10px] bg-zinc-200 dark:bg-zinc-700 rounded-md text-zinc-600 dark:text-zinc-300 capitalize">
                                                    {pag.metodo}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                {format(new Date(pag.data), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                            {pag.observacao && (
                                                <p className="text-xs text-zinc-500 mt-1 italic">"{pag.observacao}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 shrink-0 bg-white dark:bg-zinc-900 sm:rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                        Cancelar
                    </button>
                    <button
                        form="payment-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Salvando...' : 'Confirmar Pagamento'}
                    </button>
                </div>
            </div>
        </div>
    )
}

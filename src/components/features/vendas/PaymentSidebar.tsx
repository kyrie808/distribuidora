import { useState, useEffect } from 'react'
import { ChevronRight, Calendar as CalendarIcon, DollarSign, CreditCard, FileText } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { pagamentoSchema, type PagamentoFormData } from '../../../schemas/venda'
import type { DomainPagamento } from '../../../types/domain'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import { cn } from '../../../utils/cn'
import { cashFlowService } from '../../../services/cashFlowService'
import type { Conta } from '../../../types/database'

interface PaymentSidebarProps {
    onBack: () => void
    onConfirm: (data: PagamentoFormData) => Promise<boolean>
    vendaId: string
    total: number
    valorPago: number
    historico: DomainPagamento[]
    customerName: string
}

const PAYMENT_METHODS = [
    { value: 'pix', label: 'Pix', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: 'dinheiro', label: 'Dinheiro', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { value: 'cartao', label: 'Cartão', icon: CreditCard, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { value: 'fiado', label: 'Fiado', icon: CalendarIcon, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
]

export function PaymentSidebar({
    onBack,
    onConfirm,
    vendaId,
    total,
    valorPago,
    historico,
    customerName
}: PaymentSidebarProps) {
    const restante = Math.max(0, total - valorPago)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [contas, setContas] = useState<Conta[]>([])

    // Format datetime for datetime-local input
    const formatDateTimeLocal = (isoString: string) => {
        const date = new Date(isoString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isValid }
    } = useForm<PagamentoFormData>({
        mode: 'onChange',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(pagamentoSchema) as any,
        defaultValues: {
            venda_id: vendaId,
            valor: restante,
            data: new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T').slice(0, 16),
            metodo: 'pix' as const,
            conta_id: '',
            observacao: ''
        }
    })

    const currentData = watch('data')
    const currentMethod = watch('metodo')

    // Reset form when sidebar opens or props change
    useEffect(() => {
        const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T').slice(0, 16)
        reset({
            venda_id: vendaId,
            valor: restante,
            data: now,
            metodo: 'pix',
            conta_id: contas[0]?.id || '',
            observacao: ''
        })
    }, [vendaId, restante, reset, contas])

    useEffect(() => {
        const fetchContas = async () => {
            try {
                const data = await cashFlowService.getContas()
                setContas(data)
                if (data.length > 0) {
                    setValue('conta_id', data[0].id)
                }
            } catch (error) {
                console.error('Erro ao buscar contas:', error)
            }
        }
        fetchContas()
    }, [setValue])

    const handleConfirm: SubmitHandler<PagamentoFormData> = async (data) => {
        try {
            setIsSubmitting(true)
            const success = await onConfirm(data)
            if (success) {
                onBack()
            }
        } catch (error) {
            console.error('Error submitting payment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                <button
                    onClick={onBack}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <ChevronRight className="h-5 w-5 text-gray-500 rotate-180" />
                </button>
                <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Registrar Pagamento</h2>
                    <p className="text-xs text-gray-500">{customerName}</p>
                </div>
            </div>

            {/* Body (Scrollable) */}
            <form onSubmit={handleSubmit(handleConfirm)} className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Summary Card */}
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Total</span>
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Pago</span>
                            <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">
                                {valorPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className={cn(
                            "p-3 rounded-lg border",
                            restante > 0
                                ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50"
                                : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50"
                        )}>
                            <span className={cn(
                                "text-[10px] font-bold uppercase block mb-1",
                                restante > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                            )}>Saldo</span>
                            <span className={cn(
                                "font-black text-sm",
                                restante > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                            )}>
                                {restante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>
                    {valorPago > 0 && restante > 0 && (
                        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                Pagamento parcial recebido. Faltam {restante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    )}
                </div>

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
                <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon
                            const isSelected = currentMethod === method.value
                            return (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => setValue('metodo', method.value as PagamentoFormData['metodo'])}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                                        isSelected
                                            ? cn("border-primary-500 ring-1 ring-primary-500/20", method.bg, method.color)
                                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{method.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Data & Observacao */}
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider ml-1 mb-1 block">
                            Conta de Destino
                        </label>
                        <Select
                            {...register('conta_id')}
                            options={contas.map(ct => ({ value: ct.id, label: ct.nome }))}
                            error={errors.conta_id?.message}
                            placeholder="Selecione a conta..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Data</label>
                        <input
                            type="datetime-local"
                            value={formatDateTimeLocal(currentData || new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T'))}
                            onChange={(e) => {
                                // Store as local ISO-like string to avoid UTC jumps
                                const val = e.target.value; // YYYY-MM-DDTHH:MM
                                setValue('data', val)
                            }}
                            className={cn(
                                "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border rounded-lg text-sm outline-none transition-all",
                                errors.data ? "border-red-500 focus:ring-red-500/20" : "border-zinc-200 dark:border-zinc-700 focus:ring-violet-500"
                            )}
                        />
                        {errors.data && (
                            <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium italic">
                                {errors.data.message}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Observação (Opcional)</label>
                        <textarea
                            {...register('observacao')}
                            rows={2}
                            placeholder="Ex: Enviado para conta Nubank..."
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

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
            </form>

            {/* Footer - Fixed at bottom with gradient */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-10 md:pb-6">
                <Button
                    onClick={handleSubmit(handleConfirm)}
                    disabled={isSubmitting || !isValid}
                    className={cn(
                        "w-full py-6 text-lg font-black uppercase tracking-tight shadow-xl transition-all",
                        (!isValid || isSubmitting)
                            ? "bg-zinc-200 text-zinc-400 shadow-none cursor-not-allowed"
                            : "shadow-primary-500/20"
                    )}
                >
                    {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
            </div>
        </div>
    )
}

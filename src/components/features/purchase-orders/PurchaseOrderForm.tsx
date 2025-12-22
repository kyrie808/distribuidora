import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
// import { Select } from '../../ui/Select'
import { useProdutos } from '../../../hooks/useProdutos'
import type { PurchaseOrder, PurchaseOrderWithItems } from '../../../types/database'
import { formatCurrency } from '../../../utils/formatters'

interface PurchaseOrderFormProps {
    isOpen: boolean
    onClose: () => void
    onSave: (order: Partial<PurchaseOrder>, items: any[]) => Promise<void>
    initialData?: PurchaseOrderWithItems | null
}

export function PurchaseOrderForm({ isOpen, onClose, onSave, initialData }: PurchaseOrderFormProps) {
    const { produtos } = useProdutos()
    const [loading, setLoading] = useState(false)

    // Header State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')
    const [supplier, setSupplier] = useState('Fabricante') // Default for now
    const [amountPaid, setAmountPaid] = useState<number>(0)

    // Items State
    const [items, setItems] = useState<Array<{
        tempId: string
        product_id: string
        quantity: number
        unit_cost: number
    }>>([])

    // Initialize form on open
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setDate(initialData.order_date.split('T')[0])
                setNotes(initialData.notes || '')
                setSupplier(initialData.supplier_id || 'Fabricante')
                setAmountPaid(initialData.amount_paid || 0)
                setItems(initialData.items.map(item => ({
                    tempId: Math.random().toString(36),
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost
                })))
            } else {
                // Reset for new order
                setDate(new Date().toISOString().split('T')[0])
                setNotes('')
                setSupplier('Fabricante')
                setAmountPaid(0)
                setItems([])
            }
        }
    }, [isOpen, initialData])

    const handleAddItem = () => {
        setItems([...items, {
            tempId: Math.random().toString(36),
            product_id: '',
            quantity: 1,
            unit_cost: 0
        }])
    }

    const handleRemoveItem = (tempId: string) => {
        setItems(items.filter(i => i.tempId !== tempId))
    }

    const handleItemChange = (tempId: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.tempId === tempId) {
                const updated = { ...item, [field]: value }

                // Auto-fill cost when product changes
                if (field === 'product_id') {
                    const product = produtos.find(p => p.id === value)
                    if (product) {
                        updated.unit_cost = product.custo
                    }
                }
                return updated
            }
            return item
        }))
    }

    const totalAmount = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0)
    }, [items])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (items.length === 0) {
            alert('Adicione pelo menos um item ao pedido.')
            return
        }
        if (items.some(i => !i.product_id || i.quantity <= 0)) {
            alert('Preencha todos os campos dos itens corretamente.')
            return
        }

        setLoading(true)
        try {
            // Determine payment status
            let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid'
            if (amountPaid >= totalAmount && totalAmount > 0) paymentStatus = 'paid'
            else if (amountPaid > 0) paymentStatus = 'partial'

            await onSave({
                order_date: date,
                notes: notes,
                supplier_id: supplier,
                total_amount: totalAmount,
                status: initialData ? initialData.status : 'pending',
                payment_status: paymentStatus,
                amount_paid: amountPaid
            }, items)
            onClose()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar pedido.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        label="Data do Pedido"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                    <Input
                        label="Fornecedor"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        placeholder="Nome do Fornecedor"
                    />
                    <div className="md:col-span-2">
                        <Input
                            label="Observações"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>
                </div>

                {/* Items Repeater */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                        <h3 className="text-lg font-medium text-gray-900">Itens do Pedido</h3>
                        <Button type="button" variant="secondary" size="sm" onClick={handleAddItem}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Item
                        </Button>
                    </div>

                    {items.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
                            <div className="bg-gray-100 p-3 rounded-full mb-2">
                                <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p>Seu pedido está vazio</p>
                            <p className="text-sm text-gray-500">Adicione itens acima para começar</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.tempId} className="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="col-span-12 sm:col-span-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                                    <select
                                        className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all placeholder-zinc-500 appearance-none cursor-pointer hover:bg-gray-50 h-10"
                                        value={item.product_id}
                                        onChange={(e) => handleItemChange(item.tempId, 'product_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {produtos.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nome} ({p.unidade})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <Input
                                        label="Qtd"
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.tempId, 'quantity', Number(e.target.value))}
                                        className="h-10"
                                    />
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <Input
                                        label="Custo Unit."
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.unit_cost}
                                        onChange={(e) => handleItemChange(item.tempId, 'unit_cost', Number(e.target.value))}
                                        className="h-10"
                                    />
                                </div>
                                <div className="col-span-3 sm:col-span-2 flex flex-col justify-end h-full pb-1">
                                    <div className="text-xs text-gray-500 mb-1">Total</div>
                                    <div className="text-emerald-600 font-bold text-sm h-9 flex items-center">
                                        {formatCurrency(item.quantity * item.unit_cost)}
                                    </div>
                                </div>
                                <div className="col-span-1 sm:col-span-1 flex items-end justify-center pb-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveItem(item.tempId)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer / Totals */}
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-end border-t border-gray-200 pt-6 gap-4">
                    <div className="w-full sm:w-auto flex-1 max-w-[250px]">
                        <div className="relative">
                            <Input
                                label="Valor Pago"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(Number(e.target.value))}
                                className="pr-12"
                            />
                            {totalAmount > 0 && (
                                <div className="absolute right-0 top-0 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-bl-lg">
                                    {((amountPaid / totalAmount) * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                        <div className="flex flex-col items-end">
                            <span className="text-sm text-gray-500">Total do Pedido</span>
                            <span className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading} className="px-6">
                                {loading ? (
                                    'Salvando...'
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Pedido
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

import { useState, useMemo } from 'react'
import { Search, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '../../../../utils/formatters'
import type { DomainProduto } from '../../../../types/domain'

interface ProductListProps {
    produtos: DomainProduto[]
    loading: boolean
    getQuantity: (produtoId: string) => number
    onAdd: (produto: DomainProduto) => void
    onUpdateQuantity: (produtoId: string, delta: number) => void
}

export function ProductList({ produtos, loading, getQuantity, onAdd, onUpdateQuantity }: ProductListProps) {
    const [search, setSearch] = useState('')

    const filteredProdutos = useMemo(() => {
        if (!search) return produtos
        const lower = search.toLowerCase()
        return produtos.filter(p =>
            p.nome.toLowerCase().includes(lower) ||
            p.codigo?.toLowerCase().includes(lower)
        )
    }, [produtos, search])

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando produtos...</div>
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-24">
                {filteredProdutos.map((produto) => {
                    const qty = getQuantity(produto.id)
                    return (
                        <div
                            key={produto.id}
                            className={`bg-white dark:bg-gray-800 p-4 rounded-xl border-2 transition-all shadow-sm flex flex-col justify-between h-full ${qty > 0
                                    ? 'border-primary-500 ring-1 ring-primary-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                }`}
                        >
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 text-sm h-10">
                                    {produto.nome}
                                </p>
                                <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-3">
                                    {formatCurrency(Number(produto.preco))}
                                </p>
                            </div>

                            {qty > 0 ? (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => onUpdateQuantity(produto.id, -1)}
                                        className="w-8 h-8 bg-white dark:bg-gray-600 rounded shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-transform"
                                    >
                                        <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{qty}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(produto.id, 1)}
                                        className="w-8 h-8 bg-primary-500 text-white rounded shadow-sm flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-transform"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onAdd(produto)}
                                    className="w-full py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors text-sm"
                                >
                                    Adicionar
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

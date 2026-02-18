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

    const PRODUCT_ORDER = [
        'Massa Pão de Queijo 4kg',
        'Massa Pão de Queijo 1kg',
        'Chipa Congelada 2kg',
        'Chipa Congelada 1kg',
        'Palito de Queijo Congelado 2kg',
        'Palito de Queijo Congelado 1kg',
        'Pão de Queijo Congelado 2kg',
        'Pão de Queijo Congelado 1kg'
    ]

    const filteredProdutos = useMemo(() => {
        let result = [...produtos]

        if (search) {
            const lower = search.toLowerCase()
            result = result.filter(p =>
                p.nome.toLowerCase().includes(lower) ||
                p.codigo?.toLowerCase().includes(lower)
            )
        }

        return result.sort((a, b) => {
            const indexA = PRODUCT_ORDER.findIndex(name =>
                a.nome.toLowerCase() === name.toLowerCase()
            )
            const indexB = PRODUCT_ORDER.findIndex(name =>
                b.nome.toLowerCase() === name.toLowerCase()
            )

            // If both are in the list, sort by index
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB
            }

            // If only A is in the list, it comes first
            if (indexA !== -1) return -1

            // If only B is in the list, it comes first
            if (indexB !== -1) return 1

            // If neither is in the list, keep original order (or sort alphabetically/by other criteria if desired)
            return 0
        })
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

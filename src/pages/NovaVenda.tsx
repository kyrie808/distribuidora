import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { useProdutos } from '../hooks/useProdutos'
import { useCartStore } from '../stores/useCartStore'
import { useToast } from '../components/ui/Toast'
import { useVendas } from '../hooks/useVendas'
import { useContatos } from '../hooks/useContatos'
import type { DomainProduto } from '../types/domain'

import { ClientSelector } from '../components/features/vendas/NovaVenda/ClientSelector'
import { ProductList } from '../components/features/vendas/NovaVenda/ProductList'
import { CartSidebar } from '../components/features/vendas/NovaVenda/CartSidebar'
import { CheckoutSidebar } from '../components/features/vendas/NovaVenda/CheckoutSidebar'
import type { VendaFormData } from '../schemas/venda'

export function NovaVenda() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const stateContatoId = location.state?.contatoId
    const isEditing = Boolean(id)
    const toast = useToast()

    const { produtos, loading: loadingProdutos } = useProdutos()
    const { getVendaById, createVenda } = useVendas({ realtime: false })
    const { getContatoById } = useContatos({ realtime: false })

    // Store
    const {
        items: cart,
        cliente: selectedContato,
        addItem,
        removeItem,
        updateQuantity,
        setCliente: setSelectedContato,
        setItems,
        clearCart
    } = useCartStore()

    // Local UI State
    const [isCartOpen, setIsCartOpen] = useState(false) // For mobile drawer
    const [sidebarView, setSidebarView] = useState<'cart' | 'checkout'>('cart')

    // Load existing sale data
    useEffect(() => {
        if (id) {
            const loadVenda = async () => {
                const venda = await getVendaById(id)
                if (venda) {
                    if (venda.contato) setSelectedContato(venda.contato)

                    const items = venda.itens.map(item => ({
                        produto_id: item.produtoId,
                        quantidade: item.quantidade,
                        preco_unitario: item.precoUnitario,
                        subtotal: item.subtotal,
                        produto: item.produto || {
                            id: item.produtoId,
                            nome: 'Produto Desconhecido',
                            codigo: 'N/A',
                            preco: item.precoUnitario,
                            ativo: true,
                            custo: 0,
                            estoqueAtual: 0,
                            estoqueMinimo: 0,
                            criadoEm: new Date().toISOString(),
                            atualizadoEm: new Date().toISOString(),
                            unidade: 'un'
                        } as DomainProduto
                    }))
                    setItems(items)
                }
            }
            loadVenda()
        }
    }, [id])

    // Load pre-selected client from navigation state
    useEffect(() => {
        if (stateContatoId && !id) {
            const loadContato = async () => {
                // If already selected, skip
                if (selectedContato?.id === stateContatoId) return

                const contato = await getContatoById(stateContatoId)
                if (contato) {
                    setSelectedContato(contato)
                }
            }
            loadContato()
        }
    }, [stateContatoId, id, getContatoById, selectedContato, setSelectedContato])

    // Calculations
    const cartTotal = useMemo(
        () => cart.reduce((acc, item) => acc + item.subtotal, 0),
        [cart]
    )

    const cartItemsCount = useMemo(
        () => cart.reduce((acc, item) => acc + item.quantidade, 0),
        [cart]
    )

    // Handlers
    const getCartQuantity = (produtoId: string) => {
        const item = cart.find((i) => i.produto_id === produtoId)
        return item?.quantidade || 0
    }

    const handleAddToCart = (produto: DomainProduto) => {
        addItem({
            produto_id: produto.id,
            produto,
            quantidade: 1,
            preco_unitario: Number(produto.preco),
            subtotal: Number(produto.preco),
        })
        toast.success('Adicionado ao carrinho')
    }

    const handleUpdateQuantity = (produtoId: string, delta: number) => {
        const item = cart.find((i) => i.produto_id === produtoId)
        if (!item) return

        const newQty = item.quantidade + delta
        if (newQty <= 0) {
            removeItem(produtoId)
            toast.success('Item removido')
        } else {
            updateQuantity(produtoId, newQty)
        }
    }

    const handleCheckout = () => {
        if (!selectedContato) {
            toast.error('Selecione um cliente primeiro')
            return
        }
        if (cart.length === 0) {
            toast.error('O carrinho está vazio')
            return
        }
        setSidebarView('checkout')
        if (!isCartOpen) setIsCartOpen(true) // Ensure it opens on mobile
    }

    const handleConfirmSale = async (data: VendaFormData) => {
        try {
            const venda = await createVenda(data)
            if (venda) {
                toast.success('Venda realizada com sucesso!')
                clearCart()
                setSidebarView('cart')
                setIsCartOpen(false)
                navigate(`/vendas/${venda.id}`)
            } else {
                toast.error('Erro ao realizar venda. Tente novamente.')
            }
        } catch (error) {
            console.error('Erro no checkout:', error)
            toast.error('Ocorreu um erro ao processar a venda')
        }
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex justify-center">
            <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark">
                <Header
                    title={isEditing ? `Editar Venda #${id?.slice(0, 8)}` : 'Nova Venda'}
                    showBack
                    className="flex-shrink-0"
                    rightAction={
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2"
                            >
                                <ShoppingCart className="h-6 w-6 text-gray-700 dark:text-gray-100" />
                                {cartItemsCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    }
                />

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content Area (Products) */}
                    <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900/50">
                        <div className="p-4 flex-shrink-0">
                            <ClientSelector
                                selectedContato={selectedContato}
                                onSelect={setSelectedContato}
                            />
                        </div>

                        <div className="flex-1 overflow-hidden px-4">
                            <ProductList
                                produtos={produtos}
                                loading={loadingProdutos}
                                getQuantity={getCartQuantity}
                                onAdd={handleAddToCart}
                                onUpdateQuantity={handleUpdateQuantity}
                            />
                        </div>
                    </main>

                    {/* Desktop Sidebar (Cart/Checkout) */}
                    <aside className="hidden md:flex w-96 flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full overflow-hidden">
                        {sidebarView === 'cart' ? (
                            <CartSidebar
                                items={cart}
                                total={cartTotal}
                                onUpdateQuantity={handleUpdateQuantity}
                                onCheckout={handleCheckout}
                                onClear={clearCart}
                            />
                        ) : (
                            <CheckoutSidebar
                                onBack={() => setSidebarView('cart')}
                                onConfirm={handleConfirmSale}
                                total={cartTotal}
                                contatoId={selectedContato?.id || ''}
                                contatoNome={selectedContato?.nome || ''}
                                items={cart.map(item => ({
                                    produto_id: item.produto_id,
                                    quantidade: item.quantidade,
                                    preco_unitario: item.preco_unitario,
                                    subtotal: item.subtotal
                                }))}
                            />
                        )}
                    </aside>
                </div>

                {/* Mobile Cart/Checkout Drawer */}
                {isCartOpen && (
                    <div className="fixed inset-0 z-[60] md:hidden flex justify-end">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => {
                                setIsCartOpen(false)
                                setSidebarView('cart')
                            }}
                        />

                        {/* Drawer Content */}
                        <div className="relative w-[85vw] max-w-sm bg-white dark:bg-gray-800 h-[100dvh] shadow-2xl transform transition-transform animate-slide-in-right overflow-hidden">
                            {sidebarView === 'cart' ? (
                                <CartSidebar
                                    items={cart}
                                    total={cartTotal}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onCheckout={handleCheckout}
                                    onClear={clearCart}
                                    onClose={() => setIsCartOpen(false)}
                                />
                            ) : (
                                <CheckoutSidebar
                                    onBack={() => setSidebarView('cart')}
                                    onConfirm={handleConfirmSale}
                                    total={cartTotal}
                                    contatoId={selectedContato?.id || ''}
                                    contatoNome={selectedContato?.nome || ''}
                                    items={cart.map(item => ({
                                        produto_id: item.produto_id,
                                        quantidade: item.quantidade,
                                        preco_unitario: item.preco_unitario,
                                        subtotal: item.subtotal
                                    }))}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

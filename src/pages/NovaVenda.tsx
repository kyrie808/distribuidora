import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    ArrowLeft,
    Search,
    Plus,
    Minus,
    ShoppingCart,
    Check,
    User,
    X,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Button, Card, Badge, LoadingScreen, Modal, ModalActions, Input } from '../components/ui'
import { useContatos } from '../hooks/useContatos'
import { useProdutos } from '../hooks/useProdutos'
import { useVendas } from '../hooks/useVendas'
import { useToast } from '../components/ui/Toast'
import { vendaSchema, type VendaFormData, type ItemVendaFormData } from '../schemas/venda'
import { formatCurrency, formatPhone } from '../utils/formatters'
import { FORMA_PAGAMENTO_LABELS } from '../constants'
import type { Contato, Produto } from '../types/database'

// Cart item with product details
interface CartItem extends ItemVendaFormData {
    produto: Produto
}

export function NovaVenda() {
    const navigate = useNavigate()
    const location = useLocation()
    const toast = useToast()

    const { contatos, searchContatos, createContato } = useContatos({ realtime: false })
    const { produtos, loading: loadingProdutos } = useProdutos()
    const { createVenda } = useVendas({ realtime: false })

    // State
    const [step, setStep] = useState<'cliente' | 'produtos' | 'pagamento'>('cliente')
    const [selectedContato, setSelectedContato] = useState<Contato | null>(null)
    const [contatoSearch, setContatoSearch] = useState('')
    const [contatoResults, setContatoResults] = useState<Contato[]>([])
    const [showContatoDropdown, setShowContatoDropdown] = useState(false)
    const [cart, setCart] = useState<CartItem[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Quick add contact modal
    const [showQuickAddModal, setShowQuickAddModal] = useState(false)
    const [quickAddName, setQuickAddName] = useState('')
    const [quickAddPhone, setQuickAddPhone] = useState('')
    const [isCreatingContato, setIsCreatingContato] = useState(false)

    // Check if came from contact detail page
    useEffect(() => {
        const contatoId = location.state?.contatoId
        if (contatoId) {
            const found = contatos.find((c) => c.id === contatoId)
            if (found) {
                setSelectedContato(found)
                setStep('produtos')
            }
        }
    }, [location.state?.contatoId, contatos])

    // Search for contacts
    useEffect(() => {
        const search = async () => {
            if (contatoSearch.length >= 2) {
                const results = await searchContatos(contatoSearch)
                setContatoResults(results)
                setShowContatoDropdown(true)
            } else {
                setContatoResults([])
                setShowContatoDropdown(false)
            }
        }

        const debounce = setTimeout(search, 200)
        return () => clearTimeout(debounce)
    }, [contatoSearch, searchContatos])

    // Cart calculations
    const cartTotal = useMemo(
        () => cart.reduce((acc, item) => acc + item.subtotal, 0),
        [cart]
    )

    const cartItemsCount = useMemo(
        () => cart.reduce((acc, item) => acc + item.quantidade, 0),
        [cart]
    )

    // Select contact
    const handleSelectContato = (contato: Contato) => {
        setSelectedContato(contato)
        setContatoSearch('')
        setShowContatoDropdown(false)
        setStep('produtos')
    }

    // Quick add contact
    const handleQuickAddContato = async () => {
        if (!quickAddName || !quickAddPhone) {
            toast.error('Preencha nome e telefone')
            return
        }

        setIsCreatingContato(true)
        const newContato = await createContato({
            nome: quickAddName,
            telefone: quickAddPhone.replace(/\D/g, ''),
            tipo: 'B2C',
            status: 'lead',
            origem: 'direto',
        })
        setIsCreatingContato(false)

        if (newContato) {
            setSelectedContato(newContato)
            setShowQuickAddModal(false)
            setQuickAddName('')
            setQuickAddPhone('')
            setStep('produtos')
            toast.success('Cliente cadastrado!')
        }
    }

    // Add product to cart
    const handleAddToCart = (produto: Produto) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.produto_id === produto.id)
            if (existing) {
                return prev.map((item) =>
                    item.produto_id === produto.id
                        ? {
                            ...item,
                            quantidade: item.quantidade + 1,
                            subtotal: (item.quantidade + 1) * item.preco_unitario,
                        }
                        : item
                )
            }
            return [
                ...prev,
                {
                    produto_id: produto.id,
                    produto,
                    quantidade: 1,
                    preco_unitario: Number(produto.preco),
                    subtotal: Number(produto.preco),
                },
            ]
        })
    }

    // Update quantity
    const handleUpdateQuantity = (produtoId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.produto_id !== produtoId) return item
                    const newQty = item.quantidade + delta
                    if (newQty <= 0) return null
                    return {
                        ...item,
                        quantidade: newQty,
                        subtotal: newQty * item.preco_unitario,
                    }
                })
                .filter(Boolean) as CartItem[]
        )
    }

    // Remove from cart
    const handleRemoveFromCart = (produtoId: string) => {
        setCart((prev) => prev.filter((item) => item.produto_id !== produtoId))
    }

    // Submit sale
    const handleSubmitVenda = async (formaPagamento: string) => {
        if (!selectedContato || cart.length === 0) return

        setIsSubmitting(true)

        const vendaData: VendaFormData = {
            contato_id: selectedContato.id,
            data: new Date().toISOString().split('T')[0],
            forma_pagamento: formaPagamento as 'pix' | 'dinheiro' | 'cartao' | 'fiado',
            itens: cart.map((item) => ({
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal,
            })),
        }

        const result = await createVenda(vendaData)
        setIsSubmitting(false)

        if (result) {
            toast.success('Venda registrada!')
            navigate(`/vendas/${result.id}`)
        } else {
            toast.error('Erro ao registrar venda')
        }
    }

    // Get quantity in cart
    const getCartQuantity = (produtoId: string) => {
        const item = cart.find((i) => i.produto_id === produtoId)
        return item?.quantidade || 0
    }

    return (
        <>
            <Header
                title={
                    step === 'cliente'
                        ? 'Selecionar Cliente'
                        : step === 'produtos'
                            ? 'Adicionar Produtos'
                            : 'Pagamento'
                }
                showBack
            />
            <PageContainer>
                {/* Step 1: Select Client */}
                {step === 'cliente' && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente por nome ou telefone..."
                                value={contatoSearch}
                                onChange={(e) => setContatoSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-lg"
                                autoFocus
                            />
                        </div>

                        {/* Search Results */}
                        {showContatoDropdown && contatoResults.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                {contatoResults.map((contato) => (
                                    <button
                                        key={contato.id}
                                        onClick={() => handleSelectContato(contato)}
                                        className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{contato.nome}</p>
                                            <p className="text-sm text-gray-500">{formatPhone(contato.telefone)}</p>
                                        </div>
                                        <Badge variant={contato.status === 'cliente' ? 'success' : 'warning'}>
                                            {contato.status === 'cliente' ? 'Cliente' : 'Lead'}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Quick Add Button */}
                        <button
                            onClick={() => setShowQuickAddModal(true)}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Cadastrar novo cliente</span>
                        </button>

                        {/* Recent Contacts */}
                        {contatos.length > 0 && !contatoSearch && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Clientes recentes</h3>
                                <div className="space-y-2">
                                    {contatos.slice(0, 5).map((contato) => (
                                        <button
                                            key={contato.id}
                                            onClick={() => handleSelectContato(contato)}
                                            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-200 text-left hover:border-primary-300 transition-colors flex items-center gap-3"
                                        >
                                            <User className="h-5 w-5 text-gray-400" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{contato.nome}</p>
                                            </div>
                                            <span className="text-sm text-gray-500">{formatPhone(contato.telefone)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Products */}
                {step === 'produtos' && (
                    <div className="pb-32">
                        {/* Selected Client */}
                        <Card className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedContato?.nome}</p>
                                    <p className="text-sm text-gray-500">{formatPhone(selectedContato?.telefone || '')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedContato(null)
                                    setStep('cliente')
                                }}
                                className="text-sm text-primary-500"
                            >
                                Trocar
                            </button>
                        </Card>

                        {/* Products Grid */}
                        {loadingProdutos ? (
                            <LoadingScreen message="Carregando produtos..." />
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {produtos.map((produto) => {
                                    const qty = getCartQuantity(produto.id)
                                    return (
                                        <div
                                            key={produto.id}
                                            className={`bg-white rounded-xl p-4 border-2 transition-colors ${qty > 0 ? 'border-primary-500' : 'border-gray-200'
                                                }`}
                                        >
                                            <p className="font-medium text-gray-900 mb-1 line-clamp-2">{produto.nome}</p>
                                            <p className="text-lg font-bold text-primary-600 mb-3">
                                                {formatCurrency(Number(produto.preco))}
                                            </p>

                                            {qty > 0 ? (
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(produto.id, -1)}
                                                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="text-xl font-bold">{qty}</span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(produto.id, 1)}
                                                        className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddToCart(produto)}
                                                    className="w-full py-2 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                                                >
                                                    Adicionar
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Cart Summary Fixed Bottom */}
                        {cart.length > 0 && (
                            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg safe-bottom">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-gray-500">{cartItemsCount} item(s)</span>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(cartTotal)}</p>
                                    </div>
                                    <Button
                                        size="lg"
                                        onClick={() => setStep('pagamento')}
                                        leftIcon={<ShoppingCart className="h-5 w-5" />}
                                    >
                                        Continuar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Payment */}
                {step === 'pagamento' && (
                    <div className="space-y-4">
                        {/* Cart Items */}
                        <Card>
                            <h3 className="font-medium text-gray-900 mb-3">Resumo do Pedido</h3>
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <div key={item.produto_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.produto.nome}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantidade}x {formatCurrency(item.preco_unitario)}
                                            </p>
                                        </div>
                                        <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
                                <span className="font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-primary-600">{formatCurrency(cartTotal)}</span>
                            </div>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <h3 className="font-medium text-gray-900 mb-3">Forma de Pagamento</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(FORMA_PAGAMENTO_LABELS).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleSubmitVenda(key)}
                                        disabled={isSubmitting}
                                        className="py-4 px-4 bg-gray-50 hover:bg-primary-50 border-2 border-gray-200 hover:border-primary-500 rounded-xl font-medium text-gray-900 transition-colors disabled:opacity-50"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {/* Back button */}
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => setStep('produtos')}
                        >
                            Voltar para produtos
                        </Button>
                    </div>
                )}

                {/* Quick Add Contact Modal */}
                <Modal
                    isOpen={showQuickAddModal}
                    onClose={() => setShowQuickAddModal(false)}
                    title="Cadastro Rápido"
                    size="sm"
                >
                    <div className="space-y-4">
                        <Input
                            label="Nome"
                            placeholder="Nome do cliente"
                            value={quickAddName}
                            onChange={(e) => setQuickAddName(e.target.value)}
                            autoFocus
                        />
                        <Input
                            label="Telefone"
                            placeholder="(11) 99999-9999"
                            value={quickAddPhone}
                            onChange={(e) => setQuickAddPhone(e.target.value)}
                        />
                    </div>
                    <ModalActions>
                        <Button variant="secondary" onClick={() => setShowQuickAddModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleQuickAddContato} isLoading={isCreatingContato}>
                            Cadastrar
                        </Button>
                    </ModalActions>
                </Modal>
            </PageContainer>
        </>
    )
}

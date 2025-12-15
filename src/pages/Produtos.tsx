import { useState } from 'react'
import {
    Package,
    Plus,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, Button, Badge, LoadingScreen, Modal, ModalActions, Input } from '../components/ui'
import { useProdutos } from '../hooks/useProdutos'
import { useToast } from '../components/ui/Toast'
import { formatCurrency } from '../utils/formatters'
import type { Produto, ProdutoInsert, ProdutoUpdate } from '../types/database'

// Calcular margem
function calcularMargem(preco: number, custo: number): number {
    if (preco === 0) return 0
    return ((preco - custo) / preco) * 100
}

// Card de produto
function ProdutoCard({ produto, onEdit }: { produto: Produto; onEdit: () => void }) {
    const margem = calcularMargem(Number(produto.preco), Number(produto.custo))
    const margemNegativa = margem < 0

    return (
        <Card hover onClick={onEdit} className="cursor-pointer">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${produto.ativo ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                        <Package className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">{produto.nome}</p>
                            <Badge variant={produto.ativo ? 'success' : 'gray'}>
                                {produto.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">Código: {produto.codigo}</p>

                        <div className="flex items-center gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Venda: </span>
                                <span className="font-semibold text-gray-900">{formatCurrency(Number(produto.preco))}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Custo: </span>
                                <span className="font-medium text-gray-700">{formatCurrency(Number(produto.custo))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <div className={`flex items-center gap-1 ${margemNegativa ? 'text-danger-600' : 'text-success-600'}`}>
                        {margemNegativa ? (
                            <TrendingDown className="h-4 w-4" />
                        ) : (
                            <TrendingUp className="h-4 w-4" />
                        )}
                        <span className="font-bold">{margem.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-gray-500">margem</p>
                </div>
            </div>
        </Card>
    )
}

export function Produtos() {
    const toast = useToast()
    const { produtos, loading, createProduto, updateProduto } = useProdutos({ includeInactive: true })

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingProduto, setEditingProduto] = useState<Produto | null>(null)

    // Form states for create
    const [newNome, setNewNome] = useState('')
    const [newCodigo, setNewCodigo] = useState('')
    const [newPreco, setNewPreco] = useState('')
    const [newCusto, setNewCusto] = useState('')
    const [newUnidade, setNewUnidade] = useState('un')
    const [creating, setCreating] = useState(false)

    // Form states for edit
    const [editNome, setEditNome] = useState('')
    const [editPreco, setEditPreco] = useState('')
    const [editCusto, setEditCusto] = useState('')
    const [editAtivo, setEditAtivo] = useState(true)
    const [updating, setUpdating] = useState(false)

    // Stats
    const produtosAtivos = produtos.filter(p => p.ativo).length
    const produtosInativos = produtos.filter(p => !p.ativo).length

    // Open edit modal
    const handleOpenEdit = (produto: Produto) => {
        setEditingProduto(produto)
        setEditNome(produto.nome)
        setEditPreco(String(produto.preco))
        setEditCusto(String(produto.custo))
        setEditAtivo(produto.ativo)
    }

    // Close edit modal
    const handleCloseEdit = () => {
        setEditingProduto(null)
        setEditNome('')
        setEditPreco('')
        setEditCusto('')
        setEditAtivo(true)
    }

    // Open create modal
    const handleOpenCreate = () => {
        setNewNome('')
        setNewCodigo('')
        setNewPreco('')
        setNewCusto('')
        setNewUnidade('un')
        setIsCreateModalOpen(true)
    }

    // Create product
    const handleCreate = async () => {
        if (!newNome.trim() || !newCodigo.trim()) {
            toast.error('Nome e código são obrigatórios')
            return
        }

        const preco = parseFloat(newPreco)
        const custo = parseFloat(newCusto)

        if (isNaN(preco) || preco <= 0) {
            toast.error('Preço deve ser maior que zero')
            return
        }

        if (isNaN(custo) || custo <= 0) {
            toast.error('Custo deve ser maior que zero')
            return
        }

        // Check unique code
        if (produtos.some(p => p.codigo.toLowerCase() === newCodigo.trim().toLowerCase())) {
            toast.error('Código já existe')
            return
        }

        setCreating(true)

        const data: ProdutoInsert = {
            nome: newNome.trim(),
            codigo: newCodigo.trim().toUpperCase(),
            preco,
            custo,
            unidade: newUnidade,
            ativo: true,
        }

        const result = await createProduto(data)

        setCreating(false)

        if (result) {
            toast.success('Produto criado!')
            setIsCreateModalOpen(false)
        } else {
            toast.error('Erro ao criar produto')
        }
    }

    // Update product
    const handleUpdate = async () => {
        if (!editingProduto) return

        const preco = parseFloat(editPreco)
        const custo = parseFloat(editCusto)

        if (isNaN(preco) || preco <= 0) {
            toast.error('Preço deve ser maior que zero')
            return
        }

        if (isNaN(custo) || custo <= 0) {
            toast.error('Custo deve ser maior que zero')
            return
        }

        setUpdating(true)

        const data: ProdutoUpdate = {
            nome: editNome.trim(),
            preco,
            custo,
            ativo: editAtivo,
        }

        const result = await updateProduto(editingProduto.id, data)

        setUpdating(false)

        if (result) {
            toast.success('Produto atualizado!')
            handleCloseEdit()
        } else {
            toast.error('Erro ao atualizar produto')
        }
    }

    // Margem em tempo real para edição
    const editMargem = editPreco && editCusto
        ? calcularMargem(parseFloat(editPreco) || 0, parseFloat(editCusto) || 0)
        : 0

    // Margem em tempo real para criação
    const newMargem = newPreco && newCusto
        ? calcularMargem(parseFloat(newPreco) || 0, parseFloat(newCusto) || 0)
        : 0

    return (
        <>
            <Header
                title="Produtos"
                showBack
                rightAction={
                    <button
                        onClick={handleOpenCreate}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                }
            />
            <PageContainer>
                {loading && <LoadingScreen message="Carregando produtos..." />}

                {!loading && (
                    <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{produtosAtivos}</p>
                                <p className="text-sm text-gray-500">Ativos</p>
                            </Card>
                            <Card className="text-center">
                                <p className="text-2xl font-bold text-gray-400">{produtosInativos}</p>
                                <p className="text-sm text-gray-500">Inativos</p>
                            </Card>
                        </div>

                        {/* Product List */}
                        <div className="space-y-2">
                            {produtos.map(produto => (
                                <ProdutoCard
                                    key={produto.id}
                                    produto={produto}
                                    onEdit={() => handleOpenEdit(produto)}
                                />
                            ))}
                        </div>

                        {produtos.length === 0 && (
                            <Card className="text-center py-8 text-gray-500">
                                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Nenhum produto cadastrado</p>
                            </Card>
                        )}
                    </div>
                )}

                {/* Create Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Novo Produto"
                    size="md"
                >
                    <div className="space-y-4">
                        <Input
                            label="Nome *"
                            value={newNome}
                            onChange={(e) => setNewNome(e.target.value)}
                            placeholder="Ex: Massa Pão de Queijo 1kg"
                        />

                        <Input
                            label="Código *"
                            value={newCodigo}
                            onChange={(e) => setNewCodigo(e.target.value.toUpperCase())}
                            placeholder="Ex: PDQ1KG"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Preço Venda *"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={newPreco}
                                onChange={(e) => setNewPreco(e.target.value)}
                                placeholder="0.00"
                            />

                            <Input
                                label="Custo *"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={newCusto}
                                onChange={(e) => setNewCusto(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <Input
                            label="Unidade"
                            value={newUnidade}
                            onChange={(e) => setNewUnidade(e.target.value)}
                            placeholder="un, kg, etc"
                        />

                        {/* Margem Preview */}
                        {newPreco && newCusto && (
                            <div className={`p-3 rounded-lg ${newMargem < 0 ? 'bg-danger-50' : 'bg-success-50'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Margem de Lucro:</span>
                                    <span className={`font-bold ${newMargem < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                        {newMargem.toFixed(1)}%
                                    </span>
                                </div>
                                {newMargem < 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-danger-600 text-xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Margem negativa! Preço menor que custo.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <ModalActions>
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreate} isLoading={creating}>
                            Criar Produto
                        </Button>
                    </ModalActions>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={!!editingProduto}
                    onClose={handleCloseEdit}
                    title="Editar Produto"
                    size="md"
                >
                    {editingProduto && (
                        <div className="space-y-4">
                            <Input
                                label="Nome"
                                value={editNome}
                                onChange={(e) => setEditNome(e.target.value)}
                            />

                            <Input
                                label="Código"
                                value={editingProduto.codigo}
                                disabled
                                className="bg-gray-100"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Preço Venda"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editPreco}
                                    onChange={(e) => setEditPreco(e.target.value)}
                                />

                                <Input
                                    label="Custo"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={editCusto}
                                    onChange={(e) => setEditCusto(e.target.value)}
                                />
                            </div>

                            {/* Margem Preview */}
                            <div className={`p-3 rounded-lg ${editMargem < 0 ? 'bg-danger-50' : 'bg-success-50'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Margem de Lucro:</span>
                                    <span className={`font-bold ${editMargem < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                        {editMargem.toFixed(1)}%
                                    </span>
                                </div>
                                {editMargem < 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-danger-600 text-xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>Margem negativa! Preço menor que custo.</span>
                                    </div>
                                )}
                            </div>

                            {/* Toggle Ativo */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">Produto Ativo</span>
                                <button
                                    type="button"
                                    onClick={() => setEditAtivo(!editAtivo)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                        ${editAtivo ? 'bg-success-500' : 'bg-gray-300'}
                                    `}
                                >
                                    <span
                                        className={`
                                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                            ${editAtivo ? 'translate-x-6' : 'translate-x-1'}
                                        `}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    <ModalActions>
                        <Button variant="secondary" onClick={handleCloseEdit}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdate} isLoading={updating}>
                            Salvar
                        </Button>
                    </ModalActions>
                </Modal>
            </PageContainer>
        </>
    )
}

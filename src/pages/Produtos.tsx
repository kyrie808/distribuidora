import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Package,
    Plus,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Pencil,
    X
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

    // Low stock logic
    const estoqueAtual = produto.estoque_atual || 0
    const estoqueMinimo = produto.estoque_minimo || 10
    const isBaixoEstoque = estoqueAtual <= estoqueMinimo

    return (
        <Card
            hover
            onClick={onEdit}
            className={`cursor-pointer border-l-4 ${isBaixoEstoque ? 'border-l-warning-500 bg-warning-50/10' : 'border-l-transparent'}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative
                        ${produto.ativo ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}
                    `}>
                        <Package className="h-5 w-5" />
                        {isBaixoEstoque && (
                            <div className="absolute -top-1 -right-1 bg-warning-500 text-white rounded-full p-0.5 border-2 border-white">
                                <AlertTriangle className="h-2.5 w-2.5" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">{produto.nome}</p>
                            {isBaixoEstoque && (
                                <Badge variant="warning" className="h-5 px-1.5 text-[10px]">
                                    Baixo Estoque
                                </Badge>
                            )}
                            {!isBaixoEstoque && (
                                <Badge variant={produto.ativo ? 'success' : 'gray'}>
                                    {produto.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 mb-2">Código: {produto.codigo} • Estoque Mín: {estoqueMinimo}</p>

                        <div className="flex items-center gap-4 text-sm mt-2">
                            {/* Estoque Atual */}
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded text-gray-700">
                                <Package className="h-3.5 w-3.5 opacity-50" />
                                <span className={isBaixoEstoque ? 'font-bold text-warning-700' : ''}>
                                    {estoqueAtual} {produto.unidade || 'un'}
                                </span>
                            </div>

                            <div>
                                <span className="text-gray-500 text-xs">Venda: </span>
                                <span className="font-semibold text-gray-900">{formatCurrency(Number(produto.preco))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-1 ${margemNegativa ? 'text-danger-600' : 'text-success-600'}`}>
                        {margemNegativa ? (
                            <TrendingDown className="h-4 w-4" />
                        ) : (
                            <TrendingUp className="h-4 w-4" />
                        )}
                        <span className="font-bold">{margem.toFixed(1)}%</span>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                        className="opacity-100 hover:bg-gray-200"
                    >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                    </Button>
                </div>
            </div>
        </Card>
    )
}

export function Produtos() {
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const { produtos, loading, createProduto, updateProduto } = useProdutos({ includeInactive: true })

    // Filters
    const filterBaixoEstoque = searchParams.get('filtro') === 'baixo_estoque'

    const filteredProdutos = useMemo(() => {
        if (!filterBaixoEstoque) return produtos

        return produtos.filter(p => {
            const atual = p.estoque_atual || 0
            const minimo = p.estoque_minimo || 10
            return atual <= minimo && p.ativo
        })
    }, [produtos, filterBaixoEstoque])

    const clearFilter = () => {
        setSearchParams(prev => {
            prev.delete('filtro')
            return prev
        })
    }

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingProduto, setEditingProduto] = useState<Produto | null>(null)

    // Form states for create
    const [newNome, setNewNome] = useState('')
    const [newCodigo, setNewCodigo] = useState('')
    const [newApelido, setNewApelido] = useState('')
    const [newPreco, setNewPreco] = useState('')
    const [newCusto, setNewCusto] = useState('')
    const [newUnidade, setNewUnidade] = useState('un')
    const [newEstoqueMinimo, setNewEstoqueMinimo] = useState('10')
    const [creating, setCreating] = useState(false)

    // Form states for edit
    const [editNome, setEditNome] = useState('')
    const [editCodigo, setEditCodigo] = useState('')
    const [editApelido, setEditApelido] = useState('')
    const [editPreco, setEditPreco] = useState('')
    const [editCusto, setEditCusto] = useState('')
    const [editEstoqueMinimo, setEditEstoqueMinimo] = useState('')
    const [editAtivo, setEditAtivo] = useState(true)
    const [updating, setUpdating] = useState(false)

    // Stats
    const produtosAtivos = produtos.filter(p => p.ativo).length
    const produtosBaixoEstoqueCount = produtos.filter(p => {
        const atual = p.estoque_atual || 0
        const minimo = p.estoque_minimo || 10
        return atual <= minimo && p.ativo
    }).length

    // Open edit modal
    const handleOpenEdit = (produto: Produto) => {
        setEditingProduto(produto)
        setEditNome(produto.nome)
        setEditCodigo(produto.codigo)
        setEditApelido(produto.apelido || '')
        setEditPreco(String(produto.preco))
        setEditCusto(String(produto.custo))
        setEditEstoqueMinimo(String(produto.estoque_minimo || 10))
        setEditAtivo(produto.ativo)
    }

    // Close edit modal
    const handleCloseEdit = () => {
        setEditingProduto(null)
        setEditNome('')
        setEditCodigo('')
        setEditApelido('')
        setEditPreco('')
        setEditCusto('')
        setEditEstoqueMinimo('')
        setEditAtivo(true)
    }

    // Open create modal
    const handleOpenCreate = () => {
        setNewNome('')
        setNewCodigo('')
        setNewApelido('')
        setNewPreco('')
        setNewCusto('')
        setNewUnidade('un')
        setNewEstoqueMinimo('10')
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
            codigo: newCodigo.trim(),
            apelido: newApelido.trim() || null,
            preco,
            custo,
            unidade: newUnidade,
            estoque_minimo: parseInt(newEstoqueMinimo) || 10,
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
        const estoqueMinimo = parseInt(editEstoqueMinimo) || 10

        if (isNaN(preco) || preco <= 0) {
            toast.error('Preço deve ser maior que zero')
            return
        }

        if (isNaN(custo) || custo <= 0) {
            toast.error('Custo deve ser maior que zero')
            return
        }

        // Check unique code (excluding current product)
        if (editCodigo.trim() !== editingProduto.codigo) {
            if (produtos.some(p => p.id !== editingProduto.id && p.codigo.toLowerCase() === editCodigo.trim().toLowerCase())) {
                toast.error('Código já existe')
                return
            }
        }

        setUpdating(true)

        const data: ProdutoUpdate = {
            nome: editNome.trim(),
            codigo: editCodigo.trim(),
            apelido: editApelido.trim() || null,
            preco,
            custo,
            estoque_minimo: estoqueMinimo,
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
                        {/* Active Filter Banner */}
                        {filterBaixoEstoque && (
                            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 text-warning-800">
                                    <AlertTriangle className="h-5 w-5 text-warning-600" />
                                    <span className="font-medium text-sm">
                                        Exibindo {filteredProdutos.length} produtos com baixo estoque
                                    </span>
                                </div>
                                <button
                                    onClick={clearFilter}
                                    className="text-xs font-semibold text-warning-700 hover:text-warning-900 flex items-center gap-1 bg-warning-100 hover:bg-warning-200 px-2 py-1 rounded transition-colors"
                                >
                                    Limpar Filtro
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        {/* Stats */}
                        {!filterBaixoEstoque && (
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{produtosAtivos}</p>
                                    <p className="text-sm text-gray-500">Ativos</p>
                                </Card>
                                <Card
                                    className="text-center cursor-pointer hover:bg-red-50 transition-colors border-l-4 border-l-transparent hover:border-l-warning-500"
                                    onClick={() => setSearchParams({ filtro: 'baixo_estoque' })}
                                >
                                    <p className="text-2xl font-bold text-warning-600">{produtosBaixoEstoqueCount}</p>
                                    <p className="text-sm text-gray-500">Baixo Estoque</p>
                                </Card>
                            </div>
                        )}

                        {/* Product List */}
                        <div className="space-y-2">
                            {filteredProdutos.map(produto => (
                                <ProdutoCard
                                    key={produto.id}
                                    produto={produto}
                                    onEdit={() => handleOpenEdit(produto)}
                                />
                            ))}
                        </div>

                        {filteredProdutos.length === 0 && (
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

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Código *"
                                value={newCodigo}
                                onChange={(e) => setNewCodigo(e.target.value)}
                                placeholder="Ex: PDQ1KG"
                            />
                            <Input
                                label="Apelido (Sigla)"
                                value={newApelido}
                                onChange={(e) => setNewApelido(e.target.value)}
                                placeholder="Ex: B"
                                maxLength={3}
                            />
                        </div>

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

                        <Input
                            label="Estoque Mínimo (Alerta)"
                            type="number"
                            min="0"
                            value={newEstoqueMinimo}
                            onChange={(e) => setNewEstoqueMinimo(e.target.value)}
                            placeholder="10"
                            helperText="Quantidade para gerar alerta de baixo estoque"
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

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Código"
                                    value={editCodigo}
                                    onChange={(e) => setEditCodigo(e.target.value)}
                                />
                                <Input
                                    label="Apelido (Sigla)"
                                    value={editApelido}
                                    onChange={(e) => setEditApelido(e.target.value)}
                                    placeholder="Ex: B"
                                    maxLength={3}
                                />
                            </div>

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

                            <Input
                                label="Estoque Mínimo (Alerta)"
                                type="number"
                                min="0"
                                value={editEstoqueMinimo}
                                onChange={(e) => setEditEstoqueMinimo(e.target.value)}
                                helperText="Quantidade para gerar alerta de baixo estoque no Dashboard"
                            />

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
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editAtivo ? 'bg-success-500' : 'bg-gray-300'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editAtivo ? 'translate-x-6' : 'translate-x-1'}`}
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

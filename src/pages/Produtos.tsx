import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Package,
    Plus,
    AlertTriangle,
    X
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { PageContainer } from '../components/layout/PageContainer'
import { Card, LoadingScreen, Modal, ModalActions, Button, Input, Select, Badge } from '../components/ui'
import { KpiCard } from '../components/dashboard/KpiCard'
import { cn } from '@/lib/utils'
import { useProdutos } from '../hooks/useProdutos'
import { useToast } from '../components/ui/Toast'
import { formatCurrency } from '../utils/formatters'
import type { DomainProduto, CreateProduto, UpdateProduto } from '../types/domain'

export function Produtos() {
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const { produtos, loading, createProduto, updateProduto } = useProdutos(true)

    // Filters
    const filterBaixoEstoque = searchParams.get('filtro') === 'baixo_estoque'

    const filteredProdutos = useMemo(() => {
        if (!filterBaixoEstoque) return produtos

        return produtos.filter(p => {
            const atual = p.estoqueAtual || 0
            const minimo = p.estoqueMinimo || 10
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
    const [_isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingProduto, setEditingProduto] = useState<DomainProduto | null>(null)

    // Form states for create
    const [newNome, setNewNome] = useState('')
    const [newCodigo, setNewCodigo] = useState('')
    const [newApelido, setNewApelido] = useState('')
    const [newPreco, setNewPreco] = useState('')
    const [newCusto, setNewCusto] = useState('')
    const [newUnidade, setNewUnidade] = useState('un')
    const [newEstoqueMinimo, setNewEstoqueMinimo] = useState('10')
    const [_creating, _setCreating] = useState(false)

    // Form states for edit
    const [editNome, setEditNome] = useState('')
    const [editCodigo, setEditCodigo] = useState('')
    const [editApelido, setEditApelido] = useState('')
    const [editPreco, setEditPreco] = useState('')
    const [editCusto, setEditCusto] = useState('')
    const [editEstoqueMinimo, setEditEstoqueMinimo] = useState('')
    const [editAtivo, setEditAtivo] = useState(true)
    const [_updating, _setUpdating] = useState(false)

    // Stats
    const produtosAtivos = produtos.filter(p => p.ativo).length
    const produtosBaixoEstoqueCount = produtos.filter(p => {
        const atual = p.estoqueAtual || 0
        const minimo = p.estoqueMinimo || 10
        return atual <= minimo && p.ativo
    }).length

    // Open edit modal
    const handleOpenEdit = (produto: DomainProduto) => {
        setEditingProduto(produto)
        setEditNome(produto.nome)
        setEditCodigo(produto.codigo)
        setEditApelido(produto.apelido || '')
        setEditPreco(String(produto.preco))
        setEditCusto(String(produto.custo))
        setEditEstoqueMinimo(String(produto.estoqueMinimo || 10))
        setEditAtivo(produto.ativo)
    }

    const handleCloseEdit = () => {
        setEditingProduto(null)
    }

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

    const _handleCreate = async () => {
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

        _setCreating(true)

        const data: CreateProduto = {
            nome: newNome.trim(),
            codigo: newCodigo.trim(),
            apelido: newApelido.trim() || null,
            preco,
            custo,
            unidade: newUnidade,
            estoqueMinimo: parseInt(newEstoqueMinimo) || 10,
            ativo: true,
        }

        try {
            await createProduto(data)
            toast.success('Produto criado!')
            setIsCreateModalOpen(false)
        } catch (e: any) {
            toast.error(e.message || 'Erro ao criar produto')
        } finally {
            _setCreating(false)
        }
    }

    const _handleUpdate = async () => {
        if (!editingProduto) return

        const preco = parseFloat(editPreco)
        const custo = parseFloat(editCusto)

        if (isNaN(preco) || preco <= 0) {
            toast.error('Preço deve ser maior que zero')
            return
        }

        _setUpdating(true)

        const data: UpdateProduto = {
            nome: editNome.trim(),
            codigo: editCodigo.trim(),
            apelido: editApelido.trim() || null,
            preco,
            custo,
            estoqueMinimo: parseInt(editEstoqueMinimo) || 10,
            ativo: editAtivo,
        }

        try {
            await updateProduto(editingProduto.id, data)
            toast.success('Produto atualizado!')
            handleCloseEdit()
        } catch (e: any) {
            toast.error(e.message || 'Erro ao atualizar produto')
        } finally {
            _setUpdating(false)
        }
    }

    const calcularMargem = (preco: number, custo: number): number => {
        if (preco === 0) return 0
        return ((preco - custo) / preco) * 100
    }

    const _editMargem = calcularMargem(parseFloat(editPreco) || 0, parseFloat(editCusto) || 0)
    const _newMargem = calcularMargem(parseFloat(newPreco) || 0, parseFloat(newCusto) || 0)

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-[100dvh] flex justify-center">
            <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden max-w-screen-2xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
                <Header
                    title="Produtos"
                    showBack
                    centerTitle
                    className="sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md z-30 px-6 py-4 h-auto shadow-none"
                    rightAction={
                        <button
                            onClick={handleOpenCreate}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    }
                />
                <PageContainer className="pt-0 pb-16 bg-transparent px-4">
                    {loading && <LoadingScreen message="Carregando produtos..." />}

                    {!loading && (
                        <div className="space-y-4">
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

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <KpiCard
                                    title="Ativos"
                                    value={produtosAtivos.toString()}
                                    progress={100}
                                    trend="Total"
                                    icon={Package}
                                    variant="compact"
                                />
                                <KpiCard
                                    title="Baixo Estoque"
                                    value={produtosBaixoEstoqueCount.toString()}
                                    progress={produtosAtivos > 0 ? (produtosBaixoEstoqueCount / produtosAtivos) * 100 : 0}
                                    icon={AlertTriangle}
                                    variant="compact"
                                    onClick={() => setSearchParams({ filtro: 'baixo_estoque' })}
                                    className="cursor-pointer"
                                />
                            </div>

                            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                                {filteredProdutos.map((produto) => (
                                    <Card
                                        key={produto.id}
                                        className={cn(
                                            "transition-all cursor-pointer hover:shadow-md border-l-4",
                                            !produto.ativo ? "opacity-60 border-l-gray-300" :
                                                (produto.estoqueAtual <= produto.estoqueMinimo ? "border-l-warning" : "border-l-success")
                                        )}
                                        onClick={() => handleOpenEdit(produto)}
                                        hover
                                    >
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-200">
                                                {produto.imagemUrl ? (
                                                    <img src={produto.imagemUrl} alt={produto.nome} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                        <Package className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold truncate">{produto.nome}</h3>
                                                <div className="text-sm text-gray-500 font-mono">#{produto.codigo}</div>
                                                <div className="flex gap-4 mt-1">
                                                    <span className="text-sm font-semibold">{formatCurrency(produto.preco)}</span>
                                                    <span className="text-sm text-gray-400">Estoque: {produto.estoqueAtual}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Modal de Criação */}
                    <Modal
                        isOpen={_isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        title="Novo Produto"
                        size="lg"
                    >
                        <div className="space-y-4">
                            <Input
                                label="Nome do Produto"
                                value={newNome}
                                onChange={(e) => setNewNome(e.target.value)}
                                placeholder="Ex: Pão de Queijo 1kg"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Código"
                                    value={newCodigo}
                                    onChange={(e) => setNewCodigo(e.target.value)}
                                    placeholder="Ex: PQ001"
                                />
                                <Input
                                    label="Apelido"
                                    value={newApelido}
                                    onChange={(e) => setNewApelido(e.target.value)}
                                    placeholder="Nome curto"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Preço de Venda"
                                    type="number"
                                    value={newPreco}
                                    onChange={(e) => setNewPreco(e.target.value)}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Custo"
                                    type="number"
                                    value={newCusto}
                                    onChange={(e) => setNewCusto(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Margem Preview */}
                            {(parseFloat(newPreco) > 0) && (
                                <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg flex justify-between items-center transition-all animate-in fade-in slide-in-from-left-2">
                                    <span className="text-sm text-gray-500">Margem Estimada</span>
                                    <Badge variant={_newMargem > 30 ? 'success' : _newMargem > 15 ? 'warning' : 'destructive'}>
                                        {_newMargem.toFixed(1)}%
                                    </Badge>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Unidade"
                                    value={newUnidade}
                                    onChange={(e) => setNewUnidade(e.target.value)}
                                    options={[
                                        { label: 'Unidade (un)', value: 'un' },
                                        { label: 'Quilograma (kg)', value: 'kg' },
                                        { label: 'Pacote (pct)', value: 'pct' },
                                    ]}
                                />
                                <Input
                                    label="Estoque Mínimo"
                                    type="number"
                                    value={newEstoqueMinimo}
                                    onChange={(e) => setNewEstoqueMinimo(e.target.value)}
                                />
                            </div>

                            <ModalActions>
                                <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={_handleCreate}
                                    isLoading={_creating}
                                >
                                    Criar Produto
                                </Button>
                            </ModalActions>
                        </div>
                    </Modal>

                    {/* Modal de Edição */}
                    <Modal
                        isOpen={!!editingProduto}
                        onClose={handleCloseEdit}
                        title="Editar Produto"
                        size="lg"
                    >
                        <div className="space-y-4">
                            <Input
                                label="Nome do Produto"
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
                                    label="Apelido"
                                    value={editApelido}
                                    onChange={(e) => setEditApelido(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Preço de Venda"
                                    type="number"
                                    value={editPreco}
                                    onChange={(e) => setEditPreco(e.target.value)}
                                />
                                <Input
                                    label="Custo"
                                    type="number"
                                    value={editCusto}
                                    onChange={(e) => setEditCusto(e.target.value)}
                                />
                            </div>

                            {/* Margem Preview */}
                            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-sm text-gray-500">Margem Estimada</span>
                                <Badge variant={_editMargem > 30 ? 'success' : _editMargem > 15 ? 'warning' : 'destructive'}>
                                    {_editMargem.toFixed(1)}%
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Estoque Mínimo"
                                    type="number"
                                    value={editEstoqueMinimo}
                                    onChange={(e) => setEditEstoqueMinimo(e.target.value)}
                                />
                                <Select
                                    label="Status"
                                    value={editAtivo ? 'true' : 'false'}
                                    onChange={(e) => setEditAtivo(e.target.value === 'true')}
                                    options={[
                                        { label: 'Ativo', value: 'true' },
                                        { label: 'Inativo', value: 'false' },
                                    ]}
                                />
                            </div>

                            <ModalActions>
                                <Button variant="ghost" onClick={handleCloseEdit}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={_handleUpdate}
                                    isLoading={_updating}
                                >
                                    Salvar Alterações
                                </Button>
                            </ModalActions>
                        </div>
                    </Modal>
                </PageContainer>
            </div>
        </div>
    )
}

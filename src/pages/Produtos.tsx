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
import { Card, Button, Badge, LoadingScreen, Modal, ModalActions, Input } from '../components/ui'
import { KpiCard } from '../components/dashboard/KpiCard'
import { cn } from '@/lib/utils'
import { useProdutos } from '../hooks/useProdutos'
import { produtoService } from '../services/produtoService'
import { useToast } from '../components/ui/Toast'
import { formatCurrency } from '../utils/formatters'
import type { ProdutoInsert } from '../types/database'
import type { DomainProduto } from '../types/domain'



export function Produtos() {
    const toast = useToast()
    const [searchParams, setSearchParams] = useSearchParams()
    const { produtos, loading, createProduto, updateProduto } = useProdutos({ includeInactive: true })

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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingProduto, setEditingProduto] = useState<DomainProduto | null>(null)

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
    const [editImagemUrl, setEditImagemUrl] = useState<string | undefined>(undefined)
    const [updating, setUpdating] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

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
        setEditImagemUrl(produto.imagemUrl)
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
        setEditImagemUrl(undefined)
        setUploadingImage(false)
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

        const data: Partial<DomainProduto> = {
            nome: editNome.trim(),
            codigo: editCodigo.trim(),
            apelido: editApelido.trim() || null,
            preco,
            custo,
            estoqueMinimo: parseInt(editEstoqueMinimo) || 10,
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

    function calcularMargem(preco: number, custo: number): number {
        if (preco === 0) return 0
        return ((preco - custo) / preco) * 100
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111811] dark:text-gray-100 transition-colors duration-200 min-h-screen flex justify-center">
            <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-7xl shadow-2xl bg-background-light dark:bg-background-dark pb-24">
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
                                    <KpiCard
                                        title="Ativos"
                                        value={produtosAtivos.toString()}
                                        progress={100}
                                        trend="Total"
                                        trendDirection="up"
                                        icon={Package}
                                        progressColor="bg-primary"
                                        trendColor="green"
                                        iconColor="text-primary"
                                        variant="compact"
                                    />
                                    <KpiCard
                                        title="Baixo Estoque"
                                        value={produtosBaixoEstoqueCount.toString()}
                                        progress={produtosAtivos > 0 ? (produtosBaixoEstoqueCount / produtosAtivos) * 100 : 0}
                                        trend={produtosBaixoEstoqueCount > 0 ? 'Crítico' : 'OK'}
                                        trendDirection={produtosBaixoEstoqueCount > 0 ? 'down' : 'up'}
                                        icon={AlertTriangle}
                                        progressColor={produtosBaixoEstoqueCount > 0 ? 'bg-warning' : 'bg-semantic-green'}
                                        trendColor={produtosBaixoEstoqueCount > 0 ? 'red' : 'green'}
                                        iconColor={produtosBaixoEstoqueCount > 0 ? 'text-warning' : 'text-semantic-green'}
                                        variant="compact"
                                        onClick={() => setSearchParams({ filtro: 'baixo_estoque' })}
                                        className="cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Product List */}
                            <div className="space-y-3">
                                {filteredProdutos.map((produto) => {
                                    const isLowStock = produto.estoqueAtual <= produto.estoqueMinimo
                                    const isNoStock = produto.estoqueAtual === 0

                                    return (
                                        <Card
                                            key={produto.id}
                                            className={cn(
                                                "transition-all cursor-pointer hover:shadow-md border-l-4",
                                                !produto.ativo
                                                    ? "opacity-60 border-l-gray-300 bg-gray-50 dark:bg-gray-800/50"
                                                    : isNoStock
                                                        ? "border-l-semantic-red bg-semantic-red/5 dark:bg-semantic-red/10"
                                                        : isLowStock
                                                            ? "border-l-semantic-yellow bg-semantic-yellow/5 dark:bg-semantic-yellow/10"
                                                            : "border-l-semantic-green hover:bg-semantic-green/5 dark:hover:bg-semantic-green/10"
                                            )}
                                            onClick={() => handleOpenEdit(produto)}
                                            hover
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e: React.KeyboardEvent) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleOpenEdit(produto)
                                                }
                                            }}
                                        >
                                            <div className="p-4 flex items-center gap-4">
                                                {/* Image Thumbnail */}
                                                <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600">
                                                    {produto.imagemUrl ? (
                                                        <img
                                                            src={produto.imagemUrl}
                                                            alt={produto.nome}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                            <Package className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                                                {produto.nome}
                                                            </h3>
                                                            {!produto.ativo && <Badge variant="gray">Inativo</Badge>}
                                                            {produto.apelido && (
                                                                <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                                                    {produto.apelido}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">
                                                            #{produto.codigo}
                                                        </div>

                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div>
                                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-wider mb-0.5">
                                                                    Preço
                                                                </span>
                                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {formatCurrency(produto.preco)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-wider mb-0.5">
                                                                    Custo
                                                                </span>
                                                                <span className="text-gray-600 dark:text-gray-400">
                                                                    {formatCurrency(produto.custo)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 ml-4">
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 block uppercase font-bold tracking-wider mb-0.5">
                                                                Estoque
                                                            </span>
                                                            <div className={cn(
                                                                "text-xl font-bold font-mono",
                                                                isNoStock ? "text-semantic-red" :
                                                                    isLowStock ? "text-semantic-yellow" : "text-semantic-green"
                                                            )}>
                                                                {produto.estoqueAtual}
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 font-sans font-normal">
                                                                    {produto.unidade}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isLowStock && (
                                                            <Badge
                                                                className={cn(
                                                                    isNoStock
                                                                        ? "bg-semantic-red text-white hover:bg-semantic-red/90 border-transparent"
                                                                        : "bg-semantic-yellow text-yellow-900 hover:bg-semantic-yellow/90 border-transparent"
                                                                )}
                                                            >
                                                                {isNoStock ? "Esgotado" : "Baixo"}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNome(e.target.value)}
                                placeholder="Ex: Massa Pão de Queijo 1kg"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Código *"
                                    value={newCodigo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCodigo(e.target.value)}
                                    placeholder="Ex: PDQ1KG"
                                />
                                <Input
                                    label="Apelido (Sigla)"
                                    value={newApelido}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewApelido(e.target.value)}
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPreco(e.target.value)}
                                    placeholder="0.00"
                                />

                                <Input
                                    label="Custo *"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={newCusto}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCusto(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <Input
                                label="Unidade"
                                value={newUnidade}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUnidade(e.target.value)}
                                placeholder="un, kg, etc"
                            />

                            <Input
                                label="Estoque Mínimo (Alerta)"
                                type="number"
                                min="0"
                                value={newEstoqueMinimo}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEstoqueMinimo(e.target.value)}
                                placeholder="10"
                                helperText="Quantidade para gerar alerta de baixo estoque"
                            />

                            {/* Margem Preview */}
                            {newPreco && newCusto && (
                                <div className={`p - 3 rounded - lg ${newMargem < 0 ? 'bg-danger-50' : 'bg-success-50'} `}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Margem de Lucro:</span>
                                        <span className={`font - bold ${newMargem < 0 ? 'text-danger-600' : 'text-success-600'} `}>
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNome(e.target.value)}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Código"
                                        value={editCodigo}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCodigo(e.target.value)}
                                    />
                                    <Input
                                        label="Apelido (Sigla)"
                                        value={editApelido}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditApelido(e.target.value)}
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
                                <div className={`p - 3 rounded - lg ${editMargem < 0 ? 'bg-danger-50' : 'bg-success-50'} `}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">Margem de Lucro:</span>
                                        <span className={`font - bold ${editMargem < 0 ? 'text-danger-600' : 'text-success-600'} `}>
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

                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <span className="block text-sm font-medium text-gray-700">Imagem do Produto</span>

                                    <div className="flex items-center gap-4">
                                        {/* Preview */}
                                        <div className="relative h-24 w-24 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                                            {editImagemUrl ? (
                                                <img
                                                    src={editImagemUrl}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-8 w-8 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Upload Button */}
                                        <div className="flex-1">
                                            <label className="block w-full">
                                                <span className="sr-only">Escolher imagem</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    disabled={uploadingImage}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0]
                                                        if (!file) {
                                                            console.log('DEBUG: Nenhum arquivo selecionado')
                                                            return
                                                        }

                                                        console.log('DEBUG: Arquivo selecionado:', file.name, file.size, file.type)

                                                        // Immediate local preview
                                                        const localUrl = URL.createObjectURL(file)
                                                        setEditImagemUrl(localUrl)

                                                        try {
                                                            setUploadingImage(true)
                                                            console.log('DEBUG: Iniciando upload...')
                                                            const url = await produtoService.uploadImage(file)
                                                            console.log('DEBUG: Upload concluído, URL:', url)

                                                            // Update with real URL and save reference
                                                            setEditImagemUrl(url)
                                                            console.log('DEBUG: Salvando referência no banco...')
                                                            await produtoService.addImageReference(editingProduto.id, url)
                                                            console.log('DEBUG: Referência salva com sucesso!')

                                                            toast.success('Imagem atualizada com sucesso!')
                                                        } catch (error) {
                                                            console.error('DEBUG: Erro no processo:', error)
                                                            toast.error('Erro ao fazer upload da imagem')
                                                        } finally {
                                                            setUploadingImage(false)
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-primary-50 file:text-primary-700
                                                        hover:file:bg-primary-100
                                                        cursor-pointer disabled:opacity-50"
                                                />
                                            </label>
                                            {uploadingImage && <p className="text-xs text-primary-600 mt-1">Enviando...</p>}
                                        </div>
                                    </div>
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
            </div>
        </div>
    )
}

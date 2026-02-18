import { supabase } from '../lib/supabase'
import type {
    ProdutoInsert,
    ProdutoUpdate
} from '../types/database'
import type { DomainProduto } from '../types/domain'

export class ProdutoService {
    /* MAPPERS */
    private toDomain(row: any): DomainProduto {
        return {
            id: row.id,
            nome: row.nome,
            codigo: row.codigo,
            preco: row.preco,
            unidade: row.unidade,
            apelido: row.apelido,
            ativo: row.ativo,
            custo: row.custo,
            estoqueAtual: row.estoque_atual ?? 0,
            estoqueMinimo: row.estoque_minimo ?? 0,
            criadoEm: row.criado_em,
            atualizadoEm: row.atualizado_em,
            imagemUrl: row.sis_imagens_produto?.[0]?.url
        }
    }

    private toPersistence(domain: Partial<DomainProduto>): ProdutoUpdate {
        const update: ProdutoUpdate = {}
        if (domain.nome !== undefined) update.nome = domain.nome
        if (domain.codigo !== undefined) update.codigo = domain.codigo
        if (domain.preco !== undefined) update.preco = domain.preco
        if (domain.unidade !== undefined) update.unidade = domain.unidade
        if (domain.apelido !== undefined) update.apelido = domain.apelido
        if (domain.ativo !== undefined) update.ativo = domain.ativo
        if (domain.custo !== undefined) update.custo = domain.custo
        if (domain.estoqueAtual !== undefined) update.estoque_atual = domain.estoqueAtual
        if (domain.estoqueMinimo !== undefined) update.estoque_minimo = domain.estoqueMinimo

        return update
    }

    /* CRUD */
    async getAll(includeInactive: boolean = false): Promise<DomainProduto[]> {
        let query = supabase
            .from('produtos')
            .select('*, sis_imagens_produto(url)')
            .order('nome')

        if (!includeInactive) {
            query = query.eq('ativo', true)
        }

        const { data, error } = await query

        if (error) {
            console.error('Erro ao buscar produtos:', error)
            throw new Error(`Erro ao buscar produtos: ${error.message}`)
        }

        return (data || []).map(this.toDomain)
    }

    async getById(id: string): Promise<DomainProduto | null> {
        const { data, error } = await supabase
            .from('produtos')
            .select('*, sis_imagens_produto(url)')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Erro ao buscar produto por ID:', error)
            return null
        }

        return this.toDomain(data)
    }

    async create(data: ProdutoInsert): Promise<DomainProduto> {
        const { data: created, error } = await supabase
            .from('produtos')
            .insert(data)
            .select()
            .single()

        if (error) {
            console.error('Erro ao criar produto:', error)
            throw new Error(`Erro ao criar produto: ${error.message}`)
        }

        return this.toDomain(created)
    }

    async update(id: string, data: Partial<DomainProduto>): Promise<DomainProduto> {
        const persistenceData = this.toPersistence(data)

        const { data: updated, error } = await supabase
            .from('produtos')
            .update(persistenceData)
            .eq('id', id)
            .select('*, sis_imagens_produto(url)')
            .single()

        if (error) {
            console.error('Erro ao atualizar produto:', error)
            throw new Error(`Erro ao atualizar produto: ${error.message}`)
        }

        return this.toDomain(updated)
    }

    async updateEstoque(id: string, quantidade: number): Promise<DomainProduto> {
        const { data: updated, error } = await supabase
            .from('produtos')
            .update({ estoque_atual: quantidade })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Erro ao atualizar estoque:', error)
            throw new Error(`Erro ao atualizar estoque: ${error.message}`)
        }

        return this.toDomain(updated)
    }

    /* IMAGENS */
    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

        console.log('DEBUG: Iniciando upload:', fileName, 'tamanho:', file.size)

        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('products')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error('DEBUG: Erro no upload:', uploadError)
            throw uploadError
        }

        console.log('DEBUG: Upload sucesso:', uploadData)

        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(fileName)

        console.log('DEBUG: URL gerada:', data.publicUrl)
        return data.publicUrl
    }

    async addImageReference(produtoId: string, url: string): Promise<void> {
        console.log('DEBUG: addImageReference', { produtoId, url });
        // Primeiro remove imagens anteriores (opcional, assumindo 1 imagem por produto por enquanto no CRM)
        // Mas o schema é 1:N. Vamos adicionar e se quiser substituir, a UI/Lógica que decida.
        // O user pediu "carregar uma imagem e aparecer a prévia". 
        // Vamos manter simples: Deleta anteriores e insere nova para manter 1:1 "principal".

        const { error: deleteError } = await supabase
            .from('sis_imagens_produto')
            .delete()
            .eq('produto_id', produtoId)

        if (deleteError) {
            console.error('Erro ao limpar imagens antigas:', deleteError)
            // Não impede o fluxo, apenas loga
        }

        console.log('DEBUG: Inserting image...', { produtoId, url });
        const { data, error } = await supabase
            .from('sis_imagens_produto')
            .insert({
                produto_id: produtoId,
                url,
                ordem: 0,
                tipo: 'internal',
                ativo: true
            })
            .select()

        console.log('DEBUG: Insert result', { data, error });

        if (error) {
            throw error
        }
    }
}

export const produtoService = new ProdutoService()

import { supabase } from '../lib/supabase'
import type {
    ProdutoInsert,
    ProdutoUpdate
} from '../types/database'
import type { DomainProduto, CreateProduto, UpdateProduto } from '../types/domain'
import { toDomainProduto } from './mappers'

export class ProdutoService {
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

        return (data || []).map(toDomainProduto)
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

        return toDomainProduto(data)
    }

    async create(data: CreateProduto): Promise<DomainProduto> {
        // Map domain to database insert
        const dbInsert: ProdutoInsert = {
            nome: data.nome,
            codigo: data.codigo,
            preco: data.preco,
            custo: data.custo,
            unidade: data.unidade || 'un',
            apelido: data.apelido || null,
            estoque_minimo: data.estoqueMinimo || 0,
            ativo: true
        }

        const { data: created, error } = await supabase
            .from('produtos')
            .insert(dbInsert)
            .select('*, sis_imagens_produto(url)')
            .single()

        if (error) {
            console.error('Erro ao criar produto:', error)
            throw new Error(`Erro ao criar produto: ${error.message}`)
        }

        return toDomainProduto(created)
    }

    async update(id: string, data: UpdateProduto): Promise<DomainProduto> {
        const dbUpdate: ProdutoUpdate = {}
        if (data.nome !== undefined) dbUpdate.nome = data.nome
        if (data.codigo !== undefined) dbUpdate.codigo = data.codigo
        if (data.preco !== undefined) dbUpdate.preco = data.preco
        if (data.custo !== undefined) dbUpdate.custo = data.custo
        if (data.unidade !== undefined) dbUpdate.unidade = data.unidade
        if (data.apelido !== undefined) dbUpdate.apelido = data.apelido
        if (data.estoqueMinimo !== undefined) dbUpdate.estoque_minimo = data.estoqueMinimo
        if (data.ativo !== undefined) dbUpdate.ativo = data.ativo
        if (data.preco_ancoragem !== undefined) dbUpdate.preco_ancoragem = data.preco_ancoragem

        const { data: updated, error } = await supabase
            .from('produtos')
            .update(dbUpdate)
            .eq('id', id)
            .select('*, sis_imagens_produto(url)')
            .single()

        if (error) {
            console.error('Erro ao atualizar produto:', error)
            throw new Error(`Erro ao atualizar produto: ${error.message}`)
        }

        return toDomainProduto(updated)
    }

    async updateEstoque(id: string, quantidade: number): Promise<DomainProduto> {
        const { data: updated, error } = await supabase
            .from('produtos')
            .update({ estoque_atual: quantidade })
            .eq('id', id)
            .select('*, sis_imagens_produto(url)')
            .single()

        if (error) {
            console.error('Erro ao atualizar estoque:', error)
            throw new Error(`Erro ao atualizar estoque: ${error.message}`)
        }

        return toDomainProduto(updated)
    }

    /* IMAGENS */
    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error('DEBUG: Erro no upload:', uploadError)
            throw uploadError
        }

        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(fileName)

        return data.publicUrl
    }

    async addImageReference(produtoId: string, url: string): Promise<void> {
        // Primeiro remove imagens anteriores
        await supabase
            .from('sis_imagens_produto')
            .delete()
            .eq('produto_id', produtoId)

        const { error } = await supabase
            .from('sis_imagens_produto')
            .insert({
                produto_id: produtoId,
                url,
                ordem: 0,
                tipo: 'internal',
                ativo: true
            })

        if (error) {
            throw error
        }
    }
}

export const produtoService = new ProdutoService()

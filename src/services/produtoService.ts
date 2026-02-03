import { supabase } from '../lib/supabase'
import type {
    Produto,
    ProdutoInsert,
    ProdutoUpdate
} from '../types/database'
import type { DomainProduto } from '../types/domain'

export class ProdutoService {
    /* MAPPERS */
    private toDomain(row: Produto): DomainProduto {
        return {
            id: row.id,
            nome: row.nome,
            codigo: row.codigo,
            preco: row.preco,
            unidade: row.unidade,
            apelido: row.apelido,
            ativo: row.ativo,
            custo: row.custo,
            estoqueAtual: row.estoque_atual,
            estoqueMinimo: row.estoque_minimo,
            criadoEm: row.criado_em,
            atualizadoEm: row.atualizado_em
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
            .select('*')
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
            .select('*')
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
            .select()
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
}

export const produtoService = new ProdutoService()

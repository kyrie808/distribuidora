import { supabase } from '../lib/supabase'
import type {
    Contato,
    ContatoInsert,
    ContatoUpdate,
    ContatoComIndicador
} from '../types/database'
import type { DomainContato } from '../types/domain'
import { getCoordinates } from '../utils/geocoding'

export class ContatoService {
    /* MAPPERS */
    private toDomain(row: Contato | ContatoComIndicador): DomainContato {
        return {
            id: row.id,
            nome: row.nome,
            apelido: row.apelido,
            telefone: row.telefone,
            tipo: row.tipo as 'B2C' | 'B2B',
            subtipo: row.subtipo,
            status: row.status as 'lead' | 'cliente' | 'inativo',
            origem: row.origem as 'direto' | 'indicacao',
            indicadoPorId: row.indicado_por_id,
            endereco: row.endereco,
            cep: row.cep,
            bairro: row.bairro,
            lat: row.latitude,
            lng: row.longitude,
            observacoes: row.observacoes,
            criadoEm: row.criado_em,
            atualizadoEm: row.atualizado_em || row.criado_em,
            // New address fields
            logradouro: row.logradouro,
            numero: row.numero,
            complemento: row.complemento,
            cidade: row.cidade,
            uf: row.uf,
            indicador: ('indicador' in row && row.indicador && typeof row.indicador === 'object' && 'id' in row.indicador) ? {
                id: (row.indicador as any).id,
                nome: (row.indicador as any).nome
            } : null
        }
    }

    private toPersistence(domain: Partial<DomainContato>): ContatoUpdate {
        const update: ContatoUpdate = {}
        if (domain.nome !== undefined) update.nome = domain.nome
        if (domain.apelido !== undefined) update.apelido = domain.apelido
        if (domain.telefone !== undefined) update.telefone = domain.telefone
        // Type casting needed as domain usage matches DB strings but types are strict/loose
        if (domain.tipo !== undefined) update.tipo = domain.tipo as any
        if (domain.subtipo !== undefined) update.subtipo = domain.subtipo
        if (domain.status !== undefined) update.status = domain.status as any
        if (domain.origem !== undefined) update.origem = domain.origem as any
        if (domain.indicadoPorId !== undefined) update.indicado_por_id = domain.indicadoPorId
        if (domain.endereco !== undefined) update.endereco = domain.endereco
        if (domain.cep !== undefined) update.cep = domain.cep
        if (domain.bairro !== undefined) update.bairro = domain.bairro
        if (domain.lat !== undefined) update.latitude = domain.lat
        if (domain.lng !== undefined) update.longitude = domain.lng
        if (domain.observacoes !== undefined) update.observacoes = domain.observacoes

        // New address fields
        if (domain.logradouro !== undefined) update.logradouro = domain.logradouro
        if (domain.numero !== undefined) update.numero = domain.numero
        if (domain.complemento !== undefined) update.complemento = domain.complemento
        if (domain.cidade !== undefined) update.cidade = domain.cidade
        if (domain.uf !== undefined) update.uf = domain.uf

        return update
    }

    /* CRUD */
    async func(query: string = '', tipo?: string, status?: string): Promise<DomainContato[]> {
        let builder = supabase
            .from('contatos')
            .select(`
                *,
                indicador:contatos!indicado_por_id (
                    id,
                    nome
                )
            `)
            .order('criado_em', { ascending: false })

        if (query) {
            builder = builder.or(`nome.ilike.%${query}%,telefone.ilike.%${query}%,apelido.ilike.%${query}%`)
        }
        if (tipo && tipo !== 'todos') {
            builder = builder.eq('tipo', tipo)
        }
        if (status && status !== 'todos') {
            builder = builder.eq('status', status)
        }

        const { data, error } = await builder

        if (error) {
            console.error('Erro ao buscar contatos:', error)
            throw new Error(`Erro ao buscar contatos: ${error.message}`)
        }

        return (data || []).map(this.toDomain)
    }

    async getById(id: string): Promise<DomainContato | null> {
        const { data, error } = await supabase
            .from('contatos')
            .select(`
                *,
                indicador:contatos!indicado_por_id (
                    id,
                    nome
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Erro ao buscar contato por ID:', error)
            return null
        }

        return this.toDomain(data)
    }

    async create(data: ContatoInsert): Promise<DomainContato> {
        // Tentar geocoding se houver endereço mas não coordenadas
        if (data.endereco && (!data.latitude || !data.longitude)) {
            try {
                // Adiciona cidade/estado fixos se necessário ou confia no input completo
                const coords = await getCoordinates(data.endereco)
                if (coords) {
                    data.latitude = coords.lat
                    data.longitude = coords.lng
                }
            } catch (e) {
                console.warn('Falha no geocoding durante criação:', e)
                // Não impede a criação
            }
        }

        const { data: created, error } = await supabase
            .from('contatos')
            .insert(data)
            .select(`
                *,
                indicador:contatos!indicado_por_id (
                    id,
                    nome
                )
            `)
            .single()

        if (error) {
            console.error('Erro ao criar contato:', error)
            throw new Error(`Erro ao criar contato: ${error.message}`)
        }

        return this.toDomain(created)
    }

    async update(id: string, data: Partial<DomainContato>): Promise<DomainContato> {
        const persistenceData = this.toPersistence(data)

        // Se endereço mudou e coordenadas não foram fornecidas, tentar geocoding
        if (data.endereco && persistenceData.latitude === undefined) {
            try {
                const coords = await getCoordinates(data.endereco)
                if (coords) {
                    persistenceData.latitude = coords.lat
                    persistenceData.longitude = coords.lng
                }
            } catch (e) {
                console.warn('Falha no geocoding durante atualização:', e)
            }
        }

        const { data: updated, error } = await supabase
            .from('contatos')
            .update(persistenceData)
            .eq('id', id)
            .select(`
                *,
                indicador:contatos!indicado_por_id (
                    id,
                    nome
                )
            `)
            .single()

        if (error) {
            console.error('Erro ao atualizar contato:', error)
            throw new Error(`Erro ao atualizar contato: ${error.message}`)
        }

        return this.toDomain(updated)
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('contatos')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Erro ao deletar contato:', error)
            throw new Error(`Erro ao deletar contato: ${error.message}`)
        }
    }
}

export const contatoService = new ContatoService()

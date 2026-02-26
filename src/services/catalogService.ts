import { supabase } from '../lib/supabase'
import type { DomainCatalogOrder } from '../types/domain'
import { toDomainCatalogOrder } from './mappers'

export const catalogService = {
    async getPedidosByContato(contatoId: string): Promise<DomainCatalogOrder[]> {
        const { data, error } = await supabase
            .from('cat_pedidos')
            .select(`
                *,
                itens:cat_itens_pedido(*)
            `)
            .eq('contato_id', contatoId)
            .order('criado_em', { ascending: false })

        if (error) throw error
        return (data || []).map(order => toDomainCatalogOrder(order))
    }
}

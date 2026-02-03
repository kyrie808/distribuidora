import type { VendaComItens } from './vendaService'
import type {
    DomainVenda,
    DomainItemVenda,
    DomainContato,
    DomainPagamento,
    DomainProduto
} from '../types/domain'
import type { PagamentoVenda } from '../types/database'

export const toDomainContato = (dbContato: any): DomainContato => {
    return {
        id: dbContato.id,
        nome: dbContato.nome,
        telefone: dbContato.telefone,
        origem: dbContato.origem,
        status: dbContato.status,
        tipo: dbContato.tipo || 'B2C',
        indicadoPorId: dbContato.indicado_por_id,
        indicador: dbContato.indicador ? {
            id: dbContato.indicador.id,
            nome: dbContato.indicador.nome
        } : null,
        criadoEm: dbContato.criado_em || new Date().toISOString(),
        atualizadoEm: dbContato.atualizado_em || new Date().toISOString(),
        bairro: dbContato.bairro || null,
        cep: dbContato.cep || null,
        endereco: dbContato.endereco || null,
        lat: dbContato.latitude || null,
        lng: dbContato.longitude || null,
        observacoes: dbContato.observacao || null
    }
}

export const toDomainProduto = (dbProduto: any): DomainProduto => {
    return {
        id: dbProduto.id,
        nome: dbProduto.nome,
        codigo: dbProduto.codigo,
        preco: Number(dbProduto.preco),
        unidade: dbProduto.unidade || 'un',
        ativo: dbProduto.ativo ?? true,
        custo: Number(dbProduto.custo || 0),
        estoqueAtual: Number(dbProduto.estoque_atual || 0),
        estoqueMinimo: Number(dbProduto.estoque_minimo || 0),
        criadoEm: dbProduto.criado_em || new Date().toISOString(),
        atualizadoEm: dbProduto.atualizado_em || new Date().toISOString(),
        apelido: dbProduto.apelido || null
    }
}

export const toDomainItemVenda = (dbItem: any): DomainItemVenda => {
    return {
        id: dbItem.id,
        produtoId: dbItem.produto_id,
        // Optional handling if product is joined
        produto: dbItem.produto ? toDomainProduto(dbItem.produto) : undefined,
        quantidade: Number(dbItem.quantidade),
        precoUnitario: Number(dbItem.preco_unitario),
        subtotal: Number(dbItem.subtotal)
    }
}

export const toDomainPagamento = (dbPagamento: PagamentoVenda): DomainPagamento => {
    return {
        id: dbPagamento.id,
        vendaId: dbPagamento.venda_id,
        valor: Number(dbPagamento.valor),
        data: dbPagamento.data,
        metodo: dbPagamento.metodo as any,
        status: (dbPagamento as any).status || 'pago',
        observacao: dbPagamento.observacao
    }
}

export const toDomainVenda = (dbVenda: VendaComItens): DomainVenda => {
    return {
        id: dbVenda.id,
        contatoId: dbVenda.contato_id,
        contato: dbVenda.contato ? toDomainContato(dbVenda.contato) : undefined,
        data: dbVenda.data,
        total: Number(dbVenda.total),
        custoTotal: Number(dbVenda.custo_total || 0),
        status: dbVenda.status as any,
        pago: dbVenda.pago,
        formaPagamento: dbVenda.forma_pagamento as any,
        taxaEntrega: Number(dbVenda.taxa_entrega),
        itens: (dbVenda.itens || []).map(toDomainItemVenda),
        pagamentos: (dbVenda.pagamentos || []).map(toDomainPagamento),
        criadoEm: dbVenda.criado_em,
        valorPago: (dbVenda.pagamentos || []).reduce((acc, p) => acc + Number(p.valor), 0)
    }
}

import type {
    DomainVenda,
    DomainItemVenda,
    DomainContato,
    DomainPagamento,
    DomainProduto,
    DomainPurchaseOrder,
    DomainPurchaseOrderItem,
    DomainPurchaseOrderWithItems,
    PurchaseOrderStatus,
    PurchaseOrderPaymentStatus
} from '../types/domain'

export const toDomainContato = (dbContato: any): DomainContato => {
    if (!dbContato) throw new Error('Cannot map null contact')
    return {
        id: dbContato.id,
        nome: dbContato.nome,
        telefone: dbContato.telefone || '',
        email: dbContato.email || null,
        apelido: dbContato.apelido || null,
        origem: dbContato.origem || 'direto',
        status: dbContato.status || 'lead',
        tipo: dbContato.tipo || 'B2C',
        subtipo: dbContato.subtipo || null,
        indicadoPorId: dbContato.indicado_por_id,
        indicador: dbContato.indicador ? {
            id: dbContato.indicador.id,
            nome: dbContato.indicador.nome
        } : null,
        criadoEm: dbContato.criado_em || new Date().toISOString(),
        atualizadoEm: dbContato.atualizado_em || dbContato.criado_em || new Date().toISOString(),
        bairro: dbContato.bairro || null,
        cep: dbContato.cep || null,
        endereco: dbContato.endereco || null,
        logradouro: dbContato.logradouro || null,
        numero: dbContato.numero || null,
        complemento: dbContato.complemento || null,
        cidade: dbContato.cidade || null,
        uf: dbContato.uf || null,
        lat: dbContato.latitude || null,
        lng: dbContato.longitude || null,
        observacoes: dbContato.observacoes || dbContato.observacao || null
    }
}

export const toDomainProduto = (dbProduto: any): DomainProduto => {
    if (!dbProduto) throw new Error('Cannot map null product')
    return {
        id: dbProduto.id,
        nome: dbProduto.nome,
        codigo: dbProduto.codigo,
        preco: Number(dbProduto.preco || 0),
        unidade: dbProduto.unidade || 'un',
        ativo: dbProduto.ativo ?? true,
        custo: Number(dbProduto.custo || 0),
        estoqueAtual: Number(dbProduto.estoque_actual || 0),
        estoqueMinimo: Number(dbProduto.estoque_minimo || 0),
        criadoEm: dbProduto.criado_em || new Date().toISOString(),
        atualizadoEm: dbProduto.atualizado_em || dbProduto.criado_em || new Date().toISOString(),
        apelido: dbProduto.apelido || null,
        imagemUrl: dbProduto.sis_imagens_produto?.[0]?.url
    }
}

export const toDomainItemVenda = (dbItem: any): DomainItemVenda => {
    return {
        id: dbItem.id,
        produtoId: dbItem.produto_id,
        produto: dbItem.produto ? toDomainProduto(dbItem.produto) : undefined,
        quantidade: Number(dbItem.quantidade || 0),
        precoUnitario: Number(dbItem.preco_unitario || 0),
        subtotal: Number(dbItem.subtotal || 0)
    }
}

export const toDomainPagamento = (dbPagamento: any): DomainPagamento => {
    return {
        id: dbPagamento.id,
        vendaId: dbPagamento.venda_id,
        valor: Number(dbPagamento.valor || 0),
        data: dbPagamento.data,
        metodo: dbPagamento.metodo as any,
        status: (dbPagamento as any).status || 'pago',
        observacao: dbPagamento.observacao
    }
}

export const toDomainVenda = (dbVenda: any): DomainVenda => {
    return {
        id: dbVenda.id,
        contatoId: dbVenda.contato_id,
        contato: dbVenda.contato ? toDomainContato(dbVenda.contato) : undefined,
        data: dbVenda.data,
        total: Number(dbVenda.total || 0),
        custoTotal: Number(dbVenda.custo_total || 0),
        status: dbVenda.status as any,
        pago: dbVenda.pago ?? false,
        formaPagamento: dbVenda.forma_pagamento as any,
        taxaEntrega: Number(dbVenda.taxa_entrega || 0),
        itens: (dbVenda.itens || []).map(toDomainItemVenda),
        pagamentos: (dbVenda.pagamentos || []).map(toDomainPagamento),
        criadoEm: dbVenda.criado_em,
        valorPago: (dbVenda.pagamentos || []).reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0)
    }
}

/* PURCHASE ORDERS MAPPERS */

export const toDomainPurchaseOrderItem = (dbItem: any): DomainPurchaseOrderItem => {
    return {
        id: dbItem.id,
        productId: dbItem.product_id,
        product: dbItem.product ? toDomainProduto(dbItem.product) : undefined,
        quantity: Number(dbItem.quantity || 0),
        unitCost: Number(dbItem.unit_cost || 0),
        totalCost: Number(dbItem.total_cost || (Number(dbItem.quantity || 0) * Number(dbItem.unit_cost || 0)))
    }
}

export const toDomainPurchaseOrder = (dbOrder: any): DomainPurchaseOrder => {
    return {
        id: dbOrder.id,
        fornecedorId: dbOrder.fornecedor_id,
        fornecedor: dbOrder.fornecedor ? {
            id: dbOrder.fornecedor_id,
            nome: dbOrder.fornecedor.nome
        } : undefined,
        orderDate: dbOrder.order_date,
        status: dbOrder.status as PurchaseOrderStatus,
        paymentStatus: dbOrder.payment_status as PurchaseOrderPaymentStatus,
        totalAmount: Number(dbOrder.total_amount || 0),
        amountPaid: Number(dbOrder.amount_paid || 0),
        notes: dbOrder.notes,
        dataRecebimento: dbOrder.data_recebimento,
        createdAt: dbOrder.created_at
    }
}

export const toDomainPurchaseOrderWithItems = (dbOrder: any): DomainPurchaseOrderWithItems => {
    return {
        ...toDomainPurchaseOrder(dbOrder),
        items: (dbOrder.items || []).map(toDomainPurchaseOrderItem),
        payments: dbOrder.payments || []
    }
}

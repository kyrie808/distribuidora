// Status de contato
export const CONTATO_STATUS = {
    lead: 'lead',
    cliente: 'cliente',
    inativo: 'inativo',
} as const

export const CONTATO_STATUS_LABELS: Record<string, string> = {
    lead: 'Lead',
    cliente: 'Cliente',
    inativo: 'Inativo',
}

export const CONTATO_STATUS_COLORS: Record<string, string> = {
    lead: 'warning',
    cliente: 'success',
    inativo: 'gray',
}

// Tipo de contato
export const CONTATO_TIPO = {
    B2C: 'B2C',
    B2B: 'B2B',
} as const

export const CONTATO_TIPO_LABELS: Record<string, string> = {
    B2C: 'Pessoa Física',
    B2B: 'Estabelecimento',
}

// Subtipos B2B
export const SUBTIPOS_B2B = [
    'padaria',
    'lanchonete',
    'cantina',
    'restaurante',
    'cafeteria',
    'mercado',
    'outro',
] as const

export const SUBTIPOS_B2B_LABELS: Record<string, string> = {
    padaria: 'Padaria',
    lanchonete: 'Lanchonete',
    cantina: 'Cantina',
    restaurante: 'Restaurante',
    cafeteria: 'Cafeteria',
    mercado: 'Mercado',
    outro: 'Outro',
}

// Origem do contato
export const CONTATO_ORIGEM = {
    direto: 'direto',
    indicacao: 'indicacao',
} as const

export const CONTATO_ORIGEM_LABELS: Record<string, string> = {
    direto: 'Direto',
    indicacao: 'Indicação',
}

// Status de venda
export const VENDA_STATUS = {
    pendente: 'pendente',
    entregue: 'entregue',
    cancelada: 'cancelada',
} as const

export const VENDA_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    entregue: 'Entregue',
    cancelada: 'Cancelada',
}

export const VENDA_STATUS_COLORS: Record<string, string> = {
    pendente: 'warning',
    entregue: 'success',
    cancelada: 'danger',
}

// Formas de pagamento
export const FORMA_PAGAMENTO = {
    pix: 'pix',
    dinheiro: 'dinheiro',
    cartao: 'cartao',
    fiado: 'fiado',
    brinde: 'brinde',
} as const

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    cartao: 'Cartão',
    fiado: 'Fiado',
    brinde: 'Brinde',
}

export const FORMA_PAGAMENTO_ICONS: Record<string, string> = {
    pix: '💸',
    dinheiro: '💵',
    cartao: '💳',
    fiado: '📝',
    brinde: '🎁',
}

// Configurações padrão
export const CONFIG_DEFAULTS = {
    cicloRecompraB2C: 15,
    cicloRecompraB2B: 7,
    taxaEntregaPadrao: 0,
}

// Limites de recompra
export const RECOMPRA_LIMITES = {
    verde: 0.5,   // Até 50% do ciclo
    amarelo: 0.8, // 50-80% do ciclo
    vermelho: 1,  // Acima de 100% do ciclo
}

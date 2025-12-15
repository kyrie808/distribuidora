import { z } from 'zod'
import { cleanPhone, isValidPhone } from '../utils/formatters'

// Schema de validação para contato
export const contatoSchema = z.object({
    nome: z
        .string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres'),
    telefone: z
        .string()
        .min(1, 'Telefone é obrigatório')
        .refine((val) => isValidPhone(val), 'Telefone inválido')
        .transform((val) => cleanPhone(val)),
    tipo: z.enum(['B2C', 'B2B']),
    subtipo: z.string().optional().nullable(),
    status: z.enum(['lead', 'cliente', 'inativo']),
    origem: z.enum(['direto', 'indicacao']),
    indicado_por_id: z.string().uuid().optional().nullable(),
    endereco: z.string().optional().nullable(),
    bairro: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
})

export type ContatoFormData = z.infer<typeof contatoSchema>

// Schema para busca/filtros
export const contatoFiltrosSchema = z.object({
    busca: z.string().optional(),
    tipo: z.enum(['B2C', 'B2B', 'todos']).default('todos'),
    status: z.enum(['lead', 'cliente', 'inativo', 'todos']).default('todos'),
    origem: z.enum(['direto', 'indicacao', 'todos']).default('todos'),
})

export type ContatoFiltros = z.infer<typeof contatoFiltrosSchema>

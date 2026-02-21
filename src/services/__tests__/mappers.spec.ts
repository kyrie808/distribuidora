import { describe, it, expect } from 'vitest'
import { toDomainContato, toDomainProduto, toDomainItemVenda, toDomainPagamento, toDomainVenda } from '../mappers'
import type { PagamentoVenda, VendaComItens } from '../../types/database'

describe('Domain Mappers', () => {
    describe('toDomainContato', () => {
        it('should map a database contact to a domain contact correctly', () => {
            const dbContato = {
                id: '123',
                nome: 'João Silva',
                telefone: '999999999',
                origem: 'direto',
                status: 'cliente',
                tipo: 'B2B',
                indicado_por_id: null,
                criado_em: '2023-01-01T00:00:00.000Z',
                atualizado_em: '2023-01-01T00:00:00.000Z',
                bairro: 'Centro',
                cep: '12345678',
                endereco: 'Rua A, 123',
                latitude: -23.5505,
                longitude: -46.6333,
                observacao: 'Cliente VIP'
            }

            const result = toDomainContato(dbContato)

            expect(result.id).toBe('123')
            expect(result.nome).toBe('João Silva')
            expect(result.tipo).toBe('B2B')
            expect(result.lat).toBe(-23.5505)
            expect(result.lng).toBe(-46.6333)
            expect(result.observacoes).toBe('Cliente VIP')
        })

        it('should handle optional and missing fields gracefully', () => {
            const dbContato = {
                id: '456',
                nome: 'Maria Souza',
                // Missing tipo, bairro, cep, endereco, latitude, longitude, observacao
            }

            const result = toDomainContato(dbContato)

            expect(result.id).toBe('456')
            expect(result.nome).toBe('Maria Souza')
            expect(result.tipo).toBe('B2C') // Default fallback
            expect(result.bairro).toBeNull()
            expect(result.lat).toBeNull()
            expect(result.observacoes).toBeNull()
            expect(result.criadoEm).toBeDefined()
        })
    })

    describe('toDomainProduto', () => {
        it('should map product with numeric assertions correctly', () => {
            const dbProduto = {
                id: 'p1',
                nome: 'Massa Fresca',
                codigo: 'MF01',
                preco: '15.50', // Sometimes DB returns numeric as string
                unidade: 'kg',
                ativo: true,
                custo: '10.00',
                estoque_atual: '50',
                estoque_minimo: '10'
            }

            const result = toDomainProduto(dbProduto)

            expect(result.id).toBe('p1')
            expect(result.preco).toBe(15.50)
            expect(typeof result.preco).toBe('number')
            expect(result.custo).toBe(10)
            expect(result.estoqueAtual).toBe(50)
            expect(result.estoqueMinimo).toBe(10)
        })

        it('should handle null numeric values gracefully', () => {
            const dbProduto = {
                id: 'p2',
                nome: 'Molho',
                codigo: 'ML01',
                preco: 5.00,
                // Missing custo, estoque_atual, estoque_minimo
            }

            const result = toDomainProduto(dbProduto)

            expect(result.custo).toBe(0)
            expect(result.estoqueAtual).toBe(0)
            expect(result.estoqueMinimo).toBe(0)
            expect(result.unidade).toBe('un')
        })
    })

    describe('toDomainItemVenda', () => {
        it('should map numeric values and ignore missing expanded product', () => {
            const dbItem = {
                id: 'item1',
                produto_id: 'prod1',
                quantidade: '2',
                preco_unitario: '10.50',
                subtotal: '21.00'
            }

            const result = toDomainItemVenda(dbItem)

            expect(result.id).toBe('item1')
            expect(result.produtoId).toBe('prod1')
            expect(result.quantidade).toBe(2)
            expect(result.precoUnitario).toBe(10.50)
            expect(result.subtotal).toBe(21)
            expect(result.produto).toBeUndefined()
        })
    })

    describe('toDomainPagamento', () => {
        it('should map payment records converting values to numbers', () => {
            const dbPagamento: PagamentoVenda = {
                id: 'pag1',
                venda_id: 'venda1',
                valor: 150.75,
                data: '2023-10-01',
                metodo: 'pix',
                observacao: 'Sinal',
                criado_em: '2023-10-01T10:00:00Z',
                atualizado_em: '2023-10-01T10:00:00Z',
                created_by: null,
                updated_by: null
            } as any

            const result = toDomainPagamento(dbPagamento)

            expect(result.id).toBe('pag1')
            expect(result.vendaId).toBe('venda1')
            expect(result.valor).toBe(150.75)
            expect(result.metodo).toBe('pix')
            expect(result.observacao).toBe('Sinal')
            expect(result.status).toBe('pago') // Default injected by mapper
        })
    })

    describe('toDomainVenda', () => {
        it('should aggregate fully loaded Venda with items and pagamentos calculating valorPago', () => {
            const dbVenda = {
                id: 'v1',
                contato_id: 'c1',
                data: '2023-10-01',
                total: '200.00',
                custo_total: '100.00',
                status: 'entregue',
                pago: true,
                forma_pagamento: 'pix',
                taxa_entrega: '15.00',
                criado_em: '2023-10-01T10:00:00Z',
                atualizado_em: '2023-10-01T10:00:00Z',
                created_by: null,
                updated_by: null,
                data_prevista_pagamento: null,
                observacoes: null,
                origem: 'manual',
                // Nested models
                itens: [
                    { id: 'i1', produto_id: 'p1', quantidade: 1, preco_unitario: 100, subtotal: 100 } as any,
                    { id: 'i2', produto_id: 'p2', quantidade: 2, preco_unitario: 50, subtotal: 100 } as any
                ],
                pagamentos: [
                    { id: 'pag1', venda_id: 'v1', valor: 150, metodo: 'pix', data: '2023-10-01' } as any,
                    { id: 'pag2', venda_id: 'v1', valor: 50, metodo: 'dinheiro', data: '2023-10-01' } as any
                ],
                contato: { id: 'c1', nome: 'Cliente Teste' } as any
            } as unknown as VendaComItens

            const result = toDomainVenda(dbVenda)

            expect(result.id).toBe('v1')
            expect(result.total).toBe(200)
            expect(result.custoTotal).toBe(100)
            expect(result.taxaEntrega).toBe(15)
            expect(result.itens.length).toBe(2)
            expect(result.pagamentos.length).toBe(2)
            expect(result.contato?.nome).toBe('Cliente Teste')

            // Critical assertion: The mapper calculates valorPago by reducing pagamentos
            expect(result.valorPago).toBe(200)
        })

        it('should handle Venda without pagamentos gracefully', () => {
            const dbVenda: VendaComItens = {
                id: 'v2',
                total: 300,
                itens: [],
                pagamentos: null as any // Simulate outer join missing
            } as any

            const result = toDomainVenda(dbVenda)

            expect(result.valorPago).toBe(0)
            expect(result.pagamentos).toEqual([])
        })
    })
})

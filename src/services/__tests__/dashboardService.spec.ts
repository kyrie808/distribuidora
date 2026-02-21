import { describe, it, expect } from 'vitest';
import { mapDashboardMetrics } from '../dashboardService';

describe('dashboardService - mapDashboardMetrics', () => {
    it('should handle completely null inputs providing correct fallbacks', () => {
        const result = mapDashboardMetrics(null, null, null);

        expect(result.financial.faturamento_mes_atual).toBe(0);
        expect(result.financial.vendas_mes_atual).toBe(0);
        expect(result.operational.total_vendas).toBe(0);
        expect(result.alertas_recompra).toEqual([]);
        expect(result.operational.ultimas_vendas).toEqual([]);
    });

    it('should map valid inputs properly without losing data', () => {
        const mockFin = {
            faturamento: 15000,
            lucro_estimado: 5000,
            ticket_medio: 150,
            faturamento_anterior: 10000,
            variacao_faturamento_percentual: 50,
            total_a_receber: 2000,
            alertas_financeiros: [{ id: 1, message: 'Alert' }]
        };

        const mockOp = {
            total_vendas: 100,
            total_itens: 500,
            pedidos_pendentes: 5,
            pedidos_entregues_hoje: 20,
            clientes_ativos: 45,
            ranking_indicacoes: [{ user: 'Alice', count: 10 }],
            ultimas_vendas: [{ id: 101, total: 100 }]
        };

        const mockAlerts = [
            { contato_id: 'c1', nome: 'Bob', telefone: '123', data_ultima_compra: '2023-01-01', dias_sem_compra: 45 }
        ];

        const result = mapDashboardMetrics(mockFin, mockOp, mockAlerts);

        expect(result.financial.faturamento_mes_atual).toBe(15000);
        expect(result.financial.variacao_percentual).toBe(50);
        expect(result.financial.vendas_mes_atual).toBe(100); // Gets it from operational

        expect(result.operational.entregas_hoje_realizadas).toBe(20);
        expect(result.operational.clientes_ativos).toBe(45);
        expect(result.operational.ranking_indicacoes.length).toBe(1);

        expect(result.alertas_recompra.length).toBe(1);
        expect(result.alertas_recompra[0].nome).toBe('Bob');
    });

    it('should cross-bind operational sales count to financial response correctly', () => {
        const mockFin = { faturamento: 1000 };
        const mockOp = { total_vendas: 25 };

        const result = mapDashboardMetrics(mockFin, mockOp, []);

        expect(result.financial.vendas_mes_atual).toBe(25);
    });

    it('should supply default values for missing nested properties in valid objects', () => {
        const mockFin = { faturamento: 1000 }; // missing others
        const mockOp = { total_vendas: 25 }; // missing others

        const result = mapDashboardMetrics(mockFin, mockOp, [{}]); // Alert missing properties

        expect(result.financial.lucro_mes_atual).toBe(0);
        expect(result.financial.variacao_percentual).toBe(0);
        expect(result.operational.entregas_hoje_realizadas).toBe(0);
        expect(result.alertas_recompra[0].nome).toBe('Cliente sem nome'); // Fallback string
    });
});

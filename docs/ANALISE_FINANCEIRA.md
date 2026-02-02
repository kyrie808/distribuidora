# Relatório Técnico: Implementação de Vendas e Pagamentos

## 1. Status de Pagamento (Hardcoded?)
**O status de pagamento é determinado por lógica "hardcoded" no frontend/hook.**

Na função `createVenda` em `src/hooks/useVendas.ts`, o campo `pago` é definido verificando se a forma de pagamento está incluída em uma lista estática.

```typescript
// src/hooks/useVendas.ts (Linha 281)
pago: ['pix', 'dinheiro', 'cartao'].includes(data.forma_pagamento),
```

Isso significa que qualquer venda criada como "Pix", "Dinheiro" ou "Cartão" é automaticamente marcada como paga, sem validação externa. Vendas "Fiado", "Brinde" ou "Pré-venda" entram como `pago: false`.

## 2. Venda vs. Transação Financeira
**O sistema NÃO cria um registro financeiro para vendas à vista.**

Ao criar uma venda em `createVenda`, o sistema realiza operações nas tabelas:
- `vendas` (criação do pedido)
- `itens_venda` (itens do pedido)
- `contatos` (atualização de status)
- `produtos` (baixa de estoque)

**Não há inserção na tabela `pagamentos_venda`** no momento da criação da venda. A tabela `pagamentos_venda` existe e é tipada, mas só é utilizada pela função `addPagamento`, que é uma operação separada. Isso gera inconsistência, pois o saldo financeiro depende hoje apenas de somar o total da tabela `vendas` onde `pago = true`, perdendo o histórico de quando ou como o pagamento ocorreu se ele for deletado ou alterado.

## 3. Dados Específicos (Parcelas/Fiado)
**Os dados de parcelas e data prevista estão sendo DESCARTADOS.**

Embora o schema `VendaFormData` (`src/schemas/venda.ts`) e o tipo do banco de dados `VendaInsert` (`src/types/database.ts`) possuam os campos `parcelas` e `data_prevista_pagamento`, eles são **ignorados** na construção do objeto de inserção dentro de `createVenda`.

```typescript
// src/hooks/useVendas.ts (Linhas 273-284)
const vendaInsert: VendaInsert = {
    contato_id: data.contato_id,
    data: data.data,
    // ...
    forma_pagamento: data.forma_pagamento,
    // CAMPOS FALTANTES AQUI:
    // parcelas: data.parcelas,
    // data_prevista_pagamento: data.data_prevista_pagamento
    // ...
}
```

Isso significa que se o usuário selecionar "Cartão (3x)" ou "Fiado (Vencimento 30/10)" no frontend, essa informação é perdida ao salvar. A venda é salva com `parcelas` e `data_prevista_pagamento` como `null` (padrão do banco).

## 4. Escalabilidade para Múltiplos Pagamentos
**A estrutura atual NÃO suporta pagamentos mistos.**

O limitação está na raiz do design:
1.  **Schema (`src/schemas/venda.ts`):** O campo `forma_pagamento` é um `enum` simples (string), aceitando apenas um valor único (`'pix' | 'dinheiro' | ...`).
2.  **Banco de Dados (`vendas`):** A coluna `forma_pagamento` é uma string simples.

Para suportar Pagamento Misto (ex: R$ 50 Dinheiro + R$ 50 Pix), seria necessário refatorar o sistema para que a forma de pagamento não seja um atributo da Venda, mas sim uma coleção de registros na tabela `pagamentos_venda` vinculados àquela venda.

---

# Pontos de Atenção (To-Do)

1.  🔴 **Correção Urgente:** Incluir `parcelas` e `data_prevista_pagamento` no objeto `vendaInsert` em `useVendas.ts`.
2.  🟠 **Refatoração Financeira:** Alterar `createVenda` para criar automaticamente um registro em `pagamentos_venda` quando o pagamento for à vista.
3.  🟡 **Modelagem:** Depreciar o campo `forma_pagamento` e `pago` da tabela `vendas` a longo prazo, calculando o status de pagamento baseado na soma dos registros em `pagamentos_venda` vs. `total` da venda.
4.  🔵 **Feature:** Atualizar `vendaSchema` para aceitar um array de métodos de pagamento em vez de uma string única, permitindo pagamentos híbridos.

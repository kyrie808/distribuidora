# Protocolo de Análise: PDV Specs (Nova Venda)

> [!NOTE]
> Este documento mapeia a lógica da tela `NovaVenda.tsx` (Checkout/PDV). Diferente da Dashboard, esta tela é de **alta rotatividade e uso sob pressão**.

## 1. Mecânica do Carrinho (Shopping Experience)

### Adição e Edição
- **Interface**: Grid de cards (2 colunas mobile).
- **Ação de Adicionar**: Botão "Adicionar" (substitui o input de quantidade inicial).
- **Controle de Quantidade**:
  - Após adicionado, o card exibe controles `[-] QTY [+]`.
  - **Remoção**: Clicar em `[-]` quando a quantidade é 1 remove o item.
  - **Feedback Visual**: Borda do card fica colorida (`border-primary-500`) quando item está no carrinho.

### Feedback de Estoque
- **Ausente**: Atualmente a tela **NÃO** mostra o estoque atual do produto no card.
- **Risco**: O vendedor pode adicionar produtos que não têm estoque físico sem aviso prévio.

### Resumo do Pedido (Floating)
- **Componente**: Barra fixa inferior (`fixed bottom-20`).
- **Dados**: Contagem de itens e Valor Total.
- **Ação**: Botão "Continuar" leva para o Pagamento.

---

## 2. Fluxo de Pagamento (Checkout)

> [!IMPORTANT]
> A tela `NovaVenda.tsx` possui um fluxo de checkout **próprio** (inline), separado do componente `PaymentModal.tsx` (usado apenas em detalhes de vendas passadas).

### Formas de Pagamento Suportadas
| Método | Input Adicional | Comportamento Atual |
| :--- | :--- | :--- |
| **Pix** | Nenhum | Finalização imediata. |
| **Dinheiro** | Nenhum | Finalização imediata. **Não há cálculo de troco na UI**. |
| **Cartão** | Parcelas | Selector de parcelas (`-/+`) de 1x a 12x. |
| **Fiado** | Data Vencimento | Input `date` obrigatório (Padrão: Hoje + 30 dias). |

### Taxas Adicionais
- **Entrega**: Toggle "Cobrar Taxa de Entrega".
  - Se ativado, exibe input numérico manual para o valor.

---

## 3. Fricção Atual (Pain Points & Oportunidades)

1.  **Fluxo Linear Rígido (Stepper Bloqueante)**
    *   **Problema**: O usuário é obrigado a selecionar o Cliente (Step 1) *antes* de ver os produtos (Step 2).
    *   **Cenário Real**: Muitas vezes o cliente já está com os produtos no balcão e o nome dele é a última coisa a ser perguntada.
    *   **Oportunidade**: Inverter para "Produto First" ou permitir navegação livre entre abas.

2.  **Cardápio Textual Demais**
    *   **Problema**: Os cards de produto mostram apenas Nome e Preço.
    *   **Oportunidade**: Ícones ou Avatares de produto (se houver imagem) ou melhor hierarquia visual.

3.  **Checkout "Às Cegas" (Dinheiro)**
    *   **Problema**: Não há campo para "Valor Recebido" na opção Dinheiro, logo o sistema não calcula o troco. O vendedor precisa fazer de cabeça.

4.  **Cadastro de Cliente (Modal sobre Modal)**
    *   **Problema**: O "Cadastro Rápido" é um modal e quebra o fluxo.
    *   **Oportunidade**: Integrar a criação de cliente na própria busca (ex: "Criar 'João'").

---

## 4. Prompt Generator (Resumo para Designer)

> **Contexto para IA de Design:**
> "Você está projetando a tela de **PDV (Frente de Caixa)** para um aplicativo mobile. O usuário é um vendedor que está em pé, com pressa e segurando o celular com uma mão.
>
> **Objetivo de UX**: Velocidade Extrema. Cada toque conta.
>
> **Requisitos do Fluxo (Carrinho Otimizado):**
> 1.  **Grid de Produtos Inteligente**: Cards grandes e touch-friendly. O controle de quantidade (+/-) deve ser fácil de acertar com o dedão.
> 2.  **Flexibilidade no Checkout**: O vendedor deve poder adicionar produtos *antes* de identificar o cliente. O carrinho deve estar sempre visível ("Minicart" ou aba expansível).
> 3.  **Pagamento Relâmpago**:
>     - Ao selecionar 'Dinheiro', mostre sugestões de notas para cálculo de troco rápido.
>     - Ao selecionar 'Fiado', destaque a data de vencimento de forma clara.
>
> **Estilo**: Botões de ação primária (Confirmar Venda) devem ser grandes e ficar na zona de alcance do polegar (bottom screen). Use cores vibrantes para distinguir 'Ações de Venda' vs 'Navegação'."

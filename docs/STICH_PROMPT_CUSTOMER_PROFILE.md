# Prompt de Design para Stich: Refatoração do Perfil de Cliente

## Contexto
Precisamos realizar uma **"cirurgia visual"** completa na página de Detalhes do Cliente (`src/pages/ContatoDetalhe.tsx`). O backend, hooks (`useContato`, `useVendas`) e lógica de negócio **DEVEM PERMANECER INTACTOS**. O objetivo é transformar a interface atual, que é funcional mas genérica, em uma experiência **Premium**, **Gamificada** e alinhada ao tema **"Tactical Dark"** (Glassmorphism, Blur, Tipografia Inter, Cores Vibrantes em fundo Dark).

## 1. Inventário de Dados (Obrigatório)
O novo layout deve exibir TODOS os seguintes dados, sem exceção:

### Identidade
- **Nome do Cliente**: Destaque principal.
- **Avatar/Ícone**: Baseado no Tipo (Pessoa/Empresa).
- **Badges de Status**:
  - `Status`: Lead, Cliente, Inativo (Color-coded).
  - `Tipo`: Pessoa Física vs Jurídica (B2B/B2C).
  - `Subtipo` (apenas B2B): Restaurante, Mercado, etc.

### Gamification (Loyalty)
- **Nível Atual**: Emoji + Label (ex: 🥉 Bronze, 🥈 Prata, 🥇 Ouro).
- **Barra de Progresso**: Visualização clara de "X compras faltando para o próximo nível".
- *Sugestão Visual:* Transformar isso em um "Card de Membro" ou algo com destaque visual rico.

### Informações de Contato & Bio
- **Telefone**: Link clicável (`tel:`).
- **Endereço**: Rua + Bairro. Link para Google Maps.
- **Origem**: De onde veio (Google, Indicação).
  - *Link*: Se indicação, link para o perfil do indicador.
- **Data de Cadastro**: Absoluta e Relativa ("Há 2 meses").
- **Observações**: Texto livre (multiline).

### Histórico (Timeline)
- Lista de Vendas passadas.
- Dados por Venda: Data, Qtd Itens, Valor Total.
- **Status Financeiro**: Pago (Verde) vs A Receber (Amarelo/Vermelho).
- **Status Logístico**: Entregue, Pendente, Cancelado.
- **Itens da Venda** (Expandível): Lista de produtos comprados na venda.

## 2. Inventário de Ações (Interações)
O usuário deve ser capaz de realizar estas ações de forma intuitiva:
1.  **Ações Primárias (Hero/Topo)**:
    - 🟢 **Chamar no WhatsApp**: Ação mais importante.
    - 🛒 **Nova Venda**: Criar pedido para este cliente.
2.  **Ações Secundárias**:
    - ✏️ **Editar Perfil**: Alterar dados cadastrais (Modal).
    - 🗺️ **Abrir Mapa**: Ver endereço no Google Maps.
    - 🗑️ **Excluir Contato**: Zona de perigo (fim da página).
3.  **Ações no Histórico**:
    - Ver detalhes da venda (Expandir).
    - Editar Venda (se não cancelada).
    - Excluir Venda (se cancelada).

## 3. Diretrizes de Estilo ("Stich Style")
- **Layout**: Mobile-first, mas que expande elegantemente em Desktop (`max-w-7xl`).
- **Glassmorphism**: Use `backdrop-blur-md` e bordas translúcidas (`border-white/10`) para separar camadas.
- **Hierarquia**:
  - **Nível 1 (Hero)**: Quem é esse cliente e qual o nível dele? (Gamification).
  - **Nível 2 (Ações)**: O que eu quero fazer com ele agora?
  - **Nível 3 (Dados)**: Onde ele mora?
  - **Nível 4 (Histórico)**: O que ele já comprou?
- **Cores**: Use as variáveis CSS do tema (`--primary`, `--background-dark`, `--success`, etc). Evite cores hardcoded (hex) a menos que seja para degradês específicos do design.
- **Tipografia**: Fonte `Inter`. Títulos em `Tracking-tight`.

## 4. O que NÃO Fazer
- ❌ Não alterar a lógica de `useContato` ou `useVendas`.
- ❌ Não remover funcionalidades existentes (ex: cálculo de nível).
- ❌ Não criar novos endpoints ou chamadas de API.
- ❌ Não usar bibliotecas de UI pesadas (manter Tailwind + Radix/Headless se necessário).

---
**Objetivo Final:** Um layout onde o vendedor se sinta "gerenciando um relacionamento VIP", e não apenas "lendo um banco de dados".

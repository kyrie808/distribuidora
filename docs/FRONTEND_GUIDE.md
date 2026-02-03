# Frontend Guide: Estilo & Manutenção

Este guia serve como referência para manter a consistência visual do projeto **MassasCRM**, especificamente para o tema "Tactical Dark" e os componentes "Apple-Like".

## 1. Design System (Tokens)

O sistema utiliza **Tailwind CSS** extendido com variáveis CSS para permitir temas (Dark/Light), mas o foco principal é o **Dark Mode**.

### Cores Principais (`tailwind.config.js`)
As cores não devem ser hardcoded (ex: `bg-[#102210]`). Use as classes semânticas:

| Token Tailwind | Cor Hex (Dark) | Uso Principal |
| :--- | :--- | :--- |
| `bg-background-dark` | `#102210` | Fundo geral da aplicação |
| `bg-surface-dark` | `#1a2e1a` | Cards, Modais, Sidebar |
| `text-primary` | `#13ec13` (Neon Green) | Ícones principais, botões de ação primária |
| `bg-semantic-red` | `#ef4444` | Erros, alertas críticos (Overdue) |
| `bg-semantic-yellow` | `#eab308` | Avisos, pendências, Bronze |
| `bg-semantic-green` | `#22c55e` | Sucesso, KPIs positivos |

### Tipografia
- **Font Display**: `Lexend` (Títulos, Números, KPIs). Passa sensação técnica e moderna.
- **Font Body**: `Noto Sans` (Textos longos, parágrafos). Leitura fácil.

## 2. Sistema de Temas (Híbrido)
O sistema suporta alternância entre **Light** (Padrão Clean) e **Dark** (Tactical).

### Estrutura
- **Provider**: `ThemeContext.tsx` gerencia o estado (`light` | `dark` | `system`).
- **Persistência**: `localStorage` chave `vite-ui-theme`.
- **Toggle**: Componente `ThemeToggle` no Header com animações otimizadas.
- **CSS**: Tailwind usa `darkMode: 'class'`. Variáveis CSS (`--background`, etc) definem as cores em `index.css`.

---

## 3. Componentes "Apple-Like"
Recentemente implementamos widgets com estética inspirada na Apple (gradientes sutis, glassmorphism, tipografia limpa).

### A. Estrutura de Widgets (Dashboard)
Ao criar um novo widget para o Dashboard:
1. **Container**: Use `flex flex-col gap-3`.
2. **Cabeçalho**: Ícone + Título Uppercase.
   ```tsx
   <div className="flex items-center gap-2 px-1">
       <Icon className="size-4 text-primary" /> {/* ou cor semântica */}
       <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
           TÍTULO DO WIDGET
       </h2>
   </div>
   ```

### B. Gradientes & Glassmorphism
Para destacar elementos (como o Top 3 Indicadores), usamos gradientes com opacidade baixa no background e texto contrastante.

**Exemplo (Top 1 - Gold):**
```tsx
// Background
bg-gradient-to-r from-yellow-300 to-yellow-500
// Borda sutil
border-yellow-400
// Texto escuro para contraste no gradiente claro
text-yellow-900 
```

### C. Listas Limpas (Últimas Vendas)
Para listas verticais estilo iOS:
- **Separadores**: Evite bordas pesadas entre linhas. Use espaçamento (`gap-2`) ou bordas muito sutis (`border-gray-800/50`).
- **Estados**: Use "bolinhas" (`size-2 rounded-full`) coloridas em vez de badges grandes se o espaço for curto.
- **Interação**: Adicione `hover:scale-[1.01]` e sombras suaves para feedback tátil.

---

## 3. Como Alterar...

### ...uma cor global?
1. Abra `src/index.css`.
2. Procure a seção `.dark` (linha 56+).
3. Altere o valor HSL ou Hex da variável desejada (ex: `--primary`).
4. **Nota**: O Tailwind está configurado para ler essas variáveis. Não altere no `tailwind.config.js` a menos que esteja criando uma *nova* cor.

### ...o ícone de um card?
Os ícones vêm da biblioteca `lucide-react`.
1. Importe: `import { IconName } from 'lucide-react'`.
2. Use com classe de tamanho: `<IconName className="size-4" />`.
   - `size-4` = 16px (Pequeno/Metadata)
   - `size-5` = 20px (Botões)
   - `size-6` = 24px (Destaques)

### ...o formato de moeda?
Sempre use o helper:
```ts
import { formatCurrency } from '@/utils/formatters'
// ...
{formatCurrency(valor)} // R$ 1.234,56
```

---

## 4. Estrutura de Pastas (Frontend)
```
src/
├── components/
│   ├── dashboard/       # Widgets específicos (TopIndicadores, UltimasVendas...)
│   ├── ui/              # Componentes base (Card, Button, Badge) - Reutilizáveis
│   └── layout/          # Header, Sidebar, Wrapper
├── hooks/               # Lógica de dados (useVendas, useTopIndicadores)
├── pages/               # Telas do roteador
└── utils/               # Formatadores e helpers puros
```

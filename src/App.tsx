import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthGuard } from './components/auth/AuthGuard'
import {
  Dashboard,
  Contatos,
  ContatoDetalhe,
  NovaVenda,
  Vendas,
  VendaDetalhe,
  Ranking,
  Recompra,
  Configuracoes,
  Produtos,
  RelatorioFabrica,
  Estoque,
  Entregas,
  PedidosCompra,
  Menu,
  CatalogoPendentes,
  FluxoCaixa,
  PlanoDeContas,
  LoginPage
} from './pages'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contatos" element={<Contatos />} />
          <Route path="/contatos/:id" element={<ContatoDetalhe />} />
          <Route path="/nova-venda" element={<NovaVenda />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/vendas/:id" element={<VendaDetalhe />} />
          <Route path="/vendas/:id/editar" element={<NovaVenda />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/pedidos-compra" element={<PedidosCompra />} />
          <Route path="/recompra" element={<Recompra />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/relatorio-fabrica" element={<RelatorioFabrica />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/entregas" element={<Entregas />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/catalogo-pendentes" element={<CatalogoPendentes />} />
          <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
          <Route path="/plano-de-contas" element={<PlanoDeContas />} />

          {/* Redirects */}
          <Route path="/clientes" element={<Navigate to="/contatos" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

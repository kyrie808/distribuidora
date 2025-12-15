import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import {
  Dashboard,
  Contatos,
  ContatoDetalhe,
  NovaVenda,
  Vendas,
  VendaDetalhe,
  Indicacoes,
  Recompra,
  Configuracoes,
  Produtos,
  RelatorioFabrica,
  Estoque
} from './pages'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contatos" element={<Contatos />} />
          <Route path="/contatos/:id" element={<ContatoDetalhe />} />
          <Route path="/nova-venda" element={<NovaVenda />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/vendas/:id" element={<VendaDetalhe />} />
          <Route path="/indicacoes" element={<Indicacoes />} />
          <Route path="/recompra" element={<Recompra />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/relatorio-fabrica" element={<RelatorioFabrica />} />
          <Route path="/estoque" element={<Estoque />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App

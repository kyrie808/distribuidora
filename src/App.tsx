import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import {
  Dashboard,
  Contatos,
  ContatoDetalhe,
  NovaVenda,
  Vendas,
  VendaDetalhe,
  Indicacoes,
  Recompra
} from './pages'

function App() {
  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

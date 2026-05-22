import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import ContasPagar from '@/pages/ContasPagar'
import ContaForm from '@/pages/ContaForm'
import Fornecedores from '@/pages/Fornecedores'
import Categorias from '@/pages/Categorias'
import Relatorios from '@/pages/Relatorios'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index              element={<Dashboard />} />
            <Route path="contas"      element={<ContasPagar />} />
            <Route path="contas/nova" element={<ContaForm modo="criar" />} />
            <Route path="contas/:id/editar" element={<ContaForm modo="editar" />} />
            <Route path="contas/:id/pagar"  element={<ContaForm modo="pagar" />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="categorias"   element={<Categorias />} />
            <Route path="relatorios"   element={<Relatorios />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

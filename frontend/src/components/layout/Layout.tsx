import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from './Sidebar'

const titles: Record<string, string> = {
  '/':             'Dashboard',
  '/contas':       'Contas a Pagar',
  '/contas/nova':  'Nova Conta',
  '/fornecedores': 'Fornecedores',
  '/categorias':   'Categorias',
  '/relatorios':   'Relatórios',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Facil Financeiro'

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm
                           flex items-center gap-3 px-4 md:px-7 h-[60px]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-[15px] text-gray-800 flex-1">{title}</h1>
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
          </span>
          <Link to="/contas/nova" className="btn btn-primary btn-sm">
            <PlusCircle size={14} /> Nova Conta
          </Link>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

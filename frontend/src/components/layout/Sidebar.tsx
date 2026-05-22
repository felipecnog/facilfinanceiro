import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, DollarSign, PlusCircle, Users, Tag,
  BarChart2, X, GraduationCap,
} from 'lucide-react'

const nav = [
  { group: 'Principal',   items: [{ to: '/',             icon: LayoutDashboard, label: 'Dashboard' }] },
  { group: 'Financeiro',  items: [{ to: '/contas',       icon: DollarSign,      label: 'Contas a Pagar' },
                                   { to: '/contas/nova',  icon: PlusCircle,      label: 'Nova Conta' }] },
  { group: 'Cadastros',   items: [{ to: '/fornecedores', icon: Users,           label: 'Fornecedores' },
                                   { to: '/categorias',   icon: Tag,             label: 'Categorias' }] },
  { group: 'Relatórios',  items: [{ to: '/relatorios',   icon: BarChart2,       label: 'DRE / Resumo' }] },
]

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-60 z-40 flex flex-col
        bg-brand shadow-xl transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Marca */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-white font-bold text-base">Facil</div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
              Consultoria Escolar
            </div>
          </div>
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-1">
          {nav.map(group => (
            <div key={group.group} className="px-3 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 px-2 py-2">
                {group.group}
              </p>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all
                     ${isActive
                       ? 'bg-white/15 text-white shadow-inner border-l-[3px] border-white/60 pl-2.5'
                       : 'text-white/65 hover:bg-white/10 hover:text-white'
                     }`
                  }
                >
                  <item.icon size={15} className="flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/30">
          Sistema Financeiro v2.0
        </div>
      </aside>
    </>
  )
}

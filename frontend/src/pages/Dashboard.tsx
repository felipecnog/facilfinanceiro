import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Sigma, CheckCircle2, ArrowRight } from 'lucide-react'
import api, { moeda, dataBR } from '@/lib/api'
import type { DashboardData } from '@/types'

function StatCard({ label, value, sub, color, icon: Icon }:
  { label: string; value: string; sub: string; color: string; icon: React.ElementType }) {
  return (
    <div className={`card p-5 relative overflow-hidden border-t-[3px] ${color}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-gray-50">
        <Icon size={18} className="text-gray-500" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800 tabular-nums">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      Carregando...
    </div>
  )

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <div className="text-red-400 text-3xl">⚠️</div>
      <p className="text-sm font-semibold text-gray-700">Não foi possível conectar à API</p>
      <p className="text-xs text-gray-400 max-w-sm text-center">
        {(error as Error)?.message || 'Verifique se a variável VITE_API_URL está configurada corretamente no EasyPanel.'}
      </p>
      <button onClick={() => window.location.reload()} className="btn btn-primary btn-sm mt-1">
        Tentar novamente
      </button>
    </div>
  )

  const t = data.totais
  const totalGeral = Number(t.total_aberto)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Vencido"       value={moeda(t.total_vencido)}  sub={`${t.qtd_vencido} conta(s)`}   color="border-red-400"   icon={AlertTriangle} />
        <StatCard label="A Vencer"      value={moeda(t.total_pendente)} sub={`${t.qtd_pendente} conta(s)`}  color="border-amber-400" icon={Clock} />
        <StatCard label="Total Aberto"  value={moeda(t.total_aberto)}   sub="Vencido + Pendente"             color="border-brand-mid" icon={Sigma} />
        <StatCard label="Pago este mês" value={moeda(t.pago_mes)}       sub={`${t.qtd_pago_mes} pagamento(s)`} color="border-green-400" icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Próximos 7 dias */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-sm text-gray-700">⏰ Vencem nos próximos 7 dias</h2>
            <Link to="/contas?status=pendente" className="text-xs text-brand-mid hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {data.proximas.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">✓ Nenhuma conta vence nos próximos 7 dias</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    <th className="text-left px-5 py-3">Descrição</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">Fornecedor</th>
                    <th className="text-left px-3 py-3">Vencimento</th>
                    <th className="text-right px-5 py-3">Valor</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.proximas.map(c => {
                    const hoje = new Date().toISOString().split('T')[0]
                    const isHoje = c.data_vencimento === hoje
                    return (
                      <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-5 py-3">
                          {c.categoria_cor && (
                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: c.categoria_cor }} />
                          )}
                          <span className="font-medium text-gray-700">{c.descricao}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-400 hidden md:table-cell">{c.fornecedor}</td>
                        <td className="px-3 py-3">
                          <span className={isHoje ? 'text-amber-600 font-semibold' : 'text-gray-600'}>
                            {dataBR(c.data_vencimento)}
                          </span>
                          {isHoje && <span className="badge badge-warning ml-2 text-[10px]">Hoje</span>}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-700">
                          {moeda(c.valor)}
                        </td>
                        <td className="px-3 py-3">
                          <Link to={`/contas/${c.id}/pagar`} className="btn btn-success btn-sm">Pagar</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Por Categoria */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-gray-700 mb-4">📊 Em aberto por categoria</h2>
          {data.porCategoria.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum dado.</p>
          ) : (
            <div className="space-y-4">
              {data.porCategoria.map(cat => {
                const pct = totalGeral > 0 ? Math.round((Number(cat.total) / totalGeral) * 100) : 0
                return (
                  <div key={cat.nome}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.cor }} />
                      <span className="text-sm flex-1 text-gray-700">{cat.nome}</span>
                      <span className="text-xs font-semibold tabular-nums text-gray-600">{moeda(Number(cat.total))}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat.cor }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{cat.qtd} conta(s) · {pct}%</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vencidas */}
      {data.vencidas.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle size={15} /> Contas Vencidas
            </h2>
            <Link to="/contas?status=vencido" className="text-xs text-brand-mid hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="text-left px-5 py-3">Descrição</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Fornecedor</th>
                  <th className="text-left px-3 py-3">Venceu em</th>
                  <th className="text-left px-3 py-3">Atraso</th>
                  <th className="text-right px-5 py-3">Valor</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.vencidas.map(c => {
                  const atraso = Math.floor((Date.now() - new Date(c.data_vencimento + 'T12:00:00').getTime()) / 86400000)
                  return (
                    <tr key={c.id} className="border-t border-gray-50 hover:bg-red-50/30">
                      <td className="px-5 py-3 font-medium text-gray-700">{c.descricao}</td>
                      <td className="px-3 py-3 text-gray-400 hidden md:table-cell">{c.fornecedor}</td>
                      <td className="px-3 py-3 text-red-500 tabular-nums text-xs font-semibold">{dataBR(c.data_vencimento)}</td>
                      <td className="px-3 py-3"><span className="badge badge-danger">{atraso}d</span></td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums text-red-600">{moeda(c.valor)}</td>
                      <td className="px-3 py-3">
                        <Link to={`/contas/${c.id}/pagar`} className="btn btn-success btn-sm">Pagar</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

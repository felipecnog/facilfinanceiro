import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FileDown, Printer } from 'lucide-react'
import api, { moeda } from '@/lib/api'
import type { RelatorioData } from '@/types'

export default function Relatorios() {
  const now = new Date()
  const [inicio, setInicio] = useState(`${now.getFullYear()}-01`)
  const [fim,    setFim]    = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)

  const { data, isLoading, refetch } = useQuery<RelatorioData>({
    queryKey: ['relatorios', inicio, fim],
    queryFn: () => api.get('/relatorios', { params: { inicio, fim } }).then(r => r.data),
  })

  const exportCSV = () => {
    window.open(`/api/relatorios/csv?inicio=${inicio}&fim=${fim}`, '_blank')
  }
  const imprimir = () => window.print()

  const t = data?.totais
  const totalPago = Number(t?.total_pago ?? 0)
  const totalAberto = Number(t?.total_aberto ?? 0)
  const totalPrevisto = Number(t?.total_previsto ?? 0)

  return (
    <div className="space-y-6 print:space-y-4">

      {/* Cabeçalho de impressão */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-brand">
        <h1 className="text-2xl font-bold text-brand">Facil Consultoria Escolar</h1>
        <p className="text-sm text-gray-500 mt-1">
          DRE / Resumo Financeiro — Período: {inicio.split('-').reverse().join('/')} a {fim.split('-').reverse().join('/')}
        </p>
      </div>

      {/* Filtros */}
      <div className="card p-4 print:hidden">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Período — de</label>
            <input type="month" className="input w-auto" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div>
            <label className="label">até</label>
            <input type="month" className="input w-auto" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => refetch()}>Gerar</button>
          <div className="ml-auto flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={exportCSV}>
              <FileDown size={14} /> Exportar Excel
            </button>
            <button className="btn btn-outline btn-sm" onClick={imprimir}>
              <Printer size={14} /> Imprimir / PDF
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Gerando relatório...</div>
      ) : !data ? null : (
        <>
          {/* Totalizadores */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Previsto', value: moeda(totalPrevisto), color: 'border-brand-mid', sub: `${t?.qtd_total} conta(s)` },
              { label: 'Total Pago',     value: moeda(totalPago),     color: 'border-green-400', sub: `${t?.qtd_pago} pagamento(s)` },
              { label: 'Em Aberto',      value: moeda(totalAberto),   color: 'border-amber-400', sub: 'Pendente + Vencido' },
              { label: '% Realizado',    value: totalPrevisto > 0 ? `${Math.round((totalPago/totalPrevisto)*100)}%` : '—', color: 'border-blue-400', sub: 'do total previsto' },
            ].map(s => (
              <div key={s.label} className={`card p-4 border-t-[3px] ${s.color}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{s.label}</p>
                <p className="text-xl font-bold text-gray-800 tabular-nums">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Gráfico mensal */}
          {data.resumoMensal.length > 0 && (
            <div className="card p-5 print:border print:shadow-none">
              <h2 className="font-semibold text-sm text-gray-700 mb-4">📈 Evolução Mensal</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.resumoMensal} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes_label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={56} />
                  <Tooltip formatter={(v: number) => moeda(v)} labelStyle={{ fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total_pago"   name="Pago"    fill="#16a34a" radius={[4,4,0,0]} />
                  <Bar dataKey="total_aberto" name="Em Aberto" fill="#4A5BA8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* DRE por categoria */}
          <div className="card overflow-hidden print:border print:shadow-none">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-sm text-gray-700">📋 DRE — Despesas por Categoria</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Período: {inicio.split('-').reverse().join('/')} a {fim.split('-').reverse().join('/')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    <th className="text-left px-5 py-3">Categoria</th>
                    <th className="text-right px-3 py-3">Previsto</th>
                    <th className="text-right px-3 py-3">Pago</th>
                    <th className="text-right px-3 py-3">Em Aberto</th>
                    <th className="text-right px-5 py-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dre.map((row, i) => {
                    const pct = totalPrevisto > 0 ? Math.round((Number(row.valor_previsto)/totalPrevisto)*100) : 0
                    return (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.cor }} />
                            <span className="font-medium text-gray-700">{row.categoria}</span>
                            <span className="text-xs text-gray-400">({row.qtd} conta(s))</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-gray-600">{moeda(Number(row.valor_previsto))}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-green-600 font-medium">{moeda(Number(row.valor_pago))}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-amber-600">{moeda(Number(row.valor_aberto))}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.cor }} />
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                    <td className="px-5 py-3 text-gray-700">Total Geral</td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700">{moeda(totalPrevisto)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-green-700">{moeda(totalPago)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-amber-700">{moeda(totalAberto)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Resumo mensal tabela */}
          {data.resumoMensal.length > 1 && (
            <div className="card overflow-hidden print:border print:shadow-none">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-sm text-gray-700">📅 Resumo por Mês</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      <th className="text-left px-5 py-3">Mês</th>
                      <th className="text-right px-3 py-3">Contas</th>
                      <th className="text-right px-3 py-3">Previsto</th>
                      <th className="text-right px-3 py-3">Pago</th>
                      <th className="text-right px-5 py-3">Em Aberto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.resumoMensal.map(m => (
                      <tr key={m.mes_key} className="border-t border-gray-50 hover:bg-gray-50/60">
                        <td className="px-5 py-3 font-medium text-gray-700">{m.mes_label}</td>
                        <td className="px-3 py-3 text-right text-gray-400">{m.qtd}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-gray-600">{moeda(Number(m.total_previsto))}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-green-600">{moeda(Number(m.total_pago))}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-amber-600">{moeda(Number(m.total_aberto))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          .sidebar, header, .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .card { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}

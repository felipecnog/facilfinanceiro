import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, Trash2, CheckCircle, XCircle, Plus, Search, X } from 'lucide-react'
import api, { moeda, dataBR, labelForma } from '@/lib/api'
import type { ContasResponse, Categoria } from '@/types'

const STATUS_OPTS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'vencido',  label: 'Vencido' },
  { value: 'pago',     label: 'Pago' },
  { value: 'cancelado',label: 'Cancelado' },
]

function BadgeStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: 'badge badge-warning',
    pago:     'badge badge-success',
    vencido:  'badge badge-danger',
    cancelado:'badge badge-neutral',
  }
  const labels: Record<string, string> = {
    pendente: 'Pendente', pago: 'Pago', vencido: 'Vencido', cancelado: 'Cancelado',
  }
  return <span className={map[status] ?? 'badge badge-neutral'}>{labels[status] ?? status}</span>
}

export default function ContasPagar() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [busca, setBusca] = useState(params.get('q') ?? '')

  const filtros = {
    status:    params.get('status')    ?? '',
    categoria: params.get('categoria') ?? '',
    mes:       params.get('mes')       ?? '',
    q:         params.get('q')         ?? '',
    page:      Number(params.get('page') ?? 1),
  }

  const setFiltro = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    p.delete('page')
    setParams(p)
  }
  const setPage = (p: number) => {
    const np = new URLSearchParams(params)
    np.set('page', String(p))
    setParams(np)
  }
  const limpar = () => { setParams({}); setBusca('') }

  const { data, isLoading } = useQuery<ContasResponse>({
    queryKey: ['contas', filtros],
    queryFn: () => api.get('/contas', { params: { ...filtros, per_page: 20 } }).then(r => r.data),
  })

  const { data: categorias } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(r => r.data),
  })

  const cancelar = useMutation({
    mutationFn: (id: number) => api.patch(`/contas/${id}/cancelar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contas'] }),
  })
  const excluir = useMutation({
    mutationFn: (id: number) => api.delete(`/contas/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contas'] }),
  })

  const pages = data ? Math.ceil(data.total / data.per_page) : 1

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 py-1.5 text-sm"
              placeholder="Buscar descrição, documento..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setFiltro('q', busca)}
            />
          </div>
          <select className="input w-auto text-sm py-1.5" value={filtros.status}
            onChange={e => setFiltro('status', e.target.value)}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="input w-auto text-sm py-1.5" value={filtros.categoria}
            onChange={e => setFiltro('categoria', e.target.value)}>
            <option value="">Todas as categorias</option>
            {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input type="month" className="input w-auto text-sm py-1.5" value={filtros.mes}
            onChange={e => setFiltro('mes', e.target.value)} />
          <button className="btn btn-outline btn-sm" onClick={() => setFiltro('q', busca)}>
            Filtrar
          </button>
          <button className="btn btn-outline btn-sm flex items-center gap-1" onClick={limpar}>
            <X size={12} /> Limpar
          </button>
          <Link to="/contas/nova" className="btn btn-primary btn-sm ml-auto flex items-center gap-1">
            <Plus size={14} /> Nova Conta
          </Link>
        </div>

        {data && (
          <div className="flex gap-4 mt-3 text-xs text-gray-500 border-t border-gray-50 pt-3">
            <span>{data.total} registro(s)</span>
            <span>·</span>
            <span>Aberto: <strong className="text-red-500 tabular-nums">{moeda(Number(data.totais.total_aberto))}</strong></span>
            <span>·</span>
            <span>Pago: <strong className="text-green-600 tabular-nums">{moeda(Number(data.totais.total_pago))}</strong></span>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Carregando...</div>
        ) : data?.data.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-3xl mb-3 opacity-40">📂</p>
            <p className="text-sm mb-4">Nenhuma conta encontrada.</p>
            <Link to="/contas/nova" className="btn btn-primary btn-sm">+ Nova Conta</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="text-left px-5 py-3">Descrição</th>
                  <th className="text-left px-3 py-3 hidden lg:table-cell">Fornecedor</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Categoria</th>
                  <th className="text-left px-3 py-3">Vencimento</th>
                  <th className="text-right px-3 py-3">Valor</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3 hidden xl:table-cell">Pagamento</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map(c => {
                  const atraso = c.status === 'vencido'
                    ? Math.floor((Date.now() - new Date(c.data_vencimento + 'T12:00:00').getTime()) / 86400000)
                    : 0
                  return (
                    <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-700">{c.descricao}</div>
                        {c.numero_documento && <div className="text-[11px] text-gray-400 tabular-nums">{c.numero_documento}</div>}
                        {c.recorrente === 1 && <span className="badge badge-info text-[10px] mt-0.5">↻ Recorrente</span>}
                      </td>
                      <td className="px-3 py-3 text-gray-400 hidden lg:table-cell">{c.fornecedor}</td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {c.categoria_nome ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.categoria_cor ?? '#ccc' }} />
                            <span className="text-gray-600">{c.categoria_nome}</span>
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-xs">
                        <span className={c.status === 'vencido' ? 'text-red-500 font-semibold' : 'text-gray-600'}>
                          {dataBR(c.data_vencimento)}
                        </span>
                        {atraso > 0 && <span className="badge badge-danger ml-1 text-[10px]">{atraso}d</span>}
                      </td>
                      <td className={`px-3 py-3 text-right tabular-nums font-semibold ${c.status === 'vencido' ? 'text-red-500' : 'text-gray-700'}`}>
                        {moeda(c.valor)}
                      </td>
                      <td className="px-3 py-3"><BadgeStatus status={c.status} /></td>
                      <td className="px-3 py-3 hidden xl:table-cell text-xs text-gray-400 tabular-nums">
                        {c.data_pagamento ? (
                          <div>
                            <div>{dataBR(c.data_pagamento)}</div>
                            {c.forma_pagamento && <div className="text-gray-300">{labelForma(c.forma_pagamento)}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {['pendente','vencido'].includes(c.status) && (
                            <Link to={`/contas/${c.id}/pagar`} className="btn btn-success btn-sm btn-icon" title="Pagar">
                              <CheckCircle size={14} />
                            </Link>
                          )}
                          <Link to={`/contas/${c.id}/editar`} className="btn btn-outline btn-sm btn-icon" title="Editar">
                            <Pencil size={13} />
                          </Link>
                          {!['cancelado','pago'].includes(c.status) && (
                            <button className="btn btn-warning btn-sm btn-icon" title="Cancelar"
                              onClick={() => { if (confirm('Cancelar esta conta?')) cancelar.mutate(c.id) }}>
                              <XCircle size={13} />
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm btn-icon" title="Excluir"
                            onClick={() => { if (confirm('Excluir permanentemente?')) excluir.mutate(c.id) }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t border-gray-50">
            {filtros.page > 1 && (
              <button className="btn btn-outline btn-sm" onClick={() => setPage(filtros.page - 1)}>‹ Anterior</button>
            )}
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(filtros.page - 2, pages - 4)) + i
              return (
                <button key={p}
                  className={`btn btn-sm ${p === filtros.page ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPage(p)}>{p}</button>
              )
            })}
            {filtros.page < pages && (
              <button className="btn btn-outline btn-sm" onClick={() => setPage(filtros.page + 1)}>Próximo ›</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

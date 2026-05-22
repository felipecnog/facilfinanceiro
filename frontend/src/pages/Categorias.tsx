import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import api from '@/lib/api'
import type { Categoria } from '@/types'

const CORES = ['#1B2461','#4A5BA8','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#10b981','#f97316','#ec4899','#64748b']

interface FormState { nome: string; cor: string }
const empty: FormState = { nome: '', cor: '#4A5BA8' }

export default function Categorias() {
  const qc = useQueryClient()
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [showForm, setShowForm] = useState(false)

  const { data = [], isLoading } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(r => r.data),
  })

  const salvar = useMutation({
    mutationFn: () => editando ? api.put(`/categorias/${editando.id}`, form) : api.post('/categorias', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); fechar() },
  })

  const excluir = useMutation({
    mutationFn: (id: number) => api.delete(`/categorias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const abrir = (c?: Categoria) => { setEditando(c ?? null); setForm(c ? { nome: c.nome, cor: c.cor } : empty); setShowForm(true) }
  const fechar = () => { setShowForm(false); setEditando(null); setForm(empty) }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} categoria(s)</p>
        <button className="btn btn-primary btn-sm" onClick={() => abrir()}>
          <Plus size={14} /> Nova Categoria
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-l-4 border-brand">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-700">{editando ? 'Editar Categoria' : 'Nova Categoria'}</h3>
            <button onClick={fechar} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Aluguel, Impostos..." />
            </div>
            <div>
              <label className="label">Cor</label>
              <div className="flex flex-wrap gap-2">
                {CORES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, cor: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.cor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
                <input type="color" value={form.cor} onChange={e => setForm(p => ({ ...p, cor: e.target.value }))}
                  className="w-8 h-8 rounded-full cursor-pointer border border-gray-200" title="Cor personalizada" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-4 h-4 rounded-full" style={{ background: form.cor }} />
                <span className="text-xs text-gray-500 tabular-nums">{form.cor}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn btn-primary btn-sm" onClick={() => salvar.mutate()} disabled={!form.nome || salvar.isPending}>
              <Save size={13} /> {salvar.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={fechar}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhuma categoria cadastrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <th className="text-left px-5 py-3">Categoria</th>
                <th className="text-left px-3 py-3">Cor</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.cor }} />
                      <span className="font-medium text-gray-700">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-400 tabular-nums text-xs">{c.cor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="btn btn-outline btn-sm btn-icon" onClick={() => abrir(c)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon"
                        onClick={() => { if (confirm(`Remover ${c.nome}?`)) excluir.mutate(c.id) }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

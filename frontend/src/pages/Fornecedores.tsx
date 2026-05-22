import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import api from '@/lib/api'
import type { Fornecedor } from '@/types'

interface FormState { nome: string; documento: string; email: string; telefone: string }
const empty: FormState = { nome: '', documento: '', email: '', telefone: '' }

export default function Fornecedores() {
  const qc = useQueryClient()
  const [editando, setEditando] = useState<Fornecedor | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [showForm, setShowForm] = useState(false)

  const { data = [], isLoading } = useQuery<Fornecedor[]>({
    queryKey: ['fornecedores'],
    queryFn: () => api.get('/fornecedores').then(r => r.data),
  })

  const salvar = useMutation({
    mutationFn: () => editando
      ? api.put(`/fornecedores/${editando.id}`, form)
      : api.post('/fornecedores', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fornecedores'] }); fechar() },
  })

  const excluir = useMutation({
    mutationFn: (id: number) => api.delete(`/fornecedores/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fornecedores'] }),
  })

  const abrir = (f?: Fornecedor) => {
    setEditando(f ?? null)
    setForm(f ? { nome: f.nome, documento: f.documento ?? '', email: f.email ?? '', telefone: f.telefone ?? '' } : empty)
    setShowForm(true)
  }
  const fechar = () => { setShowForm(false); setEditando(null); setForm(empty) }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} fornecedor(es) ativo(s)</p>
        <button className="btn btn-primary btn-sm" onClick={() => abrir()}>
          <Plus size={14} /> Novo Fornecedor
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 border-l-4 border-brand">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-700">{editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
            <button onClick={fechar} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo ou razão social" />
            </div>
            <div>
              <label className="label">CPF / CNPJ</label>
              <input className="input" value={form.documento} onChange={e => setForm(p => ({ ...p, documento: e.target.value }))} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">E-mail</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@empresa.com" />
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

      {/* Lista */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum fornecedor cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                <th className="text-left px-5 py-3">Nome</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Documento</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">E-mail</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Telefone</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map(f => (
                <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3 font-medium text-gray-700">{f.nome}</td>
                  <td className="px-3 py-3 text-gray-400 tabular-nums hidden md:table-cell">{f.documento ?? '—'}</td>
                  <td className="px-3 py-3 text-gray-400 hidden lg:table-cell">{f.email ?? '—'}</td>
                  <td className="px-3 py-3 text-gray-400 hidden md:table-cell">{f.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="btn btn-outline btn-sm btn-icon" onClick={() => abrir(f)} title="Editar"><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Excluir"
                        onClick={() => { if (confirm(`Remover ${f.nome}?`)) excluir.mutate(f.id) }}>
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

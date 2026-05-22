import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import api from '@/lib/api'
import type { Categoria, Fornecedor, Conta } from '@/types'

const schema = z.object({
  descricao:        z.string().min(1, 'Obrigatório').max(200),
  valor:            z.string().min(1, 'Obrigatório'),
  data_vencimento:  z.string().min(1, 'Obrigatório'),
  categoria_id:     z.string().optional(),
  fornecedor_id:    z.string().optional(),
  fornecedor_livre: z.string().optional(),
  numero_documento: z.string().optional(),
  recorrente:       z.boolean().optional(),
  observacoes:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

// Pagar conta
const PagarForm = ({ id }: { id: string }) => {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: conta } = useQuery<Conta>({
    queryKey: ['conta', id],
    queryFn: () => api.get(`/contas/${id}`).then(r => r.data),
  })
  const { register, handleSubmit } = useForm<{ data_pagamento: string; forma_pagamento: string; valor_pago: string; observacoes: string }>()
  const pagar = useMutation({
    mutationFn: (d: object) => api.patch(`/contas/${id}/pagar`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contas'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); navigate('/contas') },
  })
  if (!conta) return <div className="text-sm text-gray-400 py-8 text-center">Carregando...</div>
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/contas" className="btn btn-outline btn-sm"><ArrowLeft size={14} /> Voltar</Link>
        <h2 className="font-bold text-base text-gray-800">Registrar Pagamento</h2>
      </div>
      <div className="card p-5 mb-4 border-l-4 border-brand">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Conta</p>
        <p className="font-semibold text-gray-700">{conta.descricao}</p>
        <p className="text-sm text-gray-400 mt-1">Valor: <strong className="text-gray-700">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(conta.valor)}</strong></p>
      </div>
      <form className="card p-5 space-y-4" onSubmit={handleSubmit(d => pagar.mutate({ ...d, valor_pago: d.valor_pago ? Number(d.valor_pago.replace(',','.')) : null }))}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Data do Pagamento *</label>
            <input type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} {...register('data_pagamento')} required />
          </div>
          <div>
            <label className="label">Forma de Pagamento</label>
            <select className="input" {...register('forma_pagamento')}>
              <option value="">— Selecione —</option>
              {['pix','boleto','transferencia','dinheiro','cartao','cheque'].map(f => (
                <option key={f} value={f}>{f === 'transferencia' ? 'Transferência' : f === 'cartao' ? 'Cartão' : f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Valor Pago (deixe em branco para usar o valor original)</label>
          <input type="text" className="input" placeholder={String(conta.valor).replace('.',',')} {...register('valor_pago')} />
        </div>
        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={3} {...register('observacoes')} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={pagar.isPending}>
            <Save size={14} /> {pagar.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
          </button>
          <Link to="/contas" className="btn btn-outline">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

// Form criar/editar
export default function ContaForm({ modo }: { modo: 'criar' | 'editar' | 'pagar' }) {
  const { id } = useParams()
  if (modo === 'pagar' && id) return <PagarForm id={id} />

  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: categorias }  = useQuery<Categoria[]>({ queryKey: ['categorias'], queryFn: () => api.get('/categorias').then(r => r.data) })
  const { data: fornecedores } = useQuery<Fornecedor[]>({ queryKey: ['fornecedores'], queryFn: () => api.get('/fornecedores').then(r => r.data) })
  const { data: conta }        = useQuery<Conta>({ queryKey: ['conta', id], queryFn: () => api.get(`/contas/${id}`).then(r => r.data), enabled: modo === 'editar' && !!id })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (conta) reset({ ...conta, valor: String(conta.valor).replace('.',','), categoria_id: String(conta.categoria_id ?? ''), fornecedor_id: String(conta.fornecedor_id ?? ''), recorrente: conta.recorrente === 1 })
  }, [conta])

  const salvar = useMutation({
    mutationFn: (d: FormData) => {
      const payload = { ...d, valor: Number(d.valor.replace(',','.')), categoria_id: d.categoria_id || null, fornecedor_id: d.fornecedor_id || null }
      return modo === 'editar' ? api.put(`/contas/${id}`, payload) : api.post('/contas', payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contas'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); navigate('/contas') },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/contas" className="btn btn-outline btn-sm"><ArrowLeft size={14} /> Voltar</Link>
        <h2 className="font-bold text-base text-gray-800">{modo === 'criar' ? 'Nova Conta a Pagar' : 'Editar Conta'}</h2>
      </div>

      {salvar.isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
          Erro ao salvar. Verifique os campos e tente novamente.
        </div>
      )}

      <form className="card p-6 space-y-5" onSubmit={handleSubmit(d => salvar.mutate(d))}>
        <div>
          <label className="label">Descrição *</label>
          <input className="input" placeholder="Ex: Aluguel escritório - Jun/2026" {...register('descricao')} />
          {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Valor (R$) *</label>
            <input className="input tabular-nums" placeholder="0,00" {...register('valor')} />
            {errors.valor && <p className="text-xs text-red-500 mt-1">{errors.valor.message}</p>}
          </div>
          <div>
            <label className="label">Data de Vencimento *</label>
            <input type="date" className="input" {...register('data_vencimento')} />
            {errors.data_vencimento && <p className="text-xs text-red-500 mt-1">{errors.data_vencimento.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Categoria</label>
            <select className="input" {...register('categoria_id')}>
              <option value="">— Selecione —</option>
              {categorias?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nº do Documento</label>
            <input className="input" placeholder="NF, boleto..." {...register('numero_documento')} />
          </div>
        </div>

        <div>
          <label className="label">Fornecedor Cadastrado</label>
          <select className="input" {...register('fornecedor_id')}>
            <option value="">— Sem fornecedor cadastrado —</option>
            {fornecedores?.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Ou informe o fornecedor manualmente</label>
          <input className="input" placeholder="Nome avulso" {...register('fornecedor_livre')} />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" className="accent-brand" {...register('recorrente')} />
          Esta conta é recorrente (mensal)
        </label>

        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={3} placeholder="Informações adicionais..." {...register('observacoes')} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={salvar.isPending}>
            <Save size={14} /> {salvar.isPending ? 'Salvando...' : 'Salvar Conta'}
          </button>
          <Link to="/contas" className="btn btn-outline">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

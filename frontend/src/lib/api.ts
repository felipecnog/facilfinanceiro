import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default api

// helpers
export const moeda = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export const dataBR = (d: string | null) =>
  d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

export const labelForma = (f: string | null) => ({
  pix: 'PIX', boleto: 'Boleto', transferencia: 'Transferência',
  dinheiro: 'Dinheiro', cartao: 'Cartão', cheque: 'Cheque',
}[f ?? ''] ?? 'Outro')

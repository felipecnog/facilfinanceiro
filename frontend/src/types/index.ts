export interface Conta {
  id: number
  descricao: string
  fornecedor_id: number | null
  fornecedor_livre: string | null
  fornecedor: string
  categoria_id: number | null
  categoria_nome: string | null
  categoria_cor: string | null
  valor: number
  valor_pago: number | null
  data_vencimento: string
  data_pagamento: string | null
  forma_pagamento: string | null
  numero_documento: string | null
  observacoes: string | null
  recorrente: number
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado'
  criado_em: string
}

export interface Fornecedor {
  id: number
  nome: string
  documento: string | null
  email: string | null
  telefone: string | null
  ativo: number
}

export interface Categoria {
  id: number
  nome: string
  cor: string
  ativo: number
}

export interface DashboardData {
  totais: {
    total_aberto: number
    total_vencido: number
    total_pendente: number
    pago_mes: number
    qtd_vencido: number
    qtd_pendente: number
    qtd_pago_mes: number
  }
  proximas: Conta[]
  vencidas: Conta[]
  porCategoria: { nome: string; cor: string; total: number; qtd: number }[]
}

export interface ContasResponse {
  data: Conta[]
  total: number
  page: number
  per_page: number
  totais: { total_aberto: number; total_pago: number }
}

export interface RelatorioData {
  resumoMensal: {
    mes_key: string
    mes_label: string
    total_previsto: number
    total_pago: number
    total_aberto: number
    total_vencido: number
    qtd: number
  }[]
  dre: {
    categoria: string
    cor: string
    valor_previsto: number
    valor_pago: number
    valor_aberto: number
    qtd: number
  }[]
  totais: {
    total_previsto: number
    total_pago: number
    total_aberto: number
    qtd_total: number
    qtd_pago: number
  }
  periodo: { inicio: string; fim: string }
}

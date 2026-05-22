const router = require('express').Router();
const db = require('../config/db');

// GET /api/relatorios?inicio=YYYY-MM&fim=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const inicio = req.query.inicio || `${year}-01`;
    const fim    = req.query.fim    || `${year}-${month}`;

    const [resumoMensal] = await db.execute(`
      SELECT
        DATE_FORMAT(data_vencimento,'%Y-%m') AS mes_key,
        DATE_FORMAT(data_vencimento,'%m/%Y') AS mes_label,
        SUM(valor) AS total_previsto,
        SUM(CASE WHEN status='pago' THEN COALESCE(valor_pago,valor) ELSE 0 END) AS total_pago,
        SUM(CASE WHEN status IN ('pendente','vencido') THEN valor ELSE 0 END)   AS total_aberto,
        SUM(CASE WHEN status='vencido' THEN valor ELSE 0 END)                  AS total_vencido,
        COUNT(*) AS qtd
      FROM contas_pagar
      WHERE DATE_FORMAT(data_vencimento,'%Y-%m') BETWEEN ? AND ?
        AND status != 'cancelado'
      GROUP BY DATE_FORMAT(data_vencimento,'%Y-%m')
      ORDER BY mes_key ASC
    `, [inicio, fim]);

    const [dre] = await db.execute(`
      SELECT
        COALESCE(c.nome,'Sem categoria') AS categoria,
        COALESCE(c.cor,'#64748b')        AS cor,
        SUM(cp.valor)                    AS valor_previsto,
        SUM(CASE WHEN cp.status='pago' THEN COALESCE(cp.valor_pago,cp.valor) ELSE 0 END) AS valor_pago,
        SUM(CASE WHEN cp.status IN ('pendente','vencido') THEN cp.valor ELSE 0 END)      AS valor_aberto,
        COUNT(*)                         AS qtd
      FROM contas_pagar cp
      LEFT JOIN categorias c ON c.id = cp.categoria_id
      WHERE DATE_FORMAT(cp.data_vencimento,'%Y-%m') BETWEEN ? AND ?
        AND cp.status != 'cancelado'
      GROUP BY cp.categoria_id, c.nome, c.cor
      ORDER BY valor_previsto DESC
    `, [inicio, fim]);

    const [[totais]] = await db.execute(`
      SELECT
        SUM(valor) AS total_previsto,
        SUM(CASE WHEN status='pago' THEN COALESCE(valor_pago,valor) ELSE 0 END) AS total_pago,
        SUM(CASE WHEN status IN ('pendente','vencido') THEN valor ELSE 0 END)   AS total_aberto,
        COUNT(*) AS qtd_total,
        COUNT(CASE WHEN status='pago' THEN 1 END) AS qtd_pago
      FROM contas_pagar
      WHERE DATE_FORMAT(data_vencimento,'%Y-%m') BETWEEN ? AND ?
        AND status != 'cancelado'
    `, [inicio, fim]);

    res.json({ resumoMensal, dre, totais, periodo: { inicio, fim } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/relatorios/csv — exportação de dados brutos
router.get('/csv', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const inicio = req.query.inicio || `${year}-01`;
    const fim    = req.query.fim    || `${year}-${month}`;

    const [rows] = await db.execute(`
      SELECT cp.id, cp.descricao,
             COALESCE(f.nome, cp.fornecedor_livre,'—') AS fornecedor,
             COALESCE(c.nome,'—') AS categoria,
             cp.valor, cp.valor_pago, cp.data_vencimento,
             cp.data_pagamento, cp.forma_pagamento, cp.status,
             cp.numero_documento, cp.observacoes
      FROM contas_pagar cp
      LEFT JOIN categorias   c ON c.id = cp.categoria_id
      LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
      WHERE DATE_FORMAT(cp.data_vencimento,'%Y-%m') BETWEEN ? AND ?
        AND cp.status != 'cancelado'
      ORDER BY cp.data_vencimento ASC
    `, [inicio, fim]);

    const headers = ['ID','Descrição','Fornecedor','Categoria','Valor','Valor Pago',
                     'Vencimento','Pagamento','Forma Pagamento','Status','Nº Documento','Observações'];

    const csvLines = [
      headers.join(';'),
      ...rows.map(r => [
        r.id, `"${r.descricao}"`, `"${r.fornecedor}"`, `"${r.categoria}"`,
        String(r.valor).replace('.',','), String(r.valor_pago || '').replace('.',','),
        r.data_vencimento || '', r.data_pagamento || '', r.forma_pagamento || '',
        r.status, r.numero_documento || '', `"${r.observacoes || ''}"`
      ].join(';'))
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_${inicio}_${fim}.csv"`);
    res.send('﻿' + csvLines.join('\r\n')); // BOM para Excel reconhecer UTF-8
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

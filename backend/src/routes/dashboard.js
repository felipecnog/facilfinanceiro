const router = require('express').Router();
const db = require('../config/db');

// Atualiza vencidos automaticamente
async function atualizarVencidos() {
  await db.execute(`
    UPDATE contas_pagar SET status = 'vencido'
    WHERE status = 'pendente' AND data_vencimento < CURDATE()
  `);
}

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    await atualizarVencidos();

    const [[totais]] = await db.execute(`
      SELECT
        SUM(CASE WHEN status IN ('pendente','vencido') THEN valor ELSE 0 END) AS total_aberto,
        SUM(CASE WHEN status = 'vencido'  THEN valor ELSE 0 END)              AS total_vencido,
        SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END)              AS total_pendente,
        SUM(CASE WHEN status = 'pago'
              AND MONTH(data_pagamento) = MONTH(CURDATE())
              AND YEAR(data_pagamento)  = YEAR(CURDATE()) THEN COALESCE(valor_pago, valor) ELSE 0 END) AS pago_mes,
        COUNT(CASE WHEN status = 'vencido'  THEN 1 END) AS qtd_vencido,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) AS qtd_pendente,
        COUNT(CASE WHEN status = 'pago'
               AND MONTH(data_pagamento) = MONTH(CURDATE())
               AND YEAR(data_pagamento)  = YEAR(CURDATE()) THEN 1 END) AS qtd_pago_mes
      FROM contas_pagar
    `);

    const [proximas] = await db.execute(`
      SELECT cp.*, c.nome AS categoria_nome, c.cor AS categoria_cor,
             COALESCE(f.nome, cp.fornecedor_livre, '—') AS fornecedor
      FROM   contas_pagar cp
      LEFT JOIN categorias   c ON c.id = cp.categoria_id
      LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
      WHERE  cp.status = 'pendente'
      AND    cp.data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER  BY cp.data_vencimento
      LIMIT  8
    `);

    const [vencidas] = await db.execute(`
      SELECT cp.*, c.nome AS categoria_nome, c.cor AS categoria_cor,
             COALESCE(f.nome, cp.fornecedor_livre, '—') AS fornecedor
      FROM   contas_pagar cp
      LEFT JOIN categorias   c ON c.id = cp.categoria_id
      LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
      WHERE  cp.status = 'vencido'
      ORDER  BY cp.data_vencimento
      LIMIT  6
    `);

    const [porCategoria] = await db.execute(`
      SELECT c.nome, c.cor, SUM(cp.valor) AS total, COUNT(*) AS qtd
      FROM   contas_pagar cp
      JOIN   categorias c ON c.id = cp.categoria_id
      WHERE  cp.status IN ('pendente','vencido')
      GROUP  BY c.id, c.nome, c.cor
      ORDER  BY total DESC
      LIMIT  8
    `);

    res.json({ totais, proximas, vencidas, porCategoria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

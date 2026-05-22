const router = require('express').Router();
const db = require('../config/db');

// GET /api/contas — lista com filtros e paginação
router.get('/', async (req, res) => {
  try {
    const { status, categoria, mes, q, page = 1, per_page = 20 } = req.query;
    const conditions = ['1=1'];
    const params = [];

    if (status && ['pendente','pago','vencido','cancelado'].includes(status)) {
      conditions.push('cp.status = ?'); params.push(status);
    }
    if (categoria) { conditions.push('cp.categoria_id = ?'); params.push(Number(categoria)); }
    if (mes)       { conditions.push("DATE_FORMAT(cp.data_vencimento,'%Y-%m') = ?"); params.push(mes); }
    if (q) {
      conditions.push('(cp.descricao LIKE ? OR cp.numero_documento LIKE ? OR f.nome LIKE ? OR cp.fornecedor_livre LIKE ?)');
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const where = conditions.join(' AND ');
    const offset = (Number(page) - 1) * Number(per_page);

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM contas_pagar cp LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id WHERE ${where}`,
      params
    );

    const [rows] = await db.execute(
      `SELECT cp.*, c.nome AS categoria_nome, c.cor AS categoria_cor,
              COALESCE(f.nome, cp.fornecedor_livre, '—') AS fornecedor
       FROM   contas_pagar cp
       LEFT JOIN categorias   c ON c.id = cp.categoria_id
       LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
       WHERE  ${where}
       ORDER  BY CASE cp.status WHEN 'vencido' THEN 0 WHEN 'pendente' THEN 1 WHEN 'pago' THEN 2 ELSE 3 END,
                 cp.data_vencimento ASC
       LIMIT  ? OFFSET ?`,
      [...params, Number(per_page), offset]
    );

    const [[tots]] = await db.execute(
      `SELECT
         SUM(CASE WHEN status IN ('pendente','vencido') THEN valor ELSE 0 END) AS total_aberto,
         SUM(CASE WHEN status = 'pago' THEN COALESCE(valor_pago,valor) ELSE 0 END) AS total_pago
       FROM contas_pagar cp LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id WHERE ${where}`,
      params
    );

    res.json({ data: rows, total: Number(total), page: Number(page), per_page: Number(per_page), totais: tots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/contas/:id
router.get('/:id', async (req, res) => {
  try {
    const [[row]] = await db.execute(
      `SELECT cp.*, c.nome AS categoria_nome, COALESCE(f.nome, cp.fornecedor_livre,'—') AS fornecedor_nome
       FROM contas_pagar cp
       LEFT JOIN categorias   c ON c.id = cp.categoria_id
       LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id
       WHERE cp.id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contas
router.post('/', async (req, res) => {
  try {
    const { descricao, fornecedor_id, fornecedor_livre, categoria_id, valor,
            data_vencimento, numero_documento, recorrente, observacoes } = req.body;

    if (!descricao || !valor || !data_vencimento)
      return res.status(400).json({ error: 'descricao, valor e data_vencimento são obrigatórios' });

    const status = new Date(data_vencimento) < new Date(new Date().toDateString()) ? 'vencido' : 'pendente';

    const [result] = await db.execute(
      `INSERT INTO contas_pagar
         (descricao, fornecedor_id, fornecedor_livre, categoria_id, valor, data_vencimento,
          numero_documento, recorrente, observacoes, status, criado_por)
       VALUES (?,?,?,?,?,?,?,?,?,'Admin')`,
      [
        descricao,
        fornecedor_id || null,
        fornecedor_livre || null,
        categoria_id || null,
        Number(valor),
        data_vencimento,
        numero_documento || null,
        recorrente ? 1 : 0,
        observacoes || null,
        status,
      ]
    );

    await db.execute(
      `INSERT INTO historico_pagamentos (conta_id, acao, status_antes, status_depois, usuario)
       VALUES (?, 'Criação', NULL, ?, 'Admin')`,
      [result.insertId, status]
    );

    res.status(201).json({ id: result.insertId, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contas/:id
router.put('/:id', async (req, res) => {
  try {
    const { descricao, fornecedor_id, fornecedor_livre, categoria_id, valor,
            data_vencimento, numero_documento, recorrente, observacoes } = req.body;

    const [[current]] = await db.execute('SELECT status FROM contas_pagar WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Conta não encontrada' });

    await db.execute(
      `UPDATE contas_pagar SET
         descricao=?, fornecedor_id=?, fornecedor_livre=?, categoria_id=?, valor=?,
         data_vencimento=?, numero_documento=?, recorrente=?, observacoes=?
       WHERE id=?`,
      [
        descricao, fornecedor_id || null, fornecedor_livre || null,
        categoria_id || null, Number(valor), data_vencimento,
        numero_documento || null, recorrente ? 1 : 0, observacoes || null,
        req.params.id,
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contas/:id/pagar
router.patch('/:id/pagar', async (req, res) => {
  try {
    const { data_pagamento, forma_pagamento, valor_pago, observacoes } = req.body;

    const [[current]] = await db.execute('SELECT status FROM contas_pagar WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Conta não encontrada' });

    await db.execute(
      `UPDATE contas_pagar SET status='pago', data_pagamento=?, forma_pagamento=?, valor_pago=?, observacoes=? WHERE id=?`,
      [data_pagamento, forma_pagamento || null, valor_pago || null, observacoes || null, req.params.id]
    );

    await db.execute(
      `INSERT INTO historico_pagamentos (conta_id, acao, status_antes, status_depois, usuario)
       VALUES (?, 'Pagamento', ?, 'pago', 'Admin')`,
      [req.params.id, current.status]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/contas/:id/cancelar
router.patch('/:id/cancelar', async (req, res) => {
  try {
    const [[current]] = await db.execute('SELECT status FROM contas_pagar WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Não encontrada' });

    await db.execute(`UPDATE contas_pagar SET status='cancelado' WHERE id=?`, [req.params.id]);
    await db.execute(
      `INSERT INTO historico_pagamentos (conta_id, acao, status_antes, status_depois, usuario)
       VALUES (?, 'Cancelamento', ?, 'cancelado', 'Admin')`,
      [req.params.id, current.status]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contas/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM contas_pagar WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

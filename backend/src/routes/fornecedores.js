const router = require('express').Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM fornecedores WHERE ativo=1 ORDER BY nome');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nome, documento, email, telefone } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const [r] = await db.execute(
      'INSERT INTO fornecedores (nome, documento, email, telefone) VALUES (?,?,?,?)',
      [nome, documento || null, email || null, telefone || null]
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, documento, email, telefone } = req.body;
    await db.execute(
      'UPDATE fornecedores SET nome=?, documento=?, email=?, telefone=? WHERE id=?',
      [nome, documento || null, email || null, telefone || null, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute('UPDATE fornecedores SET ativo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

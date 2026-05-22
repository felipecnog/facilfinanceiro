const router = require('express').Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM categorias WHERE ativo=1 ORDER BY nome');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nome, cor } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const [r] = await db.execute(
      'INSERT INTO categorias (nome, cor) VALUES (?,?)',
      [nome, cor || '#64748b']
    );
    res.status(201).json({ id: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, cor } = req.body;
    await db.execute('UPDATE categorias SET nome=?, cor=? WHERE id=?', [nome, cor, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute('UPDATE categorias SET ativo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

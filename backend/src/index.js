require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Rotas
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/contas',      require('./routes/contas'));
app.use('/api/fornecedores',require('./routes/fornecedores'));
app.use('/api/categorias',  require('./routes/categorias'));
app.use('/api/relatorios',  require('./routes/relatorios'));

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API Facil Financeiro rodando em http://localhost:${PORT}`);
});

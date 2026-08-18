# Facil Financeiro — React + Node.js

Sistema financeiro moderno da Facil Consultoria Escolar.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + mysql2
- **Banco**: MySQL (mesmo banco do sistema PHP)

## Instalação

### 1. Backend

```bash
cd backend
npm install

# Configure o banco de dados
cp .env.example .env
# Edite o .env com suas credenciais
```

Conteúdo do `.env`:
```
DB_HOST=erp-php_facilfinanceirosql
DB_PORT=3306
DB_NAME=erp-php
DB_USER=****
DB_PASS=****
PORT=***
```

```bash
# Rodar em desenvolvimento
npm run dev

# Rodar em produção
npm start
```

API disponível em: `http://localhost:3001`

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponível em: `http://localhost:5173`

> O Vite faz proxy automático de `/api` → `http://localhost:3001`

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard` | Totais, próximas e vencidas |
| GET | `/api/contas` | Lista com filtros e paginação |
| POST | `/api/contas` | Criar conta |
| PUT | `/api/contas/:id` | Editar conta |
| PATCH | `/api/contas/:id/pagar` | Registrar pagamento |
| PATCH | `/api/contas/:id/cancelar` | Cancelar conta |
| DELETE | `/api/contas/:id` | Excluir conta |
| GET | `/api/fornecedores` | Listar fornecedores |
| POST | `/api/fornecedores` | Criar fornecedor |
| PUT | `/api/fornecedores/:id` | Editar fornecedor |
| DELETE | `/api/fornecedores/:id` | Desativar fornecedor |
| GET | `/api/categorias` | Listar categorias |
| POST | `/api/categorias` | Criar categoria |
| PUT | `/api/categorias/:id` | Editar categoria |
| DELETE | `/api/categorias/:id` | Desativar categoria |
| GET | `/api/relatorios` | DRE + resumo mensal |
| GET | `/api/relatorios/csv` | Exportar CSV/Excel |

## Estrutura de Pastas

```
facil-financeiro/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── routes/
│   │   │   ├── dashboard.js
│   │   │   ├── contas.js
│   │   │   ├── fornecedores.js
│   │   │   ├── categorias.js
│   │   │   └── relatorios.js
│   │   └── index.js
│   ├── .env          ← criar a partir do .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/layout/
    │   ├── pages/
    │   ├── types/
    │   ├── lib/api.ts
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## Adicionando Novos Módulos

Para adicionar um novo módulo (ex: Contas a Receber):

1. **Backend**: criar `backend/src/routes/receber.js` e registrar no `index.js`
2. **Frontend**: criar `frontend/src/pages/ContasReceber.tsx` e adicionar a rota em `App.tsx` e o link em `Sidebar.tsx`

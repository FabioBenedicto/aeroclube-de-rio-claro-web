# Aeroclube de Rio Claro — Web

Interface web do *sistema de gestão financeira e operacional do Aeroclube de Rio Claro*. Painel administrativo (SPA) para gerenciar pessoas, empresas, aeronaves e voos, além de todo o ciclo financeiro do clube — títulos a receber e a pagar, faturas, baixas, remessas bancárias (CNAB/Sicoob), relatórios sob demanda e um dashboard com indicadores.

Construída com *React 19, **TypeScript* e *Vite 8, estilizada com **Tailwind CSS, usando **TanStack React Query* para estado de servidor e autenticação via *JWT*.

🌐 *Demo:* https://aeroclube-de-rio-claro-web.vercel.app
🔗 *Back-end:* [aeroclube-de-rio-claro-api](https://github.com/FabioBenedicto/aeroclube-de-rio-claro-api)

---

## Sumário

- [Stack](#stack)
- [Funcionalidades](#funcionalidades)
- [Mapa de navegação](#mapa-de-navegação)
- [Arquitetura](#arquitetura)
- [Autenticação e permissões](#autenticação-e-permissões)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executando](#executando)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Deploy](#deploy)
- [Licença](#licença)

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Biblioteca de UI | React 19 |
| Linguagem | TypeScript |
| Build / dev server | Vite 8 |
| Estilização | Tailwind CSS 3 (PostCSS + Autoprefixer) |
| Roteamento | React Router DOM 7 |
| Estado de servidor / cache | TanStack React Query 5 |
| Cliente HTTP | Axios |
| Gráficos | Recharts |
| Ícones | lucide-react |
| Utilidades de classe | class-variance-authority, clsx, tailwind-merge |
| Hospedagem | Vercel |

---

## Funcionalidades

Cada tela consome a [API](https://github.com/FabioBenedicto/aeroclube-de-rio-claro-api) e exige autenticação. As principais áreas:

- *Login* — autenticação por e-mail e senha; armazena o token JWT e o usuário.
- *Dashboard* — indicadores financeiros e operacionais com gráficos (Recharts).
- *Pessoas* — listagem, cadastro, edição e página de detalhe. Suporta os perfis de aluno, sócio, instrutor e funcionário, com endereço e saldo de crédito.
- *Empresas* — listagem, cadastro/edição (modal) e detalhe.
- *Voos* — listagem, registro (modal), edição e *fechamento de voo* (modal próprio), com cálculo de horas e valores.
- *Aeronaves* — listagem, cadastro/edição (modal) e detalhe, com tipo (avião/planador) e valor de hora.
- *Títulos a receber* — listagem com filtros, criação, edição, detalhe e *registro de pagamentos* (incluindo parciais e comprovante).
- *Títulos a pagar* — fluxo equivalente ao de recebíveis, para despesas e comissões.
- *Faturas* — listagem, criação (modal), detalhe, *pagamento* e *baixa via CNAB* (modal de baixa).
- *CNAB* — geração e acompanhamento de *remessas bancárias* (Sicoob), com página de detalhe da remessa.
- *Relatórios* — montagem de relatórios dinâmicos (entidade, campos, filtros) e *exportação*.
- *Configurações* — parâmetros gerais do clube e integração Sicoob (somente admin).
- *Usuários* — gestão de usuários e permissões (somente admin).
- *Perfil* — dados da conta do usuário logado.

Recursos transversais de UX: filtros por período (DateRangeFilter), filtros avançados em popover, paginação, menus de linha em tabelas, modais de pagamento/baixa, toasts de feedback e tema (claro/escuro) via ThemeContext.

---

## Mapa de navegação

A barra lateral (AppShell) exibe itens conforme as permissões do usuário:

| Rota | Item | Visibilidade |
| --- | --- | --- |
| /dashboard | Dashboard | Todos os autenticados |
| /receivables | Títulos a receber | Permissão receivables:view |
| /payables | Títulos a pagar | Permissão payables:view |
| /invoices | Faturas | Permissão bills:view |
| /cnab | CNAB | Somente admin |
| /flights | Voos | Permissão flights:view |
| /planes | Aeronaves | Permissão aircraft:view |
| /peoples | Pessoas | Permissão customers:view |
| /companies | Empresas | Permissão companies:view |
| /reports | Relatórios | Permissão reports:view |
| /settings | Configurações | Somente admin |
| /users | Usuários | Somente admin |

Rotas de detalhe (/:id) existem para pessoas, empresas, aeronaves, recebíveis, pagáveis, faturas e remessas CNAB. Qualquer rota desconhecida redireciona para /dashboard.

---

## Arquitetura

- *SPA com React Router 7* — todas as rotas internas ficam sob um ProtectedRoute que envolve o AppShell (layout com barra lateral e cabeçalho). O index redireciona para /dashboard.
- *Estado de servidor com React Query* — um QueryClient global gerencia cache, refetch e invalidação. As chamadas à API ficam isoladas em src/api/, uma por domínio (flights.ts, receivables.ts, cnab.ts, etc.).
- *Cliente HTTP centralizado* — src/api/client.ts cria uma instância Axios com baseURL em VITE_API_URL, injeta o token JWT no header Authorization e, em respostas 401, limpa a sessão e redireciona para /login.
- *Contextos* — AuthContext (sessão e permissões) e ThemeContext (tema claro/escuro).
- *Biblioteca de UI própria* — componentes reutilizáveis em src/components/ui/ (Button, Input, Select, Combobox, Modal, Table, Card, Badge, Chip, Checkbox, ProgressBar, Skeleton, StatCard, TabBar, etc.), compostos com clsx + tailwind-merge (helper cn) e class-variance-authority.
- *Páginas por domínio* — cada domínio tem sua pasta em src/pages/ com a listagem e os modais/detalhe relacionados.
- *Utilitários* — formatação pt-BR (formatBRL, formatHours, formatDate), máscaras de CPF/CNPJ, helpers de permissões e de toast.

---

## Autenticação e permissões

- O login persiste o token em localStorage sob a chave *acrc.token* (e os dados do usuário em acrc.user).
- O token é enviado automaticamente em toda requisição pelo interceptor do Axios.
- Respostas 401 disparam logout automático e redirecionamento para /login.
- A navegação e as ações são *filtradas por permissão*: itens de menu e telas verificam as permissões do usuário (módulo:ação), e áreas administrativas (CNAB, Configurações, Usuários) ficam restritas a admins.

---

## Pré-requisitos

- Node.js 20+
- A [API](https://github.com/FabioBenedicto/aeroclube-de-rio-claro-api) em execução (localmente ou em produção)

---

## Instalação

bash
git clone https://github.com/FabioBenedicto/aeroclube-de-rio-claro-web.git
cd aeroclube-de-rio-claro-web
npm install


---

## Variáveis de ambiente

Crie um arquivo .env na raiz a partir de .env.example:

| Variável | Descrição |
| --- | --- |
| VITE_API_URL | URL base da API, incluindo o prefixo /api |

env
VITE_API_URL=http://localhost:3000/api


> Garanta que a porta corresponde à da API. Por padrão a API sobe em http://localhost:3000/api.

---

## Executando

bash
# desenvolvimento (HMR)
npm run dev

# build de produção
npm run build

# pré-visualização da build
npm run preview


---

## Scripts

| Script | Descrição |
| --- | --- |
| npm run dev | Servidor de desenvolvimento com HMR |
| npm run build | Type-check (tsc -b) + build de produção (Vite) |
| npm run preview | Serve a build localmente |
| npm run lint | Executa o ESLint |

---

## Estrutura de pastas


src/
├── main.tsx              # ponto de entrada (StrictMode + App)
├── App.tsx              # providers (QueryClient, Auth, Theme) e rotas
├── index.css           # estilos base / Tailwind
├── api/                # camada de acesso à API (axios), uma por domínio
│   ├── client.ts       # instância Axios + interceptors (JWT, 401)
│   ├── auth.ts
│   ├── flights.ts
│   ├── receivables.ts  # ... payables, invoices, cnab, peoples,
│   └── ...             #     companies, planes, reports, settings, users
├── components/
│   ├── AppShell.tsx    # layout: barra lateral + cabeçalho
│   ├── ProtectedRoute.tsx
│   ├── ui/             # biblioteca de componentes de interface
│   └── ...             # modais e utilitários de tabela/pagamento
├── contexts/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── pages/              # telas organizadas por domínio
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   ├── peoples/        # listagem, detalhe e modais
│   ├── companies/
│   ├── flights/
│   ├── planes/
│   ├── receivables/
│   ├── payables/
│   ├── invoices/
│   ├── cnab/
│   ├── reports/
│   └── users/
├── types/              # tipos TypeScript compartilhados
└── utils/              # cn, format (pt-BR), masks (CPF/CNPJ), permissions, toast


---

## Deploy

O projeto está pronto para a *Vercel* (vercel.json com rewrite para SPA). Para publicar:

1. Conecte o repositório na Vercel.
2. Defina a variável VITE_API_URL apontando para a API em produção.
3. Faça o deploy — o build roda npm run build e publica a pasta dist.

---

## Licença

Projeto privado / acadêmico.*

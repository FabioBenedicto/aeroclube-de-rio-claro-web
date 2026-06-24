# Aeroclube de Rio Claro — API

API REST que sustenta o *sistema de gestão financeira e operacional do Aeroclube de Rio Claro*. Concentra o cadastro de pessoas, empresas, aeronaves e voos, e todo o ciclo financeiro do clube: títulos a receber e a pagar, faturas, baixas, geração de remessas bancárias (CNAB/Sicoob), relatórios sob demanda e indicadores de dashboard.

Construída com *NestJS 11, **Prisma 7* e *PostgreSQL*, com autenticação JWT, controle de acesso granular por permissões (RBAC), documentação Swagger e armazenamento de arquivos no Azure Blob Storage.

🔗 *Front-end:* [aeroclube-de-rio-claro-web](https://github.com/FabioBenedicto/aeroclube-de-rio-claro-web)

---

## Sumário

- [Stack](#stack)
- [Visão geral do domínio](#visão-geral-do-domínio)
- [Funcionalidades por módulo](#funcionalidades-por-módulo)
- [Regras de negócio em destaque](#regras-de-negócio-em-destaque)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Executando](#executando)
- [Documentação Swagger](#documentação-swagger)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Convenções de projeto](#convenções-de-projeto)
- [Licença](#licença)

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | NestJS 11 |
| Linguagem | TypeScript 5 |
| ORM | Prisma 7 (client gerado em src/generated/prisma) |
| Banco de dados | PostgreSQL (adapter @prisma/adapter-pg) |
| Autenticação | JWT (@nestjs/jwt + passport-jwt), hashing com bcrypt |
| Validação / serialização | class-validator, class-transformer, ClassSerializerInterceptor |
| Documentação | Swagger / OpenAPI (@nestjs/swagger) |
| Armazenamento de arquivos | Azure Blob Storage (@azure/storage-blob) |
| Planilhas | ExcelJS (exportação de relatórios) |
| Codificação CNAB | iconv-lite (geração do arquivo de remessa) |
| Datas | date-fns |
| Testes | Jest, Supertest |
| Dados de seed | @faker-js/faker |

---

## Visão geral do domínio

O sistema gira em torno de *pessoas* e de *títulos financeiros*:

- Uma *pessoa* (People) é o cadastro base. A partir dela, uma pessoa pode acumular um ou mais *perfis: aluno (Student), sócio (Partner), instrutor (Instructor) e/ou funcionário (Employee). Cada pessoa pode ter um **endereço* e um *saldo de crédito* (credit_balance).
- A operação aérea registra *voos* (Flight) feitos com *aeronaves* (Aircraft), opcionalmente acompanhados por um *instrutor*.
- Cada voo gera automaticamente lançamentos financeiros: um *título a receber* (Receivable) do cliente e, quando há instrutor, um *título a pagar* (Payable) referente à comissão.
- Títulos a receber podem ser agrupados em *faturas* (Bill), que por sua vez alimentam a geração de *remessas bancárias* (CnabRemessa) no padrão Sicoob.
- Todo título carrega um *stakeholder* (a quem ele se refere: pessoa, aluno, sócio, instrutor, funcionário, empresa ou nenhum), permitindo vincular o lançamento ao ator correto.

---

## Funcionalidades por módulo

A API é organizada em módulos NestJS independentes, registrados em app.module.ts. Todas as rotas usam o prefixo global */api*.

### Autenticação (auth)
- Login por e-mail e senha; a senha é verificada com bcrypt.
- Retorna os dados do usuário (incluindo role e lista de permissões) e um *access token JWT* assinado com sub, email, role, name e permissions.
- Estratégia jwt.strategy para validação do token nas rotas protegidas.

### Usuários e permissões (users, permissions)
- CRUD de usuários do sistema, com papéis *ADMIN* e *USER*.
- Controle de acesso granular: cada usuário recebe permissões no formato módulo:ação (ex.: receivables:create, flights:delete).
- Permissões disponíveis cobrem receivables, payables, bills, flights, aircraft, customers, companies, reports, settings e title-types, cada qual com ações view, create, update e delete (relatórios e configurações têm um subconjunto).

### Pessoas (peoples)
- Cadastro unificado de pessoas físicas (CPF, e-mail, telefone, endereço).
- Cada pessoa pode assumir os perfis de *aluno, **sócio, **instrutor* e/ou *funcionário*.
- Mantém *saldo de crédito* que pode ser usado para abater títulos.

### Empresas (companies)
- Cadastro de pessoas jurídicas (CNPJ, e-mail, telefone), também elegíveis como stakeholders de títulos.

### Aeronaves (aircraft)
- Cadastro por matrícula e modelo.
- Tipo *AIRPLANE* ou *GLIDER* (planador), com flight_hour_value (valor da hora de voo) para aviões.

### Voos (flights)
- Registro de voos com origem, destino, datas, aeronave, cliente e instrutor opcional.
- *Cálculo automático do valor* conforme o tipo de aeronave (ver [Regras de negócio](#regras-de-negócio-em-destaque)).
- Geração automática do título a receber (cliente) e do título a pagar (comissão do instrutor).
- Endpoint para *fechar voo* (informar a data de término e recalcular horas/valor).
- Estatísticas de voos.

### Títulos a receber (receivables, receivable-types)
- CRUD de títulos com tipos configuráveis.
- Vínculo polimórfico via stakeholder (pessoa, aluno, sócio, instrutor, funcionário, empresa).
- *Pagamentos parciais* (ReceivablePayment), com método, data e comprovante (arquivo).
- Status do título: *PENDING, **PARTIAL, **PAID, **OVERDUE*.
- Flag adds_credit para gerar crédito ao pagador.

### Títulos a pagar (payables, payable-types)
- Estrutura espelhada à de recebíveis, para despesas e comissões.
- Pagamentos parciais (PayablePayment) com método, data e comprovante.

### Faturas (bills)
- Agrupam pagamentos de recebíveis de uma pessoa.
- Status: *open, **pending_cnab, **paid, **cancelled*.
- Baixa com método e data de pagamento; suportam anexo de comprovante.

### CNAB / Sicoob (cnab)
- Geração de *arquivo de remessa bancária* (boletos) no layout Sicoob, a partir de faturas selecionadas.
- Valida se as configurações do Sicoob estão completas antes de gerar.
- Controla o *número sequencial* da remessa, codifica o arquivo com iconv-lite e o persiste no Azure Blob Storage.
- Mantém histórico de remessas (CnabRemessa) com a relação de faturas, contagem e valor total.

### Dashboard (dashboard)
- Resumo consolidado: totais e quantidade de títulos a receber/pagar em aberto, voos do dia, voos em andamento e pessoas ativas.

### Relatórios (reports)
- *Construtor de relatórios dinâmico*: o cliente escolhe a entidade, os campos, os filtros (operadores eq, neq, contains, gt, gte, lt, lte, in, is_null, is_not_null) e agregações.
- As condições são traduzidas para consultas Prisma e o resultado é *exportado em Excel* (ExcelJS).

### Configurações (settings)
- Parâmetros gerais: percentual de comissão do instrutor, mensalidade de sócio e parâmetros de cobrança de planador (minutos de franquia, valor inicial e valor por minuto).
- *Configurações do Sicoob*: prefixo/dígito da cooperativa, agência, conta, carteira, modalidade, CNPJ, razão social, sequência de remessa e parâmetros de juros.

### Arquivos (provider azure-blob)
- Upload e referência de arquivos (comprovantes de pagamento, remessas CNAB) no Azure Blob Storage, com metadados persistidos na tabela files.

---

## Regras de negócio em destaque

### Cálculo do valor do voo
O cálculo (em flights.service.ts) depende do tipo de aeronave:

- *Avião (AIRPLANE)* — valor = horas_voadas × flight_hour_value. As horas são derivadas da diferença entre início e fim do voo. Se a aeronave não tiver valor de hora configurado, o registro é rejeitado.
- *Planador (GLIDER)* — modelo de *franquia + excedente: um valor inicial cobre os primeiros *N minutos (glider_initial_minutes, padrão 45); cada minuto acima da franquia é cobrado por glider_minute_value. Ex.: valor inicial R$ 330 + R$ 3,00 por minuto excedente.

Em ambos os casos é gravado um *calculation_breakdown* (JSON) com o detalhamento do cálculo para auditoria.

### Comissão do instrutor
Quando o voo tem instrutor, é gerado um *título a pagar* com valor total_do_voo × instructor_percentage / 100, conforme o percentual definido nas configurações.

### Vencimento padrão
Títulos gerados a partir de voos recebem *vencimento padrão de 30 dias* quando não é informado explicitamente.

### Geração de remessa CNAB
A geração só ocorre se as configurações do Sicoob estiverem completas; faturas inexistentes são reportadas como erro. O arquivo é montado linha a linha pelo builder de remessa e armazenado, com o sequencial de remessa controlado nas configurações.

---

## Arquitetura

- *Modular* — cada domínio é um módulo NestJS isolado, no fluxo controller → service → repository.
- *Repository Pattern* — cada repositório expõe uma *interface* e possui duas implementações: uma com Prisma e uma *fake* (fake-*.repository.ts) usada nos testes, com injeção por *token*.
- *Guards* — JwtAuthGuard (autenticação), RolesGuard (papéis) e PermissionsGuard (permissões granulares).
- *Decorators customizados* — @CurrentUser(), @RequirePermission(), @Roles(), além dos validadores @IsCpf() e @IsCnpj().
- *Filtros globais* — PrismaExceptionFilter e HttpExceptionFilter para tratamento padronizado de erros.
- *Pipes globais* — ValidationPipe com whitelist, forbidNonWhitelisted e transform.
- *Serialização* — ClassSerializerInterceptor global (oculta campos sensíveis como senha).
- *Configuração* — @nestjs/config global, carregando a configuração de JWT.
- *Arquivos estáticos* — a pasta uploads é servida em /uploads.

---

## Modelo de dados

Entidades principais (mapeadas pelo Prisma):


People ─┬─ Address (1:1)
        ├─ Student / Partner / Instructor / Employee (perfis 1:1 opcionais)
        ├─ Flight (1:N)
        ├─ Receivable / Payable (1:N)
        └─ Bill (1:N)

Aircraft ─< Flight >─ Instructor
Flight ─┬─ Receivable (cliente)
        └─ Payable (comissão do instrutor)

Receivable ─< ReceivablePayment >─ Bill
Payable    ─< PayablePayment
Bill       ─< CnabRemessa (via faturas selecionadas)

File ←─ Bill / ReceivablePayment / PayablePayment / CnabRemessa


*Enums:* Role (ADMIN, USER) · BillStatus (open, pending_cnab, paid, cancelled) · TitleStatus (PENDING, PARTIAL, PAID, OVERDUE) · TitleStakeholder (PEOPLE, STUDENT, PARTNER, INSTRUCTOR, EMPLOYEE, COMPANY, NONE) · EAircraftType (AIRPLANE, GLIDER) · EPaymentMethod (pix, dinheiro, transferencia, credito, debito, cheque, boleto).

O histórico completo de evolução do schema está versionado em prisma/migrations.

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- (Opcional) Conta de Azure Blob Storage para upload de arquivos e geração de remessas

---

## Instalação

bash
git clone https://github.com/FabioBenedicto/aeroclube-de-rio-claro-api.git
cd aeroclube-de-rio-claro-api
npm install


---

## Variáveis de ambiente

Crie um arquivo .env na raiz a partir de .env.example:

| Variável | Descrição |
| --- | --- |
| DATABASE_URL | String de conexão do PostgreSQL |
| JWT_SECRET | Segredo de assinatura do JWT (mínimo 32 caracteres) |
| JWT_EXPIRES_IN | Validade do token (ex.: 8h) |
| PORT | Porta da aplicação (padrão 3000) |
| AZURE_STORAGE_CONNECTION_STRING | Conexão do Azure Blob Storage |
| AZURE_STORAGE_CONTAINER | Nome do container (ex.: aeroclube) |

env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/aeroclube_db"
JWT_SECRET="sua-chave-secreta-forte-min-32-chars"
JWT_EXPIRES_IN="8h"
PORT=3000

AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER="aeroclube"


---

## Banco de dados

bash
# desenvolvimento: cria/atualiza o schema e gera o client
npx prisma migrate dev

# produção: aplica as migrations já existentes
npx prisma migrate deploy

# popula o banco com dados iniciais (usuário admin, permissões, etc.)
npx prisma db seed


---

## Executando

bash
# desenvolvimento (watch)
npm run start:dev

# produção
npm run build
npm run start:prod


A aplicação sobe em http://localhost:3000/api.

---

## Documentação Swagger

Com a API em execução, a documentação interativa OpenAPI fica em:


http://localhost:3000/api/docs


A documentação usa autenticação Bearer (botão *Authorize* para informar o token JWT).

---

## Scripts

| Script | Descrição |
| --- | --- |
| npm run start | Inicia a aplicação |
| npm run start:dev | Modo desenvolvimento com watch |
| npm run start:debug | Modo debug com watch |
| npm run start:prod | Inicia a build de produção (dist/) |
| npm run build | Compila (nest build + tsc-alias) |
| npm run lint | ESLint com correção automática |
| npm run format | Formata com Prettier |
| npm run test | Testes unitários (Jest) |
| npm run test:watch | Testes em watch |
| npm run test:e2e | Testes end-to-end |
| npm run test:cov | Cobertura de testes |

---

## Estrutura de pastas


src/
├── main.ts                 # bootstrap, prefixo /api, Swagger, pipes e filtros globais
├── app.module.ts           # registro de todos os módulos
├── auth/                   # autenticação JWT
├── users/                  # usuários do sistema
├── permissions/            # permissões (RBAC)
├── peoples/                # pessoas (alunos, sócios, instrutores, funcionários)
├── companies/              # empresas
├── aircraft/               # aeronaves (avião / planador)
├── flights/                # voos + motor de cálculo
├── receivables/            # títulos a receber
├── receivable-types/       # tipos de título a receber
├── payables/               # títulos a pagar
├── payable-types/          # tipos de título a pagar
├── bills/                  # faturas
├── cnab/                   # remessa bancária (Sicoob)
│   ├── builders/           # montagem das linhas da remessa
│   └── utils/              # utilitários do layout CNAB
├── dashboard/              # indicadores consolidados
├── reports/                # construtor de relatórios + export Excel
├── settings/               # configurações gerais e Sicoob
├── prisma/                 # módulo/serviço Prisma
└── common/                 # blocos compartilhados
    ├── config/             # configuração de JWT
    ├── constants/          # catálogo de permissões
    ├── decorators/         # @CurrentUser, @RequirePermission, @IsCpf, @IsCnpj...
    ├── dto/                # DTOs comuns (paginação, bulk delete)
    ├── enums/              # métodos de pagamento, recorrência, stakeholder, status
    ├── filters/            # filtros de exceção (HTTP e Prisma)
    ├── guards/             # JwtAuth, Roles, Permissions
    ├── providers/azure-blob/  # provider de armazenamento
    └── swagger/            # helpers de resposta paginada

prisma/
├── schema.prisma           # modelo de dados
├── migrations/             # histórico de migrations
└── seed.ts                 # dados iniciais


Cada módulo de domínio segue o padrão: *.controller.ts, *.service.ts, *.module.ts, dto/, model/, enums/ e repository/ (interface + implementação Prisma + fake).

---

## Convenções de projeto

- *Repositórios* sempre por interface + token de injeção, com par fake para testes.
- *DTOs* validados por class-validator; entrada não declarada é rejeitada (forbidNonWhitelisted).
- *Valores monetários e horas* usam Decimal para evitar erros de ponto flutuante.
- *Permissões* centralizadas em common/constants/permissions.ts.
- *Aliases de import* resolvidos via tsc-alias no build.

---

## Licença

Projeto privado / acadêmico — sem licença pública (UNLICENSED).

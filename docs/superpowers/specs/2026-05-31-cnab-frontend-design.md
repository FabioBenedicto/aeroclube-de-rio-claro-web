# Design: CNAB 240 Sicoob — Frontend Integration

**Data:** 2026-05-31  
**Projeto:** aeroclube-web (React + Tailwind + React Query + React Router v7)

---

## Objetivo

Expor as funcionalidades CNAB 240 já implementadas na API através da interface web:
1. Configurar dados bancários Sicoob nas configurações do sistema
2. Cadastrar endereço nos clientes (necessário para o Segmento Q do boleto)
3. Criar faturas de boleto (pendentes, sem baixa imediata)
4. Gerar arquivo de remessa (.rem) selecionando faturas pendentes
5. Importar arquivo de retorno (.ret) para confirmar pagamentos

---

## Arquitetura

### Arquivos novos
| Arquivo | Propósito |
|---|---|
| `src/api/cnab.ts` | Chamadas à API CNAB (remessa, retorno, boleto) |
| `src/pages/cnab/Cnab.tsx` | Página dedicada CNAB |

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/types/index.ts` | Adicionar campos Sicoob a `Settings`; endereço a `Customer`; `paid_at` a `Bill` |
| `src/api/settings.ts` | Incluir campos Sicoob na interface e na função `upsertSettings` |
| `src/pages/Settings.tsx` | Nova seção "Sicoob / CNAB" com 8 campos de configuração bancária |
| `src/pages/customers/CustomerModal.tsx` | Nova seção "Endereço" com 5 campos (rua, bairro, CEP, cidade, UF) |
| `src/App.tsx` | Rota `/cnab` apontando para `Cnab` |
| `src/components/AppShell.tsx` | Item "CNAB" no grupo Financeiro + entrada em `CRUMB_MAP` |

### Backend adicional necessário
O endpoint `GET /bills` precisa de um filtro `?pending=true` para retornar apenas faturas com `paid_at = null`. Adicionar no `BillsController` e `BillsRepository`.

---

## 1. Tipos (`src/types/index.ts`)

```typescript
// Adicionar à interface Settings:
sicoob_cooperativa_prefix?: string;
sicoob_cooperativa_dv?: string;
sicoob_conta?: string;
sicoob_conta_dv?: string;
sicoob_carteira?: string;
sicoob_modalidade?: string;
sicoob_cnpj?: string;
sicoob_nome_empresa?: string;
sicoob_remessa_sequence?: number;

// Adicionar à interface Customer:
address?: string;
neighborhood?: string;
city?: string;
state?: string;
zip_code?: string;

// Adicionar à interface Bill:
paid_at?: string | null;
```

---

## 2. API CNAB (`src/api/cnab.ts`)

```typescript
// Listar faturas pendentes (paid_at = null)
getBillsPending(page, limit, dueFrom?, dueTo?): PaginatedResponse<Bill>
  → GET /bills?pending=true&page=X&limit=20&due_from=Y&due_to=Z

// Criar boleto
createBoletoBill(customer_id, total_amount, due_date): Bill
  → POST /bills/boleto

// Gerar remessa (retorna blob para download)
generateRemessa(bill_ids: number[]): Blob
  → POST /cnab/remessa (responseType: 'blob')

// Importar retorno
processRetorno(file: File): RetornoResult
  → POST /cnab/retorno (multipart/form-data, campo 'file')

// RetornoResult: { paid: number[], rejected: number[], errors: string[], updated: number[] }
```

---

## 3. Settings (`src/pages/Settings.tsx`)

Nova seção card "Sicoob / CNAB" após as seções existentes. Campos de texto (não numéricos):

| Campo | Label | Tamanho | Validação visual |
|---|---|---|---|
| `sicoob_cnpj` | CNPJ do aeroclube | 14 | 14 dígitos, mono |
| `sicoob_nome_empresa` | Nome beneficiário | 30 | max 30 chars |
| `sicoob_cooperativa_prefix` | Prefixo cooperativa | 5 | 5 dígitos |
| `sicoob_cooperativa_dv` | DV prefixo | 1 | 1 dígito |
| `sicoob_conta` | Conta corrente | 12 | até 12 dígitos |
| `sicoob_conta_dv` | DV conta | 1 | 1 dígito |
| `sicoob_carteira` | Carteira | 1 | 1 dígito |
| `sicoob_modalidade` | Modalidade | 2 | 2 dígitos |

Botão "Salvar Sicoob" separado do botão principal para evitar validar todos os campos ao mesmo tempo. Ao salvar, chama `upsertSettings` com apenas os campos Sicoob preenchidos.

---

## 4. CustomerModal (`src/pages/customers/CustomerModal.tsx`)

Nova seção colapsável "Endereço" (padrão: fechada no modo `new`, aberta no modo `edit` se já tiver endereço). Campos:

| Campo | Label | Grid |
|---|---|---|
| `address` | Logradouro (rua, número, complemento) | col-span-2 |
| `neighborhood` | Bairro | col-span-1 |
| `zip_code` | CEP | col-span-1 (máscara: XXXXX-XXX) |
| `city` | Cidade | col-span-1 |
| `state` | UF | col-span-1 (max 2 chars, uppercase) |

Campos opcionais — não bloqueiam o save se estiverem vazios.

---

## 5. Página CNAB (`src/pages/cnab/Cnab.tsx`)

### Layout vertical, 3 blocos:

**Header da página**
```
h1: "CNAB 240 — Sicoob"
subtitle: "Remessa e retorno de boletos"
```

**Bloco A — Criar Boleto** (card no topo)
- Formulário inline (não modal): cliente (select com busca), valor (R$), vencimento (date input)
- Botão "Criar Boleto" → `POST /bills/boleto` → invalida query de faturas pendentes → toast sucesso

**Bloco B — Remessa** (card)
- Título: "Faturas Pendentes"
- Filtros: data vencimento de / até + botão "Filtrar"
- Tabela com checkboxes: ID, Cliente, Valor, Vencimento
- Paginação (20 por página)
- Barra de ação (aparece quando há seleção):
  - "X fatura(s) selecionada(s) · R$ Y total"
  - Botão "Gerar Remessa" → `POST /cnab/remessa` com `bill_ids` → download automático do .rem
- Mensagem vazia: "Nenhuma fatura pendente"

**Bloco C — Retorno** (card)
- Título: "Importar Retorno"
- Descrição breve: "Selecione o arquivo .ret ou .txt enviado pelo Sicoob"
- Botão "Selecionar arquivo" → `<input type="file" accept=".ret,.txt">` oculto
- Após upload: exibe resultado inline:
  - Faturas liquidadas: badge verde com IDs
  - Rejeitadas: badge amarelo
  - Erros: lista em vermelho

### Download automático do .rem
```typescript
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `remessa_${date}.rem`;
a.click();
URL.revokeObjectURL(url);
```

---

## 6. Navegação

**AppShell.tsx** — adicionar no grupo Financeiro, após Faturas:
```
{ path: '/cnab', label: 'CNAB', Icon: Landmark, adminOnly: true }
```
Ícone: `Landmark` do lucide-react (banco/financeiro). `adminOnly: true` — só ADMINs veem.

**App.tsx** — adicionar rota:
```tsx
<Route path="cnab" element={<Cnab />} />
```

**CRUMB_MAP** — adicionar:
```
'/cnab': ['Aeroclube', 'Financeiro', 'CNAB']
```

---

## 7. Backend: filtro `?pending=true` em GET /bills

Em `aeroclube-api/src/bills/bills.controller.ts`:
```typescript
@Query('pending') pending?: string,
```

Em `aeroclube-api/src/bills/bills.repository.ts`, no método `findAll`:
```typescript
if (pending === 'true') AND.push({ paid_at: null });
```

---

## Fora do escopo (MVP)

- Histórico de remessas geradas
- Preview do arquivo .rem antes do download
- Notificação automática ao cliente após boleto criado
- Integração com emissão do PDF do boleto

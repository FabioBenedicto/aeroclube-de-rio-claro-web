# Invoice UI Payment Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir status de pagamento, data de vencimento e informações de pagamento nas telas de listagem e detalhe de faturas.

**Architecture:** Mudanças em 4 arquivos independentes: tipos TypeScript, utilitários de formato, página de listagem e página de detalhe. Sem novo componente — usa `Badge` existente seguindo o padrão já estabelecido em Receivables/Payables.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, componente `Badge` (`src/components/ui/Badge.tsx`), React Query

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `src/types/index.ts` | Modificar — Task 1 — adicionar `status`, `payment_source`, `payment_method` à interface `Bill` |
| `src/utils/format.ts` | Modificar — Task 1 — adicionar `BILL_STATUS_LABEL` e `BILL_STATUS_BADGE` |
| `src/pages/invoices/Invoices.tsx` | Modificar — Task 2 — colunas Vencimento e Status na tabela |
| `src/pages/invoices/InvoiceDetail.tsx` | Modificar — Task 3 — badge de status e linha de pagamento no header |

---

## Task 1: Tipos + Utilitários de status

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/format.ts`

- [ ] **Step 1: Adicionar campos ao tipo `Bill` em `src/types/index.ts`**

Localizar a interface `Bill` (linha 195) e substituí-la por:

```typescript
export interface Bill {
  id: number;
  customer_id: number;
  total_amount: number;
  issue_date: string;
  due_date?: string;
  paid_at?: string | null;
  status: 'open' | 'pending_cnab' | 'paid' | 'cancelled';
  payment_source?: 'cnab' | 'manual' | null;
  payment_method?: string | null;
  nota_fiscal_path?: string | null;
  customer?: Customer;
  receivable_payments?: BillItem[];
}
```

- [ ] **Step 2: Adicionar constantes de status em `src/utils/format.ts`**

Adicionar ao final do arquivo (após `STATUS_BADGE`):

```typescript
export type BillStatus = 'open' | 'pending_cnab' | 'paid' | 'cancelled';

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  open:         'Em aberto',
  pending_cnab: 'Aguardando CNAB',
  paid:         'Pago',
  cancelled:    'Cancelado',
};

export const BILL_STATUS_BADGE: Record<BillStatus, 'success' | 'warn' | 'danger' | 'accent'> = {
  open:         'warn',
  pending_cnab: 'accent',
  paid:         'success',
  cancelled:    'danger',
};
```

- [ ] **Step 3: Verificar compilação TypeScript**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/utils/format.ts
git commit -m "feat: add BillStatus type and label/badge constants"
```

---

## Task 2: Tabela de Faturas — colunas Vencimento e Status

**Files:**
- Modify: `src/pages/invoices/Invoices.tsx`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo `src/pages/invoices/Invoices.tsx`, na linha que já importa de `../../utils/format`:

```typescript
import { formatBRL, formatDate, receivableStatus, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
```

Adicionar também o import do Badge (após os imports existentes de componentes):

```typescript
import Badge from '../../components/ui/Badge';
```

- [ ] **Step 2: Adicionar cabeçalhos das colunas Vencimento e Status**

Localizar o bloco `<thead>` da tabela de faturas. O trecho atual termina com:

```tsx
<th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Criado em</th>
<th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
<th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
```

Substituir por:

```tsx
<th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Criado em</th>
<th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Vencimento</th>
<th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
<th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Status</th>
<th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
```

- [ ] **Step 3: Adicionar células Vencimento e Status em cada linha**

Localizar o bloco `<tr>` de cada bill no `<tbody>`. O trecho atual é:

```tsx
<td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(b.issue_date)}</td>
<td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(b.total_amount)}</td>
<td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
```

Substituir por:

```tsx
<td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(b.issue_date)}</td>
<td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{formatDate(b.due_date)}</td>
<td className="px-3.5 py-2.5 border-b border-line text-right font-mono">R$ {formatBRL(b.total_amount)}</td>
<td className="px-3.5 py-2.5 border-b border-line">
  <Badge variant={BILL_STATUS_BADGE[b.status]}>{BILL_STATUS_LABEL[b.status]}</Badge>
</td>
<td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
```

- [ ] **Step 4: Atualizar colSpan da linha de estado vazio**

Localizar:

```tsx
{bills.length === 0 && <tr><td colSpan={6} className="px-3.5 py-8 text-center text-ink-3">Nenhuma fatura encontrada.</td></tr>}
```

Substituir por:

```tsx
{bills.length === 0 && <tr><td colSpan={8} className="px-3.5 py-8 text-center text-ink-3">Nenhuma fatura encontrada.</td></tr>}
```

- [ ] **Step 5: Verificar compilação TypeScript**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/pages/invoices/Invoices.tsx
git commit -m "feat: add Vencimento and Status columns to invoices table"
```

---

## Task 3: Detalhe da Fatura — badge de status e linha de pagamento

**Files:**
- Modify: `src/pages/invoices/InvoiceDetail.tsx`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo `src/pages/invoices/InvoiceDetail.tsx`, adicionar:

```typescript
import Badge from '../../components/ui/Badge';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
```

(O import de `formatBRL` e `formatDate` já existe — atualizar a linha existente para incluir `BILL_STATUS_LABEL` e `BILL_STATUS_BADGE`.)

A linha existente:
```typescript
import { formatBRL, formatDate } from '../../utils/format';
```

Substituir por:
```typescript
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
```

E adicionar após os imports de ícones:
```typescript
import Badge from '../../components/ui/Badge';
```

- [ ] **Step 2: Substituir o bloco de header do detalhe**

Localizar o bloco:

```tsx
<h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{bill.id}</h1>
<p className="text-[13px] text-ink-3 mt-1 m-0">{bill.customer?.name} · Emitida em {formatDate(bill.issue_date)}</p>
```

Substituir por:

```tsx
<div className="flex items-center gap-2">
  <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">#{bill.id}</h1>
  <Badge variant={BILL_STATUS_BADGE[bill.status]}>{BILL_STATUS_LABEL[bill.status]}</Badge>
</div>
<p className="text-[13px] text-ink-3 mt-1 m-0">
  {bill.customer?.name} · Emitida em {formatDate(bill.issue_date)}
</p>
{bill.status === 'paid' && bill.paid_at && (
  <p className="text-[13px] text-ink-3 mt-0.5 m-0">
    Pago em {formatDate(bill.paid_at)}
    {bill.payment_method ? ` via ${bill.payment_method}` : ''}
    {bill.payment_source ? ` (${bill.payment_source === 'cnab' ? 'CNAB' : 'manual'})` : ''}
  </p>
)}
```

- [ ] **Step 3: Verificar compilação TypeScript**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/pages/invoices/InvoiceDetail.tsx
git commit -m "feat: add status badge and payment info to invoice detail header"
```

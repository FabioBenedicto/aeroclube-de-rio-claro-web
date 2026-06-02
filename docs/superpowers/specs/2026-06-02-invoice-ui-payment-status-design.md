# Design: Exibição de Status de Pagamento nas Faturas (UI)

**Data:** 2026-06-02  
**Contexto:** O backend agora retorna `status`, `payment_source` e `payment_method` no modelo `Bill`. O frontend precisa exibir essas informações na tabela e no detalhe de faturas.

---

## 1. Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/types/index.ts` | Adicionar `status`, `payment_source`, `payment_method` à interface `Bill` |
| `src/utils/format.ts` | Adicionar `BILL_STATUS_LABEL` e `BILL_STATUS_BADGE` |
| `src/pages/invoices/Invoices.tsx` | Adicionar colunas Vencimento e Status na tabela |
| `src/pages/invoices/InvoiceDetail.tsx` | Adicionar badge de status no título e linha de pagamento no subtítulo |

---

## 2. Tipo `Bill` — `src/types/index.ts`

Adicionar três campos à interface `Bill` existente:

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

---

## 3. Utilitários de status — `src/utils/format.ts`

Adicionar dois objetos seguindo o padrão já existente para Receivables/Payables:

```typescript
export const BILL_STATUS_LABEL: Record<string, string> = {
  open:         'Em aberto',
  pending_cnab: 'Aguardando CNAB',
  paid:         'Pago',
  cancelled:    'Cancelado',
};

export const BILL_STATUS_BADGE: Record<string, string> = {
  open:         'warn',
  pending_cnab: 'accent',
  paid:         'success',
  cancelled:    'danger',
};
```

---

## 4. Tabela de Faturas — `src/pages/invoices/Invoices.tsx`

### Colunas após a alteração

`☐ | ID | Cliente | Criado em | Vencimento | Valor | Status | ⋮`

### Header `<th>` a adicionar (após "Criado em", antes de "Valor")

```tsx
<th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">
  Vencimento
</th>
```

### Header `<th>` a adicionar (após "Valor", antes da coluna de menu)

```tsx
<th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">
  Status
</th>
```

### Células `<td>` correspondentes em cada linha `<tr>`

Vencimento (após célula de "Criado em"):
```tsx
<td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">
  {formatDate(b.due_date)}
</td>
```

Status (após célula de "Valor"):
```tsx
<td className="px-3.5 py-2.5 border-b border-line">
  <Badge variant={BILL_STATUS_BADGE[b.status] as any}>
    {BILL_STATUS_LABEL[b.status]}
  </Badge>
</td>
```

### Ajuste no `colSpan` da linha "Nenhuma fatura encontrada"

Atualizar de `colSpan={6}` para `colSpan={8}` (2 novas colunas).

### Imports a adicionar

```tsx
import Badge from '../../components/ui/Badge';
import { BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
```

---

## 5. Detalhe da Fatura — `src/pages/invoices/InvoiceDetail.tsx`

### Header atual

```tsx
<h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">{bill.id}</h1>
<p className="text-[13px] text-ink-3 mt-1 m-0">
  {bill.customer?.name} · Emitida em {formatDate(bill.issue_date)}
</p>
```

### Header novo

```tsx
<div className="flex items-center gap-2">
  <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">#{bill.id}</h1>
  <Badge variant={BILL_STATUS_BADGE[bill.status] as any}>
    {BILL_STATUS_LABEL[bill.status]}
  </Badge>
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

### Imports a adicionar

```tsx
import Badge from '../../components/ui/Badge';
import { BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
```

---

## 6. Regras da linha de pagamento (detalhe)

- Exibida **somente** quando `bill.status === 'paid'` e `bill.paid_at` está preenchido
- `payment_method` omitido se `null` ou vazio (sem "via")
- `payment_source` omitido se `null` (sem parênteses)
- Labels: `cnab → "CNAB"`, `manual → "manual"`

# CNAB 240 Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the CNAB 240 Sicoob API (already built) through the web frontend: settings, customer address, boleto creation, remessa generation, and retorno import.

**Architecture:** 6 tasks across both repos — one small backend filter addition, then 5 frontend tasks following existing React Query + Tailwind patterns. The CNAB page (`/cnab`) is a single new page with three vertical blocks: boleto creation, pending bills table with remessa generation, and retorno upload.

**Tech Stack:** React 18, React Router v7, @tanstack/react-query, Tailwind CSS (custom tokens), Axios, lucide-react.

---

## File Map

### Backend (aeroclube-api)
| File | Change |
|---|---|
| `src/bills/bills.controller.ts` | Add `?pending`, `?due_from`, `?due_to` query params |
| `src/bills/bills.service.ts` | Pass `pending`, `dueFrom`, `dueTo` to repository |
| `src/bills/bills.repository.ts` | Add `paid_at: null` filter (pending) + `due_date` range filter |

### Frontend (aeroclube-web)
| File | Change |
|---|---|
| `src/types/index.ts` | Add Sicoob fields to `Settings`; address to `Customer`; fix `Bill.paid_at` to `string \| null` |
| `src/api/settings.ts` | Add Sicoob fields to `Settings` interface and `upsertSettings` |
| `src/api/cnab.ts` (new) | `getBillsPending`, `createBoletoBill`, `generateRemessa`, `processRetorno` |
| `src/pages/Settings.tsx` | Add Sicoob/CNAB section |
| `src/pages/customers/CustomerModal.tsx` | Add address section |
| `src/pages/cnab/Cnab.tsx` (new) | Full CNAB page |
| `src/App.tsx` | Route `/cnab → <Cnab />` |
| `src/components/AppShell.tsx` | Nav item + breadcrumb |

---

## Task 1: Backend — filtro `?pending=true` em GET /bills

**Files (aeroclube-api):**
- Modify: `src/bills/bills.controller.ts`
- Modify: `src/bills/bills.service.ts`
- Modify: `src/bills/bills.repository.ts`

- [ ] **Step 1: Add query params to `src/bills/bills.controller.ts`**

Read the file first. In the `findAll` method, add `pending`, `due_from`, and `due_to` params:

```typescript
@Get()
@ApiOperation({ summary: 'Listar faturas' })
findAll(
  @Query('customer_id') customerId?: string,
  @Query('date_from') dateFrom?: string,
  @Query('date_to') dateTo?: string,
  @Query('pending') pending?: string,
  @Query('due_from') dueFrom?: string,
  @Query('due_to') dueTo?: string,
  @Query('page') page = '1',
  @Query('limit') limit = '20',
) {
  return this.billsService.findAll(
    customerId ? Number(customerId) : undefined,
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined,
    Number(page),
    Number(limit),
    pending === 'true',
    dueFrom ? new Date(dueFrom) : undefined,
    dueTo ? new Date(dueTo) : undefined,
  );
}
```

- [ ] **Step 2: Update `src/bills/bills.service.ts`**

Read the file. Change the `findAll` signature:

```typescript
async findAll(customerId?: number, dateFrom?: Date, dateTo?: Date, page = 1, limit = 20, pending = false, dueFrom?: Date, dueTo?: Date) {
  const { data, total } = await this.repo.findAll(customerId, dateFrom, dateTo, page, limit, pending, dueFrom, dueTo);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 3: Update `src/bills/bills.repository.ts`**

Read the file. Change the `findAll` method to accept and use all new params:

```typescript
async findAll(customerId?: number, dateFrom?: Date, dateTo?: Date, page = 1, limit = 20, pending = false, dueFrom?: Date, dueTo?: Date) {
  const AND: Prisma.BillWhereInput[] = [];
  if (customerId) AND.push({ customer_id: customerId });
  if (pending) AND.push({ paid_at: null });
  if (dateFrom || dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (dateFrom) range.gte = dateFrom;
    if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); range.lte = end; }
    AND.push({ issue_date: range });
  }
  if (dueFrom || dueTo) {
    const dueRange: Prisma.DateTimeNullableFilter = {};
    if (dueFrom) dueRange.gte = dueFrom;
    if (dueTo) { const end = new Date(dueTo); end.setHours(23, 59, 59, 999); dueRange.lte = end; }
    AND.push({ due_date: dueRange });
  }
  const where = AND.length > 0 ? { AND } : undefined;
  const skip = (page - 1) * limit;
  const [data, total] = await this.prisma.$transaction([
    this.prisma.bill.findMany({ where, orderBy: { issue_date: 'desc' }, include, skip, take: limit }),
    this.prisma.bill.count({ where }),
  ]);
  return { data, total };
}
```

- [ ] **Step 4: Build check**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-api
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/bills/bills.controller.ts src/bills/bills.service.ts src/bills/bills.repository.ts
git commit -m "feat: add pending=true filter to GET /bills"
```

---

## Task 2: Tipos + API cnab.ts + Settings interface

**Files (aeroclube-web):**
- Modify: `src/types/index.ts`
- Modify: `src/api/settings.ts`
- Create: `src/api/cnab.ts`

- [ ] **Step 1: Update `src/types/index.ts`**

Read the file. Make three additions:

**1) In the `Settings` interface** (after `glider_minute_value`), add:
```typescript
  sicoob_cooperativa_prefix?: string;
  sicoob_cooperativa_dv?: string;
  sicoob_conta?: string;
  sicoob_conta_dv?: string;
  sicoob_carteira?: string;
  sicoob_modalidade?: string;
  sicoob_cnpj?: string;
  sicoob_nome_empresa?: string;
  sicoob_remessa_sequence?: number;
```

**2) In the `Customer` interface** (after `categories`), add:
```typescript
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
```

**3) In the `Bill` interface**, change `paid_at?: string;` to:
```typescript
  paid_at?: string | null;
```

- [ ] **Step 2: Update `src/api/settings.ts`**

Replace the file entirely:

```typescript
import client from './client';
import type { Settings } from '../types';

export const getSettings = () =>
  client.get<Settings>('/settings').then(r => r.data);

export const upsertSettings = (data: Partial<Settings>) =>
  client.put<Settings>('/settings', data).then(r => r.data);
```

(The `Settings` type in `types/index.ts` now includes Sicoob fields, so `Partial<Settings>` picks them up automatically.)

- [ ] **Step 3: Create `src/api/cnab.ts`**

```typescript
import client from './client';
import type { Bill, PaginatedResponse } from '../types';

export interface RetornoResult {
  paid: number[];
  rejected: number[];
  errors: string[];
  updated: number[];
}

export const getBillsPending = (
  page = 1,
  limit = 20,
  dueFrom?: string,
  dueTo?: string,
) =>
  client
    .get<PaginatedResponse<Bill>>('/bills', {
      params: {
        pending: 'true',
        page,
        limit,
        ...(dueFrom && { due_from: dueFrom }),
        ...(dueTo && { due_to: dueTo }),
      },
    })
    .then(r => r.data);

// Note: due_from/due_to filter on due_date (vencimento) — requires backend Task 1

export const createBoletoBill = (data: {
  customer_id: number;
  total_amount: number;
  due_date: string;
}) => client.post<Bill>('/bills/boleto', data).then(r => r.data);

export const generateRemessa = (bill_ids: number[]) =>
  client
    .post<Blob>('/cnab/remessa', { bill_ids }, { responseType: 'blob' })
    .then(r => r.data);

export const processRetorno = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return client.post<RetornoResult>('/cnab/retorno', fd).then(r => r.data);
};
```

- [ ] **Step 4: Type-check**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/api/settings.ts src/api/cnab.ts
git commit -m "feat: add Sicoob types, address to Customer, and cnab API module"
```

---

## Task 3: Settings — seção Sicoob/CNAB

**Files (aeroclube-web):**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/Settings.tsx` to see the full current content before editing.

- [ ] **Step 2: Add Sicoob state variables**

After the existing state variables (`gliderMinuteValue`), add:

```typescript
  const [sicoobCnpj, setSicoobCnpj] = useState('');
  const [sicoobNome, setSicoobNome] = useState('');
  const [sicoobPrefix, setSicoobPrefix] = useState('');
  const [sicoobPrefixDv, setSicoobPrefixDv] = useState('');
  const [sicoobConta, setSicoobConta] = useState('');
  const [sicoobContaDv, setSicoobContaDv] = useState('');
  const [sicoobCarteira, setSicoobCarteira] = useState('');
  const [sicoobModalidade, setSicoobModalidade] = useState('');
```

- [ ] **Step 3: Load Sicoob fields in `useEffect`**

Inside the existing `useEffect`, after loading the glider values, add:

```typescript
      setSicoobCnpj(data.sicoob_cnpj ?? '');
      setSicoobNome(data.sicoob_nome_empresa ?? '');
      setSicoobPrefix(data.sicoob_cooperativa_prefix ?? '');
      setSicoobPrefixDv(data.sicoob_cooperativa_dv ?? '');
      setSicoobConta(data.sicoob_conta ?? '');
      setSicoobContaDv(data.sicoob_conta_dv ?? '');
      setSicoobCarteira(data.sicoob_carteira ?? '');
      setSicoobModalidade(data.sicoob_modalidade ?? '');
```

- [ ] **Step 4: Add a separate Sicoob mutation**

After the existing `mut` mutation, add:

```typescript
  const sicoobMut = useMutation({
    mutationFn: upsertSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações Sicoob salvas');
    },
    onError: () => toast.error('Erro ao salvar configurações Sicoob'),
  });

  function handleSaveSicoob() {
    sicoobMut.mutate({
      sicoob_cnpj: sicoobCnpj || undefined,
      sicoob_nome_empresa: sicoobNome || undefined,
      sicoob_cooperativa_prefix: sicoobPrefix || undefined,
      sicoob_cooperativa_dv: sicoobPrefixDv || undefined,
      sicoob_conta: sicoobConta || undefined,
      sicoob_conta_dv: sicoobContaDv || undefined,
      sicoob_carteira: sicoobCarteira || undefined,
      sicoob_modalidade: sicoobModalidade || undefined,
    });
  }
```

- [ ] **Step 5: Add the Sicoob card to the JSX**

After the last existing `</div>` card (the one with the Save button), add a new card:

```tsx
          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Sicoob / CNAB 240</div>
            <p className="text-[12px] text-ink-3 mt-0 mb-4">
              Dados bancários para geração de remessa e importação de retorno CNAB 240.
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">CNPJ (14 dígitos, sem formatação)</label>
                  <input className={`w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]`}
                    maxLength={14} value={sicoobCnpj} onChange={e => setSicoobCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))} placeholder="12345678000100" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Nome beneficiário (max 30 chars)</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={30} value={sicoobNome} onChange={e => setSicoobNome(e.target.value.toUpperCase())} placeholder="AEROCLUBE RIO CLARO" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Prefixo cooperativa</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={5} value={sicoobPrefix} onChange={e => setSicoobPrefix(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="04162" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">DV prefixo</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={1} value={sicoobPrefixDv} onChange={e => setSicoobPrefixDv(e.target.value.replace(/\D/g, '').slice(0, 1))} placeholder="0" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Conta corrente</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={12} value={sicoobConta} onChange={e => setSicoobConta(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="000007550000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">DV conta</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={1} value={sicoobContaDv} onChange={e => setSicoobContaDv(e.target.value.replace(/\D/g, '').slice(0, 1))} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Carteira</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={1} value={sicoobCarteira} onChange={e => setSicoobCarteira(e.target.value.replace(/\D/g, '').slice(0, 1))} placeholder="1" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Modalidade</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={2} value={sicoobModalidade} onChange={e => setSicoobModalidade(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="01" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60"
                onClick={handleSaveSicoob} disabled={sicoobMut.isPending}>
                <Check size={14} />
                {sicoobMut.isPending ? 'Salvando…' : 'Salvar Sicoob'}
              </button>
            </div>
          </div>
```

- [ ] **Step 6: Type-check and visual verify**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add Sicoob/CNAB settings section"
```

---

## Task 4: CustomerModal — seção de endereço

**Files (aeroclube-web):**
- Modify: `src/pages/customers/CustomerModal.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/customers/CustomerModal.tsx` to see the full current content.

- [ ] **Step 2: Add address fields to form state**

In the `useState` initializer, add after `phone_number`:

```typescript
    address: customer?.address ?? '',
    neighborhood: customer?.neighborhood ?? '',
    city: customer?.city ?? '',
    state: customer?.state ?? '',
    zip_code: customer?.zip_code ?? '',
```

- [ ] **Step 3: Add address fields to `handleSubmit`**

In `handleSubmit`, in the `data` object spread, the new fields come automatically via `...rest` since they're in `form`. No change needed to `handleSubmit` — the spread already includes them.

However, `categories` is extracted from `form` before spreading. Verify the destructuring includes the new fields in `rest`. The current code is:
```typescript
const { categories, ...rest } = form;
const data: Record<string, unknown> = { ...rest };
```
Since `address`, `neighborhood`, etc. are in `form` and not named `categories`, they will be in `rest` and spread into `data`. No change needed.

- [ ] **Step 4: Add address section to JSX**

After the phone/email grid row, and before the categories section, add:

```tsx
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              className="flex items-center gap-2 text-[12px] font-medium text-ink-2 hover:text-ink text-left"
              onClick={() => setShowAddress(v => !v)}
            >
              <span className="text-ink-4">{showAddress ? '▾' : '▸'}</span>
              Endereço {form.address ? <span className="text-accent text-[11px]">✓ preenchido</span> : <span className="text-ink-4 text-[11px]">(opcional)</span>}
            </button>
            {showAddress && (
              <div className="flex flex-col gap-3 pl-4 border-l-2 border-line">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Logradouro</label>
                  <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    placeholder="Rua Exemplo, 123, Apto 10" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Bairro</label>
                    <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">CEP</label>
                    <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      placeholder="13500300" maxLength={9}
                      value={form.zip_code}
                      onChange={e => setForm(f => ({ ...f, zip_code: e.target.value.replace(/\D/g, '').slice(0, 8) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Cidade</label>
                    <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">UF</label>
                    <input className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                      maxLength={2} placeholder="SP" value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) }))} />
                  </div>
                </div>
              </div>
            )}
          </div>
```

- [ ] **Step 5: Add `showAddress` state**

At the top of the component, after existing state, add:

```typescript
  const [showAddress, setShowAddress] = useState(
    mode === 'edit' && !!(customer?.address),
  );
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/customers/CustomerModal.tsx
git commit -m "feat: add address fields to customer modal"
```

---

## Task 5: Página CNAB (`/cnab`)

**Files (aeroclube-web):**
- Create: `src/pages/cnab/Cnab.tsx`

- [ ] **Step 1: Create `src/pages/cnab/Cnab.tsx`**

```tsx
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Download, Upload, Plus, X } from 'lucide-react';
import {
  getBillsPending,
  createBoletoBill,
  generateRemessa,
  processRetorno,
  type RetornoResult,
} from '../../api/cnab';
import { getCustomers } from '../../api/customers';
import { formatBRL, formatDate } from '../../utils/format';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import { toast, extractErrorMessage } from '../../utils/toast';
import type { Bill, Customer } from '../../types';

const inp = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const btnSecondary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink disabled:opacity-60';
const sel = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer';

export default function Cnab() {
  const qc = useQueryClient();

  // — Boleto form state —
  const [bCustomerId, setBCustomerId] = useState<number | ''>('');
  const [bAmount, setBAmount] = useState('');
  const [bDueDate, setBDueDate] = useState('');

  // — Remessa filter/selection state —
  const [page, setPage] = useState(1);
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // — Retorno state —
  const retornoRef = useRef<HTMLInputElement>(null);
  const [retornoResult, setRetornoResult] = useState<RetornoResult | null>(null);

  // — Queries —
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => getCustomers(undefined, undefined, 1, 9999),
  });
  const customers: Customer[] = customersData?.data ?? [];

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['bills-pending', page, appliedFrom, appliedTo],
    queryFn: () => getBillsPending(page, 20, appliedFrom || undefined, appliedTo || undefined),
  });
  const bills: Bill[] = billsData?.data ?? [];

  // — Mutations —
  const boletoMut = useMutation({
    mutationFn: createBoletoBill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills-pending'] });
      setBCustomerId('');
      setBAmount('');
      setBDueDate('');
      toast.success('Boleto criado com sucesso');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const remessaMut = useMutation({
    mutationFn: generateRemessa,
    onSuccess: (blob) => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remessa_${date}.rem`;
      a.click();
      URL.revokeObjectURL(url);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['bills-pending'] });
      toast.success('Remessa gerada com sucesso');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const retornoMut = useMutation({
    mutationFn: processRetorno,
    onSuccess: (result) => {
      setRetornoResult(result);
      qc.invalidateQueries({ queryKey: ['bills-pending'] });
      if (result.updated.length > 0) toast.success(`${result.updated.length} fatura(s) liquidada(s)`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  function handleBoletoSave() {
    if (!bCustomerId || !bAmount || !bDueDate) return;
    boletoMut.mutate({
      customer_id: Number(bCustomerId),
      total_amount: parseFloat(bAmount),
      due_date: bDueDate,
    });
  }

  function toggleAll() {
    if (selected.size === bills.length && bills.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bills.map(b => b.id)));
    }
  }

  function toggleOne(id: number) {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function applyFilter() {
    setAppliedFrom(dueFrom);
    setAppliedTo(dueTo);
    setPage(1);
    setSelected(new Set());
  }

  const selectedBills = bills.filter(b => selected.has(b.id));
  const selectedTotal = selectedBills.reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0 flex items-center gap-2">
            <Landmark size={20} className="text-accent" />
            CNAB 240 — Sicoob
          </h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Remessa e retorno de boletos</p>
        </div>
      </div>

      {/* Bloco A — Criar Boleto */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Criar Boleto</div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-[220px] flex-1">
            <label className="text-[12px] font-medium text-ink-2">Cliente</label>
            <select className={sel} value={bCustomerId} onChange={e => setBCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Selecione o cliente</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-[140px]">
            <label className="text-[12px] font-medium text-ink-2">Valor (R$)</label>
            <input
              className={inp}
              type="number" min="0.01" step="0.01" placeholder="0,00"
              value={bAmount} onChange={e => setBAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-[160px]">
            <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
            <DateInput value={bDueDate} onChange={setBDueDate} />
          </div>
          <button
            className={btnPrimary}
            disabled={!bCustomerId || !bAmount || !bDueDate || boletoMut.isPending}
            onClick={handleBoletoSave}
          >
            <Plus size={14} />
            {boletoMut.isPending ? 'Criando…' : 'Criar Boleto'}
          </button>
        </div>
      </div>

      {/* Bloco B — Remessa */}
      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Faturas Pendentes</div>
          <div className="flex items-center gap-2">
            <DateInput value={dueFrom} onChange={setDueFrom} className="w-[130px]" />
            <span className="text-[12px] text-ink-3">até</span>
            <DateInput value={dueTo} onChange={setDueTo} className="w-[130px]" />
            <button className={btnSecondary} onClick={applyFilter}>Filtrar</button>
          </div>
        </div>

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-accent/10 border-b border-accent/20">
            <span className="text-[13px] text-accent font-medium">
              {selected.size} fatura(s) selecionada(s) · R$ {formatBRL(selectedTotal)}
            </span>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center justify-center w-6 h-6 rounded text-ink-3 hover:text-ink hover:bg-bg-hover" onClick={() => setSelected(new Set())}>
                <X size={14} />
              </button>
              <button
                className={btnPrimary}
                disabled={remessaMut.isPending}
                onClick={() => remessaMut.mutate(Array.from(selected))}
              >
                <Download size={14} />
                {remessaMut.isPending ? 'Gerando…' : 'Gerar Remessa'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="px-3.5 py-2.5 text-left bg-bg border-b border-line w-9">
                  <input
                    type="checkbox"
                    checked={bills.length > 0 && selected.size === bills.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">ID</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Cliente</th>
                <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-8 text-center text-[13px] text-ink-3">Carregando…</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-8 text-center text-[13px] text-ink-3">Nenhuma fatura pendente</td>
                </tr>
              ) : bills.map(bill => (
                <tr
                  key={bill.id}
                  className={`border-b border-line hover:bg-bg-hover cursor-pointer ${selected.has(bill.id) ? 'bg-accent/5' : ''}`}
                  onClick={() => toggleOne(bill.id)}
                >
                  <td className="px-3.5 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(bill.id)}
                      onChange={() => toggleOne(bill.id)}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-ink-3">#{bill.id}</td>
                  <td className="px-3.5 py-2.5">{bill.customer?.name ?? '—'}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(bill.total_amount)}</td>
                  <td className="px-3.5 py-2.5 text-ink-3">{bill.due_date ? formatDate(bill.due_date) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {billsData && billsData.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={billsData.totalPages}
            total={billsData.total}
            limit={20}
            onChange={p => { setPage(p); setSelected(new Set()); }}
          />
        )}
      </div>

      {/* Bloco C — Retorno */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">Importar Retorno</div>
        <p className="text-[12px] text-ink-3 mt-0 mb-4">
          Selecione o arquivo <span className="font-mono">.ret</span> ou <span className="font-mono">.txt</span> enviado pelo Sicoob para confirmar os pagamentos.
        </p>
        <input
          ref={retornoRef}
          type="file"
          accept=".ret,.txt"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              setRetornoResult(null);
              retornoMut.mutate(file);
            }
            e.target.value = '';
          }}
        />
        <button
          className={btnSecondary}
          disabled={retornoMut.isPending}
          onClick={() => retornoRef.current?.click()}
        >
          <Upload size={14} />
          {retornoMut.isPending ? 'Processando…' : 'Selecionar arquivo'}
        </button>

        {retornoResult && (
          <div className="mt-4 flex flex-col gap-2 text-[13px]">
            {retornoResult.updated.length > 0 && (
              <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                <span className="font-semibold">Liquidadas:</span>
                <span className="font-mono">{retornoResult.updated.join(', ')}</span>
              </div>
            )}
            {retornoResult.rejected.length > 0 && (
              <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
                <span className="font-semibold">Rejeitadas:</span>
                <span className="font-mono">{retornoResult.rejected.join(', ')}</span>
              </div>
            )}
            {retornoResult.errors.length > 0 && (
              <div className="flex flex-col gap-1 text-red-600 dark:text-red-400">
                <span className="font-semibold">Erros:</span>
                {retornoResult.errors.map((e, i) => (
                  <span key={i} className="font-mono text-[12px]">{e}</span>
                ))}
              </div>
            )}
            {retornoResult.updated.length === 0 && retornoResult.rejected.length === 0 && retornoResult.errors.length === 0 && (
              <span className="text-ink-3">Nenhum título processado no arquivo.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/cnab/Cnab.tsx
git commit -m "feat: add CNAB page with boleto creation, remessa, and retorno"
```

---

## Task 6: Roteamento + navegação

**Files (aeroclube-web):**
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: Add route in `src/App.tsx`**

Read the file. Add the import:
```typescript
import Cnab from './pages/cnab/Cnab';
```

Add the route inside the protected `<Route path="/">` block, after the `invoices/:id` route:
```tsx
<Route path="cnab" element={<Cnab />} />
```

- [ ] **Step 2: Update `src/components/AppShell.tsx`**

Read the file. Make three changes:

**1) Add `Landmark` to the lucide-react import:**
```typescript
import { ..., Landmark } from 'lucide-react';
```

**2) Add CNAB to the NAV array**, in the `Financeiro` group, after the `invoices` item:
```typescript
    { path: '/cnab', label: 'CNAB', Icon: Landmark, adminOnly: true },
```

**3) Add to `CRUMB_MAP`**, after `/invoices`:
```typescript
  '/cnab':      ['Aeroclube', 'Financeiro', 'CNAB'],
```

- [ ] **Step 3: Type-check + build**

```bash
npx tsc --noEmit 2>&1 | head -10
npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Start dev server and smoke-test**

```bash
npm run dev
```

Open `http://localhost:5173` (or the port shown). Log in as admin. Verify:
- Menu sidebar shows "CNAB" under Financeiro
- Navigating to `/cnab` loads the page without errors
- Settings page shows the Sicoob section
- Customer modal shows the address toggle

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/AppShell.tsx
git commit -m "feat: add CNAB route and navigation"
```

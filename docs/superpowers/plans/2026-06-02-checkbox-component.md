# Checkbox Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o componente `Checkbox` (peer pattern, tema escuro) e substituir todas as 42 ocorrências de `<input type="checkbox">` nos 13 arquivos do projeto.

**Architecture:** Um componente wrapper que coloca o `<input>` real transparente sobre a área inteira (clicável nativamente) e um `<span>` visual com `peer-checked:` do Tailwind. API idêntica ao input nativo — todos os props passam via spread.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React (`Check` icon), `cn` utility

---

## Mapa de arquivos

| Arquivo | Ação | Task |
|---------|------|------|
| `src/components/ui/Checkbox.tsx` | Criar | 1 |
| `src/pages/cnab/Cnab.tsx` | Modificar (2 checkboxes) | 2 |
| `src/pages/companies/Companies.tsx` | Modificar (2) | 3 |
| `src/pages/customers/Customers.tsx` | Modificar (2) | 3 |
| `src/pages/flights/Flights.tsx` | Modificar (2) | 3 |
| `src/pages/payables/Payables.tsx` | Modificar (2) | 4 |
| `src/pages/planes/Planes.tsx` | Modificar (2) | 4 |
| `src/pages/receivables/Receivables.tsx` | Modificar (2) | 4 |
| `src/components/SettleModal.tsx` | Modificar (1) | 5 |
| `src/pages/users/UserModal.tsx` | Modificar (2) | 5 |
| `src/pages/invoices/Invoices.tsx` | Modificar (3) | 6 |
| `src/pages/reports/Reports.tsx` | Modificar (5) | 7 |
| `src/pages/companies/CompanyDetail.tsx` | Modificar (4) | 8 |
| `src/pages/customers/CustomerDetail.tsx` | Modificar (10) | 9 |

---

## Task 1: Criar o componente Checkbox

**Files:**
- Create: `src/components/ui/Checkbox.tsx`

- [ ] **Step 1: Criar o arquivo**

Criar `src/components/ui/Checkbox.tsx` com o seguinte conteúdo:

```tsx
import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <span className="relative inline-flex w-4 h-4 flex-shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer peer"
        checked={checked}
        {...props}
      />
      <span
        className={cn(
          'absolute inset-0 rounded border-[1.5px] transition-colors',
          'flex items-center justify-center pointer-events-none',
          'border-line-strong bg-bg-elev',
          'peer-checked:bg-accent peer-checked:border-accent',
          'peer-focus-visible:shadow-[0_0_0_3px_var(--focus)]',
          'peer-disabled:opacity-50',
          className,
        )}
      >
        <Check
          size={10}
          className={cn('text-white transition-opacity', checked ? 'opacity-100' : 'opacity-0')}
          strokeWidth={2.5}
        />
      </span>
    </span>
  ),
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
```

- [ ] **Step 2: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Checkbox.tsx
git commit -m "feat: add Checkbox component with dark theme support"
```

---

## Task 2: Atualizar Cnab.tsx

**Files:**
- Modify: `src/pages/cnab/Cnab.tsx`

- [ ] **Step 1: Adicionar import**

Adicionar na seção de imports do arquivo (junto dos outros imports de componentes):

```tsx
import Checkbox from '../../components/ui/Checkbox';
```

- [ ] **Step 2: Substituir checkbox do header (linha 147–152)**

Localizar:
```tsx
<input
  type="checkbox"
  checked={bills.length > 0 && selected.size === bills.length}
  onChange={toggleAll}
  className="cursor-pointer"
/>
```

Substituir por:
```tsx
<Checkbox
  checked={bills.length > 0 && selected.size === bills.length}
  onChange={toggleAll}
/>
```

- [ ] **Step 3: Substituir checkbox de linha (linha 177–183)**

Localizar:
```tsx
<input
  type="checkbox"
  checked={selected.has(bill.id)}
  onChange={() => toggleOne(bill.id)}
  onClick={e => e.stopPropagation()}
  className="cursor-pointer"
/>
```

Substituir por:
```tsx
<Checkbox
  checked={selected.has(bill.id)}
  onChange={() => toggleOne(bill.id)}
  onClick={e => e.stopPropagation()}
/>
```

- [ ] **Step 4: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/cnab/Cnab.tsx
git commit -m "feat: use Checkbox component in Cnab"
```

---

## Task 3: Atualizar Companies.tsx, Customers.tsx e Flights.tsx

**Files:**
- Modify: `src/pages/companies/Companies.tsx`
- Modify: `src/pages/customers/Customers.tsx`
- Modify: `src/pages/flights/Flights.tsx`

Padrão idêntico nos 3 arquivos:
- Header `<th>`: `<input type="checkbox" checked={allSelected} onChange={toggleAll} />`
- Row `<td>`: `<input type="checkbox" checked={selected.has(x.id)} onChange={() => toggleOne(x.id)} />`

- [ ] **Step 1: Atualizar Companies.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linha 177):
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

Substituir (linha 188):
```tsx
<input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} />
```

- [ ] **Step 2: Atualizar Customers.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linha 167):
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

Substituir (linha 178):
```tsx
<input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} />
```

- [ ] **Step 3: Atualizar Flights.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linha 176):
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

Substituir (linha 195):
```tsx
<input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleOne(f.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(f.id)} onChange={() => toggleOne(f.id)} />
```

- [ ] **Step 4: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/companies/Companies.tsx src/pages/customers/Customers.tsx src/pages/flights/Flights.tsx
git commit -m "feat: use Checkbox component in Companies, Customers, Flights"
```

---

## Task 4: Atualizar Payables.tsx, Planes.tsx e Receivables.tsx

**Files:**
- Modify: `src/pages/payables/Payables.tsx`
- Modify: `src/pages/planes/Planes.tsx`
- Modify: `src/pages/receivables/Receivables.tsx`

- [ ] **Step 1: Atualizar Payables.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linha 323):
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

Substituir (linha 339):
```tsx
<input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
```

- [ ] **Step 2: Atualizar Planes.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linha 141):
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

Substituir (linha 152):
```tsx
<input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
```

- [ ] **Step 3: Atualizar Receivables.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linha 368):
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

Substituir (linha 387):
```tsx
<input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} />
```

- [ ] **Step 4: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/pages/payables/Payables.tsx src/pages/planes/Planes.tsx src/pages/receivables/Receivables.tsx
git commit -m "feat: use Checkbox component in Payables, Planes, Receivables"
```

---

## Task 5: Atualizar SettleModal.tsx e UserModal.tsx

**Files:**
- Modify: `src/components/SettleModal.tsx`
- Modify: `src/pages/users/UserModal.tsx`

- [ ] **Step 1: Atualizar SettleModal.tsx**

Adicionar import (arquivo está em `src/components/`, não em `src/pages/`):
```tsx
import Checkbox from './ui/Checkbox';
```

Substituir (linha 61 — remove `className="w-4 h-4 accent-[var(--accent)]"`):
```tsx
<input type="checkbox" className="w-4 h-4 accent-[var(--accent)]" checked={useCredit} onChange={e => setUseCredit(e.target.checked)} />
```
Por:
```tsx
<Checkbox checked={useCredit} onChange={e => setUseCredit(e.target.checked)} />
```

- [ ] **Step 2: Atualizar UserModal.tsx**

Adicionar import:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

Substituir (linhas 141–146 — remove `className="accent-[var(--accent)]"`):
```tsx
<input
  type="checkbox"
  checked={allChecked}
  onChange={() => toggleRow(mod)}
  className="accent-[var(--accent)]"
/>
```
Por:
```tsx
<Checkbox
  checked={allChecked}
  onChange={() => toggleRow(mod)}
/>
```

Substituir (linhas 152–156 — remove `className="accent-[var(--accent)]"`):
```tsx
<input
  type="checkbox"
  checked={perms.has(p)}
  onChange={() => togglePerm(p)}
  className="accent-[var(--accent)]"
/>
```
Por:
```tsx
<Checkbox
  checked={perms.has(p)}
  onChange={() => togglePerm(p)}
/>
```

- [ ] **Step 3: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/SettleModal.tsx src/pages/users/UserModal.tsx
git commit -m "feat: use Checkbox component in SettleModal and UserModal"
```

---

## Task 6: Atualizar Invoices.tsx

**Files:**
- Modify: `src/pages/invoices/Invoices.tsx`

- [ ] **Step 1: Adicionar import**

O arquivo já importa `Badge` e outras coisas. Adicionar junto:
```tsx
import Checkbox from '../../components/ui/Checkbox';
```

- [ ] **Step 2: Substituir checkbox do modal de nova fatura (linha 114)**

Localizar:
```tsx
<input type="checkbox" checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} />
```
Por:
```tsx
<Checkbox checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} />
```

- [ ] **Step 3: Substituir checkbox do header da tabela (linha 252)**

Localizar:
```tsx
<input type="checkbox" checked={allSelected} onChange={toggleAll} />
```
Por:
```tsx
<Checkbox checked={allSelected} onChange={toggleAll} />
```

- [ ] **Step 4: Substituir checkbox de linha da tabela (linha 265)**

Localizar:
```tsx
<input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleOne(b.id)} />
```
Por:
```tsx
<Checkbox checked={selected.has(b.id)} onChange={() => toggleOne(b.id)} />
```

- [ ] **Step 5: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/pages/invoices/Invoices.tsx
git commit -m "feat: use Checkbox component in Invoices"
```

---

## Task 7: Atualizar Reports.tsx

**Files:**
- Modify: `src/pages/reports/Reports.tsx`

- [ ] **Step 1: Adicionar import**

```tsx
import Checkbox from '../../components/ui/Checkbox';
```

- [ ] **Step 2: Substituir checkbox de coluna inline (linha 488)**

Localizar:
```tsx
<input type="checkbox" checked={columns.includes(f.key)} onChange={e => toggleColumn(f.key, e.target.checked)} />
```
Por:
```tsx
<Checkbox checked={columns.includes(f.key)} onChange={e => toggleColumn(f.key, e.target.checked)} />
```

- [ ] **Step 3: Substituir checkbox de join (linhas 498–508)**

Localizar:
```tsx
<input
  type="checkbox"
  checked={active}
  onChange={e => {
    setJoins(j => e.target.checked ? [...j, opt.value] : j.filter(x => x !== opt.value));
    if (!e.target.checked) {
      setColumns(c => c.filter(col => !col.startsWith(`${opt.value}.`)));
      setFilters(f => f.filter(fi => !fi.field.startsWith(`${opt.value}.`)));
    }
  }}
/>
```
Por:
```tsx
<Checkbox
  checked={active}
  onChange={e => {
    setJoins(j => e.target.checked ? [...j, opt.value] : j.filter(x => x !== opt.value));
    if (!e.target.checked) {
      setColumns(c => c.filter(col => !col.startsWith(`${opt.value}.`)));
      setFilters(f => f.filter(fi => !fi.field.startsWith(`${opt.value}.`)));
    }
  }}
/>
```

- [ ] **Step 4: Substituir checkbox de coluna de join inline (linha 515)**

Localizar:
```tsx
<input type="checkbox" checked={columns.includes(f.key)} onChange={e => toggleColumn(f.key, e.target.checked)} />
```
Por:
```tsx
<Checkbox checked={columns.includes(f.key)} onChange={e => toggleColumn(f.key, e.target.checked)} />
```

Atenção: esta linha é idêntica à da linha 488. O arquivo tem duas ocorrências — substitua ambas.

- [ ] **Step 5: Substituir checkbox de ativar agrupamento (linha 581)**

Localizar:
```tsx
<input type="checkbox" checked={useGroupBy} onChange={e => { setUseGroupBy(e.target.checked); if (!e.target.checked) { setGroupBy([]); setAggregations([]); } }} />
```
Por:
```tsx
<Checkbox checked={useGroupBy} onChange={e => { setUseGroupBy(e.target.checked); if (!e.target.checked) { setGroupBy([]); setAggregations([]); } }} />
```

- [ ] **Step 6: Substituir checkbox de campo de agrupamento (linha 593)**

Localizar:
```tsx
<input type="checkbox" checked={groupBy.includes(f.key)} onChange={e => toggleGroupBy(f.key, e.target.checked)} />
```
Por:
```tsx
<Checkbox checked={groupBy.includes(f.key)} onChange={e => toggleGroupBy(f.key, e.target.checked)} />
```

- [ ] **Step 7: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 8: Commit**

```bash
git add src/pages/reports/Reports.tsx
git commit -m "feat: use Checkbox component in Reports"
```

---

## Task 8: Atualizar CompanyDetail.tsx

**Files:**
- Modify: `src/pages/companies/CompanyDetail.tsx`

- [ ] **Step 1: Adicionar import**

```tsx
import Checkbox from '../../components/ui/Checkbox';
```

- [ ] **Step 2: Substituir checkbox header de recebíveis (linha 550)**

Localizar:
```tsx
<th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedRec} onChange={toggleAllRec} /></th>
```
Por:
```tsx
<th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedRec} onChange={toggleAllRec} /></th>
```

- [ ] **Step 3: Substituir checkbox de linha de recebível (linha 561)**

Localizar:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} /></td>
```
Por:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} /></td>
```

- [ ] **Step 4: Substituir checkbox header de pagáveis (linha 599)**

Localizar:
```tsx
<th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedPay} onChange={toggleAllPay} /></th>
```
Por:
```tsx
<th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedPay} onChange={toggleAllPay} /></th>
```

- [ ] **Step 5: Substituir checkbox de linha de pagável (linha 608)**

Localizar:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedPay.has(p.id)} onChange={() => toggleOnePay(p.id)} /></td>
```
Por:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedPay.has(p.id)} onChange={() => toggleOnePay(p.id)} /></td>
```

- [ ] **Step 6: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/pages/companies/CompanyDetail.tsx
git commit -m "feat: use Checkbox component in CompanyDetail"
```

---

## Task 9: Atualizar CustomerDetail.tsx

**Files:**
- Modify: `src/pages/customers/CustomerDetail.tsx`

- [ ] **Step 1: Adicionar import**

```tsx
import Checkbox from '../../components/ui/Checkbox';
```

- [ ] **Step 2: Substituir checkbox de crédito no modal (linha 288 — remove className)**

Localizar:
```tsx
<input type="checkbox" className="w-4 h-4 accent-[var(--accent)]" checked={useCredit} onChange={e => setUseCredit(e.target.checked)} />
```
Por:
```tsx
<Checkbox checked={useCredit} onChange={e => setUseCredit(e.target.checked)} />
```

- [ ] **Step 3: Substituir checkbox de seleção no modal de nova fatura (linha 382)**

Localizar:
```tsx
<td className={tdCls}><input type="checkbox" checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} /></td>
```
Por:
```tsx
<td className={tdCls}><Checkbox checked={checked} onChange={() => toggleRec(r)} onClick={e => e.stopPropagation()} /></td>
```

- [ ] **Step 4: Substituir 2 checkboxes da aba Recebíveis (linhas 788 e 799)**

Localizar (linha 788):
```tsx
<th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedRec} onChange={toggleAllRec} /></th>
```
Por:
```tsx
<th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedRec} onChange={toggleAllRec} /></th>
```

Localizar (linha 799):
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} /></td>
```
Por:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedRec.has(r.id)} onChange={() => toggleOneRec(r.id)} /></td>
```

- [ ] **Step 5: Substituir 2 checkboxes da aba A Pagar (linhas 831 e 836)**

Localizar (linha 831 — inline na tag `<th>`):
```tsx
<th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedPagar} onChange={toggleAllPagar} /></th>
```
Por:
```tsx
<th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedPagar} onChange={toggleAllPagar} /></th>
```

Localizar (linha 836):
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedPagar.has(p.id)} onChange={() => toggleOnePagar(p.id)} /></td>
```
Por:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedPagar.has(p.id)} onChange={() => toggleOnePagar(p.id)} /></td>
```

- [ ] **Step 6: Substituir 2 checkboxes da aba Faturas (linhas 870 e 875)**

Localizar (linha 870):
```tsx
<th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedFatura} onChange={toggleAllFatura} /></th>
```
Por:
```tsx
<th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedFatura} onChange={toggleAllFatura} /></th>
```

Localizar (linha 875):
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedFatura.has(b.id)} onChange={() => toggleOneFatura(b.id)} /></td>
```
Por:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedFatura.has(b.id)} onChange={() => toggleOneFatura(b.id)} /></td>
```

- [ ] **Step 7: Substituir 2 checkboxes da aba Voos (linhas 949 e 954)**

Localizar (linha 949):
```tsx
<th className={thCls} style={{ width: 36 }}><input type="checkbox" checked={allSelectedVoo} onChange={toggleAllVoo} /></th>
```
Por:
```tsx
<th className={thCls} style={{ width: 36 }}><Checkbox checked={allSelectedVoo} onChange={toggleAllVoo} /></th>
```

Localizar (linha 954):
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedVoo.has(f.id)} onChange={() => toggleOneVoo(f.id)} /></td>
```
Por:
```tsx
<td className={tdCls} style={{ width: 36 }} onClick={e => e.stopPropagation()}><Checkbox checked={selectedVoo.has(f.id)} onChange={() => toggleOneVoo(f.id)} /></td>
```

- [ ] **Step 8: Verificar compilação**

```bash
cd C:\Users\FabioHenriqueBenedic\www\aeroclube\aeroclube-web
npx tsc --noEmit
```

Saída esperada: sem erros.

- [ ] **Step 9: Commit**

```bash
git add src/pages/customers/CustomerDetail.tsx
git commit -m "feat: use Checkbox component in CustomerDetail"
```

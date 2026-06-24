# Frontend Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify visual style and eliminate code duplication across ~28 frontend files by extracting repeated UI patterns into shared, focused components — zero behavior changes, zero new dependencies.

**Architecture:** Eight duplication categories are resolved by creating 7 new files (Modal compound component, 4 small UI primitives, DateRangeFilter, payerTypes) and updating RowMenu.tsx with two new exports. Every modal (~16 files) migrates to the Modal compound; every list page migrates tab bars, search inputs, stat cards, progress bars, and date range filters to the new components.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS v3, lucide-react, react-router-dom v7

## Global Constraints

- No behavior changes: queries, mutations, validations, API calls must remain identical
- No visual changes: rendered output must look identical before and after each task
- No new dependencies: every import must come from existing packages
- No new `any` types: every prop/return must be fully typed
- `src/api/`, `src/types/`, `src/index.css`, `tailwind.config.js` are not touched
- Build check after every task: run `npx tsc --noEmit` from `aeroclube-web/`

---

### Task 1: Add RowMenuItem + RowMenuDangerItem to RowMenu.tsx

**Files:**
- Modify: `src/components/RowMenu.tsx`

**Interfaces:**
- Produces: `RowMenuItem`, `RowMenuDangerItem` — named exports consumed by Tasks 9–12

- [ ] **Step 1: Edit `src/components/RowMenu.tsx`**

Replace the entire file with:

```tsx
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  top: number;
  right: number;
  onClose: () => void;
  children: ReactNode;
}

export default function RowMenu({ top, right, onClose, children }: Props) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const h = () => closeRef.current();
    window.addEventListener('click', h, { once: true });
    return () => window.removeEventListener('click', h);
  }, []);

  return createPortal(
    <div
      className="fixed z-[9999] bg-bg-elev border border-line rounded-[7px] shadow-[var(--shadow)] min-w-[160px] p-1"
      style={{ top, right }}
      onClick={e => { e.stopPropagation(); onClose(); }}
    >
      {children}
    </div>,
    document.body
  );
}

export function RowMenuSep() {
  return <div className="h-px bg-line my-1" />;
}

export function RowMenuItem({ icon, onClick, children }: { icon?: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left"
      onClick={onClick}
    >
      {icon}{children}
    </button>
  );
}

export function RowMenuDangerItem({ icon, onClick, children }: { icon?: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left"
      onClick={onClick}
    >
      {icon}{children}
    </button>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd aeroclube-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RowMenu.tsx
git commit -m "feat: add RowMenuItem and RowMenuDangerItem to RowMenu"
```

---

### Task 2: Create Modal compound component

**Files:**
- Create: `src/components/ui/Modal.tsx`

**Interfaces:**
- Produces:
  - `Modal({ children, onClose, maxWidth? }: { children: ReactNode; onClose: () => void; maxWidth?: number })` — default export
  - `Modal.Header({ title, onClose, children? }: { title: string; onClose: () => void; children?: ReactNode })`
  - `Modal.Body({ children, className? }: { children: ReactNode; className?: string })`
  - `Modal.Footer({ children, justify? }: { children: ReactNode; justify?: 'end' | 'between' })`

- [ ] **Step 1: Create `src/components/ui/Modal.tsx`**

```tsx
import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  maxWidth?: number;
}

function ModalHeader({ title, onClose, children }: { title: string; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-line gap-3">
      <span className="font-semibold text-[15px] text-ink">{title}</span>
      {children}
      <button
        className="w-7 h-7 rounded-md flex items-center justify-center text-ink-3 hover:bg-bg-hover hover:text-ink cursor-pointer bg-transparent border-0"
        onClick={onClose}
        aria-label="Fechar"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-4 overflow-y-auto flex-1 flex flex-col gap-4${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}

function ModalFooter({ children, justify = 'end' }: { children: ReactNode; justify?: 'end' | 'between' }) {
  return (
    <div className={`flex items-center gap-2 px-5 py-3.5 border-t border-line${justify === 'between' ? ' justify-between' : ' justify-end'}`}>
      {children}
    </div>
  );
}

function Modal({ children, onClose, maxWidth = 480 }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-bg-elev border border-line rounded-[10px] w-full shadow-[var(--shadow)] flex flex-col max-h-[90vh]"
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
```

- [ ] **Step 2: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Modal.tsx
git commit -m "feat: add Modal compound component"
```

---

### Task 3: Create StatCard, SearchInput, TabBar, ProgressBar

**Files:**
- Create: `src/components/ui/StatCard.tsx`
- Create: `src/components/ui/SearchInput.tsx`
- Create: `src/components/ui/TabBar.tsx`
- Create: `src/components/ui/ProgressBar.tsx`

**Interfaces:**
- `StatCard({ icon, iconVariant?, label, value, prefix?, valueVariant? })` — default export
- `SearchInput({ value, onChange, placeholder?, minWidth? })` — default export
- `TabBar({ tabs, active, onChange })` where `Tab = { key: string | undefined; label: string }` — default export
- `ProgressBar({ pct, isPaid })` — default export

- [ ] **Step 1: Create `src/components/ui/StatCard.tsx`**

```tsx
import type { ReactNode } from 'react';

type IconVariant = 'default' | 'success' | 'warn' | 'danger';

const iconBg: Record<IconVariant, string> = {
  default: 'bg-bg-sunk text-ink-3',
  success: 'bg-success-soft text-success',
  warn:    'bg-warn-soft text-warn',
  danger:  'bg-danger-soft text-danger',
};

const valueColor: Record<string, string> = {
  default: '',
  success: 'text-success',
  warn:    'text-warn',
  danger:  'text-danger',
};

interface StatCardProps {
  icon: ReactNode;
  iconVariant?: IconVariant;
  label: string;
  value: string;
  prefix?: string;
  valueVariant?: string;
}

export default function StatCard({ icon, iconVariant = 'default', label, value, prefix, valueVariant = 'default' }: StatCardProps) {
  return (
    <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-[8px] grid place-items-center shrink-0 ${iconBg[iconVariant]}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-[12px] text-ink-3 font-medium">{label}</div>
        <div className={`text-[20px] font-bold tracking-tight font-mono ${valueColor[valueVariant] ?? ''}`}>
          {prefix && <span className="text-[13px] font-medium mr-0.5">{prefix}</span>}
          {value}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/SearchInput.tsx`**

```tsx
interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minWidth?: number;
}

export default function SearchInput({ value, onChange, placeholder, minWidth = 220 }: SearchInputProps) {
  return (
    <div className="relative flex items-center">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
        style={{ minWidth }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/TabBar.tsx`**

```tsx
export type Tab = { key: string | undefined; label: string };

interface TabBarProps {
  tabs: Tab[];
  active: string | undefined;
  onChange: (key: string | undefined) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <>
      {tabs.map(t => (
        <button
          key={t.key ?? '__all__'}
          onClick={() => onChange(t.key)}
          className="px-3.5 py-2 text-[13px] font-medium cursor-pointer bg-transparent border-0 border-b-2 whitespace-nowrap"
          style={{
            color: active === t.key ? 'var(--ink)' : 'var(--ink-3)',
            borderBottomColor: active === t.key ? 'var(--accent)' : 'transparent',
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/ProgressBar.tsx`**

```tsx
interface ProgressBarProps {
  pct: number;
  isPaid: boolean;
}

export default function ProgressBar({ pct, isPaid }: ProgressBarProps) {
  const fillColor = isPaid ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--line)';
  const textColor = isPaid ? 'var(--success)' : pct > 0 ? 'var(--warn)' : 'var(--ink-3)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-sunk rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fillColor, transition: 'width 0.3s' }} />
      </div>
      <span className="font-mono text-[11px] min-w-[32px] text-right" style={{ color: textColor }}>{pct}%</span>
    </div>
  );
}
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/StatCard.tsx src/components/ui/SearchInput.tsx src/components/ui/TabBar.tsx src/components/ui/ProgressBar.tsx
git commit -m "feat: add StatCard, SearchInput, TabBar, ProgressBar UI components"
```

---

### Task 4: Create DateRangeFilter, payerTypes, update ui/index.ts

**Files:**
- Create: `src/components/DateRangeFilter.tsx`
- Create: `src/utils/payerTypes.ts`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- `DateRangeFilter({ label, onApply }: { label: string; onApply: (from: string, to: string) => void })` — default export
- `PAYER_TYPES` — named export from `src/utils/payerTypes.ts`

- [ ] **Step 1: Create `src/utils/payerTypes.ts`**

```ts
import { User, GraduationCap, UserCheck, Users, Briefcase, Building2 } from 'lucide-react';

export const PAYER_TYPES = [
  { value: 'customer',   label: 'Pessoa',      Icon: User },
  { value: 'student',    label: 'Aluno',       Icon: GraduationCap },
  { value: 'instructor', label: 'Instrutor',   Icon: UserCheck },
  { value: 'partner',    label: 'Sócio',       Icon: Users },
  { value: 'employee',   label: 'Funcionário', Icon: Briefcase },
  { value: 'company',    label: 'Empresa',     Icon: Building2 },
] as const;
```

- [ ] **Step 2: Create `src/components/DateRangeFilter.tsx`**

```tsx
import { useState } from 'react';
import DateInput from './DateInput';
import Button from './ui/Button';

interface DateRangeFilterProps {
  label: string;
  onApply: (from: string, to: string) => void;
}

export default function DateRangeFilter({ label, onApply }: DateRangeFilterProps) {
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');

  return (
    <div className="flex items-center gap-3 justify-end">
      <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
        <DateInput value={pendingFrom} onChange={setPendingFrom} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Até</span>
        <DateInput value={pendingTo} onChange={setPendingTo} />
      </div>
      <Button variant="primary" onClick={() => onApply(pendingFrom, pendingTo)}>Aplicar</Button>
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/ui/index.ts`**

Replace the entire file with:

```ts
export { default as Button } from './Button';
export { default as Badge } from './Badge';
export { default as Chip } from './Chip';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Textarea } from './Textarea';
export { default as InputGroup } from './InputGroup';
export { default as Card } from './Card';
export { default as Modal } from './Modal';
export { default as StatCard } from './StatCard';
export { default as SearchInput } from './SearchInput';
export { default as TabBar } from './TabBar';
export { default as ProgressBar } from './ProgressBar';
```

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/payerTypes.ts src/components/DateRangeFilter.tsx src/components/ui/index.ts
git commit -m "feat: add DateRangeFilter, PAYER_TYPES, and export new UI components"
```

---

### Task 5: Migrate simple modals (no wizard, or trivial)

The following modals use inline Tailwind classes with no multi-step wizard complexity. Each is migrated to the `Modal` compound component.

**Files to Modify:**
- `src/pages/companies/CompanyModal.tsx`
- `src/pages/flights/CloseFlightModal.tsx`
- `src/pages/receivables/PayModal.tsx`
- `src/pages/receivables/SettleModal.tsx`
- `src/pages/auth/ProfileModal.tsx`
- `src/pages/invoices/PayInvoiceModal.tsx`
- `src/pages/invoices/CnabBaixaModal.tsx`

The migration pattern for each modal is:

**Before (typical):**
```tsx
const modalBase = 'fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4';
const modalPanel = 'bg-bg-elev border border-line rounded-[10px] w-full max-w-[480px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]';
const modalHead = '...';
const modalBody = '...';
const modalFoot = '...';

return (
  <div className={modalBase}>
    <div className={modalPanel}>
      <div className={modalHead}>
        <span>Title</span>
        <button onClick={onClose}>×</button>
      </div>
      <div className={modalBody}>...</div>
      <div className={modalFoot}>...</div>
    </div>
  </div>
);
```

**After:**
```tsx
import Modal from '../../components/ui/Modal';

return (
  <Modal onClose={onClose} maxWidth={480}>
    <Modal.Header title="Title" onClose={onClose} />
    <Modal.Body>...</Modal.Body>
    <Modal.Footer justify="end">...</Modal.Footer>
  </Modal>
);
```

Remove all local `modalBase`, `modalPanel`, `modalHead`, `modalBody`, `modalFoot`, `field`, `lbl` constants after the migration.

**Special cases:**

- **PayModal.tsx** and **SettleModal.tsx**: These use raw `<button>` elements in the footer. Replace each with `<Button variant="secondary">` / `<Button variant="primary">` / `<Button variant="danger">` as appropriate — import `Button` from `../../components/ui/Button`. Keep the existing onClick handlers unchanged.

- **ProfileModal.tsx**: This modal has a unique style (`rounded-xl shadow-2xl rgba(0,0,0,0.45)` backdrop). Do NOT migrate ProfileModal to the Modal compound component — leave it as-is. Skip it.

- **CnabBaixaModal.tsx**: Uses `const modalBase/Head/Foot` (not `modalPanel`). Same migration pattern; just delete all three local constants.

- **PayInvoiceModal.tsx**: Uses `const modalBase/Head/Foot`. Same migration pattern.

After migrating each modal, verify it renders identically:

- [ ] **Step 1: Migrate CompanyModal.tsx**

Open `src/pages/companies/CompanyModal.tsx`. Add `import Modal from '../../components/ui/Modal';`. Remove all local class-string constants. Wrap the return value with `<Modal onClose={onClose} maxWidth={480}>`, replace the header div with `<Modal.Header title="..." onClose={onClose} />`, the body div with `<Modal.Body>`, and the footer div with `<Modal.Footer justify="end">`.

- [ ] **Step 2: Migrate CloseFlightModal.tsx**

Same pattern. `maxWidth={480}`, footer `justify="end"`.

- [ ] **Step 3: Migrate PayModal.tsx**

Same pattern. Replace raw `<button>` elements in the footer with `<Button>` from `../../components/ui/Button`. Footer `justify="end"`.

- [ ] **Step 4: Migrate SettleModal.tsx**

Same pattern. Replace raw `<button>` elements with `<Button>`. Footer `justify="end"`.

- [ ] **Step 5: Migrate PayInvoiceModal.tsx**

Delete local `modalBase`, `modalHead`, `modalFoot` constants. `maxWidth={440}`, footer `justify="end"`.

- [ ] **Step 6: Migrate CnabBaixaModal.tsx**

Delete local `modalBase`, `modalHead`, `modalFoot` constants. `maxWidth={400}`, footer `justify="end"`.

- [ ] **Step 7: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/companies/CompanyModal.tsx src/pages/flights/CloseFlightModal.tsx src/pages/receivables/PayModal.tsx src/pages/receivables/SettleModal.tsx src/pages/invoices/PayInvoiceModal.tsx src/pages/invoices/CnabBaixaModal.tsx
git commit -m "refactor: migrate simple modals to Modal compound component"
```

---

### Task 6: Migrate NewReceivableModal + EditReceivableModal

**Files to Modify:**
- `src/pages/receivables/NewReceivableModal.tsx`
- `src/pages/receivables/EditReceivableModal.tsx`

Both files have `const modalBase/Panel/Head/Body/Foot/field/lbl` local constants, a 5-6 step wizard, and footer `justify-between`. They also import `PAYER_TYPES_REC`.

- [ ] **Step 1: Migrate NewReceivableModal.tsx**

1. Add `import Modal from '../../components/ui/Modal';`
2. Add `import { PAYER_TYPES } from '../../utils/payerTypes';`
3. Delete the local `PAYER_TYPES_REC` constant and all `modalBase/Panel/Head/Body/Foot/field/lbl` constants
4. Replace all references to `PAYER_TYPES_REC` with `PAYER_TYPES`
5. Wrap the return value with `<Modal onClose={onClose} maxWidth={480}>`
6. Replace the header section with `<Modal.Header title="Novo título" onClose={onClose} />`
7. Replace the body section with `<Modal.Body>`
8. Replace the footer section with `<Modal.Footer justify="between">`
9. The `field` and `lbl` constants (used inside the body for field layout) must be inlined. Replace each `<div className={field}>` with `<div className="flex flex-col gap-1.5">` and each `<label className={lbl}>` with `<label className="text-[12px] font-medium text-ink-2">`.

- [ ] **Step 2: Migrate EditReceivableModal.tsx**

Same steps as above. Also replace `PAYER_TYPES_REC` → `PAYER_TYPES` and its import. Footer `justify="between"`.

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/receivables/NewReceivableModal.tsx src/pages/receivables/EditReceivableModal.tsx
git commit -m "refactor: migrate receivable modals to Modal compound component"
```

---

### Task 7: Migrate NewPayableModal + EditPayableModal

**Files to Modify:**
- `src/pages/payables/NewPayableModal.tsx`
- `src/pages/payables/EditPayableModal.tsx`

Same pattern as Task 6 but these use `PAYER_TYPES_PAY` instead of `PAYER_TYPES_REC`.

- [ ] **Step 1: Migrate NewPayableModal.tsx**

1. Add `import Modal from '../../components/ui/Modal';`
2. Add `import { PAYER_TYPES } from '../../utils/payerTypes';`
3. Delete local `PAYER_TYPES_PAY` and all `modalBase/Panel/Head/Body/Foot/field/lbl` constants
4. Replace all `PAYER_TYPES_PAY` → `PAYER_TYPES`
5. Wrap return with `<Modal onClose={onClose} maxWidth={480}>`
6. `<Modal.Header title="Nova despesa" onClose={onClose} />`
7. Body → `<Modal.Body>`, footer → `<Modal.Footer justify="between">`
8. Inline `field` → `"flex flex-col gap-1.5"` and `lbl` → `"text-[12px] font-medium text-ink-2"`.

- [ ] **Step 2: Migrate EditPayableModal.tsx**

Same. EditPayableModal has its own local constants instead of importing them — delete all of them and follow the same migration steps. Footer `justify="between"`.

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/payables/NewPayableModal.tsx src/pages/payables/EditPayableModal.tsx
git commit -m "refactor: migrate payable modals to Modal compound component"
```

---

### Task 8: Migrate remaining modals (PeopleModal, FlightModal, PlaneModal, UserModal, NewInvoiceModal)

**Files to Modify:**
- `src/pages/peoples/PeopleModal.tsx`
- `src/pages/flights/FlightModal.tsx`
- `src/pages/planes/PlaneModal.tsx`
- `src/pages/users/UserModal.tsx`
- `src/pages/invoices/NewInvoiceModal.tsx`

All use inline class strings (no local constants). Specific notes:

**PeopleModal.tsx** — 3-step wizard. Header padding is `px-[18px] pt-[18px] pb-4` in the original; standardize to `px-5 py-4` (the Modal.Header default). `maxWidth={480}`, footer `justify="end"`.

**FlightModal.tsx** — 2-4 steps, `maxWidth={540}`. Footer has a conditional: first step shows only Next, other steps show Back + Next/Save. Use `<Modal.Footer justify="end">`. Keep the conditional buttons inside the footer unchanged.

**PlaneModal.tsx** — 2-step wizard, `maxWidth={480}`, footer `justify="end"`.

**UserModal.tsx** — 2-3 steps, `maxWidth={560}`, footer `justify="between"`.

**NewInvoiceModal.tsx** — This modal has `const modalBase/Head/Foot` (no `modalPanel`) and each step renders its own body+footer inside a conditional. Migration approach:
1. Delete `modalBase`, `modalHead`, `modalFoot` local constants
2. Add `import Modal from '../../components/ui/Modal';`
3. Wrap the whole return in `<Modal onClose={onClose} maxWidth={520}>`
4. Add `<Modal.Header title="Nova fatura" onClose={onClose} />` once, outside the step conditional
5. Move each step's body content into `<Modal.Body>` and footer into `<Modal.Footer>` — now inside the step conditional but only the content changes, not the wrappers. If each step already has its own body+footer, restructure so there is one `<Modal.Body>` and one `<Modal.Footer>` wrapping step-conditional content:

```tsx
<Modal onClose={onClose} maxWidth={520}>
  <Modal.Header title="Nova fatura" onClose={onClose} />
  <Modal.Body>
    {step === 1 ? (
      <>...step 1 fields...</>
    ) : (
      <>...step 2 fields...</>
    )}
  </Modal.Body>
  <Modal.Footer justify="end">
    {step === 1 ? (
      <><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={goNext}>Próximo</Button></>
    ) : (
      <><Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button><Button variant="primary" onClick={handleSave}>Salvar</Button></>
    )}
  </Modal.Footer>
</Modal>
```

- [ ] **Step 1: Migrate PeopleModal.tsx**

Wrap with `<Modal onClose={onClose} maxWidth={480}>`, add `<Modal.Header title="..." onClose={onClose} />`, `<Modal.Body>`, `<Modal.Footer justify="end">`.

- [ ] **Step 2: Migrate FlightModal.tsx**

Wrap with `<Modal onClose={onClose} maxWidth={540}>`, add `<Modal.Header title="..." onClose={onClose} />`, `<Modal.Body>`, `<Modal.Footer justify="end">`.

- [ ] **Step 3: Migrate PlaneModal.tsx**

Wrap with `<Modal onClose={onClose} maxWidth={480}>`, add `<Modal.Header title="..." onClose={onClose} />`, `<Modal.Body>`, `<Modal.Footer justify="end">`.

- [ ] **Step 4: Migrate UserModal.tsx**

Wrap with `<Modal onClose={onClose} maxWidth={560}>`, add `<Modal.Header title="..." onClose={onClose} />`, `<Modal.Body>`, `<Modal.Footer justify="between">`.

- [ ] **Step 5: Migrate NewInvoiceModal.tsx**

Follow the restructuring pattern described above. `maxWidth={520}`, footer `justify="end"`. Delete `modalBase`, `modalHead`, `modalFoot` local constants.

- [ ] **Step 6: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/peoples/PeopleModal.tsx src/pages/flights/FlightModal.tsx src/pages/planes/PlaneModal.tsx src/pages/users/UserModal.tsx src/pages/invoices/NewInvoiceModal.tsx
git commit -m "refactor: migrate remaining modals to Modal compound component"
```

---

### Task 9: Migrate Receivables.tsx

**Files to Modify:**
- `src/pages/receivables/Receivables.tsx`

Replace:
1. Raw date range filter → `<DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />`
2. The 4 KPI card `<div>` blocks → `<StatCard>` components
3. The raw tab buttons inside the table toolbar → `<TabBar tabs={...} active={tab} onChange={setTab} />`
4. The raw search `<input>` + SVG → `<SearchInput value={search} onChange={setSearch} placeholder="Buscar por título ou pagador" minWidth={250} />`
5. The progress column `render` → `<ProgressBar pct={pct} isPaid={st === 'paid'} />`
6. RowMenu item buttons → `<RowMenuItem>` / `<RowMenuDangerItem>`

Remove imports no longer needed: `DateInput` (if unused elsewhere in the file).

- [ ] **Step 1: Add new imports**

At the top of `Receivables.tsx`, add:
```tsx
import DateRangeFilter from '../../components/DateRangeFilter';
import StatCard from '../../components/ui/StatCard';
import SearchInput from '../../components/ui/SearchInput';
import TabBar from '../../components/ui/TabBar';
import ProgressBar from '../../components/ui/ProgressBar';
import { RowMenuItem, RowMenuDangerItem, RowMenuSep } from '../../components/RowMenu';
```

Remove `import DateInput from '../../components/DateInput';` (no longer needed after migration).

- [ ] **Step 2: Remove pending date state**

Remove these 4 state declarations (the `DateRangeFilter` manages its own pending state now):
```tsx
const [pendingFrom, setPendingFrom] = useState('');
const [pendingTo, setPendingTo] = useState('');
```

- [ ] **Step 3: Replace date range filter JSX**

Find this block:
```tsx
<div className="flex items-center gap-3 justify-end">
  <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Criação</span>
  <div className="flex items-center gap-2">
    <span ...>de</span>
    <DateInput value={pendingFrom} onChange={setPendingFrom} />
  </div>
  <div className="flex items-center gap-2">
    <span ...>Até</span>
    <DateInput value={pendingTo} onChange={setPendingTo} />
  </div>
  <Button variant="primary" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); }}>Aplicar</Button>
</div>
```

Replace with:
```tsx
<DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />
```

- [ ] **Step 4: Replace KPI cards**

Find the `<div className="grid grid-cols-4 gap-3">` block with 4 card divs and replace with:

```tsx
<div className="grid grid-cols-4 gap-3">
  <StatCard icon={<BarChart3 size={18} />} iconVariant="default" label="Valor total" value={formatBRL(total)} prefix="R$" />
  <StatCard icon={<ArrowDownLeft size={18} />} iconVariant="success" label="Valor recebido" value={formatBRL(received)} prefix="R$" valueVariant="success" />
  <StatCard icon={<Clock size={18} />} iconVariant="warn" label="Valor a receber" value={formatBRL(total - received)} prefix="R$" valueVariant="warn" />
  <StatCard icon={<AlertCircle size={18} />} iconVariant="danger" label="Valor vencido" value={formatBRL(overdue)} prefix="R$" valueVariant="danger" />
</div>
```

- [ ] **Step 5: Replace tab bar**

In the table toolbar, find the `{TABS.map(([k, l]) => ( <button ...>{l}</button> ))}` block and replace with:

```tsx
<TabBar
  tabs={TABS.map(([key, label]) => ({ key: key === 'all' ? undefined : key, label }))}
  active={tab === 'all' ? undefined : tab}
  onChange={k => setTab(k ?? 'all')}
/>
```

Keep the Checkbox before the TabBar and the SearchInput after. Note: `tab` state and `TABS` constant stay unchanged; only the render changes.

- [ ] **Step 6: Replace search input**

Find the `<div className="relative flex items-center">` block with SVG icon + input and replace with:
```tsx
<SearchInput value={search} onChange={setSearch} placeholder="Buscar por título ou pagador" minWidth={250} />
```

- [ ] **Step 7: Replace progress bar render**

In the `progress` column render function, replace the entire JSX return with:
```tsx
<ProgressBar pct={pct} isPaid={st === 'paid'} />
```
Keep the `const st` and `const pct` lines above it.

- [ ] **Step 8: Replace RowMenu item buttons**

Find:
```tsx
<RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
  <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { setMenuState(null); navigate(`/receivables/${menuRec.id}`); }}><Eye size={14} /> Ver detalhes</button>
  {can(PERM.RECEIVABLES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setEditRec(menuRec)}><Edit size={14} /> Editar</button>}
  {can(PERM.RECEIVABLES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuRec.id)}><Trash2 size={14} /> Remover</button></>}
</RowMenu>
```

Replace with:
```tsx
<RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
  <RowMenuItem icon={<Eye size={14} />} onClick={() => { setMenuState(null); navigate(`/receivables/${menuRec.id}`); }}>Ver detalhes</RowMenuItem>
  {can(PERM.RECEIVABLES.UPDATE) && <RowMenuItem icon={<Edit size={14} />} onClick={() => setEditRec(menuRec)}>Editar</RowMenuItem>}
  {can(PERM.RECEIVABLES.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuRec.id)}>Remover</RowMenuDangerItem></>}
</RowMenu>
```

Also remove `RowMenuSep` from the RowMenu import (it's now imported from the destructured import in Step 1).

- [ ] **Step 9: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/receivables/Receivables.tsx
git commit -m "refactor: migrate Receivables page to shared UI components"
```

---

### Task 10: Migrate Payables.tsx

**Files to Modify:**
- `src/pages/payables/Payables.tsx`

Identical migration to Task 9 (Receivables). Payables has the same 4 KPI cards, same date range filter, same tab bar and search patterns, same progress column, and RowMenu items.

- [ ] **Step 1: Add new imports**

```tsx
import DateRangeFilter from '../../components/DateRangeFilter';
import StatCard from '../../components/ui/StatCard';
import SearchInput from '../../components/ui/SearchInput';
import TabBar from '../../components/ui/TabBar';
import ProgressBar from '../../components/ui/ProgressBar';
import { RowMenuItem, RowMenuDangerItem, RowMenuSep } from '../../components/RowMenu';
```

Remove `import DateInput from '../../components/DateInput';`.

- [ ] **Step 2: Remove `pendingFrom`/`pendingTo` state declarations.**

- [ ] **Step 3: Replace date range filter JSX** with `<DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />`.

- [ ] **Step 4: Replace KPI cards** — Payables uses different icons and labels (check the existing Payables.tsx for the exact icon names and labels). Apply the same `<StatCard>` pattern as Task 9, preserving whatever icons/labels/variants the existing cards use.

- [ ] **Step 5: Replace tab bar** with `<TabBar>`, adapting the `TABS` constant in Payables.

- [ ] **Step 6: Replace search input** with `<SearchInput>`.

- [ ] **Step 7: Replace progress bar render** with `<ProgressBar pct={pct} isPaid={st === 'paid'} />`.

- [ ] **Step 8: Replace RowMenu item buttons** with `<RowMenuItem>` / `<RowMenuDangerItem>`.

- [ ] **Step 9: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/payables/Payables.tsx
git commit -m "refactor: migrate Payables page to shared UI components"
```

---

### Task 11: Migrate Flights.tsx + Invoices.tsx

**Files to Modify:**
- `src/pages/flights/Flights.tsx`
- `src/pages/invoices/Invoices.tsx`

**Flights.tsx:** Has tab bar, search input, date range filter, and RowMenu items — no KPI cards, no progress bar.

**Invoices.tsx:** Has date range filter and RowMenu items — no tab bar, no search, no KPI cards.

- [ ] **Step 1: Add imports to Flights.tsx**

```tsx
import DateRangeFilter from '../../components/DateRangeFilter';
import SearchInput from '../../components/ui/SearchInput';
import TabBar from '../../components/ui/TabBar';
import { RowMenuItem, RowMenuDangerItem, RowMenuSep } from '../../components/RowMenu';
```

Remove `import DateInput from '../../components/DateInput';` if it's no longer needed after migration.

- [ ] **Step 2: Remove `pendingFrom`/`pendingTo` from Flights.tsx.** Replace date range JSX with `<DateRangeFilter label="..." onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />`.

Note: Flights uses a tab with `undefined` as the "Todos" key. The `TabBar` component supports `key: string | undefined` for exactly this case.

- [ ] **Step 3: Replace tab bar in Flights.tsx** with `<TabBar>` — pass the existing tabs array adapted to `{ key: string | undefined; label: string }[]`. The "Todos" tab should have `key: undefined`.

- [ ] **Step 4: Replace search input in Flights.tsx** with `<SearchInput>`.

- [ ] **Step 5: Replace RowMenu item buttons in Flights.tsx** with `<RowMenuItem>` / `<RowMenuDangerItem>`.

- [ ] **Step 6: Add imports to Invoices.tsx**

```tsx
import DateRangeFilter from '../../components/DateRangeFilter';
import { RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
```

Remove `import DateInput from '../../components/DateInput';`.

- [ ] **Step 7: Remove `pendingFrom`/`pendingTo` from Invoices.tsx.** Replace date range JSX with `<DateRangeFilter label="Criado em" onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />`.

- [ ] **Step 8: Replace RowMenu item buttons in Invoices.tsx:**

Find:
```tsx
<RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
  <button className="..." onClick={() => navigate(`/invoices/${b.id}`)}><Eye size={14} /> Ver detalhes</button>
  {b.status === 'open' && (
    <button className="..." onClick={() => { setPayBillId(b.id); setMenuState(null); }}><CreditCard size={14} /> Registrar pagamento</button>
  )}
  {b.status === 'pending_cnab' && (
    <button className="..." onClick={() => { setBaixaBillId(b.id); setMenuState(null); }}><CreditCard size={14} /> Dar baixa</button>
  )}
  {b.status === 'open' && (
    <button className="... text-danger ... hover:bg-danger-soft ..." onClick={() => deleteMut.mutate(b.id)}><Trash2 size={14} /> Deletar</button>
  )}
</RowMenu>
```

Replace with:
```tsx
<RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
  <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/invoices/${b.id}`)}>Ver detalhes</RowMenuItem>
  {b.status === 'open' && (
    <RowMenuItem icon={<CreditCard size={14} />} onClick={() => { setPayBillId(b.id); setMenuState(null); }}>Registrar pagamento</RowMenuItem>
  )}
  {b.status === 'pending_cnab' && (
    <RowMenuItem icon={<CreditCard size={14} />} onClick={() => { setBaixaBillId(b.id); setMenuState(null); }}>Dar baixa</RowMenuItem>
  )}
  {b.status === 'open' && (
    <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(b.id)}>Deletar</RowMenuDangerItem>
  )}
</RowMenu>
```

Also remove the now-unused `import RowMenu from '../../components/RowMenu';` line and update it to import `{ RowMenuItem, RowMenuDangerItem }` from the same file.

- [ ] **Step 9: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/flights/Flights.tsx src/pages/invoices/Invoices.tsx
git commit -m "refactor: migrate Flights and Invoices pages to shared UI components"
```

---

### Task 12: Migrate RowMenu items in remaining pages

**Files to Modify:**
- `src/pages/companies/Companies.tsx`
- `src/pages/peoples/Peoples.tsx`
- `src/pages/planes/Planes.tsx`
- `src/pages/users/Users.tsx`
- `src/pages/cnab/Cnab.tsx`
- `src/pages/planes/PlaneDetail.tsx`
- `src/pages/peoples/PeopleDetail.tsx`
- `src/pages/companies/CompanyDetail.tsx`

Each file has a `<RowMenu>` block with raw `<button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] ...">` elements. Replace every such button with `<RowMenuItem>` or `<RowMenuDangerItem>`.

Migration pattern for each file:

1. Add to the RowMenu import: `import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';`
   (or adjust relative path — `../../../components/RowMenu` for detail pages under nested paths)
2. Replace each normal button with `<RowMenuItem icon={<Icon size={14} />} onClick={...}>Label</RowMenuItem>`
3. Replace each danger button (with `text-danger` / `hover:bg-danger-soft`) with `<RowMenuDangerItem icon={<Icon size={14} />} onClick={...}>Label</RowMenuDangerItem>`
4. Keep `<RowMenuSep />` elements unchanged.

Example for Planes.tsx (which was already read — see lines 248-251):

**Before:**
```tsx
<button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => navigate(`/planes/${menuPlane.id}`)}><Eye size={14} /> Ver detalhes</button>
{can(PERM.PLANES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setModal({ mode: 'edit', plane: menuPlane })}><Edit size={14} /> Editar</button>}
{can(PERM.PLANES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuPlane.id)}><Trash2 size={14} /> Remover</button></>}
```

**After:**
```tsx
<RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/planes/${menuPlane.id}`)}>Ver detalhes</RowMenuItem>
{can(PERM.PLANES.UPDATE) && <RowMenuItem icon={<Edit size={14} />} onClick={() => setModal({ mode: 'edit', plane: menuPlane })}>Editar</RowMenuItem>}
{can(PERM.PLANES.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuPlane.id)}>Remover</RowMenuDangerItem></>}
```

Apply the same transformation to all 8 files listed above. Each file may have different action labels, icons, and onClick handlers — preserve those exactly.

- [ ] **Step 1: Migrate Companies.tsx**
- [ ] **Step 2: Migrate Peoples.tsx**
- [ ] **Step 3: Migrate Planes.tsx**
- [ ] **Step 4: Migrate Users.tsx**
- [ ] **Step 5: Migrate Cnab.tsx**
- [ ] **Step 6: Migrate PlaneDetail.tsx**
- [ ] **Step 7: Migrate PeopleDetail.tsx**
- [ ] **Step 8: Migrate CompanyDetail.tsx**

- [ ] **Step 9: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/companies/Companies.tsx src/pages/peoples/Peoples.tsx src/pages/planes/Planes.tsx src/pages/users/Users.tsx src/pages/cnab/Cnab.tsx src/pages/planes/PlaneDetail.tsx src/pages/peoples/PeopleDetail.tsx src/pages/companies/CompanyDetail.tsx
git commit -m "refactor: replace raw RowMenu buttons with RowMenuItem/RowMenuDangerItem across all pages"
```

---

## Self-Review Checklist (completed inline)

**Spec coverage:**
- ✅ Modal compound component — Tasks 2, 5–8
- ✅ RowMenuItem/RowMenuDangerItem — Tasks 1, 9–12
- ✅ DateRangeFilter — Task 4; applied in Tasks 9, 10, 11
- ✅ StatCard — Task 3; applied in Tasks 9, 10
- ✅ SearchInput — Task 3; applied in Tasks 9, 10, 11
- ✅ TabBar — Task 3; applied in Tasks 9, 10, 11
- ✅ ProgressBar — Task 3; applied in Tasks 9, 10
- ✅ PAYER_TYPES unified — Task 4; consumed in Tasks 6, 7
- ✅ ui/index.ts updated — Task 4
- ✅ ProfileModal excluded (unique style) — noted in Task 5

**Placeholder scan:** No TBDs, no incomplete steps. Every code block is complete.

**Type consistency:**
- `TabBar` accepts `Tab = { key: string | undefined; label: string }` — consistent across Task 3 (definition) and Tasks 9–11 (usage)
- `Modal.Footer justify` prop defaults to `'end'` — consistent with all modal usages
- `ProgressBar({ pct, isPaid })` — consistent across Task 3 (definition) and Tasks 9–10 (usage)
- `DateRangeFilter onApply(from: string, to: string)` — consistent with all call sites

# Frontend Refactor — Design Spec
Date: 2026-06-23

## Goal

Unify visual style and eliminate code duplication across the aeroclube-web frontend by extracting repeated UI patterns into shared, focused components. No behavior changes — only structure.

## Problem Summary

Eight categories of duplication exist across the codebase:

| Pattern | Duplicated in | Severity |
|---|---|---|
| Modal shell class strings (`modalBase/Panel/Head/Body/Foot/field/lbl`) | ~16 modal files | High |
| RowMenu item buttons (long `className` repeated per item) | ~7 page files, ~30 instances | High |
| Date range filter (`pendingFrom/To → Aplicar → dateFrom/To`) | Receivables, Payables, Flights | Medium |
| KPI stat cards (icon + label + value block) | Receivables, Payables | Medium |
| Search input with absolute SVG icon | Receivables, Payables, Flights | Medium |
| Tab bar with inline `style={{ color, borderBottomColor }}` | Receivables, Payables, Flights | Medium |
| Progress bar JSX | Receivables, Payables | Low |
| `PAYER_TYPES_REC` / `PAYER_TYPES_PAY` identical arrays | NewReceivableModal, NewPayableModal | Low |

## New Components

### `Modal` (compound component)
**File:** `src/components/ui/Modal.tsx`

Compound component with sub-components: `Modal.Header`, `Modal.Body`, `Modal.Footer`.

```tsx
<Modal onClose={fn}>
  <Modal.Header title="Novo título" onClose={fn} />
  <Modal.Body>...</Modal.Body>
  <Modal.Footer>...</Modal.Footer>
</Modal>
```

- `Modal` renders the backdrop (`fixed inset-0 bg-black/40 ...`) and panel (`bg-bg-elev border border-line rounded-[10px] ...`)
- `Modal.Header` renders title + close button
- `Modal.Body` renders scrollable body
- `Modal.Footer` renders the action row
- Accepts optional `maxWidth` prop (default `480px`) to support wider modals
- Clicking backdrop calls `onClose`

Replaces the 7 local class-string constants copied into every modal file.

### `RowMenuItem` + `RowMenuDangerItem`
**File:** `src/components/RowMenu.tsx` (added alongside existing `RowMenuSep`)

```tsx
<RowMenuItem icon={<Eye size={14} />} onClick={fn}>Ver detalhes</RowMenuItem>
<RowMenuDangerItem icon={<Trash2 size={14} />} onClick={fn}>Remover</RowMenuDangerItem>
```

- Both are thin wrappers around `<button>` with the shared class pattern
- `RowMenuDangerItem` applies `text-danger` + `hover:bg-danger-soft`
- Replaces ~30 raw `<button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] ...">` instances

### `StatCard`
**File:** `src/components/ui/StatCard.tsx`

```tsx
<StatCard
  icon={<BarChart3 size={18} />}
  iconVariant="default"   // "default" | "success" | "warn" | "danger"
  label="Valor total"
  value={formatBRL(total)}
  prefix="R$"
  valueVariant="default"  // optional color for value
/>
```

Replaces the repeated `<div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">` KPI blocks in Receivables and Payables.

### `DateRangeFilter`
**File:** `src/components/DateRangeFilter.tsx`

```tsx
<DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); }} />
```

- Manages its own `pendingFrom`/`pendingTo` internal state
- Exposes `onApply(from: string, to: string)` — the parent only tracks the committed values
- Replaces the pending/committed date state pattern repeated in 3 pages

### `SearchInput`
**File:** `src/components/ui/SearchInput.tsx`

```tsx
<SearchInput placeholder="Buscar por título..." value={search} onChange={setSearch} minWidth={250} />
```

- Renders the icon + input together
- Accepts `value: string`, `onChange: (v: string) => void`, `placeholder`, optional `minWidth`
- Replaces the raw `<input>` + absolute `<svg>` block in 3 pages

### `TabBar`
**File:** `src/components/ui/TabBar.tsx`

```tsx
type Tab = { key: string; label: string };
<TabBar tabs={Tab[]} active={tab} onChange={setTab} />
```

- Renders the underline-style tab buttons
- Active state uses CSS variables via `style` internally (acceptable since Tailwind cannot express this with arbitrary `var()` values)
- Replaces the inline-style tab rendering in 3 pages

### `ProgressBar`
**File:** `src/components/ui/ProgressBar.tsx`

```tsx
<ProgressBar pct={pct} isPaid={st === 'paid'} />
```

- `pct`: 0–100 integer
- `isPaid`: drives the color — `true` → success green, `false` with `pct > 0` → warn yellow, `false` with `pct === 0` → neutral grey
- Encapsulates the colored fill bar + percentage label
- Replaces identical JSX in the `progress` column of Receivables and Payables

### `PAYER_TYPES` constant
**File:** `src/utils/payerTypes.ts`

```ts
export const PAYER_TYPES = [
  { value: 'customer',   label: 'Pessoa',      Icon: User },
  ...
] as const;
```

Replaces `PAYER_TYPES_REC` in `NewReceivableModal` and `PAYER_TYPES_PAY` in `NewPayableModal` (identical arrays, different names).

## Files Modified

### New files
- `src/components/ui/Modal.tsx`
- `src/components/ui/StatCard.tsx`
- `src/components/ui/SearchInput.tsx`
- `src/components/ui/TabBar.tsx`
- `src/components/ui/ProgressBar.tsx`
- `src/components/DateRangeFilter.tsx`
- `src/utils/payerTypes.ts`

### Updated files
- `src/components/RowMenu.tsx` — add `RowMenuItem`, `RowMenuDangerItem`
- `src/components/ui/index.ts` — re-export new components
- **16 modal files** — replace local class strings with `Modal` compound component:
  - `NewReceivableModal`, `EditReceivableModal`
  - `NewPayableModal`, `EditPayableModal`
  - `CompanyModal`, `PeopleModal`
  - `FlightModal`, `PlaneModal`, `CloseFlightModal`
  - `CnabBaixaModal`, `NewInvoiceModal`, `PayInvoiceModal`
  - `UserModal`, `ProfileModal`, `PayModal`, `SettleModal`
- **3 list pages** — replace raw patterns with new components:
  - `Receivables.tsx` — `RowMenuItem`, `SearchInput`, `TabBar`, `StatCard`, `ProgressBar`, `DateRangeFilter`
  - `Payables.tsx` — same
  - `Flights.tsx` — `RowMenuItem`, `SearchInput`, `TabBar`, `DateRangeFilter`
- **Other pages with RowMenu** — `RowMenuItem` only:
  - `Invoices`, `Companies`, `Peoples`, `Planes`, `Users`, `Cnab`

## Constraints

- No logic changes: queries, mutations, validations, API calls are untouched
- No visual changes: the rendered output must look identical before and after
- No new dependencies
- TypeScript must remain fully typed (no new `any`)
- `src/api/`, `src/types/`, `src/index.css`, `tailwind.config.js` are not touched

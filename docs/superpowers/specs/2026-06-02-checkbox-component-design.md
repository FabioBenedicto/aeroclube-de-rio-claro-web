# Design: Componente Checkbox com suporte ao tema escuro

**Data:** 2026-06-02  
**Contexto:** Substituir os 42 `<input type="checkbox">` espalhados em 13 arquivos por um componente centralizado que respeita o tema escuro.

---

## 1. Novo componente — `src/components/ui/Checkbox.tsx`

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

**Como funciona:**
- O `<input>` real é transparente (`opacity-0`) mas cobre toda a área — clique e eventos nativos funcionam normalmente
- O `<span>` visual tem `pointer-events-none` — cliques passam para o input
- `peer-checked:` controla fundo e borda via CSS
- `checked` prop controla a visibilidade do ícone Check via JS (todos os checkboxes existentes são controlados)
- Todos os props do input nativo passam via `{...props}` — `onClick`, `onChange`, `disabled`, etc.

---

## 2. Regra de substituição (aplicar em todos os 13 arquivos)

**Substituir:**
```tsx
<input type="checkbox" className="..." checked={x} onChange={y} ... />
```

**Por:**
```tsx
<Checkbox checked={x} onChange={y} ... />
```

**Regras:**
- Remover `className="w-4 h-4 accent-[var(--accent)]"` — componente já define tamanho e cor
- Remover `className="cursor-pointer"` — componente já define cursor
- Remover `className="accent-[var(--accent)]"` — componente já define cor
- Manter todos os outros props: `onClick`, `onChange`, `disabled`, `checked`
- Adicionar import:
  - Arquivos em `src/pages/**`: `import Checkbox from '../../components/ui/Checkbox';`
  - Arquivos em `src/components/`: `import Checkbox from './ui/Checkbox';`

---

## 3. Arquivos a atualizar (42 ocorrências)

| Arquivo | Linhas | Obs |
|---------|--------|-----|
| `src/pages/cnab/Cnab.tsx` | 151, 178 | tem `className="cursor-pointer"` a remover |
| `src/pages/customers/CustomerDetail.tsx` | 288, 382, 788, 799, 831, 836, 870, 875, 949, 954 | linha 288 tem `className="w-4 h-4 accent-[var(--accent)]"` a remover |
| `src/pages/companies/CompanyDetail.tsx` | 550, 561, 599, 608 | sem className |
| `src/pages/customers/Customers.tsx` | 167, 178 | sem className |
| `src/pages/companies/Companies.tsx` | 177, 188 | sem className |
| `src/pages/flights/Flights.tsx` | 176, 195 | sem className |
| `src/components/SettleModal.tsx` | 61 | tem `className="w-4 h-4 accent-[var(--accent)]"` a remover |
| `src/pages/payables/Payables.tsx` | 323, 339 | sem className |
| `src/pages/planes/Planes.tsx` | 141, 152 | sem className |
| `src/pages/receivables/Receivables.tsx` | 368, 387 | sem className |
| `src/pages/users/UserModal.tsx` | 142, 153 | tem `className="accent-[var(--accent)]"` a remover |
| `src/pages/reports/Reports.tsx` | 488, 499, 515, 581, 593 | sem className |
| `src/pages/invoices/Invoices.tsx` | 114, 252, 265 | sem className |

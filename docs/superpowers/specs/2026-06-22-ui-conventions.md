# UI Conventions

## Tables in detail pages

Tables inside detail pages (e.g. `PlaneDetail`, `PersonDetail`) must use the same `Table` component and have the exact same column set as the corresponding standalone list page, with these exceptions:

- **Checkbox** column is omitted (no bulk actions in detail pages).
- Context-redundant columns may be omitted if they add no information (e.g. the Aeronave column on a flight table could be omitted if only one aircraft's flights are ever shown, but only by deliberate decision — default is to keep it).

### Column alignment

| Column type | Header | Cell |
|---|---|---|
| Numeric (value, hours) | `text-right` | `text-right font-mono` |
| Date / code | — | `font-mono text-[12px]` |
| ID | — | `font-mono text-[11.5px]` |
| Text | — | — |

### Row menu actions

Detail page row menus must mirror the standalone page menus. At minimum:

- **Ver detalhes** — navigates to the entity's detail page.
- **Editar** — opens the edit modal.
- Separator (`RowMenuSep`)
- **Remover** — calls the delete mutation (danger style).

### Progress column (receivables / payables)

Both receivable and payable tables include a **Progresso** column (progress bar + %) identical to the standalone pages.

### References

- `Table` component: `src/components/ui/Table.tsx`
- Standalone pages: `src/pages/flights/Flights.tsx`, `src/pages/receivables/Receivables.tsx`, `src/pages/payables/Payables.tsx`
- Example detail page: `src/pages/planes/PlaneDetail.tsx`

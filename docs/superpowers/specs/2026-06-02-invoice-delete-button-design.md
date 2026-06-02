# Design: Botão Deletar nas Faturas

**Data:** 2026-06-02  
**Contexto:** O botão "Estornar" do menu de faturas deve ser renomeado para "Deletar" e exibido somente quando a fatura estiver com status `open`.

---

## Alteração

**Arquivo:** `src/pages/invoices/Invoices.tsx`

No `RowMenu` de cada linha da tabela, substituir o botão "Estornar" por:

```tsx
{b.status === 'open' && (
  <button
    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left"
    onClick={() => deleteMut.mutate(b.id)}
  >
    <Trash2 size={14} /> Deletar
  </button>
)}
```

**Regras:**
- O botão é **ocultado** (não renderizado) quando `b.status !== 'open'`
- O label muda de "Estornar" para "Deletar"
- A ação e o handler (`deleteMut.mutate(b.id)`) permanecem inalterados
- O botão de exclusão em massa ("Remover selecionados") não é alterado

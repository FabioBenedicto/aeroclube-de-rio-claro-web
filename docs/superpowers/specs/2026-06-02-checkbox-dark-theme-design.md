# Design: Checkboxes com suporte ao tema escuro

**Data:** 2026-06-02  
**Contexto:** Os checkboxes do app usam o visual padrão do browser, que não se adapta ao tema escuro. A solução é uma regra CSS global em `src/index.css` usando as variáveis de tema já existentes.

---

## Alteração

**Arquivo:** `src/index.css`

Adicionar após o bloco de estilos do date picker (antes do bloco `.toast`):

```css
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  border: 1.5px solid var(--line-strong);
  background-color: var(--bg-elev);
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.1s, border-color 0.1s;
}

input[type="checkbox"]:checked {
  background-color: var(--accent);
  border-color: var(--accent);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 10 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4L3.5 6.5L9 1' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-size: 10px 8px;
  background-position: center;
  background-repeat: no-repeat;
}

input[type="checkbox"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus);
}

input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Variáveis utilizadas** (já existem, alternam automaticamente com `data-theme="dark"`):
- `--bg-elev` — fundo do checkbox
- `--line-strong` — borda no estado desmarcado
- `--accent` — cor de preenchimento quando marcado
- `--focus` — anel de foco (consistente com outros inputs)

**Escopo:** aplica-se a todos os `input[type="checkbox"]` do app sem nenhuma alteração nos componentes existentes.

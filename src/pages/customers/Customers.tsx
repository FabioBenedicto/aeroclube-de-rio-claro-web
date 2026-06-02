import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customers';
import type { Customer } from '../../types';
import CustomerModal from './CustomerModal';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import Chip from '../../components/ui/Chip';
import { cn } from '../../utils/cn';
import { toast, extractErrorMessage } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';

type MenuState = { id: number; top: number; right: number };

export default function Customers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; customer?: Customer } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, catFilter, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', debouncedSearch, catFilter, dateFrom, dateTo, page],
    queryFn: () => getCustomers(debouncedSearch || undefined, catFilter === 'all' ? undefined : catFilter, page, 20, dateFrom || undefined, dateTo || undefined),
  });

  const customers = data?.data ?? [];

  const deleteMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteCustomer(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuCustomer = menuState ? customers.find(c => c.id === menuState.id) ?? null : null;

  const allIds = customers.map(x => x.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function handleSave(d: unknown, id?: number) {
    if (id) {
      updateCustomer(id, d).then(() => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
    } else {
      createCustomer(d).then(() => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
    }
  }

  const CATS = [
    { key: 'all', label: 'Todos' },
    { key: 'aluno', label: 'Alunos' },
    { key: 'socio', label: 'Sócios' },
    { key: 'instrutor', label: 'Instrutores' },
    { key: 'funcionario', label: 'Funcionários' },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Pessoas</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Alunos, sócios, instrutores e funcionários cadastrados</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
{can(PERM.CUSTOMERS.CREATE) && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90"
              onClick={() => setModal({ mode: 'new' })}
            >
              <Plus size={14} /> Nova pessoa
            </button>
          )}
        </div>
      </div>

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Criação</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</button>
      </div>

<div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="flex flex-1 min-w-0">
            {CATS.map(cat => (
              <button
                key={cat.key}
                className={cn(
                  'px-3.5 py-2 text-[13px] font-medium cursor-pointer border-b-2 -mb-[11px] pb-[10px] bg-transparent border-0 border-b-2 whitespace-nowrap',
                  catFilter === cat.key
                    ? 'text-ink border-b-accent'
                    : 'text-ink-3 border-transparent hover:text-ink'
                )}
                style={{ borderBottomColor: catFilter === cat.key ? 'var(--accent)' : 'transparent' }}
                onClick={() => setCatFilter(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[260px]"
              placeholder="Buscar por nome, CPF ou e-mail"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-[13px] text-ink-3">Carregando…</div>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
                <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
                <span className="flex-1" />
                {can(PERM.CUSTOMERS.DELETE) && (
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-danger border border-danger text-white cursor-pointer hover:opacity-90" onClick={() => bulkDeleteMut.mutate([...selected])}>
                    <Trash2 size={14} /> Remover selecionados
                  </button>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line w-9"><Checkbox checked={allSelected} onChange={toggleAll} /></th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Nome</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">CPF</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Categorias</th>
                    <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">E-mail</th>
                    <th className="px-3.5 py-2.5 bg-bg border-b border-line w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="cursor-pointer hover:bg-bg-hover" onClick={() => navigate(`/pessoas/${c.id}`)}>
                      <td className="px-3.5 py-2.5 border-b border-line w-9" onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} /></td>
                      <td className="px-3.5 py-2.5 border-b border-line font-medium text-ink">{c.name}</td>
                      <td className="px-3.5 py-2.5 border-b border-line font-mono text-[12px]">{c.cpf}</td>
                      <td className="px-3.5 py-2.5 border-b border-line">
                        <div className="flex gap-1 flex-wrap">
                          {c.categories.map(cat => (
                            <Chip key={cat} variant={cat as 'aluno' | 'socio' | 'instrutor' | 'funcionario'}>
                              {{ aluno: 'aluno', socio: 'sócio', instrutor: 'instrutor', funcionario: 'funcionário' }[cat] ?? cat}
                            </Chip>
                          ))}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 border-b border-line text-ink-3">{c.email}</td>
                      <td className="px-3.5 py-2.5 border-b border-line w-10" onClick={e => e.stopPropagation()}>
                        <button
                          className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
                          onClick={e => {
                            e.stopPropagation();
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenuState(s => s?.id === c.id ? null : { id: c.id, top: r.bottom + 4, right: window.innerWidth - r.right });
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr><td colSpan={6} className="px-3.5 py-8 text-center text-ink-3">Nenhuma pessoa encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
          </>
        )}
      </div>

      </div>

      {menuState && menuCustomer && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => navigate(`/pessoas/${menuCustomer.id}`)}><Eye size={14} /> Ver detalhes</button>
          {can(PERM.CUSTOMERS.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setModal({ mode: 'edit', customer: menuCustomer })}><Edit size={14} /> Editar</button>}
          {can(PERM.CUSTOMERS.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuCustomer.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {modal && (
        <CustomerModal
          mode={modal.mode}
          customer={modal.customer}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

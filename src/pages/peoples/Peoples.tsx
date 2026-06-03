import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { getPeoples, createPerson, updatePerson, deletePerson } from '../../api/peoples';
import type { Person } from '../../types';
import PersonModal from './PersonModal';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import Chip from '../../components/ui/Chip';
import { cn } from '../../utils/cn';
import { toast, extractErrorMessage } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

type MenuState = { id: number; top: number; right: number };

export default function Peoples() {
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
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; person?: Person } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, catFilter, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['peoples', debouncedSearch, catFilter, dateFrom, dateTo, page],
    queryFn: () => getPeoples(debouncedSearch || undefined, catFilter === 'all' ? undefined : catFilter, page, 20, dateFrom || undefined, dateTo || undefined),
  });

  const peoples = data?.data ?? [];

  const deleteMut = useMutation({
    mutationFn: deletePerson,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['peoples'] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deletePerson(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['peoples'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuPerson = menuState ? peoples.find(c => c.id === menuState.id) ?? null : null;

  const allIds = peoples.map(x => x.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function handleSave(d: unknown, id?: number) {
    if (id) {
      updatePerson(id, d).then(() => { qc.invalidateQueries({ queryKey: ['peoples'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
    } else {
      createPerson(d).then(() => { qc.invalidateQueries({ queryKey: ['peoples'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
    }
  }

  const CATS = [
    { key: 'all', label: 'Todos' },
    { key: 'student', label: 'Alunos' },
    { key: 'partner', label: 'Sócios' },
    { key: 'instructor', label: 'Instrutores' },
    { key: 'employee', label: 'Funcionários' },
  ] as const;

  const columns: TableColumn<Person>[] = [
    {
      key: 'checkbox',
      label: '',
      headerClassName: 'w-9',
      cellClassName: 'w-9',
      stopPropagation: true,
      render: row => <Checkbox checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />,
    },
    {
      key: 'id',
      label: 'ID',
      render: row => <span className="font-mono text-[11.5px]">{row.id}</span>,
    },
    {
      key: 'name',
      label: 'Nome',
      render: row => <span className="font-medium text-ink">{row.name}</span>,
    },
    {
      key: 'cpf',
      label: 'CPF',
      render: row => <span className="font-mono text-[12px]">{row.cpf}</span>,
    },
    {
      key: 'categories',
      label: 'Categorias',
      render: row => (
        <div className="flex gap-1 flex-wrap">
          {row.categories.map(cat => (
            <Chip key={cat} variant={cat as 'student' | 'partner' | 'instructor' | 'employee'}>
              {{ student: 'aluno', partner: 'sócio', instructor: 'instrutor', employee: 'funcionário' }[cat] ?? cat}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'E-mail',
      render: row => <span className="text-ink-3">{row.email}</span>,
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-10',
      cellClassName: 'w-10',
      stopPropagation: true,
      render: row => (
        <Button variant="icon" onClick={e => {
          e.stopPropagation();
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuState(s => s?.id === row.id ? null : { id: row.id, top: r.bottom + 4, right: window.innerWidth - r.right });
        }}>
          <MoreHorizontal size={15} />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pessoas"
        description="Alunos, sócios, instrutores e funcionários cadastrados"
        action={can(PERM.CUSTOMERS.CREATE) ? (
          <Button variant="primary" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={14} /> Nova pessoa
          </Button>
        ) : undefined}
      />

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
        <Button variant="primary" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</Button>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="flex flex-1 min-w-0">
            <div className="px-3.5 py-2 flex items-center">
              <Checkbox checked={allSelected} onChange={toggleAll} />
            </div>
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

        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
            <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <span className="flex-1" />
            {can(PERM.CUSTOMERS.DELETE) && (
              <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
                <Trash2 size={14} /> Remover selecionados
              </Button>
            )}
          </div>
        )}

        <Table
          columns={columns}
          data={peoples}
          keyField="id"
          onRowClick={p => navigate(`/peoples/${p.id}`)}
          emptyMessage="Nenhuma pessoa encontrada."
          isLoading={isLoading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
      </div>

      </div>

      {menuState && menuPerson && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => navigate(`/peoples/${menuPerson.id}`)}><Eye size={14} /> Ver detalhes</button>
          {can(PERM.CUSTOMERS.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => setModal({ mode: 'edit', person: menuPerson })}><Edit size={14} /> Editar</button>}
          {can(PERM.CUSTOMERS.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuPerson.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {modal && (
        <PersonModal
          mode={modal.mode}
          person={modal.person}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { getPeoples, createPeople, updatePeople, deletePeople, bulkDeletePeoples } from '../../api/peoples';
import type { People, PeopleCategory } from '../../types';
import PeopleModal from './PeopleModal';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import Chip from '../../components/ui/Chip';
import { cn } from '../../utils/cn';
import { toast, extractErrorMessage } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/DateRangeFilter';
import SearchInput from '../../components/ui/SearchInput';

type MenuState = { id: number; top: number; right: number };

export default function Peoples() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; people?: People } | null>(null);
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
    mutationFn: deletePeople,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['peoples'] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => bulkDeletePeoples(ids),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['peoples'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuPeople = menuState ? peoples.find(c => c.id === menuState.id) ?? null : null;

  const allIds = peoples.map(x => x.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function handleSave(d: unknown, id?: number) {
    if (id) {
      updatePeople(id, d).then(() => { qc.invalidateQueries({ queryKey: ['peoples'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
    } else {
      createPeople(d).then(() => { qc.invalidateQueries({ queryKey: ['peoples'] }); setModal(null); }).catch((e: unknown) => toast.error(extractErrorMessage(e)));
    }
  }

  const CATS = [
    { key: 'all', label: 'Todos' },
    { key: 'student', label: 'Alunos' },
    { key: 'partner', label: 'Sócios' },
    { key: 'instructor', label: 'Instrutores' },
    { key: 'employee', label: 'Funcionários' },
  ] as const;

  const columns: TableColumn<People>[] = [
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
            <Chip key={cat} variant={cat}>
              {({ student: 'aluno', partner: 'sócio', instructor: 'instrutor', employee: 'funcionário' } satisfies Record<PeopleCategory, string>)[cat]}
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
        action={can(PERMISSIONS.CUSTOMERS.CREATE) ? (
          <Button variant="primary" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={14} /> Nova pessoa
          </Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-6">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />

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
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, CPF ou e-mail" minWidth={260} />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
              <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
              <span className="flex-1" />
              {can(PERMISSIONS.CUSTOMERS.DELETE) && (
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

      {menuState && menuPeople && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/peoples/${menuPeople.id}`)}>Ver detalhes</RowMenuItem>
          {can(PERMISSIONS.CUSTOMERS.UPDATE) && <RowMenuItem icon={<Edit size={14} />} onClick={() => setModal({ mode: 'edit', people: menuPeople })}>Editar</RowMenuItem>}
          {can(PERMISSIONS.CUSTOMERS.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuPeople.id)}>Remover</RowMenuDangerItem></>}
        </RowMenu>
      )}

      {modal && (
        <PeopleModal
          mode={modal.mode}
          people={modal.people}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Eye, Trash2, Edit } from 'lucide-react';
import DateInput from '../../components/DateInput';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../../api/companies';
import type { Company } from '../../types';
import RowMenu, { RowMenuSep } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERM } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import { CompanyModal } from './CompanyModal';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

type MenuState = { id: number; top: number; right: number };

export default function Companies() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingFrom, setPendingFrom] = useState('');
  const [pendingTo, setPendingTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, dateFrom, dateTo]);
  const [modal, setModal] = useState<'new' | Company | null>(null);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['companies', debouncedSearch, dateFrom, dateTo, page],
    queryFn: () => getCompanies(debouncedSearch || undefined, page, 20, dateFrom || undefined, dateTo || undefined),
  });
  const companies = data?.data ?? [];

  const createMut = useMutation({
    mutationFn: createCompany,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setModal(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => updateCompany(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setModal(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const deleteMut = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setMenuState(null); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });
  const bulkDeleteMut = useMutation({
    mutationFn: (ids: number[]) => Promise.all(ids.map(id => deleteCompany(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['companies'] }); setSelected(new Set()); },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuCompany = menuState ? companies.find(c => c.id === menuState.id) ?? null : null;
  const allIds = companies.map(x => x.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));
  const toggleOne = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const columns: TableColumn<Company>[] = [
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
      key: 'cnpj',
      label: 'CNPJ',
      render: row => <span className="font-mono text-[12px]">{row.cnpj ?? '—'}</span>,
    },
    {
      key: 'email',
      label: 'E-mail',
      render: row => row.email ?? '—',
    },
    {
      key: 'phone',
      label: 'Telefone',
      render: row => row.phone ?? '—',
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
        title="Empresas"
        description="Fornecedores e parceiros associados a títulos"
        action={can(PERM.COMPANIES.CREATE) ? (
          <Button variant="primary" onClick={() => setModal('new')}>
            <Plus size={14} /> Nova empresa
          </Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">Criação</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">de</span>
          <DateInput value={pendingFrom} onChange={setPendingFrom} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-ink-2 whitespace-nowrap">até</span>
          <DateInput value={pendingTo} onChange={setPendingTo} />
        </div>
        <Button variant="primary" onClick={() => { setDateFrom(pendingFrom); setDateTo(pendingTo); setPage(1); }}>Aplicar</Button>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
          <div className="px-3.5 py-2 flex items-center">
            <Checkbox checked={allSelected} onChange={toggleAll} />
          </div>
          <div className="flex-1" />
          <div className="relative flex items-center">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input className="pl-[30px] pr-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-[13px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] min-w-[280px]" placeholder="Buscar por nome, CNPJ ou e-mail" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
            <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <span className="flex-1" />
            {can(PERM.COMPANIES.DELETE) && (
              <Button variant="danger" onClick={() => bulkDeleteMut.mutate([...selected])}>
                <Trash2 size={14} /> Remover selecionados
              </Button>
            )}
          </div>
        )}

        <Table
          columns={columns}
          data={companies}
          keyField="id"
          onRowClick={c => navigate(`/companies/${c.id}`)}
          emptyMessage="Nenhuma empresa encontrada."
          isLoading={isLoading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={20} onChange={setPage} />
      </div>

      </div>

      {menuState && menuCompany && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => navigate(`/companies/${menuCompany.id}`)}><Eye size={14} /> Ver detalhes</button>
          {can(PERM.COMPANIES.UPDATE) && <button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-ink rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-bg-hover text-left" onClick={() => { setMenuState(null); setModal(menuCompany); }}><Edit size={14} /> Editar</button>}
          {can(PERM.COMPANIES.DELETE) && <><RowMenuSep /><button className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-danger rounded-[5px] cursor-pointer bg-transparent border-0 hover:bg-danger-soft text-left" onClick={() => deleteMut.mutate(menuCompany.id)}><Trash2 size={14} /> Remover</button></>}
        </RowMenu>
      )}

      {modal === 'new' && <CompanyModal onClose={() => setModal(null)} onSave={d => createMut.mutate(d)} />}
      {modal && modal !== 'new' && <CompanyModal company={modal as Company} onClose={() => setModal(null)} onSave={d => updateMut.mutate({ id: (modal as Company).id, data: d })} />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Eye, Trash2, Edit } from 'lucide-react';
import { getCompanies, createCompany, updateCompany, deleteCompany, bulkDeleteCompanies } from '../../api/companies';
import type { Company } from '../../types';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { toast, extractErrorMessage } from '../../utils/toast';
import Checkbox from '../../components/ui/Checkbox';
import { CompanyModal } from './CompanyModal';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/DateRangeFilter';
import SearchInput from '../../components/ui/SearchInput';

type MenuState = { id: number; top: number; right: number };

export default function Companies() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    mutationFn: (ids: number[]) => bulkDeleteCompanies(ids),
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
        action={can(PERMISSIONS.COMPANIES.CREATE) ? (
          <Button variant="primary" onClick={() => setModal('new')}>
            <Plus size={14} /> Nova empresa
          </Button>
        ) : undefined}
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-wrap">
            <div className="px-3.5 py-2 flex items-center">
              <Checkbox checked={allSelected} onChange={toggleAll} />
            </div>
            <div className="flex-1" />
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, CNPJ ou e-mail" minWidth={280} />
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-accent-soft border-b border-line">
              <span className="text-[13px] font-medium text-accent-ink">{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
              <span className="flex-1" />
              {can(PERMISSIONS.COMPANIES.DELETE) && (
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
          <RowMenuItem icon={<Eye size={14} />} onClick={() => navigate(`/companies/${menuCompany.id}`)}>Ver detalhes</RowMenuItem>
          {can(PERMISSIONS.COMPANIES.UPDATE) && <RowMenuItem icon={<Edit size={14} />} onClick={() => { setMenuState(null); setModal(menuCompany); }}>Editar</RowMenuItem>}
          {can(PERMISSIONS.COMPANIES.DELETE) && <><RowMenuSep /><RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuCompany.id)}>Remover</RowMenuDangerItem></>}
        </RowMenu>
      )}

      {modal === 'new' && <CompanyModal onClose={() => setModal(null)} onSave={d => createMut.mutate(d)} />}
      {modal && modal !== 'new' && <CompanyModal company={modal as Company} onClose={() => setModal(null)} onSave={d => updateMut.mutate({ id: (modal as Company).id, data: d })} />}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { getUsers, deleteUser } from '../../api/users';
import type { UserRecord } from '../../api/users';
import RowMenu, { RowMenuSep, RowMenuItem, RowMenuDangerItem } from '../../components/RowMenu';
import UserModal from './UserModal';
import Pagination from '../../components/Pagination';
import Badge from '../../components/ui/Badge';
import { USER_ROLE_LABEL, USER_ROLE_BADGE } from '../../utils/format';
import { toast, extractErrorMessage } from '../../utils/toast';
import Table, { type TableColumn } from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/DateRangeFilter';
import SearchInput from '../../components/ui/SearchInput';
import TabBar, { type Tab } from '../../components/ui/TabBar';
import { useAuth } from '../../contexts/AuthContext';

type MenuState = { id: number; top: number; right: number };
type RoleFilter = 'ADMIN' | 'USER' | undefined;

const PAGE_SIZE = 20;

const ROLE_TABS: Tab[] = [
  { key: undefined, label: 'Todos' },
  { key: 'ADMIN', label: 'Administradores' },
  { key: 'USER', label: 'Usuários' },
];

export default function Users() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; user?: UserRecord } | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, dateFrom, dateTo]);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, debouncedSearch, roleFilter, dateFrom, dateTo],
    queryFn: () => getUsers({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      role: roleFilter,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  const menuUser = menuState ? rows.find((u) => u.id === menuState.id) ?? null : null;

  const columns: TableColumn<UserRecord>[] = [
    {
      key: 'id',
      label: 'ID',
      render: row => <span className="font-mono text-[11.5px]">{row.id}</span>,
    },
    {
      key: 'name',
      label: 'Nome',
      render: row => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'email',
      label: 'E-mail',
      render: row => <span className="text-ink-2">{row.email}</span>,
    },
    {
      key: 'role',
      label: 'Papel',
      render: row => (
        <Badge variant={USER_ROLE_BADGE[row.role]}>
          {USER_ROLE_LABEL[row.role]}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: row => <span className="text-ink-3">{new Date(row.created_at).toLocaleDateString('pt-BR')}</span>,
    },
    {
      key: 'updated_at',
      label: 'Atualizado em',
      render: row => <span className="text-ink-3">{new Date(row.updated_at).toLocaleDateString('pt-BR')}</span>,
    },
    {
      key: 'actions',
      label: '',
      headerClassName: 'w-10',
      cellClassName: 'w-10',
      stopPropagation: true,
      render: row => (row.role !== 'ADMIN' && row.id !== me?.id) ? (
        <Button variant="icon" onClick={e => {
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setMenuState(s => s?.id === row.id ? null : { id: row.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
        }}>
          <MoreHorizontal size={15} />
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Usuários"
        description="Contas de acesso ao sistema"
        action={
          <Button variant="primary" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={14} /> Novo usuário
          </Button>
        }
      />

      <div className="bg-bg-sunk border border-line rounded-xl p-5 flex flex-col gap-4">
        <DateRangeFilter label="Criação" onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1); }} />

        <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
          <div className="flex items-center border-b border-line">
            <div className="flex items-center px-1 flex-1">
              <TabBar tabs={ROLE_TABS} active={roleFilter} onChange={(k) => setRoleFilter(k as RoleFilter)} />
            </div>
            <div className="px-3 py-2.5">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou e-mail" minWidth={260} />
            </div>
          </div>

          <Table
            columns={columns}
            data={rows}
            keyField="id"
            emptyMessage="Nenhum usuário encontrado."
            isLoading={isLoading}
          />
          <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>

      {menuState && menuUser && menuUser.role !== 'ADMIN' && (
        <RowMenu top={menuState.top} right={menuState.right} onClose={() => setMenuState(null)}>
          <RowMenuItem icon={<Edit size={14} />} onClick={() => setModal({ mode: 'edit', user: menuUser })}>Editar</RowMenuItem>
          <RowMenuSep />
          <RowMenuDangerItem icon={<Trash2 size={14} />} onClick={() => deleteMut.mutate(menuUser.id)}>Excluir</RowMenuDangerItem>
        </RowMenu>
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['users'] }); setModal(null); }}
        />
      )}
    </div>
  );
}

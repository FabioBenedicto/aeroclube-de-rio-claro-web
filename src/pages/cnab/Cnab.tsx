import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import SelectionModal from '../../components/ui/SelectionModal';
import {
  getBillsPending,
  generateRemessa,
  downloadRemessa,
  deleteRemessa,
  getRemessas,
} from '../../api/cnab';
import { useNavigate } from 'react-router-dom';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import Checkbox from '../../components/ui/Checkbox';
import Badge from '../../components/ui/Badge';
import { toast, extractErrorMessage } from '../../utils/toast';
import type { Bill, CnabRemessa } from '../../types';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line text-[13px]';

const menuItem = 'flex items-center gap-2 px-3 py-[7px] text-[13px] text-ink hover:bg-bg-hover cursor-pointer w-full text-left border-0 bg-transparent disabled:opacity-40';
const menuDanger = 'flex items-center gap-2 px-3 py-[7px] text-[13px] text-danger hover:bg-bg-hover cursor-pointer w-full text-left border-0 bg-transparent disabled:opacity-40';

function RemessaRowMenu({ onDownload, onDelete, deletePending }: {
  onDownload: () => void;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.right - 160 });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] border-0 bg-transparent text-ink-3 cursor-pointer hover:bg-bg-hover hover:text-ink"
        onClick={openMenu}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-bg-elev border border-line rounded-lg shadow-lg py-1 min-w-[160px]"
        >
          <button className={menuItem} onClick={() => { onDownload(); setOpen(false); }}>
            <Download size={13} className="text-ink-3 shrink-0" />
            Baixar
          </button>
          <div className="border-t border-line my-1" />
          <button className={menuDanger} disabled={deletePending} onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 size={13} className="shrink-0" />
            Deletar
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}


function GerarRemessaModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['bills-pending-modal', page, appliedFrom, appliedTo],
    queryFn: () => getBillsPending(page, 20, appliedFrom || undefined, appliedTo || undefined),
  });
  const bills: Bill[] = billsData?.data ?? [];

  const remessaMut = useMutation({
    mutationFn: async (ids: number[]) => {
      const remessa = await generateRemessa(ids);
      const blob = await downloadRemessa(remessa.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remessa_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.rem`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return remessa;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cnab-remessas'] });
      qc.invalidateQueries({ queryKey: ['bills-pending-modal'] });
      toast.success('Remessa gerada com sucesso');
      onSuccess();
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const allSelected = bills.length > 0 && bills.every(b => selected.has(b.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(bills.map(b => b.id)));
  }

  function toggleOne(id: number) {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const selectedBills = bills.filter(b => selected.has(b.id));
  const selectedTotal = selectedBills.reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <SelectionModal
      title="Gerar Remessa CNAB"
      onClose={onClose}
      maxWidth={680}
      filters={
        <>
          <DateInput value={dueFrom} onChange={setDueFrom} className="w-[120px]" />
          <span className="text-[12px] text-ink-3">até</span>
          <DateInput value={dueTo} onChange={setDueTo} className="w-[120px]" />
          <Button
            variant="default"
            onClick={() => { setAppliedFrom(dueFrom); setAppliedTo(dueTo); setPage(1); setSelected(new Set()); }}
          >
            Filtrar
          </Button>
        </>
      }
      footer={
        <>
          <span className="text-[13px] text-ink-3">
            {selected.size > 0
              ? `${selected.size} fatura(s) · R$ ${formatBRL(selectedTotal)}`
              : 'Nenhuma selecionada'}
          </span>
          <div className="flex gap-2">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={selected.size === 0 || remessaMut.isPending}
              onClick={() => remessaMut.mutate(Array.from(selected))}
            >
              <Download size={14} />
              {remessaMut.isPending ? 'Gerando…' : 'Gerar e Baixar'}
            </Button>
          </div>
        </>
      }
      pagination={
        billsData && billsData.totalPages > 1
          ? (
            <Pagination
              page={page}
              totalPages={billsData.totalPages}
              total={billsData.total}
              limit={20}
              onChange={p => { setPage(p); setSelected(new Set()); }}
            />
          )
          : undefined
      }
    >
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className={thCls + ' w-9'}><Checkbox checked={allSelected} onChange={toggleAll} /></th>
            <th className={thCls}>ID</th>
            <th className={thCls}>Cliente</th>
            <th className={thNumCls}>Valor</th>
            <th className={thCls}>Vencimento</th>
            <th className={thCls}>Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <Skeleton.TableRows cols={6} rows={5} />
          ) : bills.length === 0 ? (
            <tr><td colSpan={6} className="px-3.5 py-8 text-center text-ink-3">Nenhuma fatura em aberto</td></tr>
          ) : bills.map(bill => (
            <tr
              key={bill.id}
              className={`border-b border-line hover:bg-bg-hover cursor-pointer${selected.has(bill.id) ? ' bg-accent/5' : ''}`}
              onClick={() => toggleOne(bill.id)}
            >
              <td className={tdCls + ' w-9'}>
                <Checkbox checked={selected.has(bill.id)} onChange={() => toggleOne(bill.id)} onClick={e => e.stopPropagation()} />
              </td>
              <td className={tdCls + ' font-mono text-ink-3'}>#{bill.id}</td>
              <td className={tdCls}>{bill.customer?.name ?? '—'}</td>
              <td className={tdCls + ' text-right font-mono'}>R$ {formatBRL(bill.total_amount)}</td>
              <td className={tdCls + ' text-ink-3'}>{bill.due_date ? formatDate(bill.due_date) : '—'}</td>
              <td className={tdCls}>
                <Badge variant={BILL_STATUS_BADGE[bill.status]}>{BILL_STATUS_LABEL[bill.status]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SelectionModal>
  );
}

export default function Cnab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [remessaPage, setRemessaPage] = useState(1);

  const { data: remessasData, isLoading: remessasLoading } = useQuery({
    queryKey: ['cnab-remessas', remessaPage],
    queryFn: () => getRemessas(remessaPage, 20),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRemessa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cnab-remessas'] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Remessa deletada');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  function handleDelete(id: number) {
    if (!window.confirm('Deletar esta remessa? As faturas voltarão para "Em aberto".')) return;
    deleteMut.mutate(id);
  }

  function handleDownload(id: number) {
    downloadRemessa(id)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remessa_${id}.rem`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Erro ao baixar arquivo'));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Sicoob CNAB 240</h1>
        <p className="text-[13px] text-ink-3 mt-1 m-0">Geração de remessas de boletos</p>
      </div>

      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Remessas</div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Gerar Remessa
          </Button>
        </div>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={thCls}>Data</th>
              <th className={thCls}>Sequência</th>
              <th className={thCls}>Faturas</th>
              <th className={thNumCls}>Total</th>
              <th className={thCls + ' w-10'}></th>
            </tr>
          </thead>
          <tbody>
            {remessasLoading ? (
              <Skeleton.TableRows cols={5} rows={5} />
            ) : !remessasData?.data.length ? (
              <tr><td colSpan={5} className="px-3.5 py-8 text-center text-ink-3">Nenhuma remessa gerada ainda</td></tr>
            ) : remessasData.data.map((r: CnabRemessa) => (
              <tr key={r.id} className="border-b border-line hover:bg-bg-hover cursor-pointer" onClick={() => navigate(`/cnab/${r.id}`)}>
                <td className={tdCls + ' text-ink-3 font-mono text-[12px]'}>{formatDate(r.created_at)}</td>
                <td className={tdCls + ' font-mono text-ink-3'}>#{r.sequence_number}</td>
                <td className={tdCls}>{r.bill_count}</td>
                <td className={tdCls + ' text-right font-mono'}>R$ {formatBRL(r.total_amount)}</td>
                <td className={tdCls} onClick={e => e.stopPropagation()}>
                  <RemessaRowMenu
                    onDownload={() => handleDownload(r.id)}
                    onDelete={() => handleDelete(r.id)}
                    deletePending={deleteMut.isPending}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {remessasData && remessasData.totalPages > 1 && (
          <Pagination page={remessaPage} totalPages={remessasData.totalPages} total={remessasData.total} limit={20} onChange={setRemessaPage} />
        )}
      </div>

      {showModal && (
        <GerarRemessaModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

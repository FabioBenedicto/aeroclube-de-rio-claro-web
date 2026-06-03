import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Upload, X, Plus } from 'lucide-react';
import {
  getBillsPending,
  generateRemessa,
  downloadRemessa,
  processRetorno,
  getRemessas,
  getRetornos,
} from '../../api/cnab';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import Checkbox from '../../components/ui/Checkbox';
import Badge from '../../components/ui/Badge';
import { toast, extractErrorMessage } from '../../utils/toast';
import type { Bill, CnabRemessa, CnabRetorno } from '../../types';

const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const btnSecondary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink disabled:opacity-60';
const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line text-[13px]';

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
      a.click();
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-elev border border-line rounded-[10px] w-full max-w-[680px] shadow-[var(--shadow)] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="text-[15px] font-semibold">Gerar Remessa CNAB</div>
          <div className="flex items-center gap-3">
            <DateInput value={dueFrom} onChange={setDueFrom} className="w-[120px]" />
            <span className="text-[12px] text-ink-3">até</span>
            <DateInput value={dueTo} onChange={setDueTo} className="w-[120px]" />
            <button className={btnSecondary} onClick={() => { setAppliedFrom(dueFrom); setAppliedTo(dueTo); setPage(1); setSelected(new Set()); }}>Filtrar</button>
            <button className="inline-flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-ink hover:bg-bg-hover bg-transparent border-0 cursor-pointer" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-accent/10 border-b border-accent/20">
            <span className="text-[13px] text-accent font-medium">
              {selected.size} fatura(s) · R$ {formatBRL(selectedTotal)}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center w-6 h-6 rounded text-ink-3 hover:text-ink hover:bg-bg-hover bg-transparent border-0 cursor-pointer"
                onClick={() => setSelected(new Set())}
              >
                <X size={13} />
              </button>
              <button
                className={btnPrimary}
                disabled={remessaMut.isPending}
                onClick={() => remessaMut.mutate(Array.from(selected))}
              >
                <Download size={14} />
                {remessaMut.isPending ? 'Gerando…' : 'Gerar e Baixar'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1">
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
                <tr><td colSpan={6} className="px-3.5 py-8 text-center text-ink-3">Carregando…</td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={6} className="px-3.5 py-8 text-center text-ink-3">Nenhuma fatura em aberto</td></tr>
              ) : bills.map(bill => (
                <tr
                  key={bill.id}
                  className={`border-b border-line hover:bg-bg-hover cursor-pointer ${selected.has(bill.id) ? 'bg-accent/5' : ''}`}
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
        </div>

        {billsData && billsData.totalPages > 1 && (
          <div className="border-t border-line">
            <Pagination page={page} totalPages={billsData.totalPages} total={billsData.total} limit={20} onChange={p => { setPage(p); setSelected(new Set()); }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Cnab() {
  const qc = useQueryClient();
  const retornoRef = useRef<HTMLInputElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [remessaPage, setRemessaPage] = useState(1);
  const [retornoPage, setRetornoPage] = useState(1);
  const [expandedRetorno, setExpandedRetorno] = useState<number | null>(null);

  const { data: remessasData, isLoading: remessasLoading } = useQuery({
    queryKey: ['cnab-remessas', remessaPage],
    queryFn: () => getRemessas(remessaPage, 20),
  });

  const { data: retornosData, isLoading: retornosLoading } = useQuery({
    queryKey: ['cnab-retornos', retornoPage],
    queryFn: () => getRetornos(retornoPage, 20),
  });

  const retornoMut = useMutation({
    mutationFn: processRetorno,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cnab-retornos'] });
      toast.success('Retorno processado com sucesso');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  function handleDownload(id: number) {
    downloadRemessa(id)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remessa_${id}.rem`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Erro ao baixar arquivo'));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Sicoob CNAB 240</h1>
        <p className="text-[13px] text-ink-3 mt-1 m-0">Remessa e retorno de boletos</p>
      </div>

      {/* Remessas */}
      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Remessas</div>
          <button className={btnPrimary} onClick={() => setShowModal(true)}>
            <Plus size={14} /> Gerar Remessa
          </button>
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
              <tr><td colSpan={5} className="px-3.5 py-8 text-center text-ink-3">Carregando…</td></tr>
            ) : !remessasData?.data.length ? (
              <tr><td colSpan={5} className="px-3.5 py-8 text-center text-ink-3">Nenhuma remessa gerada ainda</td></tr>
            ) : remessasData.data.map((r: CnabRemessa) => (
              <tr key={r.id} className="border-b border-line hover:bg-bg-hover">
                <td className={tdCls + ' text-ink-3 font-mono text-[12px]'}>{formatDate(r.created_at)}</td>
                <td className={tdCls + ' font-mono text-ink-3'}>#{r.sequence_number}</td>
                <td className={tdCls}>{r.bill_count}</td>
                <td className={tdCls + ' text-right font-mono'}>R$ {formatBRL(r.total_amount)}</td>
                <td className={tdCls}>
                  <button
                    className="inline-flex items-center justify-center w-7 h-7 rounded text-ink-3 hover:text-ink hover:bg-bg-hover bg-transparent border-0 cursor-pointer"
                    onClick={() => handleDownload(r.id)}
                    title="Baixar arquivo .rem"
                  >
                    <Download size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {remessasData && remessasData.totalPages > 1 && (
          <Pagination page={remessaPage} totalPages={remessasData.totalPages} total={remessasData.total} limit={20} onChange={setRemessaPage} />
        )}
      </div>

      {/* Retornos */}
      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Retornos</div>
          <button
            className={btnSecondary}
            disabled={retornoMut.isPending}
            onClick={() => retornoRef.current?.click()}
          >
            <Upload size={14} />
            {retornoMut.isPending ? 'Processando…' : 'Importar Retorno'}
          </button>
        </div>
        <input
          ref={retornoRef}
          type="file"
          accept=".ret,.txt"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) retornoMut.mutate(file);
            e.target.value = '';
          }}
        />
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={thCls}>Data</th>
              <th className={thCls}>Liquidadas</th>
              <th className={thCls}>Rejeitadas</th>
              <th className={thCls}>Erros</th>
            </tr>
          </thead>
          <tbody>
            {retornosLoading ? (
              <tr><td colSpan={4} className="px-3.5 py-8 text-center text-ink-3">Carregando…</td></tr>
            ) : !retornosData?.data.length ? (
              <tr><td colSpan={4} className="px-3.5 py-8 text-center text-ink-3">Nenhum retorno importado ainda</td></tr>
            ) : retornosData.data.map((r: CnabRetorno) => (
              <React.Fragment key={r.id}>
                <tr className="border-b border-line hover:bg-bg-hover">
                  <td className={tdCls + ' text-ink-3 font-mono text-[12px]'}>{formatDate(r.processed_at)}</td>
                  <td className={tdCls}><Badge variant="success">{r.paid_count}</Badge></td>
                  <td className={tdCls}>
                    {r.rejected_count > 0
                      ? <Badge variant="danger">{r.rejected_count}</Badge>
                      : <span className="text-ink-3">0</span>}
                  </td>
                  <td className={tdCls}>
                    {r.errors.length > 0 ? (
                      <button
                        className="text-[12px] text-danger underline cursor-pointer bg-transparent border-0"
                        onClick={() => setExpandedRetorno(expandedRetorno === r.id ? null : r.id)}
                      >
                        {r.errors.length} erro(s) {expandedRetorno === r.id ? '▲' : '▼'}
                      </button>
                    ) : <span className="text-ink-3">0</span>}
                  </td>
                </tr>
                {expandedRetorno === r.id && r.errors.length > 0 && (
                  <tr className="border-b border-line bg-danger-soft">
                    <td colSpan={4} className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        {r.errors.map((err, i) => (
                          <span key={i} className="text-[12px] font-mono text-danger">{err}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {retornosData && retornosData.totalPages > 1 && (
          <Pagination page={retornoPage} totalPages={retornosData.totalPages} total={retornosData.total} limit={20} onChange={setRetornoPage} />
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

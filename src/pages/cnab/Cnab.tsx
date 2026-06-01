import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Download, Upload, Plus, X } from 'lucide-react';
import {
  getBillsPending,
  createBoletoBill,
  generateRemessa,
  processRetorno,
  type RetornoResult,
} from '../../api/cnab';
import { getCustomers } from '../../api/customers';
import { formatBRL, formatDate } from '../../utils/format';
import DateInput from '../../components/DateInput';
import Pagination from '../../components/Pagination';
import { toast, extractErrorMessage } from '../../utils/toast';
import type { Bill, Customer } from '../../types';

const inp = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]';
const btnPrimary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60';
const btnSecondary = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium border border-line bg-bg-elev text-ink-2 cursor-pointer hover:bg-bg-hover hover:text-ink disabled:opacity-60';
const sel = 'w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] cursor-pointer';

export default function Cnab() {
  const qc = useQueryClient();

  // — Boleto form state —
  const [bCustomerId, setBCustomerId] = useState<number | ''>('');
  const [bAmount, setBAmount] = useState('');
  const [bDueDate, setBDueDate] = useState('');

  // — Remessa filter/selection state —
  const [page, setPage] = useState(1);
  const [dueFrom, setDueFrom] = useState('');
  const [dueTo, setDueTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // — Retorno state —
  const retornoRef = useRef<HTMLInputElement>(null);
  const [retornoResult, setRetornoResult] = useState<RetornoResult | null>(null);

  // — Queries —
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => getCustomers(undefined, undefined, 1, 9999),
  });
  const customers: Customer[] = customersData?.data ?? [];

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['bills-pending', page, appliedFrom, appliedTo],
    queryFn: () => getBillsPending(page, 20, appliedFrom || undefined, appliedTo || undefined),
  });
  const bills: Bill[] = billsData?.data ?? [];

  // — Mutations —
  const boletoMut = useMutation({
    mutationFn: createBoletoBill,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills-pending'] });
      setBCustomerId('');
      setBAmount('');
      setBDueDate('');
      toast.success('Boleto criado com sucesso');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const remessaMut = useMutation({
    mutationFn: generateRemessa,
    onSuccess: (blob) => {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remessa_${date}.rem`;
      a.click();
      URL.revokeObjectURL(url);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['bills-pending'] });
      toast.success('Remessa gerada com sucesso');
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const retornoMut = useMutation({
    mutationFn: processRetorno,
    onSuccess: (result) => {
      setRetornoResult(result);
      qc.invalidateQueries({ queryKey: ['bills-pending'] });
      if (result.updated.length > 0) toast.success(`${result.updated.length} fatura(s) liquidada(s)`);
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  function handleBoletoSave() {
    if (!bCustomerId || !bAmount || !bDueDate) return;
    boletoMut.mutate({
      customer_id: Number(bCustomerId),
      total_amount: parseFloat(bAmount),
      due_date: bDueDate,
    });
  }

  function toggleAll() {
    if (selected.size === bills.length && bills.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bills.map(b => b.id)));
    }
  }

  function toggleOne(id: number) {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function applyFilter() {
    setAppliedFrom(dueFrom);
    setAppliedTo(dueTo);
    setPage(1);
    setSelected(new Set());
  }

  const selectedBills = bills.filter(b => selected.has(b.id));
  const selectedTotal = selectedBills.reduce((s, b) => s + Number(b.total_amount), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0 flex items-center gap-2">
            <Landmark size={20} className="text-accent" />
            CNAB 240 — Sicoob
          </h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Remessa e retorno de boletos</p>
        </div>
      </div>

      {/* Bloco A — Criar Boleto */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Criar Boleto</div>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-[220px] flex-1">
            <label className="text-[12px] font-medium text-ink-2">Cliente</label>
            <select
              className={sel}
              value={bCustomerId}
              onChange={e => setBCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Selecione o cliente</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-[140px]">
            <label className="text-[12px] font-medium text-ink-2">Valor (R$)</label>
            <input
              className={inp}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={bAmount}
              onChange={e => setBAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-[160px]">
            <label className="text-[12px] font-medium text-ink-2">Vencimento</label>
            <DateInput value={bDueDate} onChange={setBDueDate} />
          </div>
          <button
            className={btnPrimary}
            disabled={!bCustomerId || !bAmount || !bDueDate || boletoMut.isPending}
            onClick={handleBoletoSave}
          >
            <Plus size={14} />
            {boletoMut.isPending ? 'Criando…' : 'Criar Boleto'}
          </button>
        </div>
      </div>

      {/* Bloco B — Remessa */}
      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Faturas Pendentes</div>
          <div className="flex items-center gap-2">
            <DateInput value={dueFrom} onChange={setDueFrom} className="w-[130px]" />
            <span className="text-[12px] text-ink-3">até</span>
            <DateInput value={dueTo} onChange={setDueTo} className="w-[130px]" />
            <button className={btnSecondary} onClick={applyFilter}>Filtrar</button>
          </div>
        </div>

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-accent/10 border-b border-accent/20">
            <span className="text-[13px] text-accent font-medium">
              {selected.size} fatura(s) · R$ {formatBRL(selectedTotal)}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center justify-center w-6 h-6 rounded text-ink-3 hover:text-ink hover:bg-bg-hover"
                onClick={() => setSelected(new Set())}
              >
                <X size={14} />
              </button>
              <button
                className={btnPrimary}
                disabled={remessaMut.isPending}
                onClick={() => remessaMut.mutate(Array.from(selected))}
              >
                <Download size={14} />
                {remessaMut.isPending ? 'Gerando…' : 'Gerar Remessa'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="px-3.5 py-2.5 text-left bg-bg border-b border-line w-9">
                  <input
                    type="checkbox"
                    checked={bills.length > 0 && selected.size === bills.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">ID</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Cliente</th>
                <th className="px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Valor</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-8 text-center text-[13px] text-ink-3">Carregando…</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-8 text-center text-[13px] text-ink-3">Nenhuma fatura pendente</td>
                </tr>
              ) : bills.map(bill => (
                <tr
                  key={bill.id}
                  className={`border-b border-line hover:bg-bg-hover cursor-pointer ${selected.has(bill.id) ? 'bg-accent/5' : ''}`}
                  onClick={() => toggleOne(bill.id)}
                >
                  <td className="px-3.5 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(bill.id)}
                      onChange={() => toggleOne(bill.id)}
                      onClick={e => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-ink-3">#{bill.id}</td>
                  <td className="px-3.5 py-2.5">{bill.customer?.name ?? '—'}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono">R$ {formatBRL(bill.total_amount)}</td>
                  <td className="px-3.5 py-2.5 text-ink-3">{bill.due_date ? formatDate(bill.due_date) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {billsData && billsData.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={billsData.totalPages}
            total={billsData.total}
            limit={20}
            onChange={p => { setPage(p); setSelected(new Set()); }}
          />
        )}
      </div>

      {/* Bloco C — Retorno */}
      <div className="bg-bg-elev border border-line rounded-lg p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">Importar Retorno</div>
        <p className="text-[12px] text-ink-3 mt-0 mb-4">
          Selecione o arquivo <span className="font-mono">.ret</span> ou <span className="font-mono">.txt</span> enviado pelo Sicoob para confirmar os pagamentos.
        </p>
        <input
          ref={retornoRef}
          type="file"
          accept=".ret,.txt"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              setRetornoResult(null);
              retornoMut.mutate(file);
            }
            e.target.value = '';
          }}
        />
        <button
          className={btnSecondary}
          disabled={retornoMut.isPending}
          onClick={() => retornoRef.current?.click()}
        >
          <Upload size={14} />
          {retornoMut.isPending ? 'Processando…' : 'Selecionar arquivo'}
        </button>

        {retornoResult && (
          <div className="mt-4 flex flex-col gap-2 text-[13px]">
            {retornoResult.updated.length > 0 && (
              <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                <span className="font-semibold">Liquidadas:</span>
                <span className="font-mono">{retornoResult.updated.join(', ')}</span>
              </div>
            )}
            {retornoResult.rejected.length > 0 && (
              <div className="flex items-start gap-2 text-yellow-700 dark:text-yellow-400">
                <span className="font-semibold">Rejeitadas:</span>
                <span className="font-mono">{retornoResult.rejected.join(', ')}</span>
              </div>
            )}
            {retornoResult.errors.length > 0 && (
              <div className="flex flex-col gap-1 text-red-600 dark:text-red-400">
                <span className="font-semibold">Erros:</span>
                {retornoResult.errors.map((err, i) => (
                  <span key={i} className="font-mono text-[12px]">{err}</span>
                ))}
              </div>
            )}
            {retornoResult.updated.length === 0 && retornoResult.rejected.length === 0 && retornoResult.errors.length === 0 && (
              <span className="text-ink-3">Nenhum título processado no arquivo.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

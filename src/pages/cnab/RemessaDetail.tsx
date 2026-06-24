import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Download, Trash2, FileText, Banknote } from 'lucide-react';
import { getRemessa, downloadRemessa, deleteRemessa } from '../../api/cnab';
import { formatBRL, formatDate, BILL_STATUS_LABEL, BILL_STATUS_BADGE } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { toast, extractErrorMessage } from '../../utils/toast';

const thCls = 'px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const thNumCls = 'px-3.5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 bg-bg border-b border-line';
const tdCls = 'px-3.5 py-2.5 border-b border-line text-[13px]';

export default function RemessaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const remessaId = Number(id);

  const { data: remessa, isLoading } = useQuery({
    queryKey: ['cnab-remessa', remessaId],
    queryFn: () => getRemessa(remessaId),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteRemessa(remessaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cnab-remessas'] });
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Remessa deletada');
      navigate('/cnab');
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e)),
  });

  function handleDownload() {
    downloadRemessa(remessaId)
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remessa_${remessaId}.rem`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Erro ao baixar arquivo'));
  }

  function handleDelete() {
    if (!window.confirm('Deletar esta remessa? As faturas voltarão para "Em aberto".')) return;
    deleteMut.mutate();
  }

  if (isLoading) return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton.Block className="h-[13px] w-14 mb-1" />
          <Skeleton.Title width="w-52" />
          <Skeleton.Text width="w-40" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Skeleton.Block className="h-8 w-28 rounded-lg" />
          <Skeleton.Block className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map(i => <Skeleton.Card key={i} />)}
      </div>
      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-line"><Skeleton.Text width="w-36" /></div>
        <table className="w-full border-collapse">
          <tbody><Skeleton.TableRows cols={5} rows={6} /></tbody>
        </table>
      </div>
    </div>
  );
  if (!remessa) return <div className="p-8 text-[13px] text-ink-3">Remessa não encontrada.</div>;

  const bills = remessa.bills ?? [];

  return (
    <div className="flex flex-col gap-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            className="flex items-center gap-1 pb-2 mb-1 text-[13px] text-ink-3 cursor-pointer bg-transparent border-0 hover:text-ink"
            onClick={() => navigate('/cnab')}
          >
            <ChevronLeft size={15} /> Voltar
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">
            Remessa #{remessa.sequence_number}
          </h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Gerada em {formatDate(remessa.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Button variant="default" onClick={handleDownload}>
            <Download size={14} /> Baixar arquivo
          </Button>
          <Button
            variant="default"
            className="text-danger hover:bg-danger-soft"
            disabled={deleteMut.isPending}
            onClick={handleDelete}
          >
            <Trash2 size={14} /> Deletar
          </Button>
        </div>
      </div>

      {/* Cards de sumário */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3">
            <FileText size={18} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 w-full">
            <div className="text-[12px] text-ink-3 font-medium">Faturas</div>
            <div className="text-[20px] font-bold tracking-tight leading-none">{remessa.bill_count}</div>
          </div>
        </div>
        <div className="bg-bg-elev border border-line rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-[8px] grid place-items-center shrink-0 bg-bg-sunk text-ink-3">
            <Banknote size={18} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 w-full">
            <div className="text-[12px] text-ink-3 font-medium">Valor total</div>
            <div className="text-[20px] font-bold font-mono tracking-tight leading-none">
              <span className="text-[14px] font-medium mr-0.5">R$</span>{formatBRL(remessa.total_amount)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de faturas */}
      <div className="bg-bg-elev border border-line rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-line">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Faturas</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className={thCls + ' w-1/5'}>ID</th>
                <th className={thCls + ' w-1/5'}>Cliente</th>
                <th className={thCls + ' w-1/5'}>Vencimento</th>
                <th className={thCls + ' w-1/5'}>Status</th>
                <th className={thNumCls + ' w-1/5'}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr><td colSpan={5} className="px-3.5 py-8 text-center text-ink-3">Nenhuma fatura encontrada</td></tr>
              ) : bills.map(bill => (
                <tr
                  key={bill.id}
                  className="hover:bg-bg-hover cursor-pointer"
                  onClick={() => navigate(`/invoices/${bill.id}`)}
                >
                  <td className={tdCls + ' font-mono text-ink-3'}>#{bill.id}</td>
                  <td className={tdCls + ' font-medium'}>{bill.people?.name ?? '—'}</td>
                  <td className={tdCls + ' font-mono text-[12px] text-ink-3'}>
                    {bill.expiration_date ? formatDate(bill.expiration_date) : '—'}
                  </td>
                  <td className={tdCls}>
                    <Badge variant={BILL_STATUS_BADGE[bill.status]}>{BILL_STATUS_LABEL[bill.status]}</Badge>
                  </td>
                  <td className={tdCls + ' text-right font-mono'}>R$ {formatBRL(bill.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

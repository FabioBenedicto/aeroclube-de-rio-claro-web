import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { getSettings, upsertSettings } from '../api/settings';
import { toast } from '../utils/toast';

export default function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });

  const [instructorPct, setInstructorPct] = useState(0);
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [gliderMinutes, setGliderMinutes] = useState(45);
  const [gliderInitialValue, setGliderInitialValue] = useState(330);
  const [gliderMinuteValue, setGliderMinuteValue] = useState(3);

  const [sicoobCnpj, setSicoobCnpj] = useState('');
  const [sicoobNome, setSicoobNome] = useState('');
  const [sicoobPrefix, setSicoobPrefix] = useState('');
  const [sicoobPrefixDv, setSicoobPrefixDv] = useState('');
  const [sicoobConta, setSicoobConta] = useState('');
  const [sicoobContaDv, setSicoobContaDv] = useState('');
  const [sicoobCarteira, setSicoobCarteira] = useState('');
  const [sicoobModalidade, setSicoobModalidade] = useState('');

  useEffect(() => {
    if (data) {
      setInstructorPct(Number(data.instructor_percentage));
      setMonthlyFee(Number(data.partner_monthly_dues));
      setGliderMinutes(Number(data.glider_initial_minutes));
      setGliderInitialValue(Number(data.glider_initial_value));
      setGliderMinuteValue(Number(data.glider_minute_value));
      setSicoobCnpj(data.sicoob_cnpj ?? '');
      setSicoobNome(data.sicoob_nome_empresa ?? '');
      setSicoobPrefix(data.sicoob_cooperativa_prefix ?? '');
      setSicoobPrefixDv(data.sicoob_cooperativa_dv ?? '');
      setSicoobConta(data.sicoob_conta ?? '');
      setSicoobContaDv(data.sicoob_conta_dv ?? '');
      setSicoobCarteira(data.sicoob_carteira ?? '');
      setSicoobModalidade(data.sicoob_modalidade ?? '');
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: upsertSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações salvas');
    },
    onError: () => toast.error('Erro ao salvar configurações'),
  });

  function handleSave() {
    mut.mutate({
      instructor_percentage: instructorPct,
      partner_monthly_dues: monthlyFee,
      glider_initial_minutes: gliderMinutes,
      glider_initial_value: gliderInitialValue,
      glider_minute_value: gliderMinuteValue,
    });
  }

  const sicoobMut = useMutation({
    mutationFn: upsertSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações Sicoob salvas');
    },
    onError: () => toast.error('Erro ao salvar configurações Sicoob'),
  });

  function handleSaveSicoob() {
    sicoobMut.mutate({
      sicoob_cnpj: sicoobCnpj || undefined,
      sicoob_nome_empresa: sicoobNome || undefined,
      sicoob_cooperativa_prefix: sicoobPrefix || undefined,
      sicoob_cooperativa_dv: sicoobPrefixDv || undefined,
      sicoob_conta: sicoobConta || undefined,
      sicoob_conta_dv: sicoobContaDv || undefined,
      sicoob_carteira: sicoobCarteira || undefined,
      sicoob_modalidade: sicoobModalidade || undefined,
    });
  }

  const inp = 'w-[80px] px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)] text-right';
  const moneyInp = 'flex-1 px-2.5 py-[7px] border-0 bg-bg-elev text-ink text-[13px] font-mono outline-none';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] m-0">Configurações</h1>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Parâmetros do sistema</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-[13px] text-ink-3 py-8 text-center">Carregando…</div>
      ) : (
        <>
          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Sicoob / CNAB 240</div>
            <p className="text-[12px] text-ink-3 mt-0 mb-4">
              Dados bancários para geração de remessa e importação de retorno CNAB 240.
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">CNPJ (14 dígitos, sem formatação)</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={14} value={sicoobCnpj}
                    onChange={e => setSicoobCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))}
                    placeholder="12345678000100"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Nome beneficiário (max 30 chars)</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={30} value={sicoobNome}
                    onChange={e => setSicoobNome(e.target.value.toUpperCase())}
                    placeholder="AEROCLUBE RIO CLARO"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Prefixo coop.</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={5} value={sicoobPrefix}
                    onChange={e => setSicoobPrefix(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="04162"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">DV prefixo</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={1} value={sicoobPrefixDv}
                    onChange={e => setSicoobPrefixDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Conta corrente</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={12} value={sicoobConta}
                    onChange={e => setSicoobConta(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    placeholder="000007550000"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">DV conta</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={1} value={sicoobContaDv}
                    onChange={e => setSicoobContaDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Carteira</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={1} value={sicoobCarteira}
                    onChange={e => setSicoobCarteira(e.target.value.replace(/\D/g, '').slice(0, 1))}
                    placeholder="1"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Modalidade</label>
                  <input
                    className="w-full px-2.5 py-[7px] border border-line rounded-md bg-bg-elev text-ink text-[13px] font-mono outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--focus)]"
                    maxLength={2} value={sicoobModalidade}
                    onChange={e => setSicoobModalidade(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="01"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60"
                onClick={handleSaveSicoob}
                disabled={sicoobMut.isPending}
              >
                <Check size={14} />
                {sicoobMut.isPending ? 'Salvando…' : 'Salvar Sicoob'}
              </button>
            </div>
          </div>

          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Planador</div>
            <p className="text-[12px] text-ink-3 mt-0 mb-4">
              Regra de cobrança: valor fixo para os minutos iniciais; após o limite, acrescenta valor por minuto excedente.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-ink-2">Minutos iniciais (franquia)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={1} max={120} step={1} value={gliderMinutes}
                    onChange={e => setGliderMinutes(Number(e.target.value))}
                    className="flex-1"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <input
                    className={inp}
                    type="number" min={1} step={1} value={gliderMinutes}
                    onChange={e => setGliderMinutes(Number(e.target.value))}
                  />
                  <span className="text-[13px] text-ink-3">min</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Valor fixo inicial (R$)</label>
                  <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                    <input
                      className={moneyInp}
                      type="number" min={0} step="0.01" value={gliderInitialValue}
                      onChange={e => setGliderInitialValue(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-ink-2">Valor por minuto adicional (R$)</label>
                  <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)]">
                    <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                    <input
                      className={moneyInp}
                      type="number" min={0} step="0.01" value={gliderMinuteValue}
                      onChange={e => setGliderMinuteValue(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Sócios</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Mensalidade de sócios (R$)</label>
              <div className="flex rounded-md border border-line overflow-hidden focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus)] max-w-[200px]">
                <span className="flex items-center px-2.5 text-[13px] text-ink-3 bg-bg-sunk border-r border-line">R$</span>
                <input
                  className={moneyInp}
                  type="number" step="0.01" value={monthlyFee}
                  onChange={e => setMonthlyFee(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-elev border border-line rounded-lg p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-4">Instrutores</div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink-2">Porcentagem do instrutor (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={50} step={1} value={instructorPct}
                  onChange={e => setInstructorPct(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <input
                  className={inp}
                  type="number" min={0} max={50} step={1} value={instructorPct}
                  onChange={e => setInstructorPct(Number(e.target.value))}
                />
                <span className="text-[13px] text-ink-3">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={mut.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium bg-accent border border-accent text-white cursor-pointer hover:opacity-90 disabled:opacity-60"
              onClick={handleSave}
            >
              <Check size={14} /> {mut.isPending ? 'Salvando…' : mut.isSuccess ? 'Salvo!' : 'Salvar alterações'}
            </button>
          </div>

        </>
      )}
    </div>
  );
}

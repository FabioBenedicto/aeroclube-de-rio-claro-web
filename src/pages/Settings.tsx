import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { getSettings, upsertSettings } from '../api/settings';
import { toast } from '../utils/toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

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
  const [sicoobCarteira, setSicoobCarteira] = useState('1');
  const [sicoobModalidade, setSicoobModalidade] = useState('01');
  const [sicoobJuros, setSicoobJuros] = useState(0);
  const [sicoobJurosPrazo, setSicoobJurosPrazo] = useState(0);
  const [sicoobJurosTipo, setSicoobJurosTipo] = useState('2');

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
      setSicoobJuros(Number(data.sicoob_juros ?? 0));
      setSicoobJurosPrazo(Number(data.sicoob_juros_prazo ?? 0));
      setSicoobJurosTipo(data.sicoob_juros_tipo ?? '2');
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
      sicoob_cnpj: sicoobCnpj || undefined,
      sicoob_nome_empresa: sicoobNome || undefined,
      sicoob_cooperativa_prefix: sicoobPrefix || undefined,
      sicoob_cooperativa_dv: sicoobPrefixDv || undefined,
      sicoob_conta: sicoobConta || undefined,
      sicoob_conta_dv: sicoobContaDv || undefined,
      sicoob_carteira: sicoobCarteira || undefined,
      sicoob_modalidade: sicoobModalidade || undefined,
      sicoob_juros: sicoobJuros,
      sicoob_juros_prazo: sicoobJurosPrazo,
      sicoob_juros_tipo: sicoobJurosTipo,
    });
  }

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
            <p className="text-[12px] text-ink-3 mt-0 mb-6">
              Dados bancários para geração de remessa e importação de retorno CNAB 240.
            </p>

            <div className="flex flex-col gap-6">
              {/* Cooperativa */}
              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 border-b border-line pb-2">Cooperativa</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Agência</label>
                    <Input
                      className="font-mono"
                      maxLength={5} value={sicoobPrefix}
                      onChange={e => setSicoobPrefix(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="04162"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">DV agência</label>
                    <Input
                      className="font-mono"
                      maxLength={1} value={sicoobPrefixDv}
                      onChange={e => setSicoobPrefixDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Beneficiário */}
              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 border-b border-line pb-2">Beneficiário</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">CNPJ</label>
                    <Input
                      className="font-mono"
                      maxLength={14} value={sicoobCnpj}
                      onChange={e => setSicoobCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))}
                      placeholder="12345678000100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Nome/Razão social</label>
                    <Input
                      maxLength={30} value={sicoobNome}
                      onChange={e => setSicoobNome(e.target.value.toUpperCase())}
                      placeholder="AEROCLUBE RIO CLARO"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Conta</label>
                    <Input
                      className="font-mono"
                      maxLength={12} value={sicoobConta}
                      onChange={e => setSicoobConta(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="000007550000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">DV conta</label>
                    <Input
                      className="font-mono"
                      maxLength={1} value={sicoobContaDv}
                      onChange={e => setSicoobContaDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[12px] font-medium text-ink-2">Carteira / Modalidade</label>
                    <Select
                      value={`${sicoobCarteira}/${sicoobModalidade}`}
                      onChange={e => {
                        const [c, m] = e.target.value.split('/');
                        setSicoobCarteira(c);
                        setSicoobModalidade(m);
                      }}
                    >
                      <option value="1/01">1/01 — Cobrança Simples</option>
                      <option value="2/04">2/04 — Cobrança Vinculada</option>
                      <option value="3/03">3/03 — Cobrança Caucionada</option>
                      <option value="1/05">1/05 — Carnê de Pagamentos</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Juros */}
              <div className="flex flex-col gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 border-b border-line pb-2">Juros</div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-ink-2">Tipo de juros</label>
                    <Select
                      value={sicoobJurosTipo}
                      onChange={e => setSicoobJurosTipo(e.target.value)}
                    >
                      <option value="0">Isento</option>
                      <option value="1">Valor por dia (R$)</option>
                      <option value="2">Taxa mensal (%)</option>
                    </Select>
                  </div>
                  {sicoobJurosTipo !== '0' && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-ink-2">
                          {sicoobJurosTipo === '1' ? 'Valor por dia (R$)' : 'Taxa mensal (%)'}
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={sicoobJurosTipo === '2' ? 100 : undefined}
                          className="font-mono"
                          value={sicoobJuros}
                          onChange={e => setSicoobJuros(parseFloat(e.target.value) || 0)}
                          placeholder={sicoobJurosTipo === '1' ? '0.50' : '1.00'}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-medium text-ink-2">Prazo de juros (dias após venc.)</label>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className="font-mono"
                          value={sicoobJurosPrazo}
                          onChange={e => setSicoobJurosPrazo(parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                  <Input
                    className="w-[80px] font-mono text-right"
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
                <Input
                  className="w-[80px] font-mono text-right"
                  type="number" min={0} max={50} step={1} value={instructorPct}
                  onChange={e => setInstructorPct(Number(e.target.value))}
                />
                <span className="text-[13px] text-ink-3">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={mut.isPending}
              onClick={handleSave}
            >
              <Check size={14} /> {mut.isPending ? 'Salvando…' : mut.isSuccess ? 'Salvo!' : 'Salvar alterações'}
            </Button>
          </div>

        </>
      )}
    </div>
  );
}

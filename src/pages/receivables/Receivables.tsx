import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Trash2, Check as CheckIcon, Download } from 'lucide-react';
import { getReceivables, createReceivable, updateReceivable, deleteReceivable, registerPayment } from '../../api/receivables';
import { getCustomers } from '../../api/customers';
import { formatBRL, formatDate, receivableStatus, STATUS_LABEL, STATUS_BADGE } from '../../utils/format';
import type { Receivable } from '../../types';

const TABS = [['all','Todos'],['0','Em aberto'],['partial','Parcial'],['1','Pagos'],['overdue','Vencidos']] as const;

function NewReceivableModal({ customers, onClose, onSave }: { customers: { id: number; name: string }[]; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({ client_id: '', title: '', product: 'voo', expiration_date: '', total_amount: '' });
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">Novo título a receber</h3>
          <button className="icon-btn" onClick={onClose}><span style={{fontSize:16}}>✕</span></button>
        </div>
        <div className="modal-body stack">
          <div className="field"><label>Cliente</label>
            <select className="select" value={form.client_id} onChange={e => setForm(f=>({...f,client_id:e.target.value}))}>
              <option value="">— Selecione —</option>
              {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Descrição do título</label>
            <input className="input" placeholder="Ex: Instrução Duplo Comando · abril/26" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div className="g2">
            <div className="field"><label>Produto</label>
              <select className="select" value={form.product} onChange={e=>setForm(f=>({...f,product:e.target.value}))}>
                <option value="voo">Voo</option><option value="mensalidade">Mensalidade</option><option value="servico">Serviço</option><option value="outro">Outro</option>
              </select>
            </div>
            <div className="field"><label>Vencimento</label>
              <input className="input mono" type="date" value={form.expiration_date} onChange={e=>setForm(f=>({...f,expiration_date:e.target.value}))} />
            </div>
          </div>
          <div className="field"><label>Valor</label>
            <div className="input-group" style={{maxWidth:220}}>
              <span className="prefix">R$</span>
              <input type="number" step="0.01" className="input mono" placeholder="0,00" value={form.total_amount} onChange={e=>setForm(f=>({...f,total_amount:e.target.value}))} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave({client_id:form.client_id?Number(form.client_id):undefined,title:form.title,product:form.product,expiration_date:form.expiration_date,total_amount:parseFloat(form.total_amount)})}>
            <CheckIcon size={14}/> Criar título
          </button>
        </div>
      </div>
    </div>
  );
}

function EditReceivableModal({ rec, onClose, onSave }: { rec: Receivable; onClose: ()=>void; onSave: (d:unknown)=>void }) {
  const [form,setForm]=useState({title:rec.title,expiration_date:rec.expiration_date?.slice(0,10)??'',total_amount:String(rec.total_amount)});
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div><h3 className="modal-title">Editar título</h3><div style={{fontSize:11.5,color:'var(--ink-3)'}}>#{rec.id} · {rec.customer?.name}</div></div>
          <button className="icon-btn" onClick={onClose}><span>✕</span></button>
        </div>
        <div className="modal-body stack">
          <div className="field"><label>Descrição</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
          <div className="g2">
            <div className="field"><label>Vencimento</label><input className="input mono" type="date" value={form.expiration_date} onChange={e=>setForm(f=>({...f,expiration_date:e.target.value}))}/></div>
            <div className="field"><label>Valor</label>
              <div className="input-group"><span className="prefix">R$</span><input type="number" step="0.01" className="input mono" value={form.total_amount} onChange={e=>setForm(f=>({...f,total_amount:e.target.value}))}/></div>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave({title:form.title,expiration_date:form.expiration_date,total_amount:parseFloat(form.total_amount)})}><CheckIcon size={14}/> Salvar</button>
        </div>
      </div>
    </div>
  );
}

function SettleModal({ rec, onClose, onSave }: { rec: Receivable; onClose: ()=>void; onSave: (d:unknown)=>void }) {
  const remaining = Number(rec.total_amount) - Number(rec.amount_received);
  const [mode,setMode]=useState<'total'|'partial'>('total');
  const [amount,setAmount]=useState(String(remaining));
  const [method,setMethod]=useState('PIX');
  const [notes,setNotes]=useState('');
  const effective = mode==='total' ? remaining : parseFloat(amount)||0;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div><h3 className="modal-title">Baixa de título</h3><div style={{fontSize:11.5,color:'var(--ink-3)'}}>#{rec.id} · {rec.customer?.name}</div></div>
          <button className="icon-btn" onClick={onClose}><span>✕</span></button>
        </div>
        <div className="modal-body stack">
          <div className="row" style={{gap:16,padding:'12px 14px',background:'var(--bg-sunk)',borderRadius:6}}>
            <div><div className="section-label" style={{marginBottom:2}}>Título</div><div style={{fontWeight:500}}>{rec.title}</div></div>
            <div style={{marginLeft:'auto',textAlign:'right'}}>
              <div className="section-label" style={{marginBottom:2}}>Saldo devedor</div>
              <div className="mono" style={{fontSize:16,fontWeight:600}}>R$ {formatBRL(remaining)}</div>
            </div>
          </div>
          <div>
            <div className="section-label" style={{marginBottom:8}}>Tipo de baixa</div>
            <div className="row" style={{gap:8}}>
              <button className={`btn ${mode==='total'?'primary':''}`} style={{flex:1,justifyContent:'center'}} onClick={()=>setMode('total')}>Total · R$ {formatBRL(remaining)}</button>
              <button className={`btn ${mode==='partial'?'primary':''}`} style={{flex:1,justifyContent:'center'}} onClick={()=>setMode('partial')}>Parcial</button>
            </div>
          </div>
          <div className="g2">
            <div className="field"><label>Valor recebido</label>
              <div className="input-group"><span className="prefix mono">R$</span>
                <input className="input mono" type="number" step="0.01" value={mode==='total'?String(remaining):amount} onChange={e=>setAmount(e.target.value)} disabled={mode==='total'}/>
              </div>
            </div>
            <div className="field"><label>Forma de pagamento</label>
              <select className="select" value={method} onChange={e=>setMethod(e.target.value)}>
                <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option><option>Cartão de débito</option><option>Cheque</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Observações</label><textarea className="textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Opcional"/></div>
        </div>
        <div className="modal-foot">
          <span className="muted" style={{fontSize:11.5,marginRight:'auto'}}>Saldo restante: <strong className="mono">R$ {formatBRL(Math.max(0,remaining-effective))}</strong></span>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave({amount_received:effective,payment_method:method,notes:notes||undefined,payment_date:new Date().toISOString()})}><CheckIcon size={14}/> Confirmar baixa</button>
        </div>
      </div>
    </div>
  );
}

export default function Receivables() {
  const qc=useQueryClient();
  const [tab,setTab]=useState<string>('all');
  const [search,setSearch]=useState('');
  const [menuId,setMenuId]=useState<number|null>(null);
  const [newModal,setNewModal]=useState(false);
  const [editRec,setEditRec]=useState<Receivable|null>(null);
  const [settleRec,setSettleRec]=useState<Receivable|null>(null);

  const {data:customers=[]}=useQuery({queryKey:['customers'],queryFn:()=>getCustomers()});
  const {data:allRecs=[],isLoading}=useQuery({queryKey:['receivables'],queryFn:()=>getReceivables()});

  const deleteMut=useMutation({mutationFn:deleteReceivable,onSuccess:()=>qc.invalidateQueries({queryKey:['receivables']})});
  const payMut=useMutation({mutationFn:({id,d}:{id:number;d:unknown})=>registerPayment(id,d as {amount_received:number;payment_method?:string;payment_date?:string;notes?:string}),onSuccess:()=>{qc.invalidateQueries({queryKey:['receivables']});setSettleRec(null);}});

  useEffect(()=>{if(!menuId)return;const h=()=>setMenuId(null);window.addEventListener('click',h);return()=>window.removeEventListener('click',h);},[menuId]);

  const filtered=allRecs.filter(r=>{
    const st=receivableStatus(r);
    const matchTab=tab==='all'||(tab==='partial'&&st==='partial')||(tab==='overdue'&&st==='overdue')||(tab==='0'&&st==='open')||(tab==='1'&&st==='paid');
    const matchSearch=!search||r.title.toLowerCase().includes(search.toLowerCase())||(r.customer?.name??'').toLowerCase().includes(search.toLowerCase());
    return matchTab&&matchSearch;
  });

  const total=allRecs.reduce((a,r)=>a+Number(r.total_amount),0);
  const received=allRecs.reduce((a,r)=>a+Number(r.amount_received),0);
  const overdue=allRecs.filter(r=>receivableStatus(r)==='overdue').reduce((a,r)=>a+Number(r.total_amount)-Number(r.amount_received),0);

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1 className="page-title">Contas a receber</h1><p className="page-sub">Títulos gerados por voos, mensalidades e serviços</p></div>
        <div className="page-actions">
          <button className="btn"><Download size={14}/> Exportar</button>
          <button className="btn primary" onClick={()=>setNewModal(true)}><Plus size={14}/> Novo título</button>
        </div>
      </div>

      <div className="g4">
        <div className="kpi"><div className="kpi-label">Total emitido</div><div className="kpi-value mono"><span className="cur">R$</span>{formatBRL(total)}</div><div className="kpi-foot">{allRecs.length} títulos</div></div>
        <div className="kpi"><div className="kpi-label">Já recebido</div><div className="kpi-value mono" style={{color:'var(--success)'}}><span className="cur">R$</span>{formatBRL(received)}</div><div className="kpi-foot">{total>0?Math.round(received/total*100):0}% do total</div></div>
        <div className="kpi"><div className="kpi-label">A receber</div><div className="kpi-value mono"><span className="cur">R$</span>{formatBRL(total-received)}</div><div className="kpi-foot">saldo pendente</div></div>
        <div className="kpi"><div className="kpi-label">Vencidos</div><div className="kpi-value mono" style={{color:'var(--danger)'}}><span className="cur">R$</span>{formatBRL(overdue)}</div><div className="kpi-foot">ação necessária</div></div>
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <div className="filter-bar">
          <div className="tabs" style={{margin:0,border:0}}>
            {TABS.map(([k,l])=><button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>)}
          </div>
          <div style={{flex:1}}/>
          <div className="search">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por cliente ou título…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        {isLoading?<div style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>Carregando…</div>:(
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>ID</th><th>Cliente</th><th>Título</th><th>Venc.</th><th className="num">Valor</th><th className="num">Recebido</th><th>Progresso</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(r=>{
                const st=receivableStatus(r);
                const pct=Number(r.total_amount)>0?Math.round((Number(r.amount_received)/Number(r.total_amount))*100):0;
                return (
                  <tr key={r.id}>
                    <td className="mono" style={{fontSize:11.5}}>#{r.id}</td>
                    <td className="cell-primary">{r.customer?.name??'—'}</td>
                    <td><div>{r.title}</div>{r.product&&<div className="cell-sub"><span className="chip">{r.product}</span></div>}</td>
                    <td className="mono" style={{fontSize:12}}>{formatDate(r.expiration_date)}</td>
                    <td className="num mono">R$ {formatBRL(r.total_amount)}</td>
                    <td className="num mono">{Number(r.amount_received)>0?`R$ ${formatBRL(r.amount_received)}`:'—'}</td>
                    <td style={{minWidth:120}}>
                      <div className="row" style={{gap:8}}>
                        <div className="progress" style={{flex:1}}><span style={{width:`${pct}%`}}/></div>
                        <span className="mono muted" style={{fontSize:11,minWidth:32,textAlign:'right'}}>{pct}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[st]}`}><span className="dot"/>{STATUS_LABEL[st]}</span></td>
                    <td style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
                      <button className="icon-btn" onClick={()=>setMenuId(menuId===r.id?null:r.id)}><MoreHorizontal size={15}/></button>
                      {menuId===r.id&&(
                        <div className="row-menu" onClick={()=>setMenuId(null)}>
                          <button onClick={()=>setEditRec(r)}><Edit size={14}/> Editar</button>
                          {st!=='paid'&&<button onClick={()=>setSettleRec(r)}><CheckIcon size={14}/> Baixar</button>}
                          <div className="row-menu-sep"/>
                          <button className="danger" onClick={()=>{if(confirm('Remover título?'))deleteMut.mutate(r.id)}}><Trash2 size={14}/> Remover</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0&&<tr><td colSpan={9} style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>Nenhum título encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {newModal&&<NewReceivableModal customers={customers} onClose={()=>setNewModal(false)} onSave={d=>createReceivable(d).then(()=>{qc.invalidateQueries({queryKey:['receivables']});setNewModal(false);})}/>}
      {editRec&&<EditReceivableModal rec={editRec} onClose={()=>setEditRec(null)} onSave={d=>updateReceivable(editRec.id,d).then(()=>{qc.invalidateQueries({queryKey:['receivables']});setEditRec(null);})}/>}
      {settleRec&&<SettleModal rec={settleRec} onClose={()=>setSettleRec(null)} onSave={d=>payMut.mutate({id:settleRec.id,d})}/>}
    </div>
  );
}

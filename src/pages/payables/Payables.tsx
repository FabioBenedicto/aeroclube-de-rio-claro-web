import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Trash2, Check as CheckIcon } from 'lucide-react';
import { getPayables, createPayable, deletePayable, registerPayablePayment } from '../../api/payables';
import { formatBRL, formatDate } from '../../utils/format';
import type { Payable } from '../../types';

const P_STATUS_LABEL: Record<string,string>={open:'A pagar',partial:'Parcial',closed:'Pago'};
const P_STATUS_BADGE: Record<string,string>={open:'warn',partial:'accent',closed:'success'};

function NewPayableModal({ onClose, onSave }: { onClose:()=>void; onSave:(d:unknown)=>void }) {
  const [form,setForm]=useState({title:'',description:'',amount:'',due_date:'',product:'servico'});
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><h3 className="modal-title">Novo título a pagar</h3><button className="icon-btn" onClick={onClose}><span>✕</span></button></div>
        <div className="modal-body stack">
          <div className="field"><label>Descrição</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
          <div className="g2">
            <div className="field"><label>Produto</label>
              <select className="select" value={form.product} onChange={e=>setForm(f=>({...f,product:e.target.value}))}>
                <option value="servico">Serviço</option><option value="instrucao">Instrução</option><option value="manutencao">Manutenção</option><option value="outro">Outro</option>
              </select>
            </div>
            <div className="field"><label>Vencimento</label><input className="input mono" type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/></div>
          </div>
          <div className="field"><label>Valor</label>
            <div className="input-group" style={{maxWidth:220}}><span className="prefix">R$</span><input type="number" step="0.01" className="input mono" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
          </div>
          <div className="field"><label>Observações</label><textarea className="textarea" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Opcional"/></div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave({title:form.title,description:form.description||undefined,amount:parseFloat(form.amount),due_date:form.due_date||undefined,product:form.product})}>
            <CheckIcon size={14}/> Criar título
          </button>
        </div>
      </div>
    </div>
  );
}

function PayModal({ payable, onClose, onSave }: { payable:Payable; onClose:()=>void; onSave:(d:unknown)=>void }) {
  const remaining=Number(payable.amount)-Number(payable.amount_paid);
  const [mode,setMode]=useState<'total'|'partial'>('total');
  const [amount,setAmount]=useState(String(remaining));
  const [method,setMethod]=useState('PIX');
  const effective=mode==='total'?remaining:parseFloat(amount)||0;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div><h3 className="modal-title">Pagar título</h3><div style={{fontSize:11.5,color:'var(--ink-3)'}}>{payable.title}</div></div>
          <button className="icon-btn" onClick={onClose}><span>✕</span></button>
        </div>
        <div className="modal-body stack">
          <div className="row" style={{padding:'12px 14px',background:'var(--bg-sunk)',borderRadius:6,justifyContent:'space-between'}}>
            <div><div className="section-label">Saldo devedor</div><div className="mono" style={{fontSize:16,fontWeight:600}}>R$ {formatBRL(remaining)}</div></div>
          </div>
          <div className="row" style={{gap:8}}>
            <button className={`btn ${mode==='total'?'primary':''}`} style={{flex:1,justifyContent:'center'}} onClick={()=>setMode('total')}>Total</button>
            <button className={`btn ${mode==='partial'?'primary':''}`} style={{flex:1,justifyContent:'center'}} onClick={()=>setMode('partial')}>Parcial</button>
          </div>
          <div className="g2">
            <div className="field"><label>Valor</label>
              <div className="input-group"><span className="prefix">R$</span><input className="input mono" type="number" step="0.01" value={mode==='total'?String(remaining):amount} onChange={e=>setAmount(e.target.value)} disabled={mode==='total'}/></div>
            </div>
            <div className="field"><label>Forma</label>
              <select className="select" value={method} onChange={e=>setMethod(e.target.value)}>
                <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Cartão de crédito</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={()=>onSave({amount:effective,method,paid_at:new Date().toISOString()})}><CheckIcon size={14}/> Confirmar</button>
        </div>
      </div>
    </div>
  );
}

export default function Payables() {
  const qc=useQueryClient();
  const [tab,setTab]=useState('all');
  const [menuId,setMenuId]=useState<number|null>(null);
  const [newModal,setNewModal]=useState(false);
  const [payPayable,setPayPayable]=useState<Payable|null>(null);

  const {data:payables=[],isLoading}=useQuery({queryKey:['payables'],queryFn:()=>getPayables()});
  const deleteMut=useMutation({mutationFn:deletePayable,onSuccess:()=>qc.invalidateQueries({queryKey:['payables']})});
  const payMut=useMutation({mutationFn:({id,d}:{id:number;d:unknown})=>registerPayablePayment(id,d as {amount:number;method?:string;paid_at?:string}),onSuccess:()=>{qc.invalidateQueries({queryKey:['payables']});setPayPayable(null);}});

  useEffect(()=>{if(!menuId)return;const h=()=>setMenuId(null);window.addEventListener('click',h);return()=>window.removeEventListener('click',h);},[menuId]);

  const filtered=tab==='all'?payables:payables.filter(p=>p.status===tab);
  const total=payables.reduce((a,p)=>a+Number(p.amount),0);
  const paid=payables.reduce((a,p)=>a+Number(p.amount_paid),0);
  const overdue=payables.filter(p=>p.status!=='closed'&&p.due_date&&new Date(p.due_date)<new Date()).reduce((a,p)=>a+Number(p.amount)-Number(p.amount_paid),0);

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1 className="page-title">Contas a pagar</h1><p className="page-sub">Títulos a pagar a instrutores e fornecedores</p></div>
        <div className="page-actions"><button className="btn primary" onClick={()=>setNewModal(true)}><Plus size={14}/> Novo título</button></div>
      </div>

      <div className="g3">
        <div className="kpi"><div className="kpi-label">Total</div><div className="kpi-value mono"><span className="cur">R$</span>{formatBRL(total)}</div></div>
        <div className="kpi"><div className="kpi-label">A pagar</div><div className="kpi-value mono"><span className="cur">R$</span>{formatBRL(total-paid)}</div></div>
        <div className="kpi"><div className="kpi-label">Vencidos</div><div className="kpi-value mono" style={{color:'var(--danger)'}}><span className="cur">R$</span>{formatBRL(overdue)}</div></div>
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        <div className="filter-bar">
          <div className="tabs" style={{margin:0,border:0}}>
            {[['all','Todos'],['open','A pagar'],['partial','Parcial'],['closed','Pagos']].map(([k,l])=>(
              <button key={k} className={`tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
        </div>
        {isLoading?<div style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>Carregando…</div>:(
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>ID</th><th>Título</th><th>Produto</th><th>Venc.</th><th className="num">Valor</th><th className="num">Pago</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td className="mono" style={{fontSize:11.5}}>#{p.id}</td>
                  <td className="cell-primary">{p.title}</td>
                  <td style={{color:'var(--ink-3)'}}>{p.product??'—'}</td>
                  <td className="mono" style={{fontSize:12}}>{p.due_date?formatDate(p.due_date):'—'}</td>
                  <td className="num mono">R$ {formatBRL(p.amount)}</td>
                  <td className="num mono">{Number(p.amount_paid)>0?`R$ ${formatBRL(p.amount_paid)}`:'—'}</td>
                  <td><span className={`badge ${P_STATUS_BADGE[p.status]??'default'}`}><span className="dot"/>{P_STATUS_LABEL[p.status]??p.status}</span></td>
                  <td style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
                    <button className="icon-btn" onClick={()=>setMenuId(menuId===p.id?null:p.id)}><MoreHorizontal size={15}/></button>
                    {menuId===p.id&&(
                      <div className="row-menu" onClick={()=>setMenuId(null)}>
                        {p.status!=='closed'&&<button onClick={()=>setPayPayable(p)}><CheckIcon size={14}/> Pagar</button>}
                        <div className="row-menu-sep"/>
                        <button className="danger" onClick={()=>{if(confirm('Excluir título?'))deleteMut.mutate(p.id)}}><Trash2 size={14}/> Deletar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>Nenhum título encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {newModal&&<NewPayableModal onClose={()=>setNewModal(false)} onSave={d=>createPayable(d).then(()=>{qc.invalidateQueries({queryKey:['payables']});setNewModal(false);})}/>}
      {payPayable&&<PayModal payable={payPayable} onClose={()=>setPayPayable(null)} onSave={d=>payMut.mutate({id:payPayable.id,d})}/>}
    </div>
  );
}

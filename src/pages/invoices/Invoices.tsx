import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Eye, Check as CheckIcon, X } from 'lucide-react';
import { getBills, createBill } from '../../api/invoices';
import { getCustomers } from '../../api/customers';
import { getReceivables } from '../../api/receivables';
import { formatBRL, formatDate, receivableStatus } from '../../utils/format';
import type { Bill, Customer, Receivable } from '../../types';

const B_STATUS_LABEL: Record<string,string>={open:'Em aberto',partial:'Parcial',paid:'Pago',overdue:'Vencido'};
const B_STATUS_BADGE: Record<string,string>={open:'warn',partial:'accent',paid:'success',overdue:'danger'};

function NewInvoiceModal({ onClose, onSave }: { onClose:()=>void; onSave:(d:{customer_id:number;items:{receivable_id:number;amount:number}[]})=>void }) {
  const [step,setStep]=useState<1|2>(1);
  const [selectedCustomer,setSelectedCustomer]=useState<Customer|null>(null);
  const [selected,setSelected]=useState<Record<number,number>>({});

  const {data:customers=[]}=useQuery({queryKey:['customers'],queryFn:()=>getCustomers()});
  const {data:receivables=[]}=useQuery({queryKey:['receivables'],queryFn:()=>getReceivables(),enabled:!!selectedCustomer});

  const openRecs=receivables.filter(r=>selectedCustomer&&r.client_id===selectedCustomer.id&&receivableStatus(r)!=='paid');
  const total=Object.entries(selected).reduce((s,[,v])=>s+v,0);

  function toggleRec(r: Receivable) {
    const remaining=Number(r.total_amount)-Number(r.amount_received);
    setSelected(s=>s[r.id]!==undefined?Object.fromEntries(Object.entries(s).filter(([k])=>Number(k)!==r.id)):{...s,[r.id]:remaining});
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <div className="modal-head">
          <div><h3 className="modal-title">Nova fatura</h3><div style={{fontSize:11.5,color:'var(--ink-3)'}}>Passo {step} de 2</div></div>
          <button className="icon-btn" onClick={onClose}><X size={16}/></button>
        </div>
        {step===1&&(
          <>
            <div className="modal-body stack">
              <div className="field"><label>Selecionar cliente</label>
                <select className="select" value={selectedCustomer?.id??''} onChange={e=>{const c=customers.find(x=>x.id===Number(e.target.value))??null;setSelectedCustomer(c);setSelected({});}}>
                  <option value="">— Selecione —</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={onClose}>Cancelar</button>
              <button className="btn primary" disabled={!selectedCustomer} onClick={()=>setStep(2)}>Próximo →</button>
            </div>
          </>
        )}
        {step===2&&(
          <>
            <div className="modal-body" style={{padding:0}}>
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th></th><th>Título</th><th className="num">Valor</th><th className="num">Recebido</th><th className="num">A pagar</th></tr></thead>
                  <tbody>
                    {openRecs.length===0&&<tr><td colSpan={5} style={{padding:24,textAlign:'center',color:'var(--ink-3)'}}>Nenhum título em aberto.</td></tr>}
                    {openRecs.map(r=>{
                      const remaining=Number(r.total_amount)-Number(r.amount_received);
                      const checked=r.id in selected;
                      return (
                        <tr key={r.id} style={{cursor:'pointer'}} onClick={()=>toggleRec(r)}>
                          <td><input type="checkbox" checked={checked} onChange={()=>toggleRec(r)} onClick={e=>e.stopPropagation()}/></td>
                          <td>{r.title}</td>
                          <td className="num mono">R$ {formatBRL(r.total_amount)}</td>
                          <td className="num mono">{Number(r.amount_received)>0?`R$ ${formatBRL(r.amount_received)}`:'—'}</td>
                          <td className="num mono">
                            {checked?(
                              <input type="number" step="0.01" min="0.01" max={remaining} className="input mono" style={{width:90,padding:'2px 6px'}} value={selected[r.id]} onClick={e=>e.stopPropagation()} onChange={e=>{const v=Math.min(parseFloat(e.target.value)||0,remaining);setSelected(s=>({...s,[r.id]:v}));}}/>
                            ):`R$ ${formatBRL(remaining)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{padding:'12px 18px',borderTop:'1px solid var(--line)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span className="section-label">Total selecionado</span>
                <span className="mono" style={{fontWeight:600}}>R$ {formatBRL(total)}</span>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={()=>setStep(1)}>← Voltar</button>
              <button className="btn primary" disabled={Object.keys(selected).length===0||total<=0} onClick={()=>onSave({customer_id:selectedCustomer!.id,items:Object.entries(selected).map(([id,amount])=>({receivable_id:Number(id),amount}))})}>
                <CheckIcon size={14}/> Gerar fatura
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Invoices() {
  const navigate=useNavigate();
  const qc=useQueryClient();
  const {data:bills=[],isLoading}=useQuery({queryKey:['bills'],queryFn:getBills});
  const [newModal,setNewModal]=useState(false);
  const [menuId,setMenuId]=useState<number|null>(null);

  const createMut=useMutation({
    mutationFn:createBill,
    onSuccess:()=>{qc.invalidateQueries({queryKey:['bills']});setNewModal(false);}
  });

  // Suppress unused variable warning — menuId drives the row-menu visibility
  void (bills as Bill[]);

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1 className="page-title">Faturas</h1><p className="page-sub">Agrupamento de títulos para pagamento</p></div>
        <div className="page-actions"><button className="btn primary" onClick={()=>setNewModal(true)}><Plus size={14}/> Nova fatura</button></div>
      </div>

      <div className="card" style={{overflow:'hidden'}}>
        {isLoading?<div style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>Carregando…</div>:(
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>ID</th><th>Cliente</th><th>Emissão</th><th className="num">Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {bills.map(b=>(
                <tr key={b.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/invoices/${b.id}`)}>
                  <td className="mono" style={{fontSize:11.5}}>F-{String(b.id).padStart(4,'0')}</td>
                  <td className="cell-primary">{b.customer?.name??`#${b.customer_id}`}</td>
                  <td className="mono" style={{fontSize:12}}>{formatDate(b.issue_date)}</td>
                  <td className="num mono">R$ {formatBRL(b.total_amount)}</td>
                  <td><span className={`badge ${B_STATUS_BADGE[b.status]??'default'}`}><span className="dot"/>{B_STATUS_LABEL[b.status]??b.status}</span></td>
                  <td style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
                    <button className="icon-btn" onClick={()=>setMenuId(menuId===b.id?null:b.id)}><MoreHorizontal size={15}/></button>
                    {menuId===b.id&&(
                      <div className="row-menu" onClick={()=>setMenuId(null)}>
                        <button onClick={()=>navigate(`/invoices/${b.id}`)}><Eye size={14}/> Ver detalhes</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length===0&&<tr><td colSpan={6} style={{padding:32,textAlign:'center',color:'var(--ink-3)'}}>Nenhuma fatura encontrada.</td></tr>}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {newModal&&<NewInvoiceModal onClose={()=>setNewModal(false)} onSave={d=>createMut.mutate(d)}/>}
    </div>
  );
}

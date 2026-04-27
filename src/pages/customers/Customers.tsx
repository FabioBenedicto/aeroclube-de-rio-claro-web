import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customers';
import type { Customer } from '../../types';
import CustomerModal from './CustomerModal';

export default function Customers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: customers = [], isLoading } = useQuery({ queryKey: ['customers'], queryFn: getCustomers });

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [menuId, setMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; customer?: Customer } | null>(null);

  const deleteMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  function closeMenu() { setMenuId(null); }

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.cpf.includes(search);
    const matchCat = catFilter === 'all' || c.categories.includes(catFilter);
    return matchSearch && matchCat;
  });

  function handleSave(data: unknown, id?: number) {
    if (id) {
      updateCustomer(id, data).then(() => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal(null); });
    } else {
      createCustomer(data).then(() => { qc.invalidateQueries({ queryKey: ['customers'] }); setModal(null); });
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-sub">Alunos, sócios e instrutores cadastrados</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => setModal({ mode: 'new' })}>
            <Plus size={14} /> Novo cliente
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="filter-bar">
          <div className="tabs" style={{ margin: 0, border: 0, flex: 1 }}>
            {(['all', 'aluno', 'socio', 'instrutor'] as const).map(cat => (
              <button key={cat} className={`tab ${catFilter === cat ? 'active' : ''}`} onClick={() => setCatFilter(cat)}>
                {cat === 'all' ? 'Todos' : cat === 'aluno' ? 'Alunos' : cat === 'socio' ? 'Sócios' : 'Instrutores'}
              </button>
            ))}
          </div>
          <div className="search">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por nome ou CPF…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Carregando…</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Nome</th><th>CPF</th><th>Categorias</th><th>E-mail</th><th>Créditos</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
                    <td className="cell-primary">{c.name}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{c.cpf}</td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {c.categories.map(cat => (
                          <span key={cat} className={`chip ${cat}`}>{cat === 'socio' ? 'sócio' : cat}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{c.email}</td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {c.flight_hour_balance > 0 ? `${c.flight_hour_balance}h` : '—'}
                    </td>
                    <td style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => setMenuId(menuId === c.id ? null : c.id)}>
                        <MoreHorizontal size={15} />
                      </button>
                      {menuId === c.id && (
                        <div className="row-menu" onClick={closeMenu}>
                          <button onClick={() => navigate(`/customers/${c.id}`)}><Eye size={14} /> Ver detalhes</button>
                          <button onClick={() => setModal({ mode: 'edit', customer: c })}><Edit size={14} /> Editar</button>
                          <div className="row-menu-sep" />
                          <button className="danger" onClick={() => { if (confirm('Excluir cliente?')) deleteMut.mutate(c.id); }}>
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <CustomerModal
          mode={modal.mode}
          customer={modal.customer}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

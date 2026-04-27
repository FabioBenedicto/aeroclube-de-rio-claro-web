import { useAuth } from '../contexts/AuthContext';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatFullDate(): string {
  return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting()}, {firstName}.</h1>
          <p className="page-sub" style={{ textTransform: 'capitalize' }}>{formatFullDate()}</p>
        </div>
      </div>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { toast, extractErrorMessage } from './utils/toast';
import ProtectedRoute from './components/ProtectedRoute';

// Pages (stubs for now — will be filled in subsequent tasks)
import Login from './pages/Login';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Flights from './pages/flights/Flights';
import Planes from './pages/planes/Planes';
import PlaneDetail from './pages/planes/PlaneDetail';
import Receivables from './pages/receivables/Receivables';
import ReceivableDetail from './pages/receivables/ReceivableDetail';
import Payables from './pages/payables/Payables';
import PayableDetail from './pages/payables/PayableDetail';
import Invoices from './pages/invoices/Invoices';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import Companies from './pages/companies/Companies';
import CompanyDetail from './pages/companies/CompanyDetail';
import Settings from './pages/Settings';
import Peoples from './pages/peoples/Peoples';
import PersonDetail from './pages/peoples/PersonDetail';
import Users from './pages/users/Users';
import Reports from './pages/reports/Reports';
import Profile from './pages/Profile';
import Cnab from './pages/cnab/Cnab';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
    mutations: {
      onError: (error) => toast.error(extractErrorMessage(error)),
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="peoples" element={<Peoples />} />
                <Route path="peoples/:id" element={<PersonDetail />} />
                <Route path="companies" element={<Companies />} />
                <Route path="companies/:id" element={<CompanyDetail />} />
                <Route path="flights" element={<Flights />} />
                <Route path="planes" element={<Planes />} />
                <Route path="planes/:id" element={<PlaneDetail />} />
                <Route path="receivables" element={<Receivables />} />
                <Route path="receivables/:id" element={<ReceivableDetail />} />
                <Route path="payables" element={<Payables />} />
                <Route path="payables/:id" element={<PayableDetail />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
                <Route path="cnab" element={<Cnab />} />
                <Route path="reports" element={<Reports />} />
                <Route path="perfil" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="usuarios" element={<Users />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

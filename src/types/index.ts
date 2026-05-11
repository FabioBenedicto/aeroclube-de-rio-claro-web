export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  permissions: string[];
}

export interface Company {
  id: number;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  receivables?: Receivable[];
  payables?: Payable[];
}

export interface Customer {
  id: number;
  cpf: string;
  name: string;
  email: string;
  phone_number?: string;
  flight_hour_balance: number;
  credit_balance?: number;
  created_at: string;
  categories: string[]; // ['aluno', 'socio', 'instrutor']
  instructors: Instructor[];
  students: Student[];
  partners: Partner[];
  employees?: Employee[];
  flights?: Flight[];
  receivables?: Receivable[];
}

export interface Instructor {
  id: number;
  customer_id: number;
  customer?: Customer;
  receivables?: Receivable[];
}

export interface Employee {
  id: number;
  customer_id: number;
  customer?: Customer;
}

export interface Student {
  id: number;
  customer_id: number;
}

export interface Partner {
  id: number;
  monthly_dues: number;
  next_due_date?: string;
  last_payment_date?: string;
  customer_id: number;
  customer?: Customer;
}

export interface Plane {
  id: number;
  registration: string;
  model?: string;
  flight_hour_value: number;
  flights?: Flight[];
  payables?: Payable[];
  receivables?: Receivable[];
}

export interface Flight {
  id: number;
  plane_id: number;
  customer_id: number;
  instructor_id?: number;
  type: string;
  double_command: boolean;
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  total_hours?: number;
  total_amount?: number;
  plane?: Plane;
  customer?: Customer;
  instructor?: Instructor;
}

export interface Receivable {
  id: number;
  client_id?: number;
  company_id?: number;
  flight_id?: number;
  instructor_id?: number;
  plane_id?: number;
  payer_type?: 'customer' | 'company' | 'instructor' | 'partner' | 'employee' | 'none';
  partner_id?: number;
  employee_id?: number;
  title: string;
  description?: string;
  expiration_date: string;
  total_amount: number;
  amount_received: number;
  product?: string;
  status: number; // 0=open, 1=paid
  created_at: string;
  customer?: Customer;
  company?: Company;
  flight?: Flight;
  instructor?: Instructor;
  plane?: Plane;
  partner?: Partner;
  employee?: Employee;
  payments?: ReceivablePayment[];
}

export interface ReceivablePayment {
  id: number;
  receivable_id: number;
  amount_received: number;
  payment_method?: string;
  payment_date: string;
  nota_fiscal_path?: string | null;
}

export interface Payable {
  id: number;
  client_id?: number;
  company_id?: number;
  instructor_id?: number;
  plane_id?: number;
  title: string;
  description?: string;
  amount: number;
  amount_paid: number;
  status: string; // 'open' | 'partial' | 'closed'
  due_date?: string;
  product?: string;
  created_at: string;
  customer?: Customer;
  company?: Company;
  instructor?: Instructor;
  plane?: Plane;
  payments?: PayablePayment[];
}

export interface PayablePayment {
  id: number;
  payable_id: number;
  amount: number;
  method?: string;
  paid_at: string;
  notes?: string;
  nota_fiscal_path?: string | null;
}

export interface Bill {
  id: number;
  customer_id: number;
  total_amount: number;
  issue_date: string;
  due_date?: string;
  paid_at?: string;
  nota_fiscal_path?: string | null;
  customer?: Customer;
  items?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  receivable_id: number;
  amount: number;
  receivable?: Receivable;
}

export interface CreditHistory {
  customer_id: number;
  flight_hour_balance: number;
  movements: ReceivablePayment[];
}

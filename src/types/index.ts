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
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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
  aircraft_type: string;
  flight_hour_value?: number | null;
  flights?: Flight[];
  payables?: Payable[];
  receivables?: Receivable[];
}

export interface FlightCalculationBreakdown {
  aircraft_type: string;
  total_minutes?: number;
  initial_minutes?: number;
  exceeded_minutes?: number;
  initial_value?: number;
  minute_value?: number;
  total_hours?: number;
  flight_hour_value?: number;
  total_amount: number;
}

export interface Flight {
  id: number;
  plane_id: number;
  customer_id: number;
  instructor_id?: number;
  aircraft_type: string;
  type: string;
  double_command: boolean;
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  total_hours?: number;
  total_amount?: number;
  calculation_breakdown?: FlightCalculationBreakdown | null;
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
  expiration_date?: string | null;
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
  partner_id?: number;
  employee_id?: number;
  payer_type?: 'customer' | 'company' | 'instructor' | 'partner' | 'employee' | 'none';
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
  partner?: Partner;
  employee?: Employee;
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
  paid_at?: string | null;
  nota_fiscal_path?: string | null;
  customer?: Customer;
  receivable_payments?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  receivable_id: number;
  amount_received: number;
  receivable?: Receivable;
}

export interface CreditHistory {
  customer_id: number;
  flight_hour_balance: number;
  movements: ReceivablePayment[];
}

export interface Settings {
  instructor_percentage: number;
  partner_monthly_dues: number;
  glider_initial_minutes: number;
  glider_initial_value: number;
  glider_minute_value: number;
  sicoob_cooperativa_prefix?: string;
  sicoob_cooperativa_dv?: string;
  sicoob_conta?: string;
  sicoob_conta_dv?: string;
  sicoob_carteira?: string;
  sicoob_modalidade?: string;
  sicoob_cnpj?: string;
  sicoob_nome_empresa?: string;
  sicoob_remessa_sequence?: number;
}

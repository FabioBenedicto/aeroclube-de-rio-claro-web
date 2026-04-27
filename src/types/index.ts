export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface Customer {
  id: number;
  cpf: string;
  name: string;
  email: string;
  phone_number?: string;
  flight_hour_balance: number;
  created_at: string;
  categories: string[]; // ['aluno', 'socio', 'instrutor']
  instructors: Instructor[];
  students: Student[];
  partners: Partner[];
  flights?: Flight[];
  receivables?: Receivable[];
}

export interface Instructor {
  id: number;
  canac: string;
  cht?: number;
  customer_id: number;
  customer?: Customer;
}

export interface Student {
  id: number;
  voter_registration?: string;
  military_service_certificate?: string;
  canac?: string;
  customer_id: number;
}

export interface Partner {
  id: number;
  monthly_dues: number;
  next_due_date?: string;
  last_payment_date?: string;
  customer_id: number;
}

export interface Plane {
  id: number;
  registration: string;
  model?: string;
  flight_hour_value: number;
  status: string;
  flights?: Flight[];
}

export interface Flight {
  id: number;
  plane_id: number;
  customer_id: number;
  instructor_id?: number;
  type: string;
  double_command: boolean;
  status: 'in-flight' | 'closed' | 'cancelled';
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
  flight_id?: number;
  title: string;
  description?: string;
  expiration_date: string;
  total_amount: number;
  amount_received: number;
  product?: string;
  status: number; // 0=open, 1=paid
  created_at: string;
  customer?: Customer;
  flight?: Flight;
}

export interface ReceivablePayment {
  id: number;
  receivable_id: number;
  amount_received: number;
  payment_method?: string;
  payment_date: string;
  notes?: string;
}

export interface Payable {
  id: number;
  instructor_id?: number;
  title: string;
  description?: string;
  amount: number;
  amount_paid: number;
  status: string; // 'open' | 'partial' | 'closed'
  due_date?: string;
  product?: string;
  created_at: string;
  instructor?: Instructor;
  payments?: PayablePayment[];
}

export interface PayablePayment {
  id: number;
  payable_id: number;
  amount: number;
  method?: string;
  paid_at: string;
  notes?: string;
}

export interface Bill {
  id: number;
  customer_id: number;
  total_amount: number;
  status: string; // 'open' | 'partial' | 'paid' | 'overdue'
  issue_date: string;
  due_date?: string;
  paid_at?: string;
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

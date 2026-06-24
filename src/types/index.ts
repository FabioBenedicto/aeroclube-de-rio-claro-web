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
  role: 'ADMIN' | 'USER';
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

export type PeopleCategory = 'student' | 'partner' | 'instructor' | 'employee';

export interface PeopleAddress {
  id: number;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  people_id: number;
}

export interface People {
  id: number;
  cpf: string;
  name: string;
  email: string;
  phone_number?: string;
  credit_balance?: number;
  created_at: string;
  categories: PeopleCategory[];
  address?: PeopleAddress | null;
  instructors?: Instructor | null;
  students?: Student | null;
  partners?: Partner | null;
  employees?: Employee | null;
  receivables?: Receivable[];
}

export interface Instructor {
  id: number;
  customer_id: number;
  people_id?: number;
  created_at?: string;
  customer?: People;
  people?: People;
  receivables?: Receivable[];
}

export interface Employee {
  id: number;
  customer_id: number;
  people_id?: number;
  created_at?: string;
  customer?: People;
  people?: People;
}

export interface Student {
  id: number;
  customer_id: number;
  people_id?: number;
  created_at?: string;
  people?: People;
}

export interface Partner {
  id: number;
  monthly_dues: number;
  next_due_date?: string;
  last_payment_date?: string;
  customer_id: number;
  people_id?: number;
  created_at?: string;
  customer?: People;
  people?: People;
}

export interface Plane {
  id: number;
  registration: string;
  model?: string;
  type: string;
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
  aircraft_id: number;
  people_id: number;
  student_id?: number;
  partner_id?: number;
  instructor_id?: number;
  type: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  total_hours?: number;
  total_amount?: number;
  calculation_breakdown?: FlightCalculationBreakdown | null;
  aircraft?: Plane;
  people?: People;
  instructor?: Instructor;
}

export interface FlightStats {
  total: number;
  total_hours: number | null;
  total_revenue: number | null;
}

export interface PayableStats {
  total_amount: number;
  amount_paid: number;
}

export interface Receivable {
  id: number;
  person_id?: number;
  people_id?: number;
  company_id?: number;
  flight_id?: number;
  instructor_id?: number;
  plane_id?: number;
  stakeholder?: 'PEOPLE' | 'COMPANY' | 'INSTRUCTOR' | 'PARTNER' | 'EMPLOYEE' | 'NONE' | 'STUDENT';
  partner_id?: number;
  employee_id?: number;
  title: string;
  description?: string;
  expiration_date?: string | null;
  total_amount: number;
  amount_received: number;
  receivable_type_id?: number;
  receivable_type?: ReceivableType;
  adds_credit?: boolean;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  created_at: string;
  person?: People;
  people?: People;
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
  amount: number;
  method?: string;
  paid_at: string;
  file?: { url: string; blob_path: string; original_name: string; mime_type: string; size: number } | null;
}

export interface Payable {
  id: number;
  person_id?: number;
  company_id?: number;
  instructor_id?: number;
  flight_id?: number;
  plane_id?: number;
  partner_id?: number;
  employee_id?: number;
  stakeholder?: 'PEOPLE' | 'COMPANY' | 'INSTRUCTOR' | 'PARTNER' | 'EMPLOYEE' | 'NONE' | 'STUDENT';
  title: string;
  description?: string;
  total_amount: number;
  amount_paid: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  expiration_date?: string;
  payable_type_id?: number;
  payable_type?: { id: number; name: string };
  created_at: string;
  people?: People;
  company?: Company;
  instructor?: Instructor;
  aircraft?: Plane;
  partner?: Partner;
  employee?: Employee;
  flight?: { id: number; type: string; origin: string; destination: string; start_date: string };
  payments?: PayablePayment[];
}

export interface PayablePayment {
  id: number;
  payable_id: number;
  amount: number;
  method?: string;
  paid_at: string;
  notes?: string;
  file?: { url: string; blob_path: string; original_name: string; mime_type: string; size: number } | null;
}

export interface Bill {
  id: number;
  people_id: number;
  total_amount: number;
  created_at: string;
  expiration_date?: string;
  payment_date?: string | null;
  status: 'open' | 'pending_cnab' | 'paid' | 'cancelled';
  payment_method?: string | null;
  file?: { url: string; blob_path: string; original_name: string; mime_type: string; size: number } | null;
  people?: People;
  receivable_payments?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  receivable_id: number;
  amount: number;
  receivable?: Receivable;
}

export interface Settings {
  instructor_percentage: number;
  partner_monthly_dues: number;
  glider_initial_minutes: number;
  glider_initial_value: number;
  glider_minute_value: number;
}

export interface SicoobConfig {
  cooperative_prefix?: string | null;
  cooperative_digit?: string | null;
  branch?: string | null;
  account?: string | null;
  account_digit?: string | null;
  wallet?: string | null;
  modality?: string | null;
  cnpj?: string | null;
  company_name?: string | null;
  remittance_sequence?: number;
  interest_rate?: number;
  interest_period?: number;
  interest_type?: string;
}

export interface CnabRemessa {
  id: number;
  created_at: string;
  sequence_number: number;
  bill_count: number;
  total_amount: number;
  file_path: string;
  bill_ids?: number[];
  bills?: Bill[];
}

export interface PayableType {
  id: number;
  name: string;
  created_at: string;
}

export interface ReceivableType {
  id: number;
  name: string;
  created_at: string;
}

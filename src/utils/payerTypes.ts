import { User, GraduationCap, UserCheck, Users, Briefcase, Building2 } from 'lucide-react';

export const PAYER_TYPES = [
  { value: 'customer',   label: 'Pessoa',      Icon: User },
  { value: 'student',    label: 'Aluno',       Icon: GraduationCap },
  { value: 'instructor', label: 'Instrutor',   Icon: UserCheck },
  { value: 'partner',    label: 'Sócio',       Icon: Users },
  { value: 'employee',   label: 'Funcionário', Icon: Briefcase },
  { value: 'company',    label: 'Empresa',     Icon: Building2 },
] as const;

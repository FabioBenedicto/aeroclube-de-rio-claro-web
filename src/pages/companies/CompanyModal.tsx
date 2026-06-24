import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Company } from '../../types';
import { maskCNPJ, maskPhone, validateCNPJ } from '../../utils/masks';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="text-[11px] text-danger">{msg}</span>;
}

function inputCls(hasError: boolean) {
  return hasError ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--danger)_15%,transparent)]' : '';
}

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function CompanyModal({ company, onClose, onSave }: {
  company?: Company;
  onClose: () => void;
  onSave: (d: unknown) => void;
}) {
  const [form, setForm] = useState({
    name: company?.name ?? '',
    cnpj: company?.cnpj ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
  });

  const [errors, setErrors] = useState<{ name?: string; cnpj?: string; email?: string; phone?: string }>({});
  const [touched, setTouched] = useState<{ cnpj?: boolean; email?: boolean; phone?: boolean }>({});

  const cnpjDigits = form.cnpj.replace(/\D/g, '');
  const cnpjFilled = cnpjDigits.length === 14;
  const cnpjInvalid = cnpjFilled && !validateCNPJ(form.cnpj);

  function touch(field: 'cnpj' | 'email' | 'phone') {
    setTouched(t => ({ ...t, [field]: true }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Razão social é obrigatória.';
    if (!cnpjDigits) {
      e.cnpj = 'CNPJ é obrigatório.';
    } else if (!cnpjFilled) {
      e.cnpj = 'CNPJ incompleto.';
    } else if (cnpjInvalid) {
      e.cnpj = 'CNPJ inválido.';
    }
    if (!form.email.trim()) {
      e.email = 'E-mail é obrigatório.';
    } else if (!validateEmail(form.email)) {
      e.email = 'E-mail inválido.';
    }
    if (!form.phone.trim()) e.phone = 'Telefone é obrigatório.';
    return e;
  }

  function handleSave() {
    setTouched({ cnpj: true, email: true, phone: true });
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onSave({
      name: form.name.trim(),
      cnpj: form.cnpj,
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
  }

  const showCnpjError = errors.cnpj || (touched.cnpj && cnpjInvalid);
  const showEmailError = errors.email || (touched.email && form.email && !validateEmail(form.email));

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <Modal.Header title={company ? 'Editar empresa' : 'Nova empresa'} onClose={onClose} />

      <Modal.Body>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-ink-2">
            Razão social / Nome <span className="text-danger">*</span>
          </label>
          <Input
            placeholder="Razão Social Ltda."
            value={form.name}
            className={inputCls(!!errors.name)}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: undefined })); }}
          />
          <FieldError msg={errors.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-ink-2">
            CNPJ <span className="text-danger">*</span>
          </label>
          <Input
            className={`font-mono ${inputCls(!!showCnpjError)}`}
            placeholder="00.000.000/0000-00"
            value={form.cnpj}
            onChange={e => { setForm(f => ({ ...f, cnpj: maskCNPJ(e.target.value) })); setErrors(v => ({ ...v, cnpj: undefined })); }}
            onBlur={() => touch('cnpj')}
          />
          <FieldError msg={
            errors.cnpj
              ? errors.cnpj
              : touched.cnpj && cnpjInvalid
                ? 'CNPJ inválido.'
                : undefined
          } />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-ink-2">E-mail <span className="text-danger">*</span></label>
          <Input
            type="email"
            placeholder="contato@empresa.com.br"
            className={inputCls(!!showEmailError)}
            value={form.email}
            onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: undefined })); }}
            onBlur={() => touch('email')}
          />
          <FieldError msg={
            errors.email
              ? errors.email
              : touched.email && form.email && !validateEmail(form.email)
                ? 'E-mail inválido.'
                : undefined
          } />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-ink-2">Telefone <span className="text-danger">*</span></label>
          <Input
            className={inputCls(!!errors.phone)}
            placeholder="(00) 00000-0000"
            value={form.phone}
            onChange={e => { setForm(f => ({ ...f, phone: maskPhone(e.target.value) })); setErrors(v => ({ ...v, phone: undefined })); }}
            onBlur={() => touch('phone')}
          />
          <FieldError msg={errors.phone} />
        </div>
      </Modal.Body>

      <Modal.Footer justify="end">
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave}>
          <Check size={14} /> {company ? 'Salvar' : 'Cadastrar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

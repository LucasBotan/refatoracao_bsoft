import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CriarVarejistaPayload, Varejista } from '@/services/varejistasService'

// ── Tipos exportados ──────────────────────────────────────────────────────────

export interface FormState {
  nome: string
  cnpj: string
  consumidor: string
  telefone: string
  email: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  complemento: string
  cidade: string
  estado: string
}

export type FormErrors = Partial<Record<keyof FormState | '_form', string>>

interface VarejistasFormProps {
  initialValues?: Varejista
  ct: string
  errors?: FormErrors
  isLoading?: boolean
  submitLabel?: string
  onSubmit: (payload: CriarVarejistaPayload) => void
  onCancel: () => void
}

// ── Formatadores ──────────────────────────────────────────────────────────────

export function formatarCnpj(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatarTelefone(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatarCep(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

// ── Estado inicial ────────────────────────────────────────────────────────────

const FORM_VAZIO: FormState = {
  nome: '', cnpj: '', consumidor: '', telefone: '',
  email: '', cep: '', endereco: '', numero: '',
  bairro: '', complemento: '', cidade: '', estado: '',
}

function fromVarejista(v: Varejista): FormState {
  return {
    nome: v.nome,
    cnpj: v.cnpj ? formatarCnpj(v.cnpj) : '',
    consumidor: v.consumidor,
    telefone: v.telefone ? formatarTelefone(v.telefone) : '',
    email: v.email,
    cep: v.cep ? formatarCep(v.cep) : '',
    endereco: v.endereco,
    numero: v.numero,
    bairro: v.bairro,
    complemento: v.complemento,
    cidade: v.cidade,
    estado: v.estado,
  }
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

interface CampoProps {
  label: string
  obrigatorio?: boolean
  erro?: string
  children: React.ReactNode
}

function Campo({ label, obrigatorio, erro, children }: CampoProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
        {obrigatorio && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
      </label>
      {children}
      {erro && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}

function inputClass(erro?: string) {
  return cn(
    'mt-0.5 block w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors',
    erro ? 'border-destructive' : 'border-input',
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function VarejistasForm({
  initialValues,
  ct,
  errors = {},
  isLoading = false,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: VarejistasFormProps) {
  const [form, setForm] = useState<FormState>(
    initialValues ? fromVarejista(initialValues) : FORM_VAZIO,
  )
  const [camposComErro, setCamposComErro] = useState<Set<keyof FormState>>(new Set())

  useEffect(() => {
    if (initialValues) {
      setForm(fromVarejista(initialValues))
      setCamposComErro(new Set())
    }
  }, [initialValues?.id])

  function atualizar(campo: keyof FormState, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (errors[campo]) {
      setCamposComErro((prev) => {
        const next = new Set(prev)
        next.delete(campo)
        return next
      })
    }
  }

  function erroField(campo: keyof FormState): string | undefined {
    if (camposComErro.has(campo)) return undefined
    return errors[campo]
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: CriarVarejistaPayload = {
      nome: form.nome.trim(),
      cnpj: form.cnpj.replace(/\D/g, ''),
      consumidor: form.consumidor.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      cep: form.cep.trim(),
      endereco: form.endereco.trim(),
      numero: form.numero.trim(),
      bairro: form.bairro.trim(),
      complemento: form.complemento.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
      ct,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Identificação */}
      <section
        aria-label="Identificação"
        className="rounded-xl border border-border bg-background p-6 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Identificação</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Nome" obrigatorio erro={erroField('nome')}>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Razão social ou nome fantasia"
              className={inputClass(erroField('nome'))}
              aria-required="true"
              disabled={isLoading}
            />
          </Campo>

          <Campo label="CNPJ" obrigatorio erro={erroField('cnpj')}>
            <input
              type="text"
              inputMode="numeric"
              value={form.cnpj}
              onChange={(e) => atualizar('cnpj', formatarCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className={inputClass(erroField('cnpj'))}
              aria-required="true"
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Consumidor" erro={erroField('consumidor')}>
            <input
              type="text"
              value={form.consumidor}
              onChange={(e) => atualizar('consumidor', e.target.value)}
              placeholder="Ex.: B2B, B2C, Varejo"
              className={inputClass(erroField('consumidor'))}
              disabled={isLoading}
            />
          </Campo>
        </div>
      </section>

      {/* Contato */}
      <section
        aria-label="Contato"
        className="rounded-xl border border-border bg-background p-6 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Contato</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="E-mail" erro={erroField('email')}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => atualizar('email', e.target.value)}
              placeholder="contato@empresa.com.br"
              className={inputClass(erroField('email'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Telefone" erro={erroField('telefone')}>
            <input
              type="tel"
              inputMode="numeric"
              value={form.telefone}
              onChange={(e) => atualizar('telefone', formatarTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={inputClass(erroField('telefone'))}
              disabled={isLoading}
            />
          </Campo>
        </div>
      </section>

      {/* Endereço */}
      <section
        aria-label="Endereço"
        className="rounded-xl border border-border bg-background p-6 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold text-foreground">Endereço</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="CEP" erro={erroField('cep')}>
            <input
              type="text"
              inputMode="numeric"
              value={form.cep}
              onChange={(e) => atualizar('cep', formatarCep(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
              className={inputClass(erroField('cep'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Endereço" erro={erroField('endereco')}>
            <input
              type="text"
              value={form.endereco}
              onChange={(e) => atualizar('endereco', e.target.value)}
              placeholder="Logradouro"
              className={inputClass(erroField('endereco'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Número" erro={erroField('numero')}>
            <input
              type="text"
              value={form.numero}
              onChange={(e) => atualizar('numero', e.target.value)}
              placeholder="Nº"
              className={inputClass(erroField('numero'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Bairro" erro={erroField('bairro')}>
            <input
              type="text"
              value={form.bairro}
              onChange={(e) => atualizar('bairro', e.target.value)}
              placeholder="Bairro"
              className={inputClass(erroField('bairro'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Complemento" erro={erroField('complemento')}>
            <input
              type="text"
              value={form.complemento}
              onChange={(e) => atualizar('complemento', e.target.value)}
              placeholder="Apto, sala, bloco…"
              className={inputClass(erroField('complemento'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Cidade" erro={erroField('cidade')}>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => atualizar('cidade', e.target.value)}
              placeholder="Cidade"
              className={inputClass(erroField('cidade'))}
              disabled={isLoading}
            />
          </Campo>

          <Campo label="Estado (UF)" erro={erroField('estado')}>
            <input
              type="text"
              value={form.estado}
              onChange={(e) => atualizar('estado', e.target.value.slice(0, 2).toUpperCase())}
              placeholder="SP"
              maxLength={2}
              className={inputClass(erroField('estado'))}
              disabled={isLoading}
            />
          </Campo>
        </div>
      </section>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {submitLabel}
        </Button>
      </div>

    </form>
  )
}

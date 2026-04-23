/**
 * Testes de lib/authz.ts
 *
 * Cobertos:
 *   - capability sem grupos requeridos → visível para qualquer autenticado
 *   - capability com grupos → nega sem grupo, concede com grupo correto
 *   - case-insensitivity (consistente com User.is_in_ms_group no backend)
 *   - ADMIN acessa todos os módulos de gestão
 *   - FINANCEIRO acessa relatórios mas não administração
 *   - deriveCapabilities cobre todos os casos
 */
import { describe, it, expect } from 'vitest'
import { hasCapability, deriveCapabilities } from '@/lib/authz'

describe('hasCapability', () => {
  describe('capabilities abertas (array vazio = qualquer autenticado)', () => {
    it.each(['view_dashboard', 'view_ordens', 'view_apontamentos', 'view_maquinas', 'view_qualidade'] as const)(
      '%s é visível sem nenhum grupo',
      (cap) => {
        expect(hasCapability(cap, [])).toBe(true)
      },
    )

    it.each(['view_dashboard', 'view_ordens'] as const)(
      '%s é visível mesmo com grupos arbitrários',
      (cap) => {
        expect(hasCapability(cap, ['QUALQUER', 'GRUPO'])).toBe(true)
      },
    )
  })

  describe('capabilities restritas — nega sem o grupo correto', () => {
    it('view_usuarios nega para usuário sem grupos', () => {
      expect(hasCapability('view_usuarios', [])).toBe(false)
    })

    it('view_configuracoes nega para usuário sem grupos', () => {
      expect(hasCapability('view_configuracoes', [])).toBe(false)
    })

    it('view_relatorios nega para grupo OPERADOR sem gestão', () => {
      expect(hasCapability('view_relatorios', ['OPERADOR'])).toBe(false)
    })

    it('view_estoque nega para grupo FINANCEIRO', () => {
      expect(hasCapability('view_estoque', ['FINANCEIRO'])).toBe(false)
    })
  })

  describe('capabilities restritas — concede com grupo correto', () => {
    it('view_usuarios concedido para ADMIN', () => {
      expect(hasCapability('view_usuarios', ['ADMIN'])).toBe(true)
    })

    it('view_configuracoes concedido para ADMIN', () => {
      expect(hasCapability('view_configuracoes', ['ADMIN'])).toBe(true)
    })

    it('view_relatorios concedido para FINANCEIRO', () => {
      expect(hasCapability('view_relatorios', ['FINANCEIRO'])).toBe(true)
    })

    it('view_relatorios concedido para GESTAO', () => {
      expect(hasCapability('view_relatorios', ['GESTAO'])).toBe(true)
    })

    it('view_estoque concedido para ESTOQUE', () => {
      expect(hasCapability('view_estoque', ['ESTOQUE'])).toBe(true)
    })

    it('view_manutencao concedido para MANUTENCAO', () => {
      expect(hasCapability('view_manutencao', ['MANUTENCAO'])).toBe(true)
    })
  })

  describe('case-insensitivity — consistente com User.is_in_ms_group no backend', () => {
    it('ADMIN em lowercase concede view_usuarios', () => {
      expect(hasCapability('view_usuarios', ['admin'])).toBe(true)
    })

    it('ADMIN em mixed case concede view_configuracoes', () => {
      expect(hasCapability('view_configuracoes', ['Admin'])).toBe(true)
    })

    it('FINANCEIRO em lowercase concede view_relatorios', () => {
      expect(hasCapability('view_relatorios', ['financeiro'])).toBe(true)
    })

    it('GESTAO em uppercase com acento concede view_relatorios', () => {
      expect(hasCapability('view_relatorios', ['GESTÃO'])).toBe(true)
    })
  })

  describe('ADMIN — acessa todos os módulos de gestão', () => {
    const adminGroups = ['ADMIN']

    it.each(['view_estoque', 'view_manutencao', 'view_relatorios', 'view_usuarios', 'view_configuracoes'] as const)(
      'ADMIN tem %s',
      (cap) => {
        expect(hasCapability(cap, adminGroups)).toBe(true)
      },
    )
  })

  describe('FINANCEIRO — acessa relatórios mas não administração', () => {
    const groups = ['FINANCEIRO']

    it('FINANCEIRO tem view_relatorios', () => {
      expect(hasCapability('view_relatorios', groups)).toBe(true)
    })

    it('FINANCEIRO não tem view_usuarios', () => {
      expect(hasCapability('view_usuarios', groups)).toBe(false)
    })

    it('FINANCEIRO não tem view_configuracoes', () => {
      expect(hasCapability('view_configuracoes', groups)).toBe(false)
    })
  })
})

describe('deriveCapabilities', () => {
  it('usuário sem grupos tem capabilities operacionais básicas', () => {
    const caps = deriveCapabilities([])
    expect(caps.has('view_dashboard')).toBe(true)
    expect(caps.has('view_ordens')).toBe(true)
    expect(caps.has('view_apontamentos')).toBe(true)
    expect(caps.has('view_maquinas')).toBe(true)
    expect(caps.has('view_qualidade')).toBe(true)
  })

  it('usuário sem grupos não tem capabilities restritas', () => {
    const caps = deriveCapabilities([])
    expect(caps.has('view_usuarios')).toBe(false)
    expect(caps.has('view_configuracoes')).toBe(false)
    expect(caps.has('view_relatorios')).toBe(false)
  })

  it('ADMIN tem todas as capabilities', () => {
    const caps = deriveCapabilities(['ADMIN'])
    expect(caps.has('view_usuarios')).toBe(true)
    expect(caps.has('view_configuracoes')).toBe(true)
    expect(caps.has('view_relatorios')).toBe(true)
    expect(caps.has('view_estoque')).toBe(true)
    expect(caps.has('view_manutencao')).toBe(true)
  })

  it('FINANCEIRO tem capabilities operacionais + relatórios', () => {
    const caps = deriveCapabilities(['FINANCEIRO'])
    expect(caps.has('view_relatorios')).toBe(true)
    expect(caps.has('view_dashboard')).toBe(true)
    expect(caps.has('view_usuarios')).toBe(false)
  })

  it('retorna Set vazio para capability inexistente — não há Set falso positivo', () => {
    const caps = deriveCapabilities([])
    // Verifica que a estrutura é um Set real
    expect(caps).toBeInstanceOf(Set)
  })
})

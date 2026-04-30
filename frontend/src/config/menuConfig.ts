/**
 * menuConfig.ts — fonte de verdade da navegação da aplicação.
 *
 * Cada item define label, caminho, ícone e capability necessária para
 * visibilidade. AppSidebar, AppTopbar (busca) e atalhos rápidos derivam
 * sua estrutura exclusivamente desta configuração — sem hardcode de
 * grupos ou paths espalhados pelos componentes visuais.
 */
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ClipboardList,
  Timer,
  Cpu,
  CheckSquare,
  Package,
  Wrench,
  BarChart2,
  Users,
  Settings,
  Store,
  FileInput,
} from 'lucide-react'
import type { Capability } from '@/lib/authz'

export interface MenuItem {
  label: string
  /** URL path — deve coincidir com a rota registrada no routeTree. */
  path: string
  icon: LucideIcon
  capability: Capability
  category: 'operacao' | 'gestao' | 'recebimento' | 'cadastro'
  /** Descrição curta usada nos cards de atalho rápido. */
  description: string
}

export const MENU_ITEMS: MenuItem[] = [
  // ── Operação — acesso para todos os autenticados ─────────────────────────
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    capability: 'view_dashboard',
    category: 'operacao',
    description: 'Visão geral da planta',
  },
  {
    label: 'Ordens de Produção',
    path: '/ordens',
    icon: ClipboardList,
    capability: 'view_ordens',
    category: 'operacao',
    description: 'Gerir ordens ativas',
  },
  {
    label: 'Apontamentos',
    path: '/apontamentos',
    icon: Timer,
    capability: 'view_apontamentos',
    category: 'operacao',
    description: 'Registrar produção',
  },
  {
    label: 'Máquinas',
    path: '/maquinas',
    icon: Cpu,
    capability: 'view_maquinas',
    category: 'operacao',
    description: 'Status dos equipamentos',
  },
  {
    label: 'Qualidade',
    path: '/qualidade',
    icon: CheckSquare,
    capability: 'view_qualidade',
    category: 'operacao',
    description: 'Controle de qualidade',
  },

  // ── Gestão — requerem grupo específico ou ADMIN ──────────────────────────
  {
    label: 'Estoque',
    path: '/estoque',
    icon: Package,
    capability: 'view_estoque',
    category: 'gestao',
    description: 'Materiais e componentes',
  },
  {
    label: 'Manutenção',
    path: '/manutencao',
    icon: Wrench,
    capability: 'view_manutencao',
    category: 'gestao',
    description: 'Planos e ordens de manutenção',
  },
  {
    label: 'Relatórios',
    path: '/relatorios',
    icon: BarChart2,
    capability: 'view_relatorios',
    category: 'gestao',
    description: 'Análises e exportações',
  },
  {
    label: 'Usuários',
    path: '/usuarios',
    icon: Users,
    capability: 'view_usuarios',
    category: 'gestao',
    description: 'Gerenciar acessos',
  },
  {
    label: 'Configurações',
    path: '/configuracoes',
    icon: Settings,
    capability: 'view_configuracoes',
    category: 'gestao',
    description: 'Parâmetros do sistema',
  },

  // ── Recebimento — entrada de notas e documentos fiscais ─────────────────
  {
    label: 'Entrada de Notas',
    path: '/entrada-nota-fiscal',
    icon: FileInput,
    capability: 'view_entrada_nota_fiscal',
    category: 'recebimento',
    description: 'Importar NF-e via XML',
  },

  // ── Cadastro — módulos de cadastro de entidades ──────────────────────────
  {
    label: 'Varejistas',
    path: '/varejistas',
    icon: Store,
    capability: 'view_varejistas',
    category: 'cadastro',
    description: 'Gerenciar varejistas',
  },
]

export const OPERACAO_ITEMS = MENU_ITEMS.filter((i) => i.category === 'operacao')
export const GESTAO_ITEMS = MENU_ITEMS.filter((i) => i.category === 'gestao')
export const RECEBIMENTO_ITEMS = MENU_ITEMS.filter((i) => i.category === 'recebimento')
export const CADASTRO_ITEMS = MENU_ITEMS.filter((i) => i.category === 'cadastro')

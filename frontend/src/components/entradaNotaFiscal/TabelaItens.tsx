import { BookPlus, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ItemPreview } from '@/services/notaFiscalService'

interface TabelaItensProps {
  itens: ItemPreview[]
  onCadastrarCodigo: (item: ItemPreview) => void
  disabled?: boolean
}

function formatarMoeda(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
  }).format(Number(valor))
}

export function TabelaItens({ itens, onCadastrarCodigo, disabled }: TabelaItensProps) {
  const temNaosCadastrados = itens.some((i) => i.status === 'NAO_CADASTRADO')

  return (
    <section aria-label="Itens da nota fiscal">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Itens da Nota
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({itens.length} {itens.length === 1 ? 'item' : 'itens'})
          </span>
        </h3>

        {temNaosCadastrados && (
          <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Há itens não cadastrados
          </span>
        )}

        {!temNaosCadastrados && itens.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Todos os itens validados
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descrição
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qtd
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vl. Unitário
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                  Gera Saída
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Qtd Restante
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {itens.map((item, idx) => {
                const isNaoCadastrado = item.status === 'NAO_CADASTRADO'
                return (
                  <tr
                    key={`${item.codigo_varejo}-${idx}`}
                    className={cn(
                      'transition-colors',
                      isNaoCadastrado
                        ? 'bg-destructive/5 hover:bg-destructive/10'
                        : 'hover:bg-muted/20',
                    )}
                  >
                    <td className={cn(
                      'px-4 py-3 font-mono text-xs',
                      isNaoCadastrado ? 'text-destructive font-medium' : 'text-muted-foreground',
                    )}>
                      {item.codigo_varejo}
                    </td>
                    <td className={cn(
                      'px-4 py-3 max-w-[200px] truncate',
                      isNaoCadastrado ? 'text-destructive' : 'text-foreground',
                    )}
                      title={item.descricao}
                    >
                      {item.descricao}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right tabular-nums',
                      isNaoCadastrado ? 'text-destructive' : 'text-foreground',
                    )}>
                      {item.quantidade}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right tabular-nums',
                      isNaoCadastrado ? 'text-destructive' : 'text-foreground',
                    )}>
                      {formatarMoeda(item.valor_unitario)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isNaoCadastrado ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                          <XCircle className="h-3 w-3" aria-hidden="true" />
                          Não cadastrado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                        item.gera_saida
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-muted text-muted-foreground',
                      )}>
                        {item.gera_saida ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                      {item.quantidade_restante}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isNaoCadastrado && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCadastrarCodigo(item)}
                          disabled={disabled}
                          className="text-destructive hover:text-destructive hover:border-destructive/50 whitespace-nowrap"
                        >
                          <BookPlus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          Cadastrar
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

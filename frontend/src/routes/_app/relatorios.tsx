import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/relatorios')({
  component: () => (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">
        Relatórios — em construção
      </p>
    </div>
  ),
})

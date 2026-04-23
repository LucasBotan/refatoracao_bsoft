import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/qualidade')({
  component: () => (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">
        Qualidade — em construção
      </p>
    </div>
  ),
})

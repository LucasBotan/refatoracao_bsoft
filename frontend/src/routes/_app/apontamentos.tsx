import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/apontamentos')({
  component: () => (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">
        Apontamentos — em construção
      </p>
    </div>
  ),
})

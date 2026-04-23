import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/**
 * routeTree.gen.ts é gerado automaticamente pelo plugin TanStackRouterVite
 * ao iniciar o servidor Vite (`npm run dev`). Não edite manualmente.
 */
export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

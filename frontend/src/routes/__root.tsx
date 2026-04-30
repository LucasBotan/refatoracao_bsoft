import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProvider } from '@/contexts/UserContext'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <UserProvider>
        <Outlet />
      </UserProvider>
    </AuthProvider>
  ),
})

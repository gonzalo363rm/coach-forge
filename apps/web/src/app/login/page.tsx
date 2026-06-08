import { Suspense } from "react"

import { AuthShell } from "@/components/auth/AuthShell"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthShell
      title="Iniciar sesión"
      description="Accede a tu cuenta de Coach Forge."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}

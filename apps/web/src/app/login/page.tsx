import type { Metadata } from "next"
import { Suspense } from "react"

import { AuthShell } from "@/components/auth/AuthShell"
import { LoginForm } from "@/components/auth/LoginForm"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Iniciar sesión",
  description: "Accedé a tu cuenta de Coach Forge para crear y gestionar ejercicios y clases.",
  path: "/login",
  noIndex: true,
})

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

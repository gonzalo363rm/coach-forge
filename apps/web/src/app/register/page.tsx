import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/AuthShell"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Crear cuenta",
  description: "Registrate en Coach Forge y empezá a crear ejercicios y clases de entrenamiento.",
  path: "/register",
  noIndex: true,
})

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      description="Regístrate para empezar a usar Coach Forge."
    >
      <RegisterForm />
    </AuthShell>
  )
}

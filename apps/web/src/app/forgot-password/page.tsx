import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/AuthShell"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Recuperar contraseña",
  description: "Solicitá un enlace para restablecer la contraseña de tu cuenta en Coach Forge.",
  path: "/forgot-password",
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para elegir una nueva contraseña."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}

import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/AuthShell"
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
  title: "Nueva contraseña",
  description: "Definí una nueva contraseña para tu cuenta de Coach Forge.",
  path: "/reset-password",
  noIndex: true,
})

type Props = {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token?.trim()) {
    return (
      <AuthShell
        title="Enlace inválido"
        description="El enlace de recuperación no es válido o ha caducado."
        footer={
          <Link
            href="/forgot-password"
            className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            Solicitar un nuevo enlace
          </Link>
        }
      >
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Puedes solicitar uno nuevo desde la página de recuperación de
          contraseña.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      description="Elige una contraseña nueva para tu cuenta."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}

import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/AuthShell"
import { createPageMetadata } from "@/lib/seo"
import { verifyEmailToken } from "@/services/auth.service"
import Link from "next/link"

export const metadata: Metadata = createPageMetadata({
  title: "Verificar email",
  description: "Confirmá tu correo electrónico para activar tu cuenta en Coach Forge.",
  path: "/verify-email",
  noIndex: true,
})

type Props = {
  searchParams: Promise<{
    token?: string
    email?: string
  }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, email } = await searchParams

  if (token) {
    const result = await verifyEmailToken(token)

    if (!result.ok) {
      return (
        <AuthShell
          title="Verificación fallida"
          description={result.error}
          footer={
            <Link
              href="/register"
              className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              Volver al registro
            </Link>
          }
        >
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Puedes solicitar un nuevo enlace registrándote de nuevo con el mismo
            email si la cuenta aún no estaba verificada.
          </p>
        </AuthShell>
      )
    }

    return (
      <AuthShell
        title="Email verificado"
        description="Tu cuenta ya está activa. Ya puedes iniciar sesión."
        footer={
          <Link
            href="/login?verified=true"
            className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            Ir a iniciar sesión
          </Link>
        }
      >
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Hemos confirmado <strong>{result.data.email}</strong>.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Revisa tu email"
      description={
        email
          ? `Hemos enviado un enlace de verificación a ${email}.`
          : "Te hemos enviado un enlace para confirmar tu cuenta."
      }
      footer={
        <Link
          href="/login"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Ir a iniciar sesión
        </Link>
      }
    >
      <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Abre el enlace del correo para activar tu cuenta. El enlace caduca en
          24 horas.
        </p>
        <p>
          Si no lo ves, revisa la carpeta de spam.
        </p>
      </div>
    </AuthShell>
  )
}

import { getAppUrl } from "@/lib/app-url"

type SendVerificationEmailInput = {
  to: string
  firstName: string
  token: string
}

function buildVerificationUrl(token: string): string {
  return `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`
}

async function sendWithResend(
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    return { ok: false, error: "Configuración de email incompleta" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error("Resend error:", body)
    return { ok: false, error: "No se pudo enviar el email de verificación" }
  }

  return { ok: true }
}

export async function sendVerificationEmail(
  input: SendVerificationEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const verifyUrl = buildVerificationUrl(input.token)
  const subject = "Verifica tu cuenta en Coach Forge"
  const html = `
    <p>Hola ${input.firstName},</p>
    <p>Gracias por registrarte en Coach Forge. Confirma tu email haciendo clic en el enlace:</p>
    <p><a href="${verifyUrl}">Verificar mi cuenta</a></p>
    <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
    <p>El enlace caduca en 24 horas.</p>
  `

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    return sendWithResend(input.to, subject, html)
  }

  console.info(
    `[email:dev] Verificación para ${input.to}\n${verifyUrl}`,
  )

  return { ok: true }
}

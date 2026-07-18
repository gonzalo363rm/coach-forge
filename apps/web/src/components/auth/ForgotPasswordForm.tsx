"use client"

import { forgotPasswordAction } from "@/app/actions/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { clsx } from "clsx"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  type ForgotPasswordFormInput,
  forgotPasswordSchema,
} from "@/schemas/auth.schema"

import { AuthFieldError } from "./AuthFieldError"
import {
  authInputClass,
  authInputErrorClass,
  authLabelClass,
} from "./auth-input-class"

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: ForgotPasswordFormInput) {
    setServerError(null)

    startTransition(async () => {
      const result = await forgotPasswordAction(values)

      if (!result.ok) {
        setServerError(result.error)
        return
      }

      setSubmittedEmail(result.data.email)
    })
  }

  function inputClass(hasError: boolean) {
    return clsx(authInputClass, hasError && authInputErrorClass)
  }

  if (submittedEmail) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Si existe una cuenta con <strong>{submittedEmail}</strong>, recibirás
          un enlace para restablecer tu contraseña.
        </p>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link
            href="/login"
            className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={authLabelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass(!!errors.email)}
          {...register("email")}
        />
        <AuthFieldError message={errors.email?.message} />
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Enviando enlace..." : "Enviar enlace de recuperación"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  )
}

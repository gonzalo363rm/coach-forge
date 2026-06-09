"use client"

import {
  loginAction,
  resendVerificationAction,
  type AuthErrorCode,
} from "@/app/actions/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { clsx } from "clsx"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { IoRefreshCircleOutline } from "react-icons/io5"

import { type SignInFormInput, signInSchema } from "@/schemas/auth.schema"

import { AuthFieldError } from "./AuthFieldError"
import {
  authInputClass,
  authInputErrorClass,
  authLabelClass,
} from "./auth-input-class"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [resendPending, startResendTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)

  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const verified = searchParams.get("verified") === "true"
  const passwordReset = searchParams.get("reset") === "true"

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignInFormInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: SignInFormInput) {
    setServerError(null)
    setErrorCode(null)
    setResendSuccess(false)

    startTransition(async () => {
      const result = await loginAction({
        ...values,
        callbackUrl,
      })

      if (!result.ok) {
        setServerError(result.error)
        setErrorCode(result.code ?? null)
      }
    })
  }

  function handleResendVerification() {
    setResendSuccess(false)

    startResendTransition(async () => {
      const result = await resendVerificationAction(getValues())

      if (!result.ok) {
        setServerError(result.error)
        setErrorCode(null)
        return
      }

      setServerError(null)
      setErrorCode(null)
      setResendSuccess(true)
    })
  }

  function inputClass(hasError: boolean) {
    return clsx(authInputClass, hasError && authInputErrorClass)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {verified ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Tu email ha sido verificado. Ya puedes iniciar sesión.
        </p>
      ) : null}

      {passwordReset ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Tu contraseña se ha actualizado. Ya puedes iniciar sesión.
        </p>
      ) : null}

      {resendSuccess ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Hemos enviado un nuevo enlace de verificación a tu email.
        </p>
      ) : null}

      {serverError ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1">{serverError}</p>
            {errorCode === "EMAIL_NOT_VERIFIED" ? (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={pending || resendPending}
                title="Reenviar correo de verificación"
                aria-label="Reenviar correo de verificación"
                className="shrink-0 rounded-full p-0.5 text-red-700 transition-colors hover:bg-red-100 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-950 dark:hover:text-red-50"
              >
                <IoRefreshCircleOutline
                  className={clsx(
                    "h-5 w-5",
                    resendPending && "animate-spin",
                  )}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="password" className={authLabelClass}>
            Contraseña
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass(!!errors.password)}
          {...register("password")}
        />
        <AuthFieldError message={errors.password?.message} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Regístrate
        </Link>
      </p>
    </form>
  )
}

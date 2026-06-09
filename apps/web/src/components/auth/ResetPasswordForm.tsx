"use client"

import { resetPasswordAction } from "@/app/actions/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { clsx } from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import {
  type ResetPasswordFormInput,
  resetPasswordFormSchema,
} from "@/schemas/auth.schema"

import { AuthFieldError } from "./AuthFieldError"
import {
  authInputClass,
  authInputErrorClass,
  authLabelClass,
} from "./auth-input-class"

type Props = {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  function onSubmit(values: ResetPasswordFormInput) {
    setServerError(null)

    startTransition(async () => {
      const result = await resetPasswordAction({
        ...values,
        token,
      })

      if (!result.ok) {
        setServerError(result.error)
        return
      }

      router.push("/login?reset=true")
    })
  }

  function inputClass(hasError: boolean) {
    return clsx(authInputClass, hasError && authInputErrorClass)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {serverError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={authLabelClass}>
          Nueva contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass(!!errors.password)}
          {...register("password")}
        />
        <AuthFieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className={authLabelClass}>
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={inputClass(!!errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        <AuthFieldError message={errors.confirmPassword?.message} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Restablecer contraseña"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/forgot-password"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Solicitar un nuevo enlace
        </Link>
      </p>
    </form>
  )
}

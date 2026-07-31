"use client"

import { registerAction } from "@/app/actions/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { clsx } from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  type RegisterFormInput,
  registerSchema,
} from "@/schemas/auth.schema"

import { AuthFieldError } from "./AuthFieldError"
import {
  authInputClass,
  authInputErrorClass,
  authLabelClass,
} from "./auth-input-class"

export function RegisterForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "coach",
      clubName: "",
      clubAddress: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const accountType = watch("accountType")

  function onSubmit(values: RegisterFormInput) {
    setServerError(null)

    startTransition(async () => {
      const result = await registerAction(values)

      if (!result.ok) {
        setServerError(result.error)
        return
      }

      router.push(
        `/verify-email?email=${encodeURIComponent(result.data.email)}`,
      )
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

      <fieldset className="flex flex-col gap-2">
        <legend className={authLabelClass}>Tipo de cuenta</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
            <input type="radio" value="coach" {...register("accountType")} />
            Entrenador
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600">
            <input type="radio" value="club" {...register("accountType")} />
            Club
          </label>
        </div>
      </fieldset>

      {accountType === "club" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="clubName" className={authLabelClass}>
              Nombre del club
            </label>
            <input
              id="clubName"
              className={inputClass(!!errors.clubName)}
              {...register("clubName")}
            />
            <AuthFieldError message={errors.clubName?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="clubAddress" className={authLabelClass}>
              Dirección (opcional)
            </label>
            <input id="clubAddress" className={inputClass(false)} {...register("clubAddress")} />
          </div>
        </>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className={authLabelClass}>
            Nombre
          </label>
          <input
            id="firstName"
            autoComplete="given-name"
            className={inputClass(!!errors.firstName)}
            {...register("firstName")}
          />
          <AuthFieldError message={errors.firstName?.message} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className={authLabelClass}>
            Apellido
          </label>
          <input
            id="lastName"
            autoComplete="family-name"
            className={inputClass(!!errors.lastName)}
            {...register("lastName")}
          />
          <AuthFieldError message={errors.lastName?.message} />
        </div>
      </div>

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
        <label htmlFor="password" className={authLabelClass}>
          Contraseña
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

      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}

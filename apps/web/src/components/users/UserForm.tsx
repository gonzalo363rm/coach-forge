"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { clsx } from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import {
    createUserAction,
    saveMyAvatarAction,
    saveUserAvatarAction,
    updateProfileAction,
    updateUserAction,
} from "@/app/actions/users"
import { UserAvatarField } from "@/components/users/UserAvatarField"
import {
    assignableRolesForActor,
    canManageUserRoles,
    formatUserRole,
} from "@/lib/user-permissions"
import {
    userCreateSchema,
    userProfileUpdateSchema,
    userUpdateSchema,
    type UserCreateInput,
    type UserProfileUpdateInput,
    type UserUpdateInput,
} from "@/schemas/user.schema"
import type { UserSafe } from "@/services/users.service"
import type { Role } from "@prisma/client"
import { readElementImageFile } from "@/utils/element-image-file"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props =
    | { mode: "create"; actorRole: Role }
    | { mode: "edit"; user: UserSafe; actorRole: Role }
    | { mode: "profile"; user: UserSafe }

function fieldClass(hasError: boolean) {
    return clsx(inputClass, hasError && "border-red-500 ring-red-500/30")
}

async function uploadAvatarForUser(
    userId: string,
    file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const image = await readElementImageFile(file)
        const result = await saveUserAvatarAction({
            userId,
            imageBase64: image.imageBase64,
            imageMime: image.imageMime,
        })
        if (!result.ok) {
            return { ok: false, error: result.error }
        }
        return { ok: true }
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al subir la imagen"
        return { ok: false, error: msg }
    }
}

async function uploadAvatarForProfile(
    file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const image = await readElementImageFile(file)
        const result = await saveMyAvatarAction({
            imageBase64: image.imageBase64,
            imageMime: image.imageMime,
        })
        if (!result.ok) {
            return { ok: false, error: result.error }
        }
        return { ok: true }
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al subir la imagen"
        return { ok: false, error: msg }
    }
}

export function UserForm(props: Props) {
    if (props.mode === "profile") {
        return <UserProfileForm user={props.user} />
    }
    if (props.mode === "edit") {
        return <UserEditForm user={props.user} actorRole={props.actorRole} />
    }
    return <UserCreateForm actorRole={props.actorRole} />
}

function UserCreateForm({ actorRole }: { actorRole: Role }) {
    const canEditRole = canManageUserRoles(actorRole)
    const assignableRoles = assignableRolesForActor(actorRole)
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UserCreateInput>({
        resolver: zodResolver(userCreateSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            role: "coach",
            emailVerified: true,
            avatarUrl: "",
            password: "",
            confirmPassword: "",
        },
    })

    const firstName = watch("firstName")
    const lastName = watch("lastName")
    const emailVerified = watch("emailVerified")

    function onSubmit(values: UserCreateInput) {
        setServerError(null)
        startTransition(async () => {
            const result = await createUserAction({
                ...values,
                avatarUrl: pendingAvatarFile ? "" : values.avatarUrl,
            })
            if (!result.ok) {
                setServerError(result.error)
                return
            }

            if (pendingAvatarFile) {
                const upload = await uploadAvatarForUser(result.data.id, pendingAvatarFile)
                if (!upload.ok) {
                    setServerError(
                        `Usuario creado, pero no se pudo subir el avatar: ${upload.error}`,
                    )
                    return
                }
            }

            router.push("/admin/users")
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">Nuevo usuario</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <UserAvatarField
                    firstName={firstName}
                    lastName={lastName}
                    initialUrl={null}
                    onFileSelected={setPendingAvatarFile}
                    onRemove={() => {
                        setPendingAvatarFile(null)
                        setValue("avatarUrl", "")
                    }}
                />
                <input type="hidden" {...register("avatarUrl")} />

                <UserFields
                    register={register}
                    errors={errors}
                    emailVerified={emailVerified}
                    onToggleVerified={() => setValue("emailVerified", !emailVerified)}
                    canEditRole={canEditRole}
                    assignableRoles={assignableRoles}
                />
                <FormActions pending={pending} cancelHref="/admin/users" />
            </form>
        </div>
    )
}

function UserEditForm({ user, actorRole }: { user: UserSafe; actorRole: Role }) {
    const canEditRole = canManageUserRoles(actorRole)
    const assignableRoles = assignableRolesForActor(actorRole)
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
    const [avatarRemoved, setAvatarRemoved] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UserUpdateInput>({
        resolver: zodResolver(userUpdateSchema),
        defaultValues: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber ?? "",
            role: user.role,
            emailVerified: Boolean(user.emailVerified),
            avatarUrl: user.avatarUrl ?? "",
            password: "",
            confirmPassword: "",
        },
    })

    const firstName = watch("firstName")
    const lastName = watch("lastName")
    const emailVerified = watch("emailVerified")
    const avatarPreviewUrl = avatarRemoved ? null : (user.avatarUrl ?? null)

    function onSubmit(values: UserUpdateInput) {
        setServerError(null)
        startTransition(async () => {
            const payload: UserUpdateInput = {
                ...values,
                avatarUrl: avatarRemoved && !pendingAvatarFile ? "" : values.avatarUrl,
            }

            const result = await updateUserAction(payload)
            if (!result.ok) {
                setServerError(result.error)
                return
            }

            if (pendingAvatarFile) {
                const upload = await uploadAvatarForUser(user.id, pendingAvatarFile)
                if (!upload.ok) {
                    setServerError(
                        `Datos guardados, pero no se pudo subir el avatar: ${upload.error}`,
                    )
                    return
                }
            }

            router.push("/admin/users")
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">Editar usuario</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <input type="hidden" {...register("id")} />
                <input type="hidden" {...register("avatarUrl")} />
                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <UserAvatarField
                    firstName={firstName}
                    lastName={lastName}
                    initialUrl={avatarPreviewUrl}
                    onFileSelected={(file) => {
                        setPendingAvatarFile(file)
                        if (file) setAvatarRemoved(false)
                    }}
                    onRemove={() => {
                        setPendingAvatarFile(null)
                        setAvatarRemoved(true)
                        setValue("avatarUrl", "")
                    }}
                />

                <UserFields
                    register={register}
                    errors={errors}
                    emailVerified={emailVerified}
                    onToggleVerified={() => setValue("emailVerified", !emailVerified)}
                    showPasswordHint
                    canEditRole={canEditRole}
                    assignableRoles={assignableRoles}
                />
                <FormActions pending={pending} cancelHref="/admin/users" />
            </form>
        </div>
    )
}

function UserProfileForm({ user }: { user: UserSafe }) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
    const [avatarRemoved, setAvatarRemoved] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<UserProfileUpdateInput>({
        resolver: zodResolver(userProfileUpdateSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber ?? "",
            avatarUrl: user.avatarUrl ?? "",
            password: "",
            confirmPassword: "",
        },
    })

    const firstName = watch("firstName")
    const lastName = watch("lastName")
    const avatarPreviewUrl = avatarRemoved ? null : (user.avatarUrl ?? null)

    function onSubmit(values: UserProfileUpdateInput) {
        setServerError(null)
        startTransition(async () => {
            const payload: UserProfileUpdateInput = {
                ...values,
                avatarUrl: avatarRemoved && !pendingAvatarFile ? "" : values.avatarUrl,
            }

            const result = await updateProfileAction(payload)
            if (!result.ok) {
                setServerError(result.error)
                return
            }

            if (pendingAvatarFile) {
                const upload = await uploadAvatarForProfile(pendingAvatarFile)
                if (!upload.ok) {
                    setServerError(
                        `Datos guardados, pero no se pudo subir el avatar: ${upload.error}`,
                    )
                    return
                }
            }

            router.push("/")
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">Mi perfil</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <input type="hidden" {...register("avatarUrl")} />
                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <UserAvatarField
                    firstName={firstName}
                    lastName={lastName}
                    initialUrl={avatarPreviewUrl}
                    onFileSelected={(file) => {
                        setPendingAvatarFile(file)
                        if (file) setAvatarRemoved(false)
                    }}
                    onRemove={() => {
                        setPendingAvatarFile(null)
                        setAvatarRemoved(true)
                        setValue("avatarUrl", "")
                    }}
                />

                <ProfileFields register={register} errors={errors} />
                <FormActions pending={pending} cancelHref="/" />
            </form>
        </div>
    )
}

type ProfileFieldsProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors: any
}

function ProfileFields({ register, errors }: ProfileFieldsProps) {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="firstName" className={labelClass}>
                        Nombre
                    </label>
                    <input
                        id="firstName"
                        autoComplete="given-name"
                        className={fieldClass(!!errors.firstName)}
                        {...register("firstName")}
                    />
                    {errors.firstName ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {String(errors.firstName.message)}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="lastName" className={labelClass}>
                        Apellido
                    </label>
                    <input
                        id="lastName"
                        autoComplete="family-name"
                        className={fieldClass(!!errors.lastName)}
                        {...register("lastName")}
                    />
                    {errors.lastName ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {String(errors.lastName.message)}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={fieldClass(!!errors.email)}
                    {...register("email")}
                />
                {errors.email ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {String(errors.email.message)}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="phoneNumber" className={labelClass}>
                    Teléfono <span className="font-normal text-zinc-500">(opcional)</span>
                </label>
                <input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    className={fieldClass(!!errors.phoneNumber)}
                    {...register("phoneNumber")}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={labelClass}>
                    Contraseña
                    <span className="font-normal text-zinc-500"> (opcional)</span>
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={fieldClass(!!errors.password)}
                    {...register("password")}
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Dejar vacío para no cambiar la contraseña.
                </p>
                {errors.password ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {String(errors.password.message)}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className={labelClass}>
                    Confirmar contraseña
                    <span className="font-normal text-zinc-500"> (opcional)</span>
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={fieldClass(!!errors.confirmPassword)}
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {String(errors.confirmPassword.message)}
                    </p>
                ) : null}
            </div>
        </>
    )
}

type UserFieldsProps = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors: any
    emailVerified: boolean
    onToggleVerified: () => void
    showPasswordHint?: boolean
    canEditRole: boolean
    assignableRoles: Role[]
}

function UserFields({
    register,
    errors,
    emailVerified,
    onToggleVerified,
    showPasswordHint = false,
    canEditRole,
    assignableRoles,
}: UserFieldsProps) {
    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="firstName" className={labelClass}>
                        Nombre
                    </label>
                    <input
                        id="firstName"
                        autoComplete="given-name"
                        className={fieldClass(!!errors.firstName)}
                        {...register("firstName")}
                    />
                    {errors.firstName ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {String(errors.firstName.message)}
                        </p>
                    ) : null}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="lastName" className={labelClass}>
                        Apellido
                    </label>
                    <input
                        id="lastName"
                        autoComplete="family-name"
                        className={fieldClass(!!errors.lastName)}
                        {...register("lastName")}
                    />
                    {errors.lastName ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {String(errors.lastName.message)}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className={labelClass}>
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={fieldClass(!!errors.email)}
                    {...register("email")}
                />
                {errors.email ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {String(errors.email.message)}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="phoneNumber" className={labelClass}>
                    Teléfono <span className="font-normal text-zinc-500">(opcional)</span>
                </label>
                <input
                    id="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    className={fieldClass(!!errors.phoneNumber)}
                    {...register("phoneNumber")}
                />
            </div>

            {canEditRole ? (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="role" className={labelClass}>
                        Rol
                    </label>
                    <select
                        id="role"
                        className={fieldClass(!!errors.role)}
                        {...register("role")}
                    >
                        {assignableRoles.map((role) => (
                            <option key={role} value={role}>
                                {formatUserRole(role)}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <input type="hidden" {...register("role")} />
            )}

            <div className="flex items-center justify-between gap-3">
                <span className={labelClass}>Email verificado</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={emailVerified}
                    onClick={onToggleVerified}
                    className={`relative h-5 w-10 shrink-0 overflow-hidden rounded-full transition-colors ${
                        emailVerified ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                    }`}
                >
                    <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            emailVerified ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                </button>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className={labelClass}>
                    Contraseña
                    {showPasswordHint ? (
                        <span className="font-normal text-zinc-500"> (opcional)</span>
                    ) : null}
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className={fieldClass(!!errors.password)}
                    {...register("password")}
                />
                {showPasswordHint ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Dejar vacío para no cambiar la contraseña.
                    </p>
                ) : null}
                {errors.password ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {String(errors.password.message)}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className={labelClass}>
                    Confirmar contraseña
                    {showPasswordHint ? (
                        <span className="font-normal text-zinc-500"> (opcional)</span>
                    ) : null}
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={fieldClass(!!errors.confirmPassword)}
                    {...register("confirmPassword")}
                />
                {errors.confirmPassword ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                        {String(errors.confirmPassword.message)}
                    </p>
                ) : null}
            </div>
        </>
    )
}

function FormActions({
    pending,
    cancelHref,
}: {
    pending: boolean
    cancelHref: string
}) {
    return (
        <div className="mt-2 flex flex-wrap gap-3">
            <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
                {pending ? "Guardando…" : "Guardar"}
            </button>
            <Link
                href={cancelHref}
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
                Cancelar
            </Link>
        </div>
    )
}

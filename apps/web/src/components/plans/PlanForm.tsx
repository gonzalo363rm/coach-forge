"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import type { Permission } from "@prisma/client"

import { createPlanAction, updatePlanAction } from "@/app/actions/plans"
import { PlanPermissionsEditor } from "@/components/plans/PlanPermissionsEditor"
import { FormActions } from "@/components/ui/FormActions"
import { useToast } from "@/hooks/use-toast"
import { permissionAppliesToPlanType } from "@/lib/billing-labels"
import {
    planCreateSchema,
    type PlanCreateInput,
    type PlanPermissionInput,
} from "@/schemas/billing.schema"
import type { PlanDetail } from "@/services/plans.service"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props =
    | { mode: "create"; catalog: Permission[] }
    | { mode: "edit"; catalog: Permission[]; plan: PlanDetail }

export function PlanForm(props: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)

    const defaultPermissions: PlanPermissionInput[] =
        props.mode === "edit"
            ? props.plan.permissions.map((row) => ({
                  permissionId: row.permissionId,
                  value: row.value,
              }))
            : []

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(planCreateSchema),
        defaultValues: {
            name: props.mode === "edit" ? props.plan.name : "",
            description: props.mode === "edit" ? (props.plan.description ?? "") : "",
            type: props.mode === "edit" ? props.plan.type : "individual",
            catalogRole: props.mode === "edit" ? props.plan.catalogRole : "none",
            status: props.mode === "edit" ? props.plan.status : "active",
            permissions: defaultPermissions,
        },
    })

    const planType = watch("type")
    const permissions = watch("permissions") ?? []

    function onSubmit(values: PlanCreateInput) {
        setServerError(null)
        const filtered = values.permissions.filter((item) => {
            const permission = props.catalog.find((row) => row.id === item.permissionId)
            if (!permission) return false
            return permissionAppliesToPlanType(permission.appliesToPlanType, values.type)
        })
        startTransition(async () => {
            const payload = { ...values, permissions: filtered }
            const result =
                props.mode === "edit"
                    ? await updatePlanAction({ ...payload, id: props.plan.id })
                    : await createPlanAction(payload)
            if (!result.ok) {
                setServerError(result.error)
                return
            }
            toast({
                type: "success",
                title: props.mode === "edit" ? "Plan actualizado" : "Plan creado",
                message: "Los cambios se guardaron correctamente.",
            })
            router.push(`/admin/plans/${result.data.id}/edit`)
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">
                {props.mode === "edit" ? "Editar plan" : "Nuevo plan"}
            </h1>
            <form onSubmit={handleSubmit((values) => onSubmit(values as PlanCreateInput))} className="flex flex-col gap-4">
                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className={labelClass}>
                        Nombre
                    </label>
                    <input
                        id="name"
                        className={clsx(inputClass, errors.name && "border-red-500")}
                        {...register("name")}
                    />
                    {errors.name ? (
                        <p className="text-xs text-red-600">{errors.name.message}</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="description" className={labelClass}>
                        Descripción{" "}
                        <span className="font-normal text-zinc-500">(opcional)</span>
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        className={inputClass}
                        {...register("description")}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="type" className={labelClass}>
                            Tipo
                        </label>
                        <select id="type" className={inputClass} {...register("type")}>
                            <option value="individual">Individual</option>
                            <option value="club">Club</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="catalogRole" className={labelClass}>
                            Rol de catálogo
                        </label>
                        <select id="catalogRole" className={inputClass} {...register("catalogRole")}>
                            <option value="none">Ninguno</option>
                            <option value="free">Free</option>
                            <option value="full">Full</option>
                        </select>
                        <p className="text-xs text-zinc-500">
                            Solo un Free y un Full por tipo. Free = fallback sin suscripción.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="status" className={labelClass}>
                            Estado
                        </label>
                        <select id="status" className={inputClass} {...register("status")}>
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                </div>

                <Controller
                    control={control}
                    name="permissions"
                    render={({ field }) => (
                        <PlanPermissionsEditor
                            planType={planType}
                            catalog={props.catalog}
                            value={field.value ?? permissions}
                            onChange={(next) => {
                                field.onChange(next)
                                setValue("permissions", next, { shouldDirty: true })
                            }}
                        />
                    )}
                />

                <FormActions
                    pending={pending}
                    cancelHref="/admin/plans"
                    submitLabel={props.mode === "edit" ? "Guardar cambios" : "Crear plan"}
                    className="mt-2"
                />
            </form>
        </div>
    )
}

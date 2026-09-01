"use client"

import type { Permission, PlanType } from "@prisma/client"
import { useMemo } from "react"

import { permissionAppliesToPlanType } from "@/lib/billing-labels"
import type { PlanPermissionInput } from "@/schemas/billing.schema"

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = {
    planType: PlanType
    catalog: Permission[]
    value: PlanPermissionInput[]
    onChange: (next: PlanPermissionInput[]) => void
}

export function PlanPermissionsEditor({ planType, catalog, value, onChange }: Props) {
    const visible = useMemo(
        () =>
            catalog.filter((permission) =>
                permissionAppliesToPlanType(permission.appliesToPlanType, planType),
            ),
        [catalog, planType],
    )

    const byId = useMemo(
        () => new Map(value.map((item) => [item.permissionId, item])),
        [value],
    )

    function setIncluded(permission: Permission, included: boolean) {
        const rest = value.filter((item) => item.permissionId !== permission.id)
        if (!included) {
            onChange(rest)
            return
        }
        onChange([
            ...rest,
            {
                permissionId: permission.id,
                value: permission.valueKind === "limit" ? null : null,
            },
        ])
    }

    function setUnlimited(permissionId: string, unlimited: boolean) {
        onChange(
            value.map((item) =>
                item.permissionId === permissionId
                    ? { ...item, value: unlimited ? null : 1 }
                    : item,
            ),
        )
    }

    function setLimit(permissionId: string, raw: string) {
        const parsed = Number.parseInt(raw, 10)
        onChange(
            value.map((item) =>
                item.permissionId === permissionId
                    ? { ...item, value: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) }
                    : item,
            ),
        )
    }

    if (visible.length === 0) {
        return (
            <p className="text-sm text-zinc-500">No hay permisos activos para este tipo de plan.</p>
        )
    }

    return (
        <fieldset className="flex flex-col gap-3">
            <legend className={labelClass}>Permisos</legend>
            <p className="text-xs text-zinc-500">
                Los flags se habilitan con el check. En los cupos, ilimitado significa sin tope
                (value vacío).
            </p>
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                {visible.map((permission) => {
                    const selected = byId.get(permission.id)
                    const included = Boolean(selected)
                    const unlimited = included && selected?.value == null

                    return (
                        <li key={permission.id} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
                            <label className="flex flex-1 items-start gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                                <input
                                    type="checkbox"
                                    className="mt-1"
                                    checked={included}
                                    onChange={(event) =>
                                        setIncluded(permission, event.target.checked)
                                    }
                                />
                                <span>
                                    <span className="font-medium">{permission.name}</span>
                                    {permission.description ? (
                                        <span className="mt-0.5 block text-xs text-zinc-500">
                                            {permission.description}
                                        </span>
                                    ) : null}
                                </span>
                            </label>

                            {permission.valueKind === "limit" && included ? (
                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                                        <input
                                            type="checkbox"
                                            checked={unlimited}
                                            onChange={(event) =>
                                                setUnlimited(permission.id, event.target.checked)
                                            }
                                        />
                                        Ilimitado
                                    </label>
                                    {!unlimited ? (
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                                            value={selected?.value ?? 0}
                                            onChange={(event) =>
                                                setLimit(permission.id, event.target.value)
                                            }
                                        />
                                    ) : null}
                                </div>
                            ) : null}
                        </li>
                    )
                })}
            </ul>
        </fieldset>
    )
}

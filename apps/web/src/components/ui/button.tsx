import { clsx } from "clsx"
import Link from "next/link"
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react"

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "soft"
    | "danger"
    | "info"
    | "ghost"

export type ButtonSize = "sm" | "md"

const baseClass =
    "inline-flex cursor-pointer items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950"

const variantClass: Record<ButtonVariant, string> = {
    primary:
        "border border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
    secondary:
        "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
    soft: "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/70",
    danger:
        "border border-transparent bg-red-600 text-white hover:bg-red-700",
    info: "border border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 dark:hover:bg-indigo-900/40",
    ghost: "border border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
}

const sizeClass: Record<ButtonSize, string> = {
    sm: "rounded-lg px-3 py-1.5 text-xs",
    md: "rounded-lg px-4 py-2.5 text-sm",
}

export type ButtonClassOptions = {
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
    className?: string
}

export function buttonClass({
    variant = "primary",
    size = "md",
    fullWidth = false,
    className,
}: ButtonClassOptions = {}): string {
    return clsx(
        baseClass,
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
    )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    ButtonClassOptions & {
        children: ReactNode
    }

export function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    className,
    type = "button",
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={buttonClass({ variant, size, fullWidth, className })}
            {...props}
        >
            {children}
        </button>
    )
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> &
    ButtonClassOptions & {
        children: ReactNode
    }

export function ButtonLink({
    variant = "secondary",
    size = "md",
    fullWidth = false,
    className,
    children,
    ...props
}: ButtonLinkProps) {
    return (
        <Link
            className={buttonClass({ variant, size, fullWidth, className })}
            {...props}
        >
            {children}
        </Link>
    )
}

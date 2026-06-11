import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
    code: string
    icon: ReactNode
    title: string
    description: string
    hint?: string
}

export function FunErrorPage({
    code,
    icon,
    title,
    description,
    hint,
}: Props) {
    return (
        <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                <div className="mb-6 select-none">{icon}</div>
                <p className="font-mono text-sm font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    {code}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-zinc-800 dark:text-white sm:text-4xl">
                    {title}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {description}
                </p>
                {hint ? (
                    <p className="mt-3 text-sm italic text-zinc-500 dark:text-zinc-500">
                        {hint}
                    </p>
                ) : null}
                <Link
                    href="/"
                    className="mt-8 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}

import Link from "next/link"
import type { ReactNode } from "react"

type Props = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, description, children, footer }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-6 space-y-2 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              Coach Forge
            </Link>
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">
              {title}
            </h1>
            {description ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>
          {children}
          {footer ? (
            <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              {footer}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

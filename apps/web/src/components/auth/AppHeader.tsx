import Link from "next/link"

import { auth } from "@/auth"

import { LogoutButton } from "./LogoutButton"

export async function AppHeader() {
  const session = await auth()
  if (!session?.user) return null

  const { firstName, lastName } = session.user

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          Coach Forge
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {firstName} {lastName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}

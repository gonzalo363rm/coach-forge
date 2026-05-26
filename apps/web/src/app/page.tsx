import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
          Coach Forge
        </h1>
        <Link
          href="/classes/new"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Nueva clase
        </Link>

        <Link
          href="/classes/list"
          className="rounded-lg border border-emerald-600 px-6 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        >
          Lista de clases
        </Link>

        <Link
          href="/exercises/new"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Nuevo ejercicio
        </Link>

        <Link
          href="/exercises/list"
          className="rounded-lg border border-emerald-600 px-6 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        >
          Lista de ejercicios
        </Link>

        <Link
          href="/elements/list"
          className="rounded-lg border border-emerald-600 px-6 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
        >
          Lista de elementos
        </Link>

        <Link
          href="/sports/list"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Ver deportes
        </Link>
      </main>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
          Coach Forge
        </h1>
        <Link
          href="/exercice/edit"
          className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Abrir Editor
        </Link>
      </main>
    </div>
  );
}

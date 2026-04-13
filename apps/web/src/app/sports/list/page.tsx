/** Revalidación ISR: 7 días */
export const revalidate = 60 * 60 * 24 * 7;

import { getSportsPaginatedAction } from "@/app/actions/sports";
import { SportsPaginatedTable } from "@/components/sports/SportsPaginatedTable";
import Link from "next/link";

interface Props {
    searchParams: Promise<{ page?: string }>;
}

export default async function Sports({ searchParams }: Props) {
    const params = await searchParams;
    const rawPage = params.page ? parseInt(params.page, 10) : 1
    const page = Number.isNaN(rawPage) ? 1 : rawPage
    const result = await getSportsPaginatedAction({ page })

    if (!result.ok) {
        return (
            <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
                <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
                    <p className="text-center text-zinc-600 dark:text-zinc-400">
                        {result.error}
                    </p>
                    <Link
                        href="/"
                        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                    >
                        Volver al inicio
                    </Link>
                </main>
            </div>
        );
    }

    const { sports, totalPages } = result.data

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                            Deportes
                        </h1>
                        <Link
                            href="/sports/new"
                            aria-label="Agregar deporte"
                            title="Agregar deporte"
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-300 text-xl font-semibold leading-none text-emerald-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 dark:border-zinc-600 dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/40"
                        >
                            +
                        </Link>
                    </div>
                </header>

                <SportsPaginatedTable sports={sports} totalPages={totalPages} />
            </main>
        </div>
    );
}

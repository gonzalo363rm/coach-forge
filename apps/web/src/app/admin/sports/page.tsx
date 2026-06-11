/** Revalidación ISR: 7 días */
export const revalidate = 60 * 60 * 24 * 7;

import { getSportsPaginatedAction } from "@/app/actions/sports";
import { ListNewLink } from "@/components/ui/ListNewLink";
import { SportsPaginatedTable } from "@/components/sports/SportsPaginatedTable";
import {
    sportListSortBySchema,
    type SportListSortBy,
} from "@/schemas/sport.schema";
import Link from "next/link";

function firstQueryValue(v: string | string[] | undefined): string {
    if (v === undefined) return "";
    return Array.isArray(v) ? (v[0] ?? "") : v;
}

interface Props {
    searchParams: Promise<{
        page?: string | string[];
        search?: string | string[];
        sortBy?: string | string[];
        sortDir?: string | string[];
    }>;
}

export default async function Sports({ searchParams }: Props) {
    const params = await searchParams;
    const rawPage = firstQueryValue(params.page);
    const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
    const page = Number.isNaN(parsedPage) ? 1 : parsedPage;

    const search = firstQueryValue(params.search) || null;

    const sortByParsed = sportListSortBySchema.safeParse(firstQueryValue(params.sortBy));
    const sortBy: SportListSortBy = sortByParsed.success ? sortByParsed.data : "name";
    const sortDirRaw = firstQueryValue(params.sortDir);
    const sortDir: "asc" | "desc" = sortDirRaw === "desc" ? "desc" : "asc";

    const listQueryKey = [page, search ?? "", sortBy, sortDir].join("|");
    const listState = {
        search: search ?? "",
        sortBy,
        sortDir,
    };

    const result = await getSportsPaginatedAction({
        page,
        filters: { search },
        sortBy,
        sortDir,
    });

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
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Deportes
                    </h1>
                    <ListNewLink href="/admin/sports/new" ariaLabel="Nuevo deporte" />
                </header>

                <SportsPaginatedTable
                    key={listQueryKey}
                    sports={sports}
                    totalPages={totalPages}
                    listState={listState}
                />
            </main>
        </div>
    );
}

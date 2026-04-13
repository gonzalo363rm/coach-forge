'use client'

import { generatePaginationNumbers } from '@/utils/generatePaginationNumbers';
import Link from 'next/link';
import { redirect, usePathname, useSearchParams } from 'next/navigation';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import clsx from 'clsx';

interface Props {
    totalPages: number;
}

export const Pagination = ({ totalPages }: Props) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const pageString = searchParams.get('page') ?? '1';
    const pageIsNaN = isNaN( +pageString );
    const currentPage = pageIsNaN ? 1 : +pageString;

    if(currentPage <= 0 || pageIsNaN ) redirect(pathname);

    if(totalPages === 1) return;

    const allPages = generatePaginationNumbers({ currentPage, totalPages });

    const createPageUrl = ({ pageNumber }: { pageNumber: number | string }) => {
        const params = new URLSearchParams(searchParams);

        if (pageNumber === '...') { // devuelve el mismo url en el que estamos, pero scroll al top
            return `${pathname}?${params.toString()}`;
        }

        if (+pageNumber <= 0) { // el + para hacerlo number por si es string, no deberia pasar igualmente
            return `${pathname}`;
        }

        if (+pageNumber > totalPages) { // se queda en la ruta actual
            return `${pathname}?${params.toString()}`;
        }

        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    }

    return (
        <div className="mb-16 mt-4 flex justify-center text-center">
            <nav aria-label="Paginación">
                <ul className="flex list-none flex-wrap items-center justify-center gap-0.5">
                    <li>
                        <Link
                            className="relative block rounded-md border-0 bg-transparent px-3 py-1.5 text-zinc-800 outline-none transition-colors duration-200 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
                            href={createPageUrl({ pageNumber: currentPage - 1 })}
                        >
                            <IoChevronBackOutline size={30} />
                        </Link>
                    </li>

                    {allPages.map((page) => (
                        <li key={page}>
                            <Link
                                href={createPageUrl({ pageNumber: page })}
                                className={clsx(
                                    "relative block min-w-9 rounded-md border-0 px-3 py-1.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
                                    {
                                        "bg-transparent text-zinc-800 hover:bg-zinc-200 dark:text-zinc-200 dark:hover:bg-zinc-800":
                                            page !== currentPage,
                                        "bg-emerald-600 font-medium text-white shadow-sm hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500":
                                            page === currentPage,
                                    },
                                )}
                            >
                                {page}
                            </Link>
                        </li>
                    ))}

                    <li>
                        <Link
                            className="relative block rounded-md border-0 bg-transparent px-3 py-1.5 text-zinc-800 outline-none transition-colors duration-200 hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:focus-visible:ring-offset-zinc-950"
                            href={createPageUrl({ pageNumber: currentPage + 1 })}
                        >
                            <IoChevronForwardOutline size={30} />
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}




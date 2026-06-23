const listFilterOddChildSpanClass =
    "[&:has(>:last-child:nth-child(odd))>:nth-last-child(2)]:col-span-2 sm:[&:has(>:last-child:nth-child(odd))>:nth-last-child(2)]:col-span-1"

export const listFilterFormClass = [
    "grid w-full grid-cols-2 gap-3",
    listFilterOddChildSpanClass,
    "sm:flex sm:flex-nowrap sm:items-center",
].join(" ")

export const listFilterFieldClass =
    "col-span-1 min-w-0 w-full sm:col-span-1 sm:w-auto sm:shrink-0"

export const listFilterSearchClass = [
    "col-span-2 min-w-0 min-h-8 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 sm:col-span-1 sm:flex-1 sm:basis-0 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100",
].join(" ")

export const listFilterSelectClass = [
    listFilterFieldClass,
    "min-h-8 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200",
].join(" ")

export const listFilterButtonClass = [
    "col-span-2 min-h-8 w-full rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:col-span-1 sm:w-auto sm:shrink-0",
].join(" ")

export const listFilterSkeletonFormClass = [
    "grid w-full min-w-0 max-w-full grid-cols-2 gap-3 sm:gap-4",
    listFilterOddChildSpanClass,
    "sm:flex sm:min-w-0 sm:flex-nowrap sm:items-center",
].join(" ")

export const listFilterSkeletonSearchClass =
    "col-span-2 min-h-8 min-w-0 w-full rounded-md sm:col-span-1 sm:min-h-9 sm:min-w-0 sm:flex-[1.25] sm:basis-0"

export const listFilterSkeletonSelectClass =
    "col-span-1 min-h-8 min-w-0 w-full rounded-md sm:col-span-1 sm:min-h-9 sm:min-w-0 sm:flex-1 sm:basis-0"

export const listFilterSkeletonButtonClass =
    "col-span-2 min-h-8 w-full rounded-lg sm:col-span-1 sm:min-h-9 sm:w-24 sm:shrink-0"

import { Skeleton } from "./Skeleton"

type Props = {
    maxWidth?: "lg" | "2xl"
    fieldCount?: number
}

export function FormPageLoading({ maxWidth = "lg", fieldCount = 6 }: Props) {
    const widthClass = maxWidth === "2xl" ? "max-w-2xl" : "max-w-lg"

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <div
                    className={`mx-auto w-full ${widthClass} rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950`}
                >
                    <Skeleton className="mb-6 h-8 w-48" />
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: fieldCount }, (_, index) => (
                            <div key={index} className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ))}
                        <div className="mt-2 flex justify-end gap-3">
                            <Skeleton className="h-10 w-24 rounded-lg" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

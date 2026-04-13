import { SportForm } from "@/components/sports/SportForm"

export default function SportNewPage() {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-8">
                <SportForm mode="create" />
            </div>
        </div>
    )
}

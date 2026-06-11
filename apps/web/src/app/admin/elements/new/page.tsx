import { ElementForm } from "@/components/elements/ElementForm"
import { sportsListAll } from "@/services/sports.service"

export default async function ElementNewPage() {
    const sportRows = await sportsListAll()
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full flex-1 flex-col gap-6 p-8">
                <ElementForm mode="create" sports={sports} />
            </main>
        </div>
    )
}

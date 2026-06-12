import { SportForm } from "@/components/sports/SportForm"
import { sportsGetById } from "@/services/sports.service"
import { notFound } from "next/navigation"

interface Props {
    params: Promise<{ id: string }>
}

export default async function SportEditPage({ params }: Props) {
    const { id } = await params
    const sport = await sportsGetById(id)
    if (!sport) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <SportForm mode="edit" sport={sport} />
            </div>
        </div>
    )
}

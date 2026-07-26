import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import { ClassSessionRunner } from "@/components/classes/ClassSessionRunner"
import { createPageMetadata } from "@/lib/seo"
import { canManageOwnedResource } from "@/lib/user-permissions"
import { buildClassSessionData } from "@/utils/build-class-session-data"
import { trainingClassGetById } from "@/services/classes.service"
import { sportsListAll } from "@/services/sports.service"

export const metadata: Metadata = createPageMetadata({
    title: "Sesión de clase",
    description: "Ejecutá una sesión de entrenamiento en vivo con el runner de Coach Forge.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function StartClassPage({ params }: Props) {
    const { id } = await params
    const [trainingClass, sports, session] = await Promise.all([
        trainingClassGetById(id),
        sportsListAll(),
        auth(),
    ])

    if (!trainingClass) {
        notFound()
    }

    if (trainingClass.items.length === 0) {
        return (
            <PageRoot>
                <Link
                    href="/classes/mine"
                    className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                >
                    ← Clases
                </Link>
                <p className="mt-6 text-zinc-600 dark:text-zinc-400">
                    Esta clase no tiene ejercicios.{" "}
                    <Link
                        href={`/classes/${id}/edit`}
                        className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        Añade ejercicios
                    </Link>{" "}
                    antes de comenzar.
                </p>
            </PageRoot>
        )
    }

    const classSession = await buildClassSessionData(trainingClass)
    const canManage = Boolean(
        session?.user && canManageOwnedResource(session.user, trainingClass.creatorId),
    )

    return (
        <PageRoot>
            <ClassSessionRunner
                session={classSession}
                canManage={canManage}
                sports={sports}
            />
        </PageRoot>
    )
}

function PageRoot({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6 sm:p-8">
                {children}
            </main>
        </div>
    )
}

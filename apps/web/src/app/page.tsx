import { auth } from "@/auth"

export default async function Home() {
    const session = await auth()
    const firstName = session?.user?.firstName ?? ""

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 p-8">
                <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                    Coach Forge
                </h1>
                {firstName ? (
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        Hola, {firstName}. Usa el menú superior para crear o gestionar tu
                        contenido.
                    </p>
                ) : (
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        Plataforma de entrenamiento deportivo.
                    </p>
                )}
            </main>
        </div>
    )
}

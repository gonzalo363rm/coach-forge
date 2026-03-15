import { ExerciseEditor } from "@/components/exercise-canvas/ExerciseEditor";

export default function ExerciceEditPage() {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="flex flex-1 flex-col items-center gap-8 p-8">
                <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                    Coach Forge
                </h1>
                <ExerciseEditor />
            </main>
        </div>
    );
}


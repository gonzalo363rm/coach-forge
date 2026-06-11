import { revalidatePath } from "next/cache"

export function revalidateExercisesViews() {
    revalidatePath("/admin/exercises")
    revalidatePath("/exercises/mine")
}

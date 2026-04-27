import { revalidatePath } from "next/cache"

export function revalidateExercisesViews() {
    revalidatePath("/exercises/list")
}

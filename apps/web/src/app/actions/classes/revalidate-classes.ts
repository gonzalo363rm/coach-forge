import { revalidatePath } from "next/cache"

export function revalidateClassesViews(classId?: string) {
    revalidatePath("/classes/list")
    if (classId) {
        revalidatePath(`/classes/${classId}/edit`)
    }
}

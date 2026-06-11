import { revalidatePath } from "next/cache"

export function revalidateClassesViews(classId?: string) {
    revalidatePath("/admin/classes")
    revalidatePath("/classes/mine")
    if (classId) {
        revalidatePath(`/classes/${classId}/edit`)
    }
}

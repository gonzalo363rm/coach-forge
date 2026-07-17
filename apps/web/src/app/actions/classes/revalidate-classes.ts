import { revalidatePath, revalidateTag } from "next/cache"

import { HOME_CATALOG_CACHE_TAG } from "@/services/home-catalog.service"

export function revalidateClassesViews(classId?: string) {
    revalidatePath("/")
    revalidatePath("/admin/classes")
    revalidatePath("/classes/mine")
    revalidateTag(HOME_CATALOG_CACHE_TAG, "max")
    if (classId) {
        revalidatePath(`/classes/${classId}/edit`)
    }
}

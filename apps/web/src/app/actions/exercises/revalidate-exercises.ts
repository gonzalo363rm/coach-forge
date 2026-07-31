import { revalidatePath, revalidateTag } from "next/cache"

import { HOME_CATALOG_CACHE_TAG, HOME_CLUB_CATALOG_CACHE_TAG } from "@/services/home-catalog.service"

export function revalidateExercisesViews() {
    revalidatePath("/")
    revalidatePath("/admin/exercises")
    revalidatePath("/exercises/mine")
    revalidateTag(HOME_CATALOG_CACHE_TAG, "max")
    revalidateTag(HOME_CLUB_CATALOG_CACHE_TAG, "max")
}

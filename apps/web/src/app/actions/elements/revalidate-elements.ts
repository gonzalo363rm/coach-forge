import { revalidatePath } from "next/cache"

export function revalidateElementsViews() {
    revalidatePath("/admin/elements")
    revalidatePath("/exercises/new")
    revalidatePath("/exercises/[id]/edit", "page")
}

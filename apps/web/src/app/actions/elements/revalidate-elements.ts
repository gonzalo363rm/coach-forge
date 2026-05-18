import { revalidatePath } from "next/cache"

export function revalidateElementsViews() {
    revalidatePath("/elements/list")
    revalidatePath("/exercises/new")
    revalidatePath("/exercises/[id]/edit", "page")
}

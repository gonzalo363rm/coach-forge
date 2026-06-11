import { revalidatePath } from "next/cache"

export function revalidateSportsViews() {
    revalidatePath("/admin/sports")
}

import { revalidatePath } from "next/cache"

export function revalidateSportsViews() {
    revalidatePath("/sports/list")
}

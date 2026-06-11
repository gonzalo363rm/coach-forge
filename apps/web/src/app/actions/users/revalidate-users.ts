import { revalidatePath } from "next/cache"

export function revalidateUsersViews() {
    revalidatePath("/admin/users")
}

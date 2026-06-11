import { UserForm } from "@/components/users/UserForm"

export default function UserNewPage() {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <UserForm mode="create" />
            </div>
        </div>
    )
}

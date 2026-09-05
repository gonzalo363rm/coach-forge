import { getContactEmail } from "@/lib/contact"
import { SITE_NAME } from "@/lib/seo"

export function SiteFooter() {
    const email = getContactEmail()

    return (
        <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 sm:px-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    © {new Date().getFullYear()} {SITE_NAME}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Ante cualquier consulta estamos disponibles para vos. Contactanos a{" "}
                    <a
                        href={`mailto:${email}`}
                        className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                        {email}
                    </a>
                    .
                </p>
            </div>
        </footer>
    )
}

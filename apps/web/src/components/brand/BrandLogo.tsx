import Link from "next/link"
import { Michroma } from "next/font/google"
import clsx from "clsx"

const brandFont = Michroma({
    subsets: ["latin"],
    weight: "400",
})

type Props = {
    className?: string
}

export function BrandLogo({ className }: Props) {
    return (
        <Link
            href="/"
            aria-label="Coach Forge — inicio"
            className={clsx(
                "brand-logo inline-flex flex-col items-center transition-opacity hover:opacity-90",
                brandFont.className,
                className,
            )}
        >
            <span className="brand-logo-title" aria-hidden="true">
                <span className="brand-logo-coach">COACH</span>
                {" "}
                <span className="brand-logo-forge">FORGE</span>
            </span>
            <span className="brand-logo-tagline" aria-hidden="true">
                <span className="brand-logo-dash brand-logo-dash--left" />
                <span className="brand-logo-tagline-text">FORGE YOUR GAME</span>
                <span className="brand-logo-dash brand-logo-dash--right" />
            </span>
        </Link>
    )
}

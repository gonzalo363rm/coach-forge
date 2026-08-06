"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { IoChevronBack, IoChevronForward } from "react-icons/io5"

type Props = {
    children: ReactNode
    ariaLabel: string
    className?: string
}

const SCROLL_STEP_RATIO = 0.85

export function HorizontalScrollStrip({ children, ariaLabel, className = "" }: Props) {
    const stripRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = useCallback(() => {
        const el = stripRef.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        setCanScrollLeft(scrollLeft > 4)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
    }, [])

    useEffect(() => {
        const el = stripRef.current
        if (!el) return

        updateScrollState()

        el.addEventListener("scroll", updateScrollState, { passive: true })
        const observer = new ResizeObserver(updateScrollState)
        observer.observe(el)

        return () => {
            el.removeEventListener("scroll", updateScrollState)
            observer.disconnect()
        }
    }, [updateScrollState, children])

    function scrollByDirection(direction: -1 | 1) {
        const el = stripRef.current
        if (!el) return
        el.scrollBy({
            left: direction * el.clientWidth * SCROLL_STEP_RATIO,
            behavior: "smooth",
        })
    }

    const showArrows = canScrollLeft || canScrollRight

    return (
        <div className={`relative ${className}`}>
            {showArrows ? (
                <>
                    <ScrollArrow
                        direction="left"
                        visible={canScrollLeft}
                        onClick={() => scrollByDirection(-1)}
                    />
                    <ScrollArrow
                        direction="right"
                        visible={canScrollRight}
                        onClick={() => scrollByDirection(1)}
                    />
                </>
            ) : null}

            <div
                ref={stripRef}
                role="region"
                aria-label={ariaLabel}
                className="app-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {children}
            </div>
        </div>
    )
}

function ScrollArrow({
    direction,
    visible,
    onClick,
}: {
    direction: "left" | "right"
    visible: boolean
    onClick: () => void
}) {
    const isLeft = direction === "left"

    return (
        <button
            type="button"
            aria-label={isLeft ? "Ver anteriores" : "Ver siguientes"}
            onClick={onClick}
            className={`absolute top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-900 ${
                isLeft ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
            } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
            {isLeft ? (
                <IoChevronBack className="size-5" aria-hidden />
            ) : (
                <IoChevronForward className="size-5" aria-hidden />
            )}
        </button>
    )
}

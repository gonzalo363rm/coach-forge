export function formatMmSs(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds))
    const minutes = Math.floor(safe / 60)
    const seconds = safe % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function formatEstimatedMinutes(totalSeconds: number): string {
    if (totalSeconds <= 0) return "—"
    const minutes = Math.ceil(totalSeconds / 60)
    return `${minutes} min`
}

export function formatClock(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds))
    const minutes = Math.floor(safe / 60)
    const seconds = safe % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

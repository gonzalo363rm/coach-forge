export function exercisePreviewFilename(exerciseId: string): string {
    return `exercise-${exerciseId}.webp`
}

export function exercisePreviewPublicUrl(exerciseId: string): string {
    return `/exercises/${exercisePreviewFilename(exerciseId)}`
}

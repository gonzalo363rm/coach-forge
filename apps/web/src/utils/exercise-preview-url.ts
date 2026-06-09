export function exercisePreviewFilename(exerciseId: string): string {
  return `exercise-${exerciseId}.webp`
}

/** @deprecated Usa `resolveExercisePreviewUrl` en servidor. */
export function exercisePreviewPublicUrl(exerciseId: string): string {
  return `/exercises/${exercisePreviewFilename(exerciseId)}`
}

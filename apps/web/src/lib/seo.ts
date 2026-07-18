import type { Metadata } from "next"

import { getAppUrl } from "@/lib/app-url"

export const SITE_NAME = "Coach Forge"

export const DEFAULT_DESCRIPTION =
  "Creá y organizá ejercicios y clases de entrenamiento con un editor visual 2D. Plantillas públicas, sesiones en vivo y herramientas para coaches."

type PageMetadataInput = {
  title: string
  description: string
  /** Ruta canónica, p. ej. `/login`. */
  path?: string
  /** No indexar (páginas privadas / auth / admin). */
  noIndex?: boolean
  /** Si true, el title no usa el template del layout. */
  absoluteTitle?: boolean
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const url = path ? new URL(path, getAppUrl()).toString() : undefined

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: "es",
      type: "website",
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

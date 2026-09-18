import { defaultCache, PAGES_CACHE_NAME } from "@serwist/next/worker"
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist"
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist"

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
    }
}

declare const self: ServiceWorkerGlobalScope

const PAGE_MAX_ENTRIES = 64
const PAGE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
/** Si la red no responde, usar la última respuesta cacheada. */
const NETWORK_TIMEOUT_SECONDS = 3

/**
 * NetworkFirst para páginas/RSC: con red usa datos frescos y guarda caché;
 * sin red (o timeout) sirve la última consulta que funcionó.
 */
const offlineAwarePages: RuntimeCaching[] = [
    {
        matcher: ({ request, url: { pathname }, sameOrigin }) =>
            request.headers.get("RSC") === "1" &&
            request.headers.get("Next-Router-Prefetch") === "1" &&
            sameOrigin &&
            !pathname.startsWith("/api/"),
        handler: new NetworkFirst({
            cacheName: PAGES_CACHE_NAME.rscPrefetch,
            networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
            plugins: [
                new ExpirationPlugin({
                    maxEntries: PAGE_MAX_ENTRIES,
                    maxAgeSeconds: PAGE_MAX_AGE_SECONDS,
                }),
            ],
        }),
    },
    {
        matcher: ({ request, url: { pathname }, sameOrigin }) =>
            request.headers.get("RSC") === "1" &&
            sameOrigin &&
            !pathname.startsWith("/api/"),
        handler: new NetworkFirst({
            cacheName: PAGES_CACHE_NAME.rsc,
            networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
            plugins: [
                new ExpirationPlugin({
                    maxEntries: PAGE_MAX_ENTRIES,
                    maxAgeSeconds: PAGE_MAX_AGE_SECONDS,
                }),
            ],
        }),
    },
    {
        matcher: ({ request, url: { pathname }, sameOrigin }) =>
            sameOrigin &&
            !pathname.startsWith("/api/") &&
            (request.mode === "navigate" || request.destination === "document"),
        handler: new NetworkFirst({
            cacheName: PAGES_CACHE_NAME.html,
            networkTimeoutSeconds: NETWORK_TIMEOUT_SECONDS,
            plugins: [
                new ExpirationPlugin({
                    maxEntries: PAGE_MAX_ENTRIES,
                    maxAgeSeconds: PAGE_MAX_AGE_SECONDS,
                }),
            ],
        }),
    },
    // Mutaciones (server actions, POST, etc.): nunca cachear; fallan offline.
    {
        matcher: ({ request, sameOrigin }) =>
            sameOrigin && request.method !== "GET" && request.method !== "HEAD",
        handler: new NetworkOnly(),
    },
]

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [...offlineAwarePages, ...defaultCache],
    fallbacks: {
        entries: [
            {
                url: "/~offline",
                matcher({ request }) {
                    return request.destination === "document" || request.mode === "navigate"
                },
            },
        ],
    },
})

serwist.addEventListeners()

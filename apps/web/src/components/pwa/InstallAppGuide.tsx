"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import {
    IoCheckmarkCircle,
    IoCopyOutline,
    IoLogoApple,
    IoLogoAndroid,
} from "react-icons/io5"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIosDevice(): boolean {
    if (typeof window === "undefined") return false
    const ua = window.navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) return true
    return (
        navigator.platform === "MacIntel" &&
        typeof navigator.maxTouchPoints === "number" &&
        navigator.maxTouchPoints > 1
    )
}

function isStandaloneDisplay(): boolean {
    if (typeof window === "undefined") return false
    if (window.matchMedia("(display-mode: standalone)").matches) return true
    const nav = window.navigator as Navigator & { standalone?: boolean }
    return nav.standalone === true
}

export function InstallAppGuide() {
    const { toast } = useToast()
    const [appUrl, setAppUrl] = useState("")
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
    const [standalone, setStandalone] = useState(false)
    const [platform, setPlatform] = useState<"unknown" | "ios" | "android">("unknown")

    useEffect(() => {
        setAppUrl(window.location.origin)
        setStandalone(isStandaloneDisplay())
        setPlatform(isIosDevice() ? "ios" : "android")

        const onBeforeInstall = (event: Event) => {
            event.preventDefault()
            setDeferred(event as BeforeInstallPromptEvent)
        }
        window.addEventListener("beforeinstallprompt", onBeforeInstall)
        return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall)
    }, [])

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.origin)
            toast({
                type: "success",
                title: "Enlace copiado",
                message: "Pegalo en Safari o Chrome del celular.",
            })
        } catch {
            toast({
                type: "error",
                message: "No se pudo copiar. Copiá la URL de la barra de direcciones.",
            })
        }
    }, [toast])

    const installNative = useCallback(async () => {
        if (!deferred) return
        try {
            await deferred.prompt()
            await deferred.userChoice
        } catch {
            // cancelado
        } finally {
            setDeferred(null)
        }
    }, [deferred])

    return (
        <div className="flex flex-col gap-8">
            {standalone ? (
                <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100"
                >
                    <IoCheckmarkCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                    <p>
                        Ya estás usando Coach Forge como app en este dispositivo. Podés
                        compartir estas instrucciones con alguien más o instalarla en otro
                        celular.
                    </p>
                </div>
            ) : null}

            <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Desde la computadora
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Abrí Coach Forge en el navegador del celular (Safari en iPhone, Chrome en
                    Android) y seguí los pasos de abajo. Podés copiar el enlace:
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {appUrl || "…"}
                    </code>
                    <Button
                        type="button"
                        size="sm"
                        variant="soft"
                        className="shrink-0"
                        onClick={() => void copyLink()}
                    >
                        <IoCopyOutline className="size-4" aria-hidden />
                        Copiar enlace
                    </Button>
                </div>
            </section>

            {!standalone && deferred && platform === "android" ? (
                <section className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30 sm:p-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        En este dispositivo
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Tu navegador permite instalar Coach Forge ahora mismo.
                    </p>
                    <Button type="button" className="mt-4" onClick={() => void installNative()}>
                        Instalar app
                    </Button>
                </section>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
                <article
                    className={`flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-zinc-950 ${
                        platform === "ios"
                            ? "border-emerald-300 dark:border-emerald-800"
                            : "border-zinc-200 dark:border-zinc-800"
                    }`}
                >
                    <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                            <IoLogoApple className="size-5" aria-hidden />
                            <h2 className="text-lg font-semibold">iPhone / iPad</h2>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Usando Safari (iOS).
                        </p>
                    </div>
                    <div className="relative aspect-4/3 bg-zinc-950">
                        <Image
                            src="/images/install/ios-safari-v2.png"
                            alt="Safari en iPhone: botón Compartir y opción Agregar a pantalla de inicio"
                            fill
                            className="object-contain"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                    </div>
                    <ol className="list-decimal space-y-2 px-5 py-4 pl-9 text-sm text-zinc-700 dark:text-zinc-300">
                        <li>Abrí Coach Forge en Safari.</li>
                        <li>
                            Tocá el botón{" "}
                            <span className="font-medium text-zinc-900 dark:text-white">
                                Compartir
                            </span>{" "}
                            (cuadrado con flecha hacia arriba).
                        </li>
                        <li>
                            Elegí{" "}
                            <span className="font-medium text-zinc-900 dark:text-white">
                                Agregar a pantalla de inicio
                            </span>{" "}
                            y confirmá.
                        </li>
                    </ol>
                </article>

                <article
                    className={`flex flex-col overflow-hidden rounded-xl border bg-white dark:bg-zinc-950 ${
                        platform === "android"
                            ? "border-emerald-300 dark:border-emerald-800"
                            : "border-zinc-200 dark:border-zinc-800"
                    }`}
                >
                    <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                            <IoLogoAndroid className="size-5" aria-hidden />
                            <h2 className="text-lg font-semibold">Android</h2>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Preferí Chrome u otro navegador basado en Chromium.
                        </p>
                    </div>
                    <div className="relative aspect-4/3 bg-zinc-950">
                        <Image
                            src="/images/install/android-chrome-v2.png"
                            alt="Chrome en Android: menú de tres puntos e Instalar app"
                            fill
                            className="object-contain"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                    </div>
                    <ol className="list-decimal space-y-2 px-5 py-4 pl-9 text-sm text-zinc-700 dark:text-zinc-300">
                        <li>Abrí Coach Forge en Chrome.</li>
                        <li>
                            Tocá el menú{" "}
                            <span className="font-medium text-zinc-900 dark:text-white">⋮</span>{" "}
                            (arriba a la derecha).
                        </li>
                        <li>
                            Elegí{" "}
                            <span className="font-medium text-zinc-900 dark:text-white">
                                Instalar app
                            </span>{" "}
                            o{" "}
                            <span className="font-medium text-zinc-900 dark:text-white">
                                Agregar a pantalla de inicio
                            </span>
                            .
                        </li>
                    </ol>
                </article>
            </div>
        </div>
    )
}

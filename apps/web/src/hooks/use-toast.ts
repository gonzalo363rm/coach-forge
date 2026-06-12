"use client"

import { useToastStore } from "@/stores/toast.store"

export type { ToastInput } from "@/stores/toast.store"

export function useToast() {
    const toast = useToastStore((s) => s.toast)
    return { toast }
}

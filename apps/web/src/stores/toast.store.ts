import { create } from "zustand"

export type ToastType = "error" | "success" | "info"

export type ToastInput = {
    type?: ToastType
    title?: string
    message: string
    /** Auto-cierre en ms (por defecto 4500). */
    durationMs?: number
}

type Toast = Required<Pick<ToastInput, "message">> &
    Pick<ToastInput, "title"> & {
        id: string
        type: ToastType
        durationMs: number
    }

type ToastState = {
    toasts: Toast[]
    toast: (input: ToastInput) => void
    remove: (id: string) => void
}

let toastSeq = 0

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],

    remove: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }))
    },

    toast: (input) => {
        const id = `${Date.now()}_${toastSeq++}`
        const next: Toast = {
            id,
            type: input.type ?? "info",
            title: input.title,
            message: input.message,
            durationMs: input.durationMs ?? 4500,
        }

        set((state) => ({ toasts: [...state.toasts, next] }))

        window.setTimeout(() => {
            get().remove(id)
        }, next.durationMs)
    },
}))

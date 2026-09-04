/** Alarma de cronómetro con unlock explícito para iOS Safari. */

let audioContext: AudioContext | null = null
let alarmElement: HTMLAudioElement | null = null
let alarmObjectUrl: string | null = null
let unlocked = false

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!audioContext) {
        const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext
        if (!Ctx) return null
        audioContext = new Ctx()
    }
    return audioContext
}

/** WAV corto con 3 beeps (más fiable en iOS que osciladores sueltos tras un timer). */
function buildAlarmWavBlob(): Blob {
    const sampleRate = 22050
    const beeps: { freq: number; startMs: number; durationMs: number }[] = [
        { freq: 880, startMs: 0, durationMs: 180 },
        { freq: 880, startMs: 280, durationMs: 180 },
        { freq: 1174, startMs: 560, durationMs: 280 },
    ]
    const totalMs = 900
    const numSamples = Math.ceil((sampleRate * totalMs) / 1000)
    const samples = new Float32Array(numSamples)

    for (const beep of beeps) {
        const start = Math.floor((beep.startMs / 1000) * sampleRate)
        const len = Math.floor((beep.durationMs / 1000) * sampleRate)
        for (let i = 0; i < len; i++) {
            const t = i / sampleRate
            const env =
                Math.min(1, i / (0.02 * sampleRate)) *
                Math.min(1, (len - i) / (0.04 * sampleRate))
            const idx = start + i
            if (idx < numSamples) {
                samples[idx] += Math.sin(2 * Math.PI * beep.freq * t) * 0.55 * env
            }
        }
    }

    const dataSize = numSamples * 2
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
    }

    writeStr(0, "RIFF")
    view.setUint32(4, 36 + dataSize, true)
    writeStr(8, "WAVE")
    writeStr(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, "data")
    view.setUint32(40, dataSize, true)

    let offset = 44
    for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]!))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
        offset += 2
    }

    return new Blob([buffer], { type: "audio/wav" })
}

function ensureAlarmElement(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null
    if (alarmElement) return alarmElement

    alarmObjectUrl = URL.createObjectURL(buildAlarmWavBlob())
    alarmElement = new Audio(alarmObjectUrl)
    alarmElement.preload = "auto"
    alarmElement.setAttribute("playsinline", "true")
    return alarmElement
}

function playBeep(ctx: AudioContext, startAt: number, frequency: number, duration: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = frequency
    const peak = 0.4
    gain.gain.setValueAtTime(0.001, startAt)
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startAt)
    osc.stop(startAt + duration + 0.05)
}

function playWebAudioAlarm(ctx: AudioContext) {
    const t0 = ctx.currentTime + 0.02
    playBeep(ctx, t0, 880, 0.18)
    playBeep(ctx, t0 + 0.28, 880, 0.18)
    playBeep(ctx, t0 + 0.56, 1174, 0.28)
}

/**
 * Debe llamarse dentro de un gesto del usuario (tap en Play, etc.).
 * En iOS Safari el AudioContext / <audio> quedan muteados hasta ese unlock.
 */
export function unlockTimerAudio(): void {
    if (typeof window === "undefined") return

    const ctx = getAudioContext()
    if (ctx?.state === "suspended") {
        void ctx.resume()
    }

    if (unlocked && ctx?.state === "running") {
        return
    }

    if (ctx) {
        void ctx.resume()
        try {
            const buffer = ctx.createBuffer(1, 1, 22050)
            const source = ctx.createBufferSource()
            source.buffer = buffer
            source.connect(ctx.destination)
            source.start(0)
        } catch {
            // ignore
        }
    }

    const audio = ensureAlarmElement()
    if (audio) {
        const wasMuted = audio.muted
        audio.muted = true
        audio.currentTime = 0
        void audio
            .play()
            .then(() => {
                audio.pause()
                audio.currentTime = 0
                audio.muted = wasMuted
                unlocked = true
            })
            .catch(() => {
                audio.muted = wasMuted
            })
    }

    unlocked = true
}

/** Vibración: solo Android / algunos Chromium. iOS Safari no soporta vibrate. */
function vibrateTimerAlarm(): void {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
        return
    }
    try {
        navigator.vibrate([180, 80, 180, 80, 280])
    } catch {
        // ignore
    }
}

/** Tres tonos + vibración (si el SO lo permite) al fin de cronómetro. */
export function playTimerAlarm(): void {
    vibrateTimerAlarm()

    const audio = ensureAlarmElement()
    if (audio) {
        try {
            audio.muted = false
            audio.currentTime = 0
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                void playPromise.catch(() => {
                    // Si falla (aún no unlockeado), intentar Web Audio por si acaso.
                    playWebAudioFallback()
                })
                return
            }
        } catch {
            // fall through
        }
    }

    playWebAudioFallback()
}

function playWebAudioFallback(): void {
    const ctx = getAudioContext()
    if (!ctx) return

    const run = () => playWebAudioAlarm(ctx)
    if (ctx.state === "suspended") {
        void ctx.resume().then(run).catch(() => {})
        return
    }
    run()
}

export function isTimerAudioUnlocked(): boolean {
    return unlocked
}

let audioContext: AudioContext | null = null

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

function playBeep(ctx: AudioContext, startAt: number, frequency: number, duration: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startAt)
    osc.stop(startAt + duration + 0.05)
}

/** Tres tonos cortos para avisar fin de cronómetro (ejercicio o descanso). */
export function playTimerAlarm(): void {
    const ctx = getAudioContext()
    if (!ctx) return

    void ctx.resume().then(() => {
        const t0 = ctx.currentTime + 0.05
        playBeep(ctx, t0, 880, 0.18)
        playBeep(ctx, t0 + 0.28, 880, 0.18)
        playBeep(ctx, t0 + 0.56, 1174, 0.28)
    })
}

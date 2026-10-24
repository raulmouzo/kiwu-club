// Native Web Audio synthesizer for tactile UI feedback without external audio files.

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    void audioCtx.resume()
  }
  return audioCtx
}

/** Plays the signature dual-tone NFC card payment success chime */
export function playPaymentBeep() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = "sine"
    osc1.frequency.setValueAtTime(987.77, now) // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08) // E6

    osc2.type = "triangle"
    osc2.frequency.setValueAtTime(1975.53, now) // B6
    osc2.frequency.setValueAtTime(2637.02, now + 0.08) // E7

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.36)
    osc2.stop(now + 0.36)
  } catch {
    // Ignore autoplay or audio context constraints
  }
}

/** Plays a soft coffee-house bell when a new order arrives on the staff board */
export function playOrderBell() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(659.25, now) // E5
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.6) // C5

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.95)
  } catch {
    // Ignore errors
  }
}

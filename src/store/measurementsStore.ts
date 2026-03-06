import { create } from 'zustand'

export interface Measurement {
  id: string
  timestamp: number
  depth: number       // глубина, м
  rpm: number         // обороты, об/мин
  wob: number         // нагрузка на долото, кН
  torque: number      // крутящий момент, кН·м
  rop: number         // скорость проходки, м/ч
  pressure: number    // давление, МПа
  temperature: number // температура, °C
}

export interface TelemetryPoint {
  timestamp: number
  rpm: number
  wob: number
  torque: number
  rop: number
  pressure: number
  temperature: number
  magneticToolface?: number
  vibAx?: number
  vibLat?: number
  gammaRay?: number
  resistivity?: number
}

interface MeasurementsState {
  measurements: Measurement[]
  telemetry: TelemetryPoint[]
  isRecording: boolean
  addMeasurement: (m: Omit<Measurement, 'id' | 'timestamp'>) => void
  removeMeasurement: (id: string) => void
  addTelemetryPoint: (point: Omit<TelemetryPoint, 'timestamp'>) => void
  clearTelemetry: () => void
  setRecording: (value: boolean) => void
}

// --- Demo seed data ---

function rnd(base: number, spread: number) {
  return base + (Math.random() - 0.5) * 2 * spread
}

const DEMO_MEASUREMENTS: Measurement[] = [
  { id: 'd1', timestamp: Date.now() - 7200_000, depth: 2180.0, rpm: 88,  wob: 52.1, torque: 8.4, rop: 11.2, pressure: 22.8, temperature: 61.5 },
  { id: 'd2', timestamp: Date.now() - 5400_000, depth: 2240.5, rpm: 95,  wob: 55.0, torque: 8.9, rop: 13.0, pressure: 23.4, temperature: 63.2 },
  { id: 'd3', timestamp: Date.now() - 3600_000, depth: 2310.0, rpm: 91,  wob: 57.3, torque: 9.1, rop: 12.5, pressure: 24.1, temperature: 65.8 },
  { id: 'd4', timestamp: Date.now() - 1800_000, depth: 2370.8, rpm: 94,  wob: 59.8, torque: 9.6, rop: 14.1, pressure: 24.7, temperature: 67.3 },
  { id: 'd5', timestamp: Date.now() - 600_000,  depth: 2412.3, rpm: 97,  wob: 61.2, torque: 9.8, rop: 15.3, pressure: 25.1, temperature: 68.9 },
]

const _now = Date.now()
const DEMO_TELEMETRY: TelemetryPoint[] = Array.from({ length: 120 }, (_, i) => {
  const phase = i / 20
  return {
    timestamp:        _now - (120 - i) * 1000,
    rpm:              90   + Math.sin(phase * 1.3) * 8   + rnd(0, 3),
    wob:              58   + Math.sin(phase * 0.9) * 5   + rnd(0, 2),
    torque:           9.4  + Math.sin(phase * 1.1) * 0.8 + rnd(0, 0.3),
    rop:              13.5 + Math.sin(phase * 0.7) * 3   + rnd(0, 1.5),
    pressure:         24.5 + Math.sin(phase * 1.5) * 1   + rnd(0, 0.4),
    temperature:      68   + (i / 120) * 2               + rnd(0, 0.5),
    magneticToolface: 245  + Math.sin(phase * 2) * 12    + rnd(0, 5),
    vibAx:            0.3  + Math.abs(Math.sin(phase * 3)) * 0.6 + rnd(0, 0.15),
    vibLat:           0.2  + Math.abs(Math.sin(phase * 2.5)) * 0.4 + rnd(0, 0.1),
    gammaRay:         65   + Math.sin(phase * 0.5) * 40  + rnd(0, 15),
    resistivity:      12   + Math.sin(phase * 0.8) * 8   + rnd(0, 3),
  }
})

// --- Store ---

export const useMeasurementsStore = create<MeasurementsState>((set) => ({
  measurements: DEMO_MEASUREMENTS,
  telemetry: DEMO_TELEMETRY,
  isRecording: true,

  addMeasurement: (m) =>
    set((state) => ({
      measurements: [
        ...state.measurements,
        { ...m, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),

  removeMeasurement: (id) =>
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
    })),

  addTelemetryPoint: (point) =>
    set((state) => ({
      telemetry: [
        ...state.telemetry.slice(-299),
        { ...point, timestamp: Date.now() },
      ],
    })),

  clearTelemetry: () => set({ telemetry: [] }),

  setRecording: (value) => set({ isRecording: value }),
}))

import { create } from 'zustand'

export interface Survey {
  id: string
  md: number   // Measured Depth, м
  inc: number  // Inclination, °
  azi: number  // Azimuth, °
  tvd: number  // True Vertical Depth, м (calculated)
  dls: number  // Dogleg Severity, °/30м (calculated)
}

const toRad = (deg: number) => (deg * Math.PI) / 180

function calcPoint(
  prev: Survey | null,
  md: number,
  inc: number,
  azi: number,
): { tvd: number; dls: number } {
  if (!prev) {
    return { tvd: md * Math.cos(toRad(inc)), dls: 0 }
  }

  const dMD = md - prev.md
  if (dMD <= 0) return { tvd: prev.tvd, dls: 0 }

  const inc1 = toRad(prev.inc)
  const inc2 = toRad(inc)
  const azi1 = toRad(prev.azi)
  const azi2 = toRad(azi)

  // Dogleg angle (Minimum Curvature)
  const cosDL =
    Math.cos(inc2 - inc1) -
    Math.sin(inc1) * Math.sin(inc2) * (1 - Math.cos(azi2 - azi1))
  const dl = Math.acos(Math.max(-1, Math.min(1, cosDL)))

  // Ratio factor
  const rf = dl < 1e-10 ? 1 : (2 / dl) * Math.tan(dl / 2)

  const tvd = prev.tvd + (dMD / 2) * (Math.cos(inc1) + Math.cos(inc2)) * rf
  const dls = ((dl * 180) / Math.PI / dMD) * 30

  return { tvd, dls }
}

function recalcAll(sorted: Survey[]): Survey[] {
  const result: Survey[] = []
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? result[i - 1] : null
    const { tvd, dls } = calcPoint(prev, sorted[i].md, sorted[i].inc, sorted[i].azi)
    result.push({ ...sorted[i], tvd, dls })
  }
  return result
}

interface SurveysState {
  surveys: Survey[]
  addSurvey: (md: number, inc: number, azi: number) => void
  removeSurvey: (id: string) => void
}

const DEMO_SURVEYS_RAW = [
  { md:    0, inc:  0.0, azi:   0.0 },
  { md:  300, inc:  0.0, azi:   0.0 },
  { md:  600, inc:  3.2, azi: 244.5 },
  { md:  900, inc:  8.7, azi: 245.1 },
  { md: 1200, inc: 16.4, azi: 245.8 },
  { md: 1500, inc: 26.1, azi: 245.3 },
  { md: 1800, inc: 35.9, azi: 244.9 },
  { md: 2100, inc: 42.5, azi: 245.6 },
  { md: 2400, inc: 44.8, azi: 245.2 },
  { md: 2412, inc: 45.1, azi: 245.4 },
]

function buildDemoSurveys(): Survey[] {
  const raw = DEMO_SURVEYS_RAW.map((r) => ({
    ...r,
    id: `demo-${r.md}`,
    tvd: 0,
    dls: 0,
  }))
  return recalcAll(raw)
}

export const useSurveysStore = create<SurveysState>((set) => ({
  surveys: buildDemoSurveys(),

  addSurvey: (md, inc, azi) =>
    set((state) => {
      const sorted = [...state.surveys].sort((a, b) => a.md - b.md)
      const newEntry: Survey = { id: crypto.randomUUID(), md, inc, azi, tvd: 0, dls: 0 }
      const withNew = [...sorted, newEntry].sort((a, b) => a.md - b.md)
      return { surveys: recalcAll(withNew) }
    }),

  removeSurvey: (id) =>
    set((state) => {
      const filtered = state.surveys.filter((s) => s.id !== id).sort((a, b) => a.md - b.md)
      return { surveys: recalcAll(filtered) }
    }),
}))

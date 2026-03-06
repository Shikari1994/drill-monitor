import { useMemo, useState, useRef, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMeasurementsStore } from '@/store/measurementsStore'

// Encode a byte as positive/negative pulses (simplified MWD encoding)
function generatePulsePattern(basePressure: number, seed: number): { t: number; p: number }[] {
  const data: { t: number; p: number }[] = []

  // Pseudo-random bit sequence derived from seed
  const bits: number[] = []
  let state = (seed % 32767) + 1
  for (let i = 0; i < 24; i++) {
    state = ((state * 1103515245) + 12345) & 0x7fffffff
    bits.push((state >> 14) & 1)
  }

  let t = 0
  const noise = () => (Math.sin(t * 7.3) * 0.08 + Math.cos(t * 13.7) * 0.05)

  // Sync frame: 2 positive pulses
  for (let k = 0; k < 2; k++) {
    const pulseLen = 8
    for (let j = 0; j < pulseLen; j++, t++) {
      const rise = j < 3 ? (j / 3) : j > pulseLen - 3 ? ((pulseLen - j) / 3) : 1
      data.push({ t, p: +(basePressure + rise * 2.4 + noise()).toFixed(3) })
    }
    for (let j = 0; j < 6; j++, t++) {
      data.push({ t, p: +(basePressure + noise()).toFixed(3) })
    }
  }

  // Data bits
  for (const bit of bits) {
    if (bit === 1) {
      // Positive pulse
      const pulseLen = 6
      for (let j = 0; j < pulseLen; j++, t++) {
        const rise = j < 2 ? j / 2 : j > pulseLen - 2 ? (pulseLen - j) / 2 : 1
        data.push({ t, p: +(basePressure + rise * 2.1 + noise()).toFixed(3) })
      }
    } else {
      // Negative pulse
      const pulseLen = 6
      for (let j = 0; j < pulseLen; j++, t++) {
        const drop = j < 2 ? j / 2 : j > pulseLen - 2 ? (pulseLen - j) / 2 : 1
        data.push({ t, p: +(basePressure - drop * 0.8 + noise()).toFixed(3) })
      }
    }
    // Gap between bits
    const gapLen = 5
    for (let j = 0; j < gapLen; j++, t++) {
      data.push({ t, p: +(basePressure + noise()).toFixed(3) })
    }
  }

  return data
}

const GRID_COLOR = 'hsl(220 16% 14%)'
const TICK_COLOR = 'hsl(215 15% 38%)'
const CHART_HEIGHT = 200
const CHART_MARGIN = { top: 8, right: 72, left: 0, bottom: 0 }
const Y_AXIS_WIDTH = 42

interface DragMarkerProps {
  label: string
  value: number
  color: string
  y: number
  active: boolean
  onMouseDown: (e: React.MouseEvent) => void
}

function DragMarker({ label, value, color, y, active, onMouseDown }: DragMarkerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 1,
        top: y - 9,
        zIndex: 20,
        cursor: 'ns-resize',
        userSelect: 'none',
      }}
      onMouseDown={onMouseDown}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingLeft: 5,
          paddingRight: 6,
          height: 18,
          width: Y_AXIS_WIDTH - 3,
          borderRadius: '3px 0 0 3px',
          background: active ? `${color}22` : `${color}12`,
          border: `1px solid ${active ? `${color}cc` : `${color}55`}`,
          borderRight: 'none',
          color,
          fontSize: 9,
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 700,
          letterSpacing: '0.03em',
          transition: 'background 0.1s, border-color 0.1s',
        }}
      >
        {/* Grip dots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <div style={{ width: 8, height: 1, background: color, opacity: 0.7 }} />
          <div style={{ width: 8, height: 1, background: color, opacity: 0.7 }} />
          <div style={{ width: 8, height: 1, background: color, opacity: 0.7 }} />
        </div>
        {/* Label + value */}
        <span style={{ flexShrink: 0 }}>{label}</span>
        <span style={{ fontWeight: 400, opacity: 0.85, fontSize: 8 }}>{value.toFixed(2)}</span>
      </div>
    </div>
  )
}

export function MudPulseChart() {
  const telemetry = useMeasurementsStore((s) => s.telemetry)
  const last = telemetry.at(-1)
  const basePressure = last?.pressure ?? 18

  // Offsets relative to basePressure — move with it automatically
  const [highOffset, setHighOffset] = useState(1.6)
  const [lowOffset, setLowOffset] = useState(-0.5)
  const highThresh = basePressure + highOffset
  const lowThresh = basePressure + lowOffset

  const data = useMemo(
    () => generatePulsePattern(basePressure, telemetry.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [telemetry.length, Math.round(basePressure * 10)]
  )

  const domainMin = data.length ? Math.min(...data.map(d => d.p)) - 0.5 : basePressure - 2
  const domainMax = data.length ? Math.max(...data.map(d => d.p)) + 0.5 : basePressure + 3

  // Refs for drag logic (avoid stale closures)
  const domainRef = useRef({ min: domainMin, max: domainMax, base: basePressure })
  useEffect(() => { domainRef.current = { min: domainMin, max: domainMax, base: basePressure } })

  const chartAreaRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'high' | 'low' | null>(null)
  const [activeHandle, setActiveHandle] = useState<'high' | 'low' | null>(null)

  const plotHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom

  const valueToY = (val: number) => {
    const ratio = (val - domainMin) / (domainMax - domainMin)
    return CHART_MARGIN.top + plotHeight * (1 - ratio)
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !chartAreaRef.current) return
      const rect = chartAreaRef.current.getBoundingClientRect()
      const { min, max, base } = domainRef.current
      const ph = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom
      const y = Math.max(CHART_MARGIN.top, Math.min(CHART_HEIGHT - CHART_MARGIN.bottom, e.clientY - rect.top))
      const ratio = 1 - (y - CHART_MARGIN.top) / ph
      const val = min + ratio * (max - min)
      const offset = Math.max(min - base, Math.min(max - base, val - base))
      if (dragging.current === 'high') {
        setHighOffset(offset)
      } else {
        setLowOffset(offset)
      }
    }
    const onUp = () => {
      dragging.current = null
      setActiveHandle(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // Классификация сэмплов
  const signalSamples = data.filter(d => d.p > highThresh || d.p < lowThresh).length
  const noiseSamples = data.length - signalSamples
  const signalPct = data.length > 0 ? Math.round(signalSamples / data.length * 100) : 0
  const snrDb = signalSamples > 0 && noiseSamples > 0
    ? (10 * Math.log10(signalSamples / noiseSamples)).toFixed(1)
    : '—'

  const highY = valueToY(highThresh)
  const lowY = valueToY(lowThresh)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            MWD Пульс — Сигнал давления
          </span>
        </div>
        <div className="flex gap-4 text-[10px] font-mono text-muted-foreground">
          <span>База: <span className="text-foreground">{basePressure.toFixed(1)} МПа</span></span>
          <span>Импульс: <span className="text-blue-400">+2.1 МПа</span></span>
          <span>Скорость: <span className="text-foreground">~2 бит/с</span></span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-5 px-4 py-2 border-b border-border bg-card/50">
        {/* High pulse indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <span className="inline-block w-3 h-[2px] rounded" style={{ background: '#84cc16' }} />
          <span className="text-muted-foreground">High pulse:</span>
          <span className="tabular-nums text-lime-400 font-bold">{highThresh.toFixed(2)}</span>
          <span className="text-muted-foreground">МПа</span>
        </div>
        {/* Low pulse indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <span className="inline-block w-3 h-[2px] rounded" style={{ background: '#f59e0b' }} />
          <span className="text-muted-foreground">Low pulse:</span>
          <span className="tabular-nums text-amber-400 font-bold">{lowThresh.toFixed(2)}</span>
          <span className="text-muted-foreground">МПа</span>
        </div>
        <span className="text-[9px] text-muted-foreground/50 font-mono">↕ перетащите линию на графике</span>
        <div className="flex items-center gap-3 text-[10px] font-mono ml-auto">
          <span>
            <span className="text-lime-400 font-bold">{signalSamples}</span>
            <span className="text-muted-foreground"> сигнал</span>
          </span>
          <span>
            <span className="text-slate-400 font-bold">{noiseSamples}</span>
            <span className="text-muted-foreground"> шум</span>
          </span>
          <span className="text-muted-foreground">
            SNR: <span className="text-foreground">{snrDb} dB</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider
            ${signalPct > 30
              ? 'text-lime-400 border border-lime-500/40 bg-lime-500/10'
              : 'text-amber-400 border border-amber-500/40 bg-amber-500/10'}`}>
            {signalPct}% сигнал
          </span>
        </div>
      </div>

      {/* Chart with draggable threshold lines */}
      <div className="px-2 py-3">
        <div ref={chartAreaRef} className="relative select-none" style={{ height: CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={data} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id="mpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis
                domain={[domainMin, domainMax]}
                tick={{ fill: TICK_COLOR, fontSize: 10, fontFamily: 'ui-monospace, monospace' }}
                tickFormatter={(v: number) => `${v.toFixed(1)}`}
                width={Y_AXIS_WIDTH}
              />
              {/* Baseline */}
              <ReferenceLine y={basePressure} stroke="hsl(215 15% 30%)" strokeDasharray="4 3" />
              {/* High pulse threshold */}
              <ReferenceLine
                y={highThresh}
                stroke="#84cc16"
                strokeDasharray="3 3"
                strokeOpacity={0.9}
                label={{ value: `H ${highThresh.toFixed(2)}`, fill: '#84cc16', fontSize: 9, fontFamily: 'monospace', position: 'right' }}
              />
              {/* Low pulse threshold */}
              <ReferenceLine
                y={lowThresh}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeOpacity={0.9}
                label={{ value: `L ${lowThresh.toFixed(2)}`, fill: '#f59e0b', fontSize: 9, fontFamily: 'monospace', position: 'right' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(220 20% 7%)',
                  border: '1px solid hsl(220 16% 20%)',
                  borderRadius: 6,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                }}
                formatter={(v: number) => {
                  const isSignal = v > highThresh || v < lowThresh
                  return [`${v.toFixed(3)} МПа ${isSignal ? '▶ Сигнал' : '▶ Шум'}`, 'Давление']
                }}
                labelFormatter={(t) => `t = ${t}`}
              />
              <Area
                type="stepAfter"
                dataKey="p"
                stroke="#60a5fa"
                strokeWidth={1.5}
                fill="url(#mpGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Left marker — High pulse */}
          <DragMarker
            label="H"
            value={highThresh}
            color="#84cc16"
            y={highY}
            active={activeHandle === 'high'}
            onMouseDown={(e) => { e.preventDefault(); dragging.current = 'high'; setActiveHandle('high') }}
          />

          {/* Left marker — Low pulse */}
          <DragMarker
            label="L"
            value={lowThresh}
            color="#f59e0b"
            y={lowY}
            active={activeHandle === 'low'}
            onMouseDown={(e) => { e.preventDefault(); dragging.current = 'low'; setActiveHandle('low') }}
          />
        </div>
      </div>

      {/* Legend / info bar */}
      <div className="flex items-center gap-6 px-4 pb-3 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-[2px] bg-blue-400 rounded" /> Сигнал
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-[1px] bg-slate-600 border-dashed" /> Базовая линия
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-[1px]" style={{ borderTop: '1px dashed #84cc16' }} /> High pulse
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-[1px]" style={{ borderTop: '1px dashed #f59e0b' }} /> Low pulse
        </span>
        <span className="ml-auto opacity-50">Симуляция MWD кодирования положительным импульсом</span>
      </div>
    </div>
  )
}

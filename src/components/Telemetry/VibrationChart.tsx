import { useMemo } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMeasurementsStore } from '@/store/measurementsStore'

interface VibPoint {
  t: number
  ax: number   // axial, g
  lat: number  // lateral, g
  tor: number  // torsional shock, g
}

function generateVibration(rpm: number, torque: number, wob: number, count: number): VibPoint[] {
  const data: VibPoint[] = []
  // Fundamental excitation frequency (RPM/60 Hz, normalized to time steps)
  const f1 = rpm / 60
  const f2 = f1 * 3  // 3× harmonic (blade pass)
  const wobFactor = Math.min(wob / 30, 2.5)
  const torqueFactor = Math.min(torque / 5, 2.5)

  let noiseState = (rpm * 7 + torque * 13 + 1) | 0

  for (let i = 0; i < count; i++) {
    const ti = i / count * 10
    noiseState = ((noiseState * 1664525) + 1013904223) & 0xffffffff
    const noise = ((noiseState & 0xffff) / 0xffff - 0.5) * 0.4

    const ax = +(Math.abs(
      Math.sin(ti * f1 * 2.1) * wobFactor * 2.8 +
      Math.sin(ti * f2 * 1.3 + 0.7) * wobFactor * 1.2 +
      noise * 0.5
    )).toFixed(2)

    const lat = +(Math.abs(
      Math.sin(ti * f1 * 1.7 + 1.0) * wobFactor * 3.5 +
      Math.cos(ti * f2 * 0.9 + 2.1) * wobFactor * 1.8 +
      noise * 0.8
    )).toFixed(2)

    const tor = +(Math.abs(
      Math.sin(ti * f1 * 0.5 + 0.3) * torqueFactor * 2.0 +
      Math.sin(ti * f1 * 2.5 + 1.5) * torqueFactor * 0.8 +
      noise * 0.4
    )).toFixed(2)

    data.push({ t: i, ax, lat, tor })
  }
  return data
}

const GRID_COLOR = 'hsl(220 16% 14%)'
const TICK_COLOR = 'hsl(215 15% 38%)'
const WARN_LOW = 5   // g — caution
const WARN_HIGH = 10  // g — danger

export function VibrationChart() {
  const telemetry = useMeasurementsStore((s) => s.telemetry)
  const last = telemetry.at(-1)
  const rpm = last?.rpm ?? 0
  const torque = last?.torque ?? 0
  const wob = last?.wob ?? 0

  const data = useMemo(
    () => generateVibration(rpm, torque, wob, 120),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(rpm), Math.round(torque * 10), Math.round(wob)]
  )

  const maxVib = Math.max(...data.map(d => Math.max(d.ax, d.lat, d.tor)))
  const yMax = Math.max(maxVib * 1.15, 12)

  const lastPoint = data[data.length - 1]
  const severity = maxVib > WARN_HIGH ? 'danger' : maxVib > WARN_LOW ? 'caution' : 'normal'
  const severityColor = { danger: '#ef4444', caution: '#f59e0b', normal: '#84cc16' }[severity]
  const severityLabel = { danger: 'КРИТИЧНО', caution: 'ПРЕДУПРЕЖДЕНИЕ', normal: 'НОРМА' }[severity]

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: severityColor }} />
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            Анализ вибрации
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span className="text-muted-foreground">
            RPM: <span className="text-foreground">{rpm.toFixed(0)}</span>
          </span>
          <span className="text-muted-foreground">
            Пик: <span className="text-foreground">{maxVib.toFixed(1)} g</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
            style={{ color: severityColor, border: `1px solid ${severityColor}40`, background: `${severityColor}10` }}>
            {severityLabel}
          </span>
        </div>
      </div>

      <div className="px-2 py-3">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: TICK_COLOR, fontSize: 10, fontFamily: 'ui-monospace, monospace' }}
              tickFormatter={(v: number) => `${v.toFixed(0)}g`}
              width={36}
            />
            {/* Threshold reference lines */}
            <ReferenceLine y={WARN_LOW} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.6} />
            <ReferenceLine y={WARN_HIGH} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />

            <Tooltip
              contentStyle={{
                background: 'hsl(220 20% 7%)',
                border: '1px solid hsl(220 16% 20%)',
                borderRadius: 6,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
              }}
              formatter={(v: number, name: string) => [
                `${v.toFixed(2)} g`,
                name === 'ax' ? 'Осевая' : name === 'lat' ? 'Поперечная' : 'Крутильная',
              ]}
              labelFormatter={() => ''}
            />
            <Legend
              formatter={(val: string) =>
                val === 'ax' ? 'Осевая' : val === 'lat' ? 'Поперечная' : 'Крутильная'
              }
              wrapperStyle={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10,
                paddingTop: 6,
              }}
            />
            <Line type="monotone" dataKey="ax" stroke="#34d399" strokeWidth={1.5} dot={false}
              name="ax" isAnimationActive={false} />
            <Line type="monotone" dataKey="lat" stroke="#f87171" strokeWidth={1.5} dot={false}
              name="lat" isAnimationActive={false} />
            <Line type="monotone" dataKey="tor" stroke="#a78bfa" strokeWidth={1.5} dot={false}
              name="tor" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RMS readouts */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {[
          { label: 'ОСЕ. RMS', value: lastPoint?.ax ?? 0, color: '#34d399', unit: 'g' },
          { label: 'ПОПЕР. RMS', value: lastPoint?.lat ?? 0, color: '#f87171', unit: 'g' },
          { label: 'КРУТИЛ. RMS', value: lastPoint?.tor ?? 0, color: '#a78bfa', unit: 'g' },
        ].map(({ label, value, color, unit }) => (
          <div key={label} className="px-4 py-2.5 flex flex-col gap-0.5">
            <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-lg font-bold tabular-nums" style={{ color }}>
                {value.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

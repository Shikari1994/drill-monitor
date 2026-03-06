import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useMeasurementsStore } from '@/store/measurementsStore'

const CHART_LINES = [
  { key: 'rpm',      color: '#60a5fa', label: 'RPM' },
  { key: 'wob',      color: '#34d399', label: 'WOB, кН' },
  { key: 'torque',   color: '#f59e0b', label: 'Torque, кН·м' },
  { key: 'rop',      color: '#f87171', label: 'ROP, м/ч' },
  { key: 'pressure', color: '#a78bfa', label: 'P, МПа' },
] as const

const GRID_COLOR = 'hsl(220 16% 13%)'
const TICK_STYLE = {
  fill: 'hsl(215 15% 38%)',
  fontSize: 10,
  fontFamily: 'ui-monospace, JetBrains Mono, monospace',
}

export function TelemetryChart() {
  const telemetry = useMeasurementsStore((s) => s.telemetry)

  const data = telemetry.map((p) => ({
    ...p,
    time: new Date(p.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }))

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
          Телеметрия — Временной ряд
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          Точек: <span className="text-foreground tabular-nums">{telemetry.length}</span> / 300
        </span>
      </div>

      <div className="p-3">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[260px] text-xs font-mono text-muted-foreground">
            Нет данных — добавьте замеры или запустите запись телеметрии
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="time" tick={TICK_STYLE} interval="preserveStartEnd" />
              <YAxis tick={TICK_STYLE} width={36} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(220 20% 7%)',
                  border: '1px solid hsl(220 16% 20%)',
                  borderRadius: 6,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                }}
                labelStyle={{ color: 'hsl(215 15% 55%)', marginBottom: 4, fontSize: 10 }}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, paddingTop: 8 }}
              />
              {CHART_LINES.map(({ key, color, label }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  name={label}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

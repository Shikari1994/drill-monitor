import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMeasurementsStore } from '@/store/measurementsStore'

const GRID_COLOR = 'hsl(220 16% 13%)'
const TICK_STYLE = {
  fill: 'hsl(215 15% 38%)',
  fontSize: 10,
  fontFamily: 'ui-monospace, JetBrains Mono, monospace',
}

// Пороговые значения
const GR_SHALE_LINE = 75  // gAPI — выше: глина/сланец, ниже: коллектор
const RES_PAY_LINE = 10   // Ом·м — выше: потенциальный коллектор

export function PetrophysicsChart() {
  const telemetry = useMeasurementsStore((s) => s.telemetry)
  const last = telemetry.at(-1)

  const data = telemetry.map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
    gr: p.gammaRay ?? null,
    res: p.resistivity ?? null,
  }))

  const grValue = last?.gammaRay
  const resValue = last?.resistivity

  const grLithology = grValue != null
    ? grValue > GR_SHALE_LINE ? 'ГЛИНА/СЛАНЕЦ' : 'КОЛЛЕКТОР'
    : '—'
  const grLithColor = grValue != null
    ? grValue > GR_SHALE_LINE ? '#f59e0b' : '#34d399'
    : 'hsl(215 15% 38%)'

  const resStatus = resValue != null
    ? resValue > RES_PAY_LINE ? 'УВ-НАСЫЩЕНИЕ' : 'ВОДОНАСЫЩ.'
    : '—'
  const resStatusColor = resValue != null
    ? resValue > RES_PAY_LINE ? '#60a5fa' : '#f87171'
    : 'hsl(215 15% 38%)'

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
          Петрофизика — ГК и Сопротивление
        </span>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          {grValue != null && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
              style={{ color: grLithColor, border: `1px solid ${grLithColor}40`, background: `${grLithColor}10` }}>
              GR: {grLithology}
            </span>
          )}
          {resValue != null && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
              style={{ color: resStatusColor, border: `1px solid ${resStatusColor}40`, background: `${resStatusColor}10` }}>
              RES: {resStatus}
            </span>
          )}
        </div>
      </div>

      {/* Gamma Ray chart */}
      <div className="px-3 pt-3">
        <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1 pl-1">
          Гамма Каротаж (GR), gAPI
        </div>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[160px] text-xs font-mono text-muted-foreground">
            Нет данных
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <ComposedChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="time" tick={TICK_STYLE} interval="preserveStartEnd" />
              <YAxis domain={[0, 200]} tick={TICK_STYLE} width={36}
                tickFormatter={(v: number) => `${v}`} />
              <ReferenceLine y={GR_SHALE_LINE} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.7}
                label={{ value: 'Глина', fill: '#f59e0b', fontSize: 9, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(220 20% 7%)',
                  border: '1px solid hsl(220 16% 20%)',
                  borderRadius: 6,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                }}
                labelStyle={{ color: 'hsl(215 15% 55%)', marginBottom: 4, fontSize: 10 }}
                formatter={(v: number) => [`${v.toFixed(1)} gAPI`, 'GR']}
              />
              <Line type="monotone" dataKey="gr" stroke="#84cc16" strokeWidth={1.5}
                dot={false} name="GR" isAnimationActive={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Resistivity chart */}
      <div className="px-3 pb-3">
        <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1 pl-1 mt-2">
          Резистивиметр (RES), Ом·м
        </div>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[160px] text-xs font-mono text-muted-foreground">
            Нет данных
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <ComposedChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="time" tick={TICK_STYLE} interval="preserveStartEnd" />
              <YAxis domain={[0, 'auto']} tick={TICK_STYLE} width={36}
                tickFormatter={(v: number) => `${v.toFixed(0)}`} />
              <ReferenceLine y={RES_PAY_LINE} stroke="#60a5fa" strokeDasharray="3 3" strokeOpacity={0.7}
                label={{ value: 'УВ-пласт', fill: '#60a5fa', fontSize: 9, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(220 20% 7%)',
                  border: '1px solid hsl(220 16% 20%)',
                  borderRadius: 6,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                }}
                labelStyle={{ color: 'hsl(215 15% 55%)', marginBottom: 4, fontSize: 10 }}
                formatter={(v: number) => [`${v.toFixed(2)} Ом·м`, 'Сопротивление']}
              />
              <Line type="monotone" dataKey="res" stroke="#38bdf8" strokeWidth={1.5}
                dot={false} name="RES" isAnimationActive={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Live readouts */}
      <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
        <div className="px-4 py-2.5 flex flex-col gap-0.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
            Гамма-каротаж (ГК)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold tabular-nums" style={{ color: '#84cc16' }}>
              {grValue != null ? grValue.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-muted-foreground">gAPI</span>
          </div>
          {grValue != null && (
            <span className="text-[9px] font-mono" style={{ color: grLithColor }}>{grLithology}</span>
          )}
        </div>
        <div className="px-4 py-2.5 flex flex-col gap-0.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
            Сопротивление (РЕЗ)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-bold tabular-nums" style={{ color: '#38bdf8' }}>
              {resValue != null ? resValue.toFixed(2) : '—'}
            </span>
            <span className="text-xs text-muted-foreground">Ом·м</span>
          </div>
          {resValue != null && (
            <span className="text-[9px] font-mono" style={{ color: resStatusColor }}>{resStatus}</span>
          )}
        </div>
      </div>
    </div>
  )
}

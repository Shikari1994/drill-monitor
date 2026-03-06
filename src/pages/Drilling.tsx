import { useState } from 'react'
import { ZoomIn, ZoomOut, Drill, TrendingUp, Activity, Navigation, Compass, ArrowDownToLine, Gauge, Thermometer, Radio, Zap, TrendingDown, Minus, ChevronLeft, ChevronRight, Target, X } from 'lucide-react'
import { useMeasurementsStore } from '@/store/measurementsStore'
import { useSurveysStore } from '@/store/surveysStore'
import { ToolfaceGauge } from '@/components/Toolface/ToolfaceGauge'
import { MudPulseChart } from '@/components/Telemetry/MudPulseChart'

function Sparkline({ values, accent }: { values: number[]; accent?: boolean }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 100
  const h = 24
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const color = accent ? '#a3e635' : '#64748b'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

function TrendIcon({ values }: { values: number[] }) {
  if (values.length < 6) return null
  const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3
  const prev   = values.slice(-6, -3).reduce((a, b) => a + b, 0) / 3
  const diff = recent - prev
  const threshold = Math.abs(prev) * 0.015
  if (diff > threshold)  return <TrendingUp  className="h-3 w-3 text-lime-400" />
  if (diff < -threshold) return <TrendingDown className="h-3 w-3 text-red-400" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

interface DrillKpiProps {
  label: string
  value: string
  unit: string
  icon: React.ReactNode
  accent?: boolean
  sparkValues?: number[]
}

function DrillKpi({ label, value, unit, icon, accent, sparkValues }: DrillKpiProps) {
  return (
    <div className={`rounded-lg border flex flex-col overflow-hidden
      ${accent ? 'border-lime-500/30 bg-lime-500/5' : 'border-border bg-card'}`}>
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-2.5">
        <span className={`shrink-0 ${accent ? 'text-lime-400' : 'text-muted-foreground'}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground truncate">
            {label}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`font-mono text-lg font-bold leading-none tabular-nums
              ${accent ? 'text-lime-400' : 'text-foreground'}`}>
              {value}
            </span>
            <span className="text-[11px] text-muted-foreground">{unit}</span>
            {sparkValues && (
              <span className="ml-auto pl-1">
                <TrendIcon values={sparkValues} />
              </span>
            )}
          </div>
        </div>
      </div>
      {sparkValues && sparkValues.length > 1 && (
        <div className="px-0 pb-0">
          <Sparkline values={sparkValues} accent={accent} />
        </div>
      )}
    </div>
  )
}

const GAUGE_SIZES = [180, 240, 280, 340]

export function Drilling() {
  const { telemetry, measurements } = useMeasurementsStore()
  const { surveys } = useSurveysStore()
  const last = telemetry.at(-1)
  const lastSurvey = surveys.at(-1)
  const lastMeasurement = measurements.at(-1)
  const [gaugeSizeIdx, setGaugeSizeIdx] = useState(1)
  const gaugeSize = GAUGE_SIZES[gaugeSizeIdx]
  const [targetTF, setTargetTF] = useState<number | undefined>(undefined)
  const [sectorWidth, setSectorWidth] = useState(30)

  // Last 5 magneticToolface readings
  const toolfaces = telemetry
    .filter(t => t.magneticToolface != null)
    .slice(-5)
    .map(t => t.magneticToolface as number)

  const bitDepth = lastMeasurement ? lastMeasurement.depth.toFixed(1) : '—'
  const wellDepth = measurements.length > 0
    ? Math.max(...measurements.map(m => m.depth)).toFixed(1) : '—'

  const pressure = last ? last.pressure.toFixed(1) : '—'
  const rop = last ? last.rop.toFixed(2) : lastMeasurement ? lastMeasurement.rop.toFixed(2) : '—'
  const inc = lastSurvey ? lastSurvey.inc.toFixed(2) : '—'
  const azi = lastSurvey ? lastSurvey.azi.toFixed(2) : '—'

  // sparkline data (last 40 points)
  const tele40 = telemetry.slice(-40)
  const spRpm   = tele40.map(t => t.rpm)
  const spWob   = tele40.map(t => t.wob)
  const spPres  = tele40.map(t => t.pressure)
  const spRop   = tele40.map(t => t.rop)
  const spTemp  = tele40.map(t => t.temperature)
  const spTorq  = tele40.map(t => t.torque)
  const spGR    = tele40.map(t => t.gammaRay ?? 0)
  const spRes   = tele40.map(t => t.resistivity ?? 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Бурение</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Оперативные параметры бурения и ориентация инструмента</p>
      </div>

      {/* Основной блок: тулфейс + KPI */}
      <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
        {/* Слева: датчик тулфейса */}
        <div className="rounded-xl border border-lime-500/15 bg-card/60 backdrop-blur-sm p-4
                        shadow-[inset_0_1px_0_0_rgba(132,204,22,0.06)] flex flex-col gap-3">
          {/* Заголовок + управление размером */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Тулфейс
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setGaugeSizeIdx(i => Math.max(0, i - 1))}
                disabled={gaugeSizeIdx === 0}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors"
                title="Уменьшить"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGaugeSizeIdx(i => Math.min(GAUGE_SIZES.length - 1, i + 1))}
                disabled={gaugeSizeIdx === GAUGE_SIZES.length - 1}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 transition-colors"
                title="Увеличить"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ToolfaceGauge
            toolfaces={toolfaces}
            size={gaugeSize}
            targetAngle={targetTF}
            targetWidth={sectorWidth}
            onTargetChange={setTargetTF}
          />

          {/* Управление целевым сектором */}
          <div className="pt-1 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3 w-3" /> Целевой сектор
              </span>
              {targetTF != null && (
                <button
                  onClick={() => setTargetTF(undefined)}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  title="Сбросить"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {targetTF != null ? (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Направление</div>
                  <div className="font-mono text-sm font-bold text-lime-400">{targetTF}°</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground text-right">Ширина</div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <button
                      onClick={() => setSectorWidth(w => Math.max(5, w - 5))}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono text-sm font-bold text-foreground w-8 text-center tabular-nums">
                      {sectorWidth}°
                    </span>
                    <button
                      onClick={() => setSectorWidth(w => Math.min(120, w + 5))}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground/60 font-mono">
                Кликните на шкале для установки
              </div>
            )}
          </div>

          {/* DLS под датчиком */}
          <div className="pt-1 border-t border-border">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">DLS</div>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className={`font-mono text-base font-bold tabular-nums
                ${lastSurvey && lastSurvey.dls > 3 ? 'text-amber-400' : 'text-foreground'}`}>
                {lastSurvey ? lastSurvey.dls.toFixed(2) : '—'}
              </span>
              <span className="text-xs text-muted-foreground">°/30м</span>
            </div>
          </div>
        </div>

        {/* Справа: сетка KPI */}
        <div className="grid grid-cols-3 gap-2">
          <DrillKpi
            label="Положение долота"
            value={bitDepth}
            unit="м"
            icon={<Drill className="h-4 w-4" />}
            accent
          />
          <DrillKpi
            label="Глубина скважины"
            value={wellDepth}
            unit="м"
            icon={<ArrowDownToLine className="h-4 w-4" />}
            accent
          />
          <DrillKpi
            label="Давление"
            value={pressure}
            unit="МПа"
            icon={<Activity className="h-4 w-4" />}
            sparkValues={spPres}
          />
          <DrillKpi
            label="Скорость проходки"
            value={rop}
            unit="м/ч"
            icon={<TrendingUp className="h-4 w-4" />}
            sparkValues={spRop}
          />
          <DrillKpi
            label="Зенитный угол"
            value={inc}
            unit="°"
            icon={<Navigation className="h-4 w-4" />}
          />
          <DrillKpi
            label="Азимут"
            value={azi}
            unit="°"
            icon={<Compass className="h-4 w-4" />}
          />
          <DrillKpi
            label="Обороты"
            value={last ? last.rpm.toFixed(0) : '—'}
            unit="об/мин"
            icon={<Gauge className="h-4 w-4" />}
            sparkValues={spRpm}
          />
          <DrillKpi
            label="Нагрузка на долото"
            value={last ? last.wob.toFixed(1) : '—'}
            unit="кН"
            icon={<Zap className="h-4 w-4" />}
            sparkValues={spWob}
          />
          <DrillKpi
            label="Температура"
            value={last ? last.temperature.toFixed(1) : '—'}
            unit="°C"
            icon={<Thermometer className="h-4 w-4" />}
            sparkValues={spTemp}
          />
          <DrillKpi
            label="Момент вращения"
            value={last ? last.torque.toFixed(2) : '—'}
            unit="кН·м"
            icon={<Gauge className="h-4 w-4" />}
            sparkValues={spTorq}
          />
          <DrillKpi
            label="Гамма-каротаж"
            value={last?.gammaRay != null ? last.gammaRay.toFixed(1) : '—'}
            unit="gAPI"
            icon={<Radio className="h-4 w-4" />}
            sparkValues={spGR}
          />
          <DrillKpi
            label="Сопротивление"
            value={last?.resistivity != null ? last.resistivity.toFixed(1) : '—'}
            unit="Ом·м"
            icon={<Zap className="h-4 w-4" />}
            sparkValues={spRes}
          />
        </div>
      </div>

      {/* Декодер сигнала MWD */}
      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Декодер сигнала MWD
        </h3>
        <MudPulseChart />
      </div>
    </div>
  )
}

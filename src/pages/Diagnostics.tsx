import { TelemetryChart } from '@/components/Telemetry/TelemetryChart'
import { MudPulseChart } from '@/components/Telemetry/MudPulseChart'
import { VibrationChart } from '@/components/Telemetry/VibrationChart'
import { PetrophysicsChart } from '@/components/Telemetry/PetrophysicsChart'
import { useMeasurementsStore } from '@/store/measurementsStore'

export function Diagnostics() {
  const { telemetry } = useMeasurementsStore()
  const last = telemetry.at(-1)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Диагностика</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Телеметрия, MWD-сигнал и вибрационный анализ</p>
      </div>

      {/* Raw values — glassmorphism card */}
      {last && (
        <div className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm overflow-hidden
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
              Живой пакет — Сырые данные
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500" />
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 divide-x divide-y divide-border/60">
            {[
              { key: 'RPM', value: last.rpm.toFixed(1), unit: 'об/мин', color: '#60a5fa' },
              { key: 'WOB', value: last.wob.toFixed(2), unit: 'кН', color: '#34d399' },
              { key: 'Torque', value: last.torque.toFixed(3), unit: 'кН·м', color: '#f59e0b' },
              { key: 'ROP', value: last.rop.toFixed(2), unit: 'м/ч', color: '#f87171' },
              { key: 'Pressure', value: last.pressure.toFixed(2), unit: 'МПа', color: '#a78bfa' },
              { key: 'Temp', value: last.temperature.toFixed(1), unit: '°C', color: '#fb923c' },
              { key: 'GR', value: last.gammaRay != null ? last.gammaRay.toFixed(1) : '—', unit: 'gAPI', color: '#84cc16' },
              { key: 'RES', value: last.resistivity != null ? last.resistivity.toFixed(2) : '—', unit: 'Ом·м', color: '#38bdf8' },
            ].map(({ key, value, unit, color }) => (
              <div key={key} className="px-4 py-3 group">
                <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  {key}
                </div>
                <div className="font-mono text-base font-bold tabular-nums" style={{ color }}>
                  {value}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main telemetry chart */}
      <TelemetryChart />

      {/* MWD Section */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Декодер сигнала MWD
        </h3>
        <MudPulseChart />
      </div>

      {/* Vibration section */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Вибрация и удары
        </h3>
        <VibrationChart />
      </div>

      {/* Petrophysics section */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Гамма-каротаж и кривая сопротивления
        </h3>
        <PetrophysicsChart />
      </div>
    </div>
  )
}

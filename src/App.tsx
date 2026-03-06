import { useEffect, useState } from 'react'
import { useMeasurementsStore } from '@/store/measurementsStore'
import { TopNav, type PageId } from '@/components/Shell/Sidebar'
import { Surveys } from '@/pages/Surveys'
import { BHATools } from '@/pages/BHATools'
import { Diagnostics } from '@/pages/Diagnostics'
import { Drilling } from '@/pages/Drilling'
import { Button } from '@/components/ui/button'

function useTelemetrySimulator() {
  const { isRecording, addTelemetryPoint } = useMeasurementsStore()

  useEffect(() => {
    if (!isRecording) return
    const interval = setInterval(() => {
      addTelemetryPoint({
        rpm: 80 + Math.random() * 60,
        wob: 40 + Math.random() * 30,
        torque: 6 + Math.random() * 5,
        rop: 8 + Math.random() * 10,
        pressure: 20 + Math.random() * 10,
        temperature: 55 + Math.random() * 20,
        gammaRay: 45 + Math.random() * 120,
        resistivity: 0.5 + Math.random() * 80,
        magneticToolface: 245 + Math.sin(Date.now() / 3000) * 40 + (Math.random() - 0.5) * 8,
        vibAx: 0.2 + Math.random() * 0.8,
        vibLat: 0.1 + Math.random() * 0.5,
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRecording, addTelemetryPoint])
}

const PAGES: Record<PageId, React.ReactNode> = {
  drilling: <Drilling />,
  surveys: <Surveys />,
  bha: <BHATools />,
  diagnostics: <Diagnostics />,
}

export default function App() {
  const { isRecording, setRecording } = useMeasurementsStore()
  const [activePage, setActivePage] = useState<PageId>('drilling')
  useTelemetrySimulator()

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top header bar */}
      <header className="flex items-center gap-4 px-5 h-14 border-b border-border bg-sidebar shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r border-border">
          <div className="h-6 w-6 rounded bg-lime-500 flex items-center justify-center shrink-0">
            <span className="text-black text-xs font-black leading-none">D</span>
          </div>
          <span className="font-semibold tracking-tight text-sm whitespace-nowrap">Drill Monitor</span>
        </div>

        {/* Navigation */}
        <TopNav active={activePage} onChange={setActivePage} />

        {/* Recording controls */}
        <div className="flex items-center gap-3 ml-auto">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isRecording
                ? 'bg-lime-500/15 text-lime-400 border border-lime-500/25'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {isRecording ? '● Запись...' : '○ Остановлено'}
          </span>
          <Button
            variant={isRecording ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setRecording(!isRecording)}
          >
            {isRecording ? 'Стоп' : 'Старт симуляции'}
          </Button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">
        {activePage === 'surveys' ? (
          <div className="h-full">
            {PAGES[activePage]}
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6">
              {PAGES[activePage]}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

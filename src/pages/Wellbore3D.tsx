import { DrillVisualization } from '@/components/Visualization3D/DrillVisualization'

export function Wellbore3D() {
  return (
    <div className="space-y-4 h-full">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">3D Скважина</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Интерактивная 3D-траектория скважины</p>
      </div>
      <DrillVisualization />
    </div>
  )
}

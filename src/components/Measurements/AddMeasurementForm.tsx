import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { useMeasurementsStore } from '@/store/measurementsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FIELDS = [
  { key: 'depth', label: 'Глубина (м)', placeholder: '1500' },
  { key: 'rpm', label: 'RPM', placeholder: '120' },
  { key: 'wob', label: 'WOB (кН)', placeholder: '50' },
  { key: 'torque', label: 'Момент (кН·м)', placeholder: '8.5' },
  { key: 'rop', label: 'ROP (м/ч)', placeholder: '12' },
  { key: 'pressure', label: 'Давление (МПа)', placeholder: '25' },
  { key: 'temperature', label: 'Температура (°C)', placeholder: '60' },
] as const

type FieldKey = (typeof FIELDS)[number]['key']

const DEFAULT_VALUES: Record<FieldKey, string> = {
  depth: '',
  rpm: '',
  wob: '',
  torque: '',
  rop: '',
  pressure: '',
  temperature: '',
}

export function AddMeasurementForm() {
  const [values, setValues] = useState(DEFAULT_VALUES)
  const addMeasurement = useMeasurementsStore((s) => s.addMeasurement)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, parseFloat(v) || 0])
    ) as Record<FieldKey, number>
    addMeasurement(parsed)
    setValues(DEFAULT_VALUES)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Добавить замер</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{label}</label>
              <Input
                type="number"
                step="any"
                placeholder={placeholder}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex items-end col-span-2 md:col-span-4">
            <Button type="submit" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Добавить
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

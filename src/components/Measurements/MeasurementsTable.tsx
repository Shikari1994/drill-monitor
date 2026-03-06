import { Trash2 } from 'lucide-react'
import { useMeasurementsStore } from '@/store/measurementsStore'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MeasurementsTable() {
  const measurements = useMeasurementsStore((s) => s.measurements)
  const removeMeasurement = useMeasurementsStore((s) => s.removeMeasurement)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Замеры ({measurements.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Время</TableHead>
              <TableHead>Глубина (м)</TableHead>
              <TableHead>RPM</TableHead>
              <TableHead>WOB (кН)</TableHead>
              <TableHead>Момент (кН·м)</TableHead>
              <TableHead>ROP (м/ч)</TableHead>
              <TableHead>Давл. (МПа)</TableHead>
              <TableHead>Темп. (°C)</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurements.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Нет данных
                </TableCell>
              </TableRow>
            )}
            {measurements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{new Date(m.timestamp).toLocaleTimeString()}</TableCell>
                <TableCell>{m.depth.toFixed(1)}</TableCell>
                <TableCell>{m.rpm}</TableCell>
                <TableCell>{m.wob.toFixed(1)}</TableCell>
                <TableCell>{m.torque.toFixed(2)}</TableCell>
                <TableCell>{m.rop.toFixed(1)}</TableCell>
                <TableCell>{m.pressure.toFixed(1)}</TableCell>
                <TableCell>{m.temperature.toFixed(1)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMeasurement(m.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

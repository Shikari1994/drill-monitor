import { useState } from 'react'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useSurveysStore } from '@/store/surveysStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DrillVisualization } from '@/components/Visualization3D/DrillVisualization'

const EMPTY = { md: '', inc: '', azi: '' }

export function Surveys() {
  const { surveys, addSurvey, removeSurvey } = useSurveysStore()
  const [form, setForm] = useState(EMPTY)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const md = parseFloat(form.md)
    const inc = parseFloat(form.inc)
    const azi = parseFloat(form.azi)
    if (isNaN(md) || isNaN(inc) || isNaN(azi)) return
    addSurvey(md, inc, azi)
    setForm(EMPTY)
  }

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((v) => ({ ...v, [key]: e.target.value }))

  return (
    <div className="flex h-full min-h-0">
      {/* Левая панель: форма + таблица */}
      <div className="w-[400px] shrink-0 flex flex-col overflow-y-auto border-r border-border">
        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Инклинометрия</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              TVD и DLS рассчитываются по методу Minimum Curvature
            </p>
          </div>

          {/* Форма добавления */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Добавить замер</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">MD (м)</label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="1500"
                      value={form.md}
                      onChange={set('md')}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Inc (°)</label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max="180"
                      placeholder="12.5"
                      value={form.inc}
                      onChange={set('inc')}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Azi (°)</label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      max="360"
                      placeholder="245.0"
                      value={form.azi}
                      onChange={set('azi')}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Добавить
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Таблица замеров */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Замеры ({surveys.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-mono text-xs px-3">MD</TableHead>
                    <TableHead className="font-mono text-xs px-3">Inc</TableHead>
                    <TableHead className="font-mono text-xs px-3">Azi</TableHead>
                    <TableHead className="font-mono text-xs px-3">TVD</TableHead>
                    <TableHead className="font-mono text-xs px-3">DLS</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-xs">
                        Нет данных — добавьте первый замер
                      </TableCell>
                    </TableRow>
                  )}
                  {surveys.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs px-3">{s.md.toFixed(1)}</TableCell>
                      <TableCell className="font-mono text-xs px-3">{s.inc.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs px-3">{s.azi.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs px-3">{s.tvd.toFixed(1)}</TableCell>
                      <TableCell className="font-mono text-xs px-3">
                        <span className={s.dls > 3 ? 'text-amber-400' : ''}>
                          {s.dls.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="px-2">
                        <Button variant="ghost" size="icon" onClick={() => removeSurvey(s.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Правая панель: 3D скважина */}
      <div className="flex-1 min-w-0 p-4">
        <DrillVisualization fillHeight />
      </div>
    </div>
  )
}

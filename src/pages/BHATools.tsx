import { Drill, Circle, ArrowDown } from 'lucide-react'

interface BHAComponent {
  id: string
  name: string
  type: 'bit' | 'motor' | 'mwd' | 'stabilizer' | 'collar' | 'jar'
  length: number
  od: number
  id_: number
}

const DEMO_BHA: BHAComponent[] = [
  { id: '1', name: 'PDC Bit 8½"',    type: 'bit',        length: 0.32, od: 215.9, id_: 0    },
  { id: '2', name: 'Mud Motor 6¾"',  type: 'motor',      length: 8.4,  od: 171.5, id_: 57.2 },
  { id: '3', name: 'MWD/LWD Tool',   type: 'mwd',        length: 5.1,  od: 171.5, id_: 57.2 },
  { id: '4', name: 'Stabilizer 8½"', type: 'stabilizer', length: 1.2,  od: 215.9, id_: 71.4 },
  { id: '5', name: 'Drill Collar 6½"', type: 'collar',   length: 9.1,  od: 165.1, id_: 71.4 },
  { id: '6', name: 'Drill Collar 6½"', type: 'collar',   length: 9.1,  od: 165.1, id_: 71.4 },
  { id: '7', name: 'Hydraulic Jar',  type: 'jar',        length: 4.8,  od: 165.1, id_: 57.2 },
]

const typeColors: Record<BHAComponent['type'], { fill: string; stroke: string; badge: string }> = {
  bit:        { fill: '#1a2e05', stroke: '#84cc16', badge: 'text-lime-400   bg-lime-500/10   border-lime-500/30'   },
  motor:      { fill: '#0c2340', stroke: '#38bdf8', badge: 'text-cyan-400   bg-cyan-500/10   border-cyan-500/30'   },
  mwd:        { fill: '#1e1040', stroke: '#a78bfa', badge: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  stabilizer: { fill: '#2d1f00', stroke: '#f59e0b', badge: 'text-amber-400  bg-amber-500/10  border-amber-500/30'  },
  collar:     { fill: '#161b22', stroke: '#64748b', badge: 'text-slate-400  bg-slate-500/10  border-slate-500/30'  },
  jar:        { fill: '#2d1200', stroke: '#f97316', badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
}

const typeLabels: Record<BHAComponent['type'], string> = {
  bit:        'Долото',
  motor:      'Двигатель',
  mwd:        'MWD/LWD',
  stabilizer: 'Центратор',
  collar:     'УБТ',
  jar:        'Яс',
}

// SVG diagram constants
const SVG_W = 120
const MIN_H = 8
const MAX_H = 72
const PIPE_OD = 50   // max OD reference (215.9 mm → 50px wide)
const REF_OD = 215.9

function odToPx(od: number) {
  return Math.max(16, (od / REF_OD) * PIPE_OD)
}

function lengthToPx(len: number, totalLen: number) {
  return MIN_H + ((len / totalLen) * (MAX_H - MIN_H) * DEMO_BHA.length)
}

function BHADiagram() {
  const totalLen = DEMO_BHA.reduce((a, c) => a + c.length, 0)

  const segments: { comp: BHAComponent; h: number; y: number }[] = []
  let y = 4
  for (const comp of DEMO_BHA) {
    const h = lengthToPx(comp.length, totalLen)
    segments.push({ comp, h, y })
    y += h + 1
  }
  const svgH = y + 4

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      width={SVG_W}
      style={{ height: svgH, display: 'block' }}
    >
      {/* Center line */}
      <line
        x1={SVG_W / 2} y1={0}
        x2={SVG_W / 2} y2={svgH}
        stroke="#334155" strokeWidth="1" strokeDasharray="3,3"
      />

      {segments.map(({ comp, h, y: cy }) => {
        const { fill, stroke } = typeColors[comp.type]
        const w = odToPx(comp.od)
        const x = (SVG_W - w) / 2
        const r = comp.type === 'bit' ? `0 0 ${w / 2}px ${w / 2}px` : '2px'

        // stabilizer: wider flanges
        if (comp.type === 'stabilizer') {
          const fw = w + 8
          const fx = (SVG_W - fw) / 2
          const fh = Math.min(6, h * 0.3)
          return (
            <g key={comp.id}>
              {/* body */}
              <rect x={x} y={cy} width={w} height={h} rx="2" fill={fill} stroke={stroke} strokeWidth="1" />
              {/* flanges */}
              <rect x={fx} y={cy + h * 0.2} width={fw} height={fh} rx="1" fill={stroke} opacity="0.3" />
              <rect x={fx} y={cy + h * 0.6} width={fw} height={fh} rx="1" fill={stroke} opacity="0.3" />
            </g>
          )
        }

        // bit: tapered bottom
        if (comp.type === 'bit') {
          const cx = SVG_W / 2
          const tipY = cy + h
          return (
            <g key={comp.id}>
              <polygon
                points={`${x},${cy} ${x + w},${cy} ${cx + 4},${tipY} ${cx - 4},${tipY}`}
                fill={fill} stroke={stroke} strokeWidth="1"
              />
            </g>
          )
        }

        // motor: show helix hint
        if (comp.type === 'motor') {
          return (
            <g key={comp.id}>
              <rect x={x} y={cy} width={w} height={h} rx="2" fill={fill} stroke={stroke} strokeWidth="1" />
              {[0.2, 0.4, 0.6, 0.8].map((frac) => (
                <line
                  key={frac}
                  x1={x + 4} y1={cy + h * frac}
                  x2={x + w - 4} y2={cy + h * frac}
                  stroke={stroke} strokeWidth="0.7" opacity="0.35"
                />
              ))}
            </g>
          )
        }

        // mwd: antenna dots
        if (comp.type === 'mwd') {
          return (
            <g key={comp.id}>
              <rect x={x} y={cy} width={w} height={h} rx="2" fill={fill} stroke={stroke} strokeWidth="1" />
              {[0.25, 0.5, 0.75].map((frac) => (
                <circle
                  key={frac}
                  cx={SVG_W / 2} cy={cy + h * frac}
                  r="2" fill={stroke} opacity="0.5"
                />
              ))}
            </g>
          )
        }

        return (
          <g key={comp.id}>
            <rect x={x} y={cy} width={w} height={h} rx="2"
              fill={fill} stroke={stroke} strokeWidth="1"
              style={{ borderRadius: r }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export function BHATools() {
  const totalLength = DEMO_BHA.reduce((acc, c) => acc + c.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">КНБК и инструменты</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Компоновка низа бурильной колонны (КНБК)</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Элементов',     value: DEMO_BHA.length },
          { label: 'Общая длина',   value: `${totalLength.toFixed(2)} м` },
          { label: 'Диаметр долота', value: '215.9 мм' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
            <div className="font-mono text-lg font-semibold mt-1">{value}</div>
          </div>
        ))}
      </div>

      {/* Main layout: diagram + list */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Drill className="h-4 w-4 text-lime-400" />
          <span className="text-sm font-semibold">Компоновка (сверху вниз)</span>
        </div>

        <div className="flex min-h-0">
          {/* SVG diagram */}
          <div className="shrink-0 border-r border-border flex items-start justify-center px-4 py-4 bg-muted/20">
            <BHADiagram />
          </div>

          {/* List */}
          <div className="flex-1 divide-y divide-border">
            {DEMO_BHA.map((comp, idx) => {
              const { stroke, badge } = typeColors[comp.type]
              return (
                <div
                  key={comp.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  style={{ borderLeft: `2px solid ${stroke}20` }}
                >
                  {/* Index */}
                  <div className="flex flex-col items-center gap-0.5 w-5 shrink-0">
                    {idx === 0 && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
                    <Circle className="h-2 w-2 fill-current text-muted-foreground/40" />
                    {idx < DEMO_BHA.length - 1 && <div className="w-px h-4 bg-border" />}
                  </div>

                  {/* Type badge */}
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium w-24 text-center shrink-0 ${badge}`}>
                    {typeLabels[comp.type]}
                  </span>

                  {/* Name */}
                  <span className="font-medium text-sm flex-1">{comp.name}</span>

                  {/* Specs */}
                  <div className="flex gap-5 text-xs text-muted-foreground font-mono">
                    <span>L: <span className="text-foreground">{comp.length.toFixed(2)} м</span></span>
                    <span>OD: <span className="text-foreground">{comp.od} мм</span></span>
                    <span>ID: <span className="text-foreground">{comp.id_ > 0 ? `${comp.id_} мм` : '—'}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

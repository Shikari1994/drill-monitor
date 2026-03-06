import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useSurveysStore, type Survey } from '@/store/surveysStore'
import { useMeasurementsStore } from '@/store/measurementsStore'

function toRad(deg: number) { return (deg * Math.PI) / 180 }

const SURFACE: Survey = { id: '__surface__', md: 0, inc: 0, azi: 0, tvd: 0, dls: 0 }

function surveysTo3D(surveys: Survey[]): THREE.Vector3[] {
  const src: Survey[] = surveys.length > 0
    ? [SURFACE, ...surveys]
    : [SURFACE, { id: '__bot__', md: 200, inc: 0, azi: 0, tvd: 200, dls: 0 }]

  type Pos = { n: number; e: number; tvd: number }
  const positions: Pos[] = [{ n: 0, e: 0, tvd: 0 }]

  for (let i = 1; i < src.length; i++) {
    const prev = src[i - 1], curr = src[i]
    const dMD = curr.md - prev.md
    if (dMD <= 0) { positions.push({ ...positions[positions.length - 1] }); continue }
    const inc1 = toRad(prev.inc), azi1 = toRad(prev.azi)
    const inc2 = toRad(curr.inc), azi2 = toRad(curr.azi)
    const cosDL = Math.cos(inc2 - inc1) - Math.sin(inc1) * Math.sin(inc2) * (1 - Math.cos(azi2 - azi1))
    const dl = Math.acos(Math.max(-1, Math.min(1, cosDL)))
    const rf = dl < 1e-10 ? 1 : (2 / dl) * Math.tan(dl / 2)
    const last = positions[positions.length - 1]
    positions.push({
      n:   last.n   + (dMD / 2) * (Math.sin(inc1) * Math.cos(azi1) + Math.sin(inc2) * Math.cos(azi2)) * rf,
      e:   last.e   + (dMD / 2) * (Math.sin(inc1) * Math.sin(azi1) + Math.sin(inc2) * Math.sin(azi2)) * rf,
      tvd: last.tvd + (dMD / 2) * (Math.cos(inc1) + Math.cos(inc2)) * rf,
    })
  }

  const maxExt = positions.reduce((m, p) => Math.max(m, Math.abs(p.n), Math.abs(p.e), p.tvd), 1)
  const scale = 5 / maxExt
  return positions.map(p => new THREE.Vector3(p.e * scale, -p.tvd * scale, -p.n * scale))
}

// Wellbore tube
function WellboreTube({ points }: { points: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const pts = points.length >= 2 ? points : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -5, 0)]
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.TubeGeometry(curve, Math.max(pts.length * 12, 80), 0.045, 10, false)
  }, [points])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#84cc16"
        emissive="#84cc16"
        emissiveIntensity={0.5}
        roughness={0.25}
        metalness={0.75}
      />
    </mesh>
  )
}

// Subtle ghost path line underneath tube for depth perception
function WellboreLine({ points }: { points: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const pts = points.length >= 2 ? points : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -5, 0)]
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(120))
  }, [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#84cc16" opacity={0.12} transparent />
    </line>
  )
}

// Survey station markers — diamond shape, always-visible label, clickable
function SurveyMarkers({
  points, surveys, selected, onSelect,
}: {
  points: THREE.Vector3[]
  surveys: Survey[]
  selected: number | null
  onSelect: (i: number | null) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <>
      {points.map((pt, i) => {
        if (i === 0) return null
        const isSelected = selected === i
        const isHovered  = hovered  === i
        const isLast     = i === points.length - 1
        const survey     = surveys[i - 1]

        const color    = isLast ? '#ef4444' : isSelected ? '#a3e635' : isHovered ? '#cbd5e1' : '#94a3b8'
        const emissive = isLast ? '#991b1b' : isSelected ? '#4d7c0f' : '#000'
        const size     = isSelected ? 0.14 : isHovered ? 0.13 : 0.10

        return (
          <group key={i} position={pt}>
            {/* Diamond (octahedron) marker */}
            <mesh
              onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : i) }}
              onPointerOver={(e) => { e.stopPropagation(); setHovered(i); document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { setHovered(null); document.body.style.cursor = 'auto' }}
            >
              <octahedronGeometry args={[size, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={isSelected ? 1.2 : isHovered ? 0.7 : 0.2}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>

            {/* Subtle glow ring around selected/last */}
            {(isSelected || isLast) && (
              <mesh>
                <ringGeometry args={[size + 0.04, size + 0.07, 24]} />
                <meshBasicMaterial color={isLast ? '#ef4444' : '#a3e635'} transparent opacity={0.35} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Always-visible station label */}
            <Html
              position={[size + 0.12, 0, 0]}
              style={{ pointerEvents: 'none' }}
              distanceFactor={7}
            >
              <div style={{
                color: isSelected ? '#a3e635' : isLast ? '#f87171' : '#94a3b8',
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10,
                fontWeight: isSelected ? 700 : 400,
                whiteSpace: 'nowrap',
                userSelect: 'none',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                {survey.md.toFixed(0)} m
              </div>
            </Html>

            {/* Detailed popup on select */}
            {isSelected && survey && (
              <Html
                position={[0, size + 0.35, 0]}
                style={{ pointerEvents: 'none' }}
                distanceFactor={6}
              >
                <div style={{
                  background: 'rgba(10,15,28,0.97)',
                  border: '1px solid rgba(163,230,53,0.5)',
                  borderRadius: 7,
                  padding: '7px 12px',
                  color: '#f1f5f9',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  lineHeight: 1.8,
                  boxShadow: '0 6px 28px rgba(0,0,0,0.8)',
                }}>
                  <div style={{ color: '#a3e635', fontWeight: 700, marginBottom: 3, fontSize: 10, letterSpacing: '0.1em' }}>
                    ◆ STATION {i}
                  </div>
                  <div>MD  <span style={{ color: '#a3e635' }}>{survey.md.toFixed(1)}</span> m</div>
                  <div>Inc <span style={{ color: '#e2e8f0' }}>{survey.inc.toFixed(2)}°</span>  Azi <span style={{ color: '#e2e8f0' }}>{survey.azi.toFixed(2)}°</span></div>
                  <div>TVD <span style={{ color: '#e2e8f0' }}>{survey.tvd.toFixed(1)}</span> m</div>
                  <div>DLS <span style={{ color: survey.dls > 3 ? '#f87171' : '#86efac' }}>{survey.dls.toFixed(2)}</span> °/30m</div>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </>
  )
}

// Drill bit — oriented along last trajectory tangent
function DrillBit({ points, rpm }: { points: THREE.Vector3[]; rpm: number }) {
  const ref = useRef<THREE.Group>(null)
  const speed = (rpm / 60) * 0.12

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += speed
  })

  const { position, quaternion } = useMemo(() => {
    const last = points[points.length - 1] ?? new THREE.Vector3(0, -5, 0)
    const prev = points[points.length - 2] ?? new THREE.Vector3(0, 0, 0)
    const dir  = last.clone().sub(prev).normalize()
    // Cone tip is at +Y in local space — rotate Y→dir
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    return { position: last, quaternion: quat }
  }, [points])

  return (
    <group position={position} quaternion={quaternion}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[0.035, 0.055, 0.18, 8]} />
        <meshStandardMaterial color="#b45309" roughness={0.25} metalness={0.95} emissive="#7c2d12" emissiveIntensity={0.4} />
      </mesh>
      {/* Tip cone */}
      <mesh position={[0, 0.14, 0]}>
        <coneGeometry args={[0.035, 0.1, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={1} emissive="#92400e" emissiveIntensity={0.5} />
      </mesh>
      {/* Rotating inner disc */}
      <group ref={ref}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.04, 6]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.1} metalness={1} emissive="#d97706" emissiveIntensity={0.6} />
        </mesh>
      </group>
      {/* Glow halo */}
      <pointLight color="#f59e0b" intensity={1.2} distance={0.8} />
    </group>
  )
}

// Thin custom axis indicators (no fat axesHelper)
function AxisIndicators() {
  const axes = useMemo(() => {
    const makeAxis = (dir: THREE.Vector3) =>
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), dir])
    return {
      E: makeAxis(new THREE.Vector3(1.5, 0, 0)),
      N: makeAxis(new THREE.Vector3(0, 0, -1.5)),
      V: makeAxis(new THREE.Vector3(0, -1.5, 0)),
    }
  }, [])

  return (
    <>
      <line geometry={axes.E}>
        <lineBasicMaterial color="#ef444488" />
      </line>
      <line geometry={axes.N}>
        <lineBasicMaterial color="#22c55e88" />
      </line>
      <line geometry={axes.V}>
        <lineBasicMaterial color="#64748b88" />
      </line>
      <Html position={[1.65, 0, 0]} style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#ef4444aa', fontFamily: 'monospace', fontSize: 9, userSelect: 'none' }}>E</span>
      </Html>
      <Html position={[0, 0, -1.65]} style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#22c55eaa', fontFamily: 'monospace', fontSize: 9, userSelect: 'none' }}>N</span>
      </Html>
    </>
  )
}

// Depth label at bit
function BitDepthLabel({ position, depth }: { position: THREE.Vector3; depth: number }) {
  return (
    <Html position={[position.x + 0.22, position.y, position.z]} style={{ pointerEvents: 'none' }}>
      <div style={{
        background: 'rgba(10,15,28,0.9)',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: 4,
        padding: '2px 7px',
        color: '#f87171',
        fontFamily: 'ui-monospace, monospace',
        fontSize: 10,
        whiteSpace: 'nowrap',
        letterSpacing: '0.05em',
      }}>
        {depth.toFixed(0)} m MD
      </div>
    </Html>
  )
}

// Main scene
function WellboreScene({ surveys, rpm, maxDepth, orbitRef }: {
  surveys: Survey[]; rpm: number; maxDepth: number; orbitRef: React.RefObject<any>
}) {
  const [selectedStation, setSelectedStation] = useState<number | null>(null)
  const points = useMemo(() => surveysTo3D(surveys), [surveys])
  const lastPoint = points[points.length - 1] ?? new THREE.Vector3(0, -5, 0)

  const center = useMemo(() => {
    if (points.length < 2) return new THREE.Vector3(0, -2.5, 0)
    const box = new THREE.Box3().setFromPoints(points)
    const c = new THREE.Vector3()
    box.getCenter(c)
    return c
  }, [points])

  return (
    <>
      <color attach="background" args={['hsl(220, 22%, 5%)']} />
      <fog attach="fog" args={['hsl(220, 22%, 5%)', 12, 28]} />

      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 10, 6]} intensity={0.7} />
      <pointLight position={[-3, 2, -3]} intensity={0.4} color="#60a5fa" />
      <pointLight position={[0, -5, 0]} intensity={0.5} color="#84cc16" distance={6} />

      {/* Trajectory */}
      <WellboreLine points={points} />
      <WellboreTube points={points} />

      {/* Survey markers */}
      <SurveyMarkers
        points={points}
        surveys={surveys}
        selected={selectedStation}
        onSelect={setSelectedStation}
      />

      {/* Bit */}
      <DrillBit points={points} rpm={rpm} />

      {/* Depth label */}
      {maxDepth > 0 && <BitDepthLabel position={lastPoint} depth={maxDepth} />}

      {/* Subtle axis indicators */}
      <AxisIndicators />

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.07}
        target={[center.x, center.y, center.z]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </>
  )
}

export function DrillVisualization({ fillHeight }: { fillHeight?: boolean }) {
  const { surveys } = useSurveysStore()
  const rpm = useMeasurementsStore((s) => s.telemetry.at(-1)?.rpm ?? 0)
  const maxDepth = surveys.length > 0 ? Math.max(...surveys.map(s => s.md)) : 0
  const orbitRef = useRef<any>(null)

  function handleZoomIn()  { orbitRef.current?.dollyIn(1.35);  orbitRef.current?.update() }
  function handleZoomOut() { orbitRef.current?.dollyOut(1.35); orbitRef.current?.update() }

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
      style={fillHeight ? { height: '100%' } : { height: 500 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/80 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500" />
          </span>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">
            3D Wellbore Trajectory
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span>Stations: <span className="text-foreground">{surveys.length || 2}</span></span>
          <span>MD: <span className="text-lime-400">{maxDepth.toFixed(0)} m</span></span>
          <span>RPM: <span className="text-foreground">{rpm.toFixed(0)}</span></span>
          <div className="flex items-center gap-0.5 border-l border-border pl-3">
            <button onClick={handleZoomOut} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" title="Отдалить">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleZoomIn} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors" title="Приблизить">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <Canvas camera={{ position: [7, 3, 7], fov: 48 }}>
          <WellboreScene surveys={surveys} rpm={rpm} maxDepth={maxDepth} orbitRef={orbitRef} />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-4 py-2 border-t border-border bg-card/60 text-[10px] font-mono text-muted-foreground shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-px bg-lime-500 opacity-80" />
          Ствол
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full border border-slate-400 opacity-70" />
          Замер
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full border border-red-400 opacity-80" />
          Долото
        </span>
        <span className="ml-auto opacity-50">Orbit · Scroll to zoom · Click station</span>
      </div>
    </div>
  )
}

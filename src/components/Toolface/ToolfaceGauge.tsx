import React from 'react'

interface ToolfaceGaugeProps {
  toolfaces: number[]       // recent readings, newest last (up to 5)
  size?: number
  targetAngle?: number      // center of desired sector
  targetWidth?: number      // total sector arc in degrees
  onTargetChange?: (angle: number) => void
}

export function ToolfaceGauge({
  toolfaces,
  size = 280,
  targetAngle,
  targetWidth = 30,
  onTargetChange,
}: ToolfaceGaugeProps) {
  const cx = size / 2
  const cy = size / 2
  const rimR       = size / 2 - 2
  const tickOuterR = rimR - 7
  const labelR     = tickOuterR - 19
  const innerR     = labelR - 12   // larger inner well

  const dotPlaceR = innerR * 0.66
  const PI = Math.PI

  // Tick marks every 10°, major every 30°
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const deg = i * 10
    const isMajor = deg % 30 === 0
    const tickLen = isMajor ? 11 : 5
    const rad = (deg - 90) * (PI / 180)
    return {
      deg, isMajor,
      x1: cx + (tickOuterR - tickLen) * Math.cos(rad),
      y1: cy + (tickOuterR - tickLen) * Math.sin(rad),
      x2: cx + tickOuterR * Math.cos(rad),
      y2: cy + tickOuterR * Math.sin(rad),
    }
  })

  // Degree labels every 30°
  const degLabels = Array.from({ length: 12 }, (_, i) => {
    const deg = i * 30
    const rad = (deg - 90) * (PI / 180)
    return { deg, x: cx + labelR * Math.cos(rad), y: cy + labelR * Math.sin(rad) }
  })

  // Sector annulus path between r1 and r2 spanning centerDeg ± halfW
  function sectorPath(centerDeg: number, halfW: number, r1: number, r2: number) {
    const s = (centerDeg - halfW - 90) * (PI / 180)
    const e = (centerDeg + halfW - 90) * (PI / 180)
    const large = halfW * 2 > 180 ? 1 : 0
    const x1o = cx + r2 * Math.cos(s), y1o = cy + r2 * Math.sin(s)
    const x2o = cx + r2 * Math.cos(e), y2o = cy + r2 * Math.sin(e)
    const x1i = cx + r1 * Math.cos(e), y1i = cy + r1 * Math.sin(e)
    const x2i = cx + r1 * Math.cos(s), y2i = cy + r1 * Math.sin(s)
    return `M ${x1o} ${y1o} A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${r1} ${r1} 0 ${large} 0 ${x2i} ${y2i} Z`
  }

  // Click on outer ring → set target angle
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onTargetChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - cx
    const y = e.clientY - rect.top - cy
    const dist = Math.sqrt(x * x + y * y)
    if (dist < innerR + 4 || dist > rimR) return
    let angle = Math.atan2(y, x) * (180 / PI) + 90
    if (angle < 0) angle += 360
    if (angle >= 360) angle -= 360
    onTargetChange(Math.round(angle))
  }

  const latest = toolfaces[toolfaces.length - 1]
  const latestLabel = latest != null ? latest.toFixed(1) : '—'

  // Check if latest reading is within target sector
  const inSector = targetAngle != null && latest != null && (() => {
    let diff = ((latest - targetAngle) + 360) % 360
    if (diff > 180) diff = 360 - diff
    return diff <= targetWidth / 2
  })()

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      onClick={handleClick}
      style={{ cursor: onTargetChange ? 'crosshair' : 'default' }}
    >
      <defs>
        <radialGradient id="tfBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(220 22% 9%)" />
          <stop offset="100%" stopColor="hsl(220 20% 5%)" />
        </radialGradient>
        <radialGradient id="tfInner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(220 18% 8%)" />
          <stop offset="100%" stopColor="hsl(220 22% 4%)" />
        </radialGradient>
        <filter id="tfGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="tfDotGlow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="tfSectorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Outer rim */}
      <circle cx={cx} cy={cy} r={rimR} fill="url(#tfBg)"
        stroke="hsl(220 16% 28%)" strokeWidth="1.5" />

      {/* Target sector — filled arc band covering tick + label zone */}
      {targetAngle != null && (
        <>
          <path
            d={sectorPath(targetAngle, targetWidth / 2, innerR + 2, tickOuterR + 1)}
            fill="#84cc16" opacity={0.13}
          />
          {/* Bright outer edge arc */}
          <path
            d={sectorPath(targetAngle, targetWidth / 2, tickOuterR - 1, tickOuterR + 1)}
            fill="#84cc16" opacity={0.4}
            filter="url(#tfSectorGlow)"
          />
          {/* Center radial line in outer zone */}
          {(() => {
            const rad = (targetAngle - 90) * (PI / 180)
            return (
              <line
                x1={cx + (innerR + 5) * Math.cos(rad)} y1={cy + (innerR + 5) * Math.sin(rad)}
                x2={cx + tickOuterR * Math.cos(rad)}    y2={cy + tickOuterR * Math.sin(rad)}
                stroke="#84cc16" strokeWidth="1.5" opacity={0.75}
              />
            )
          })()}
        </>
      )}

      {/* Tick marks */}
      {ticks.map(({ deg, isMajor, x1, y1, x2, y2 }) => (
        <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={isMajor ? 'hsl(215 20% 52%)' : 'hsl(220 16% 30%)'}
          strokeWidth={isMajor ? 1.5 : 0.75}
        />
      ))}

      {/* Degree labels */}
      {degLabels.map(({ deg, x, y }) => (
        <text key={deg} x={x} y={y}
          textAnchor="middle" dominantBaseline="central"
          fill={deg === 0 ? '#84cc16' : 'hsl(215 15% 55%)'}
          fontSize={deg === 0 ? 12 : 9.5}
          fontFamily="ui-monospace, 'JetBrains Mono', monospace"
          fontWeight={deg === 0 ? 'bold' : 'normal'}
        >
          {deg === 0 ? 'N' : deg}
        </text>
      ))}

      {/* Inner face — the "well" */}
      <circle cx={cx} cy={cy} r={innerR}
        fill="url(#tfInner)"
        stroke={inSector ? 'rgba(132,204,22,0.4)' : 'hsl(220 16% 14%)'}
        strokeWidth={inSector ? 1.5 : 1}
      />

      {/* Quadrant marks on inner edge */}
      {(['U', 'R', 'D', 'L'] as const).map((label, qi) => {
        const deg = qi * 90
        const r = innerR - 12
        const rad = (deg - 90) * (PI / 180)
        return (
          <text key={label}
            x={cx + r * Math.cos(rad)} y={cy + r * Math.sin(rad)}
            textAnchor="middle" dominantBaseline="central"
            fill={label === 'U' ? '#84cc16' : 'hsl(215 15% 38%)'}
            fontSize={label === 'U' ? 11 : 9}
            fontFamily="ui-monospace, monospace"
            fontWeight={label === 'U' ? 'bold' : 'normal'}
          >{label}</text>
        )
      })}

      {/* Target center dashed line inside inner well */}
      {targetAngle != null && (() => {
        const rad = (targetAngle - 90) * (PI / 180)
        return (
          <line
            x1={cx + 10 * Math.cos(rad)}            y1={cy + 10 * Math.sin(rad)}
            x2={cx + (innerR - 14) * Math.cos(rad)} y2={cy + (innerR - 14) * Math.sin(rad)}
            stroke="#84cc16" strokeWidth="1" opacity={0.35} strokeDasharray="3 4"
          />
        )
      })()}

      {/* Toolface scatter dots — oldest (dim) to newest (bright) */}
      {toolfaces.map((tf, i) => {
        const isLatest = i === toolfaces.length - 1
        const ageFrac = toolfaces.length > 1 ? i / (toolfaces.length - 1) : 1
        const opacity = 0.18 + ageFrac * 0.82
        const rad = (tf - 90) * (PI / 180)
        const dx = cx + dotPlaceR * Math.cos(rad)
        const dy = cy + dotPlaceR * Math.sin(rad)
        const r = isLatest ? 5.5 : 3.5
        return (
          <g key={i}>
            {isLatest && (
              <>
                <circle cx={dx} cy={dy} r={11} fill="#84cc16" opacity={0.08} />
                <line
                  x1={cx} y1={cy} x2={dx} y2={dy}
                  stroke="#84cc16" strokeWidth="1" opacity={0.22}
                />
              </>
            )}
            <circle
              cx={dx} cy={dy} r={r}
              fill={isLatest ? '#84cc16' : '#a3e635'}
              opacity={opacity}
              filter={isLatest ? 'url(#tfDotGlow)' : undefined}
            />
          </g>
        )
      })}

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={5.5}
        fill="hsl(220 20% 8%)"
        stroke={inSector ? '#84cc16' : 'hsl(215 15% 40%)'}
        strokeWidth="1.5"
        filter="url(#tfGlow)"
      />

      {/* Value readout */}
      <text x={cx} y={cy + innerR * 0.46}
        textAnchor="middle" dominantBaseline="central"
        fill={inSector ? '#84cc16' : 'hsl(210 30% 95%)'} fontSize={18}
        fontFamily="ui-monospace, 'JetBrains Mono', monospace"
        fontWeight="bold" letterSpacing="0.5"
      >
        {latestLabel}°
      </text>
      <text x={cx} y={cy + innerR * 0.46 + 20}
        textAnchor="middle" dominantBaseline="central"
        fill="hsl(215 15% 48%)" fontSize={8.5}
        fontFamily="ui-monospace, monospace" letterSpacing="2"
      >
        MAG TOOLFACE
      </text>
    </svg>
  )
}

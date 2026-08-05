import { useEffect, useRef, useState } from 'react'
import type { DashboardData } from '@/types/dashboard'

const UP = '#f0515e'
const DOWN = '#34c38f'
const MA50 = '#f2a93b'
const MA200 = '#5b9bff'
const GRID = '#1c2530'
const AXIS = '#68798a'

interface Hover {
  x: number
  idx: number
}

export default function KlineChart({ data }: { data: DashboardData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)

  const candles = data.candles
  const ma50 = data.ma50Series
  const ma200 = data.ma200Series

  // find cross points (ma50 - ma200 sign change)
  const crosses: { idx: number; golden: boolean }[] = []
  for (let i = 1; i < candles.length; i++) {
    const dPrev = ma50[i - 1].value - ma200[i - 1].value
    const dCur = ma50[i].value - ma200[i].value
    if (dPrev !== 0 && Math.sign(dPrev) !== Math.sign(dCur)) {
      crosses.push({ idx: i, golden: dCur > 0 })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W = wrap.clientWidth
      const H = Math.max(360, Math.min(460, Math.round(W * 0.45)))
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      const padL = 8
      const padR = 56
      const padT = 14
      const padB = 26
      const plotW = W - padL - padR
      const plotH = H - padT - padB
      const n = candles.length

      let lo = Infinity
      let hi = -Infinity
      for (const c of candles) {
        lo = Math.min(lo, c.low)
        hi = Math.max(hi, c.high)
      }
      const pad = (hi - lo) * 0.06
      lo -= pad
      hi += pad

      const x = (i: number) => padL + ((i + 0.5) / n) * plotW
      const y = (v: number) => padT + ((hi - v) / (hi - lo)) * plotH

      // grid + y labels
      ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const ticks = 5
      for (let t = 0; t <= ticks; t++) {
        const v = lo + ((hi - lo) * t) / ticks
        const yy = y(v)
        ctx.strokeStyle = GRID
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padL, yy)
        ctx.lineTo(W - padR, yy)
        ctx.stroke()
        ctx.fillStyle = AXIS
        ctx.fillText(v.toFixed(0), W - padR + 8, yy)
      }

      // x labels: monthly
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      let lastMonth = ''
      for (let i = 0; i < n; i++) {
        const m = candles[i].date.slice(0, 7)
        if (m !== lastMonth) {
          lastMonth = m
          ctx.fillStyle = AXIS
          ctx.fillText(m, x(i), H - padB + 8)
        }
      }

      // candles
      const bw = Math.max(1.5, Math.min(7, (plotW / n) * 0.62))
      for (let i = 0; i < n; i++) {
        const c = candles[i]
        const up = c.close >= c.open
        const col = up ? UP : DOWN
        ctx.strokeStyle = col
        ctx.fillStyle = col
        ctx.lineWidth = 1
        // wick
        ctx.beginPath()
        ctx.moveTo(x(i), y(c.high))
        ctx.lineTo(x(i), y(c.low))
        ctx.stroke()
        // body
        const yO = y(c.open)
        const yC = y(c.close)
        const top = Math.min(yO, yC)
        const h = Math.max(1, Math.abs(yO - yC))
        ctx.fillRect(x(i) - bw / 2, top, bw, h)
      }

      // MA lines
      const drawMa = (series: { value: number }[], color: string) => {
        ctx.strokeStyle = color
        ctx.lineWidth = 1.6
        ctx.beginPath()
        series.forEach((p, i) => {
          if (i === 0) ctx.moveTo(x(0), y(p.value))
          else ctx.lineTo(x(i), y(p.value))
        })
        ctx.stroke()
      }
      drawMa(ma50, MA50)
      drawMa(ma200, MA200)

      // cross markers
      for (const cr of crosses) {
        const cx = x(cr.idx)
        const cy = y(cr.golden ? candles[cr.idx].low : candles[cr.idx].high)
        ctx.fillStyle = cr.golden ? MA50 : MA200
        ctx.beginPath()
        ctx.arc(cx, cr.golden ? cy + 14 : cy - 14, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(cr.golden ? '金叉' : '死叉', cx, cr.golden ? cy + 28 : cy - 26)
      }

      // hover crosshair
      if (hover && hover.idx >= 0 && hover.idx < n) {
        ctx.strokeStyle = '#3a4a5c'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(x(hover.idx), padT)
        ctx.lineTo(x(hover.idx), H - padB)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [candles, ma50, ma200, hover, crosses])

  const onMove = (e: React.MouseEvent) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const padL = 8
    const padR = 56
    const plotW = rect.width - padL - padR
    const rel = (e.clientX - rect.left - padL) / plotW
    const idx = Math.round(rel * candles.length - 0.5)
    if (idx >= 0 && idx < candles.length) setHover({ x: e.clientX - rect.left, idx })
    else setHover(null)
  }

  const hc = hover ? candles[hover.idx] : null

  return (
    <section className="rounded-xl border border-[#26303d] bg-[#151c25] p-5">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-base font-medium text-[#e8eef5]">QQQ 日 K · MA50 / MA200</h2>
        <span className="flex items-center gap-1.5 text-xs text-[#9db0c1]">
          <i className="inline-block h-0.5 w-4 rounded" style={{ background: MA50 }} /> MA50
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#9db0c1]">
          <i className="inline-block h-0.5 w-4 rounded" style={{ background: MA200 }} /> MA200
        </span>
        {hc && (
          <span className="ml-auto text-xs tabular-nums text-[#9db0c1]">
            {hc.date}　开 {hc.open.toFixed(2)}　高 {hc.high.toFixed(2)}　低 {hc.low.toFixed(2)}　收{' '}
            <b style={{ color: hc.close >= hc.open ? UP : DOWN }}>{hc.close.toFixed(2)}</b>
            　MA50 {ma50[hover!.idx].value.toFixed(2)}　MA200 {ma200[hover!.idx].value.toFixed(2)}
          </span>
        )}
      </div>
      <div ref={wrapRef} className="relative w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <canvas ref={canvasRef} className="block w-full cursor-crosshair" />
      </div>
      <p className="mt-2 text-xs text-[#68798a]">
        近一年日线（{candles[0].date} ~ {candles[candles.length - 1].date}）· 数据源：每日盯盘任务
      </p>
    </section>
  )
}

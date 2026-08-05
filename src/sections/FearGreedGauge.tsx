import type { DashboardData } from '@/types/dashboard'

const ZONES = [
  { from: 0, to: 25, color: '#f0515e', label: '极度恐惧' },
  { from: 25, to: 45, color: '#f0865c', label: '恐惧' },
  { from: 45, to: 55, color: '#9db0c1', label: '中性' },
  { from: 55, to: 75, color: '#7fbf6e', label: '贪婪' },
  { from: 75, to: 100, color: '#34c38f', label: '极度贪婪' },
]

export default function FearGreedGauge({ data }: { data: DashboardData }) {
  const fg = data.fearGreed
  const unavailable = !fg.available || fg.value == null
  const v = Math.max(0, Math.min(100, fg.value ?? 0))
  // arc: 180°(left) → 0°(right), center (100, 100), r 80
  const polar = (val: number, r: number) => {
    const a = Math.PI * (1 - val / 100)
    return [100 + r * Math.cos(a), 100 - r * Math.sin(a)] as const
  }
  const arc = (from: number, to: number, r: number) => {
    const [x1, y1] = polar(from, r)
    const [x2, y2] = polar(to, r)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }
  const [nx, ny] = polar(v, 62)

  return (
    <section className="rounded-xl border border-[#26303d] bg-[#151c25] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-[#e8eef5]">恐惧与贪婪指数</h2>
        <span className="text-xs text-[#68798a]">{fg.source} · {fg.asOf}</span>
      </div>
      <div className="relative mx-auto mt-2 max-w-[260px]">
        <svg viewBox="0 0 200 112" className="w-full">
          {ZONES.map((z) => (
            <path
              key={z.label}
              d={arc(z.from + 0.8, z.to - 0.8, 80)}
              fill="none"
              stroke={z.color}
              strokeWidth={13}
              strokeLinecap="round"
              opacity={0.9}
            />
          ))}
          {!unavailable && (
            <>
              <line x1={100} y1={100} x2={nx} y2={ny} stroke="#e8eef5" strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={100} cy={100} r={4.5} fill="#e8eef5" />
            </>
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          {unavailable ? (
            <div className="pb-2 text-sm text-[#68798a]">暂无数据</div>
          ) : (
            <>
              <div className="text-3xl font-semibold tabular-nums text-[#e8eef5]">{v}</div>
              <div className="text-sm font-medium" style={{ color: ZONES.find((z) => v >= z.from && v < z.to)?.color }}>
                {fg.ratingZh} · {fg.rating}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-[10px] text-[#68798a]">
        <span>0 极度恐惧</span>
        <span>50</span>
        <span>100 极度贪婪</span>
      </div>
    </section>
  )
}

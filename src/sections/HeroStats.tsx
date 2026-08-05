import type { DashboardData } from '@/types/dashboard'
import { INITIAL_CAPITAL, fmtWan } from '@/types/dashboard'

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[#26303d] bg-[#151c25] px-4 py-3">
      <div className="text-xs text-[#68798a]">{label}</div>
      <div className="mt-1 text-xl font-medium tabular-nums" style={{ color: accent ?? '#e8eef5' }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs tabular-nums text-[#68798a]">{sub}</div>}
    </div>
  )
}

export default function HeroStats({ data }: { data: DashboardData }) {
  const m = data.market
  const diff = data.buckets.total - INITIAL_CAPITAL
  const ret = (diff / INITIAL_CAPITAL) * 100
  const upColor = '#f0515e'
  const downColor = '#34c38f'
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Stat
        label="QQQ 最新收盘"
        value={`$${m.close.toFixed(2)}`}
        sub={`${m.changePct >= 0 ? '+' : ''}${m.changePct}% 较前日`}
        accent={m.changePct >= 0 ? upColor : downColor}
      />
      <Stat label="MA50（50 日均线）" value={`$${m.ma50.toFixed(2)}`} />
      <Stat label="MA200（200 日均线）" value={`$${m.ma200.toFixed(2)}`} />
      <Stat
        label="均线偏离度"
        value={`${m.crossDistPct >= 0 ? '+' : ''}${m.crossDistPct}%`}
        sub={m.goldenCross ? 'MA50 在 MA200 上方' : 'MA50 在 MA200 下方'}
        accent={m.goldenCross ? '#f2a93b' : '#5b9bff'}
      />
      <Stat label="总资产" value={`${fmtWan(data.buckets.total)} 万`} sub={`初始 ${fmtWan(INITIAL_CAPITAL)} 万`} />
      <Stat
        label="累计收益率"
        value={`${diff >= 0 ? '+' : ''}${ret.toFixed(1)}%`}
        sub={`${diff >= 0 ? '+' : '−'}${fmtWan(Math.abs(diff))} 万`}
        accent={diff >= 0 ? upColor : downColor}
      />
    </section>
  )
}

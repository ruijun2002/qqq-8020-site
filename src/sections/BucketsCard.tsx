import type { DashboardData } from '@/types/dashboard'
import { INITIAL_CAPITAL, BASELINE_DATE, fmtWan } from '@/types/dashboard'

function Fact({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="border-t border-[#26303d] pt-2.5">
      <div className="text-xs text-[#68798a]">{k}</div>
      <div className={`mt-1 text-sm font-medium text-[#e8eef5] ${mono ? 'tabular-nums' : ''}`}>{v}</div>
    </div>
  )
}

export default function BucketsCard({ data }: { data: DashboardData }) {
  const b = data.buckets
  const death = b.regime === 'DEATH'
  const gp = b.growthPct
  const cp = 100 - gp
  const diff = b.total - INITIAL_CAPITAL
  const ret = (diff / INITIAL_CAPITAL) * 100
  const retColor = diff >= 0 ? '#f0515e' : '#34c38f'

  return (
    <section className="rounded-xl border border-[#26303d] bg-[#151c25] p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-base font-medium text-[#e8eef5]">资产双桶 · 80/20</h2>
        <span
          className={
            death
              ? 'rounded-full bg-[#5b9bff]/15 px-2.5 py-0.5 text-xs font-medium text-[#5b9bff]'
              : 'rounded-full bg-[#f2a93b]/15 px-2.5 py-0.5 text-xs font-medium text-[#f2a93b]'
          }
        >
          {death ? '死叉 · 防御停放' : '金叉 · 正常运作'}
        </span>
        <span className="text-xs text-[#68798a]">截至 {data.asOf}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-5">
        <div>
          <div className="text-xs text-[#9db0c1]">总模拟资产</div>
          <div className="mt-1 text-4xl font-medium tabular-nums text-[#e8eef5]">
            {fmtWan(b.total)}
            <span className="ml-1.5 text-base font-normal text-[#9db0c1]">万</span>
          </div>
          <div className="mt-1.5 text-sm font-medium tabular-nums">
            <span className="text-[#68798a]">累计收益率 </span>
            <span style={{ color: retColor }}>
              {diff >= 0 ? '+' : ''}
              {ret.toFixed(1)}%
            </span>
            <span className="ml-1.5 text-xs font-normal text-[#68798a]">
              （{diff >= 0 ? '+' : '−'}
              {fmtWan(Math.abs(diff))} 万）
            </span>
          </div>
        </div>

        <div className="min-w-[280px] flex-1">
          <div className="flex h-6 overflow-hidden rounded-md">
            <div
              className="transition-all"
              style={{
                width: `${gp}%`,
                background: death
                  ? 'repeating-linear-gradient(135deg, #5b9bff 0 6px, #4a86e8 6px 12px)'
                  : '#e8eef5',
              }}
            />
            <div
              className="transition-all"
              style={{
                width: `${cp}%`,
                background: 'repeating-linear-gradient(135deg, #26303d 0 5px, #1c2530 5px 10px)',
              }}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-1.5">
            <span className="flex items-baseline gap-2 text-sm text-[#9db0c1]">
              <i
                className="inline-block h-2 w-2 self-center rounded-sm"
                style={{ background: death ? '#5b9bff' : '#e8eef5' }}
              />
              {death ? `股票桶 ${b.growthAsset || '货基/短债'}` : `增长桶 ${b.growthAsset || 'QQQ'}`}
              <b className="tabular-nums text-[#e8eef5]">{fmtWan(b.growthValue)} 万</b>
              <span className="text-xs tabular-nums text-[#68798a]">{gp.toFixed(1)}%</span>
            </span>
            <span className="flex items-baseline gap-2 text-sm text-[#9db0c1]">
              <i className="inline-block h-2 w-2 self-center rounded-sm border border-[#26303d] bg-[#1c2530]" />
              现金桶 货基
              <b className="tabular-nums text-[#e8eef5]">{fmtWan(b.cashValue)} 万</b>
              <span className="text-xs tabular-nums text-[#68798a]">{cp.toFixed(1)}%</span>
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#68798a]">
        初始资金 <span className="tabular-nums text-[#9db0c1]">{fmtWan(INITIAL_CAPITAL)} 万</span> · 起始日期{' '}
        <span className="tabular-nums text-[#9db0c1]">{BASELINE_DATE}</span>
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Fact k="每月生活费提取" v={`${fmtWan(b.monthlyWithdrawal)} 万 / 月（固定）`} mono />
        <Fact k="上次提取月份" v={b.lastWithdrawalMonth} mono />
        <Fact
          k="年度再平衡"
          v={death ? '死叉期间暂停 · 等金叉恢复' : `${b.lastRebalanceYear} 已做 · 下次 ${b.nextRebalanceYear}`}
          mono
        />
      </div>

      {b.warnings.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {b.warnings.map((w, i) => (
            <p key={i} className="border-l-2 border-[#f2a93b] pl-2.5 text-xs text-[#f2a93b]">
              {w}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}

import type { DashboardData } from '@/types/dashboard'

export default function SiteHeader({ data }: { data: DashboardData }) {
  const golden = data.market.regime === 'GOLDEN'
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#26303d] pb-5">
      <h1 className="text-2xl font-semibold tracking-tight text-[#e8eef5]">
        QQQ 80/20 盯盘
      </h1>
      <span
        className={
          golden
            ? 'rounded-full bg-[#f2a93b]/15 px-3 py-1 text-sm font-medium text-[#f2a93b]'
            : 'rounded-full bg-[#5b9bff]/15 px-3 py-1 text-sm font-medium text-[#5b9bff]'
        }
      >
        {golden ? '金叉 · 正常运作' : '死叉 · 防御停放'}
      </span>
      <span className="text-sm text-[#68798a]">
        数据截至 {data.asOf} · 每日美股收盘后自动更新
      </span>
    </header>
  )
}

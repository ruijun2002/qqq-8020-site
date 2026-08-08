import type { DashboardData } from '@/types/dashboard'

interface Props {
  data: DashboardData
  onRefresh?: () => void
  refreshing?: boolean
}

export default function SiteHeader({ data, onRefresh, refreshing }: Props) {
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
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="刷新到最新数据"
          aria-label="刷新到最新数据"
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-[#26303d] bg-[#151c25] px-3 py-1.5 text-xs text-[#9db0c1] transition-colors hover:border-[#3a4a5c] hover:text-[#e8eef5] disabled:cursor-wait disabled:opacity-70"
        >
          <svg
            viewBox="0 0 16 16"
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13.5 8a5.5 5.5 0 1 1-1.61-3.89" />
            <path d="M13.5 2.5v2.6h-2.6" />
          </svg>
          {refreshing ? '刷新中' : '刷新'}
        </button>
      )}
    </header>
  )
}

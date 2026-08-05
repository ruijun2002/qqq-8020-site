import type { DashboardData } from '@/types/dashboard'

const toneStyle: Record<string, { border: string; badge: string; label: string }> = {
  success: { border: '#f2a93b', badge: 'bg-[#f2a93b]/15 text-[#f2a93b]', label: '金叉持有' },
  warning: { border: '#5b9bff', badge: 'bg-[#5b9bff]/15 text-[#5b9bff]', label: '防御停放' },
  danger: { border: '#f0515e', badge: 'bg-[#f0515e]/15 text-[#f0515e]', label: '风险警示' },
}

export default function AdviceCard({ data }: { data: DashboardData }) {
  const t = toneStyle[data.advice.tone] ?? toneStyle.success
  return (
    <section
      className="rounded-xl border border-[#26303d] bg-[#151c25] p-5"
      style={{ borderInlineStart: `3px solid ${t.border}` }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-[#e8eef5]">今日操作建议</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.badge}`}>{t.label}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#e8eef5]">{data.advice.text}</p>
      <p className="mt-2 text-xs tabular-nums text-[#68798a]">{data.advice.detail}</p>
      <div className="mt-4 border-t border-[#26303d] pt-3 text-xs leading-relaxed text-[#9db0c1]">
        策略规则：金叉期维持 80% QQQ + 20% 货基，每月提取 4 万生活费，每年再平衡一次；
        死叉期股票桶全部转货基/短债，生活费照取，静候金叉恢复。
      </div>
    </section>
  )
}

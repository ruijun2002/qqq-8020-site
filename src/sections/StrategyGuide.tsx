export default function StrategyGuide() {
  return (
    <section className="rounded-xl border border-[#26303d] bg-[#151c25] p-5">
      <h2 className="text-base font-medium text-[#e8eef5]">策略说明 · QQQ 80/20 双桶投资法</h2>
      <p className="mt-2 text-xs leading-relaxed text-[#68798a]">
        一套面向长期生活开支的纪律化投资方法：用两条均线的位置关系决定「进攻」还是「防守」，
        用固定比例和固定提款消除情绪决策。
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#26303d] bg-[#1c2530]/50 p-4">
          <div className="flex items-center gap-2">
            <i className="inline-block h-2 w-2 rounded-full bg-[#f2a93b]" />
            <h3 className="text-sm font-medium text-[#f2a93b]">金叉期 · 正常运作</h3>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#9db0c1]">
            <li>· 条件：MA50 在 MA200 上方</li>
            <li>· 增长桶（80%）持有 QQQ，分享纳指长期增长</li>
            <li>· 现金桶（20%）货币基金，年化约 2%</li>
            <li>· 每月从现金桶固定提取 4 万生活费</li>
            <li>· 每年再平衡一次，恢复 80/20 比例</li>
          </ul>
        </div>
        <div className="rounded-lg border border-[#26303d] bg-[#1c2530]/50 p-4">
          <div className="flex items-center gap-2">
            <i className="inline-block h-2 w-2 rounded-full bg-[#5b9bff]" />
            <h3 className="text-sm font-medium text-[#5b9bff]">死叉期 · 防御停放</h3>
          </div>
          <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#9db0c1]">
            <li>· 条件：MA50 跌破 MA200</li>
            <li>· 股票桶全部转入货币基金 / 短债，回避下跌段</li>
            <li>· 生活费照常每月提取 4 万（不做通胀上调）</li>
            <li>· 暂停年度再平衡，静候趋势修复</li>
            <li>· 再次金叉时按当时总资产恢复 80/20</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-[#26303d] pt-3 text-xs leading-relaxed text-[#9db0c1]">
        <b className="text-[#e8eef5]">为什么有效：</b>
        200 日均线代表长期趋势，50 日均线上穿说明中短期动能转强。金叉期满仓进攻、死叉期全身而退，
        用「20% 现金桶 + 固定提款」保证任何行情下生活费不断供；纪律化的再平衡与信号切换，
        避免了「跌了不敢补、涨了舍不得卖」的人性弱点。
        <span className="text-[#68798a]">（初始资金 2,000 万 · 起始日期 2026-07-31 · 本页数据每日美股收盘后自动更新）</span>
      </div>
    </section>
  )
}

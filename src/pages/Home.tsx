import { useEffect, useState } from 'react'
import bundledData from '../data.json'
import type { DashboardData } from '@/types/dashboard'
import SiteHeader from '@/sections/SiteHeader'
import HeroStats from '@/sections/HeroStats'
import KlineChart from '@/sections/KlineChart'
import AdviceCard from '@/sections/AdviceCard'
import FearGreedGauge from '@/sections/FearGreedGauge'
import BucketsCard from '@/sections/BucketsCard'
import StrategyGuide from '@/sections/StrategyGuide'

// 公网部署后，打开页面时实时拉取最新数据快照；优先同源静态文件（Pages 托管，国内稳定），
// 其次 GitHub raw，都失败时回退到构建时内置的数据。
const DATA_URLS = [
  'data.json',
  'https://raw.githubusercontent.com/ruijun2002/qqq-8020-site/main/src/data.json',
]

export default function Home() {
  const [data, setData] = useState<DashboardData>(bundledData as unknown as DashboardData)

  useEffect(() => {
    let cancelled = false
    const tryFetch = (idx: number): Promise<void> => {
      if (idx >= DATA_URLS.length) return Promise.resolve()
      return fetch(DATA_URLS[idx], { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d) => {
          if (!cancelled && d && d.market && d.candles) setData(d as DashboardData)
        })
        .catch(() => tryFetch(idx + 1))
    }
    tryFetch(0)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0d1218] font-sans">
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
        <SiteHeader data={data} />
        <HeroStats data={data} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <KlineChart data={data} />
          </div>
          <div className="flex flex-col gap-5">
            <AdviceCard data={data} />
            <FearGreedGauge data={data} />
          </div>
        </div>
        <BucketsCard data={data} />
        <StrategyGuide />
        <footer className="border-t border-[#26303d] pt-4 text-xs text-[#68798a]">
          数据由「QQQ 金叉/死叉盯盘 · 每日收盘更新」任务生成（{data.generatedAt.slice(0, 10)}）· 仅供个人投资记录，不构成投资建议
        </footer>
      </main>
    </div>
  )
}

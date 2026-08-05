export interface Candle {
  date: string
  open: number
  high: number
  low: number
  close: number
}

export interface MaPoint {
  date: string
  value: number
}

export interface DashboardData {
  asOf: string
  generatedAt: string
  market: {
    symbol: string
    close: number
    prevClose: number
    changePct: number
    ma50: number
    ma200: number
    crossDistPct: number
    goldenCross: boolean
    signal: string
    regime: 'GOLDEN' | 'DEATH'
    currency: string
  }
  candles: Candle[]
  ma50Series: MaPoint[]
  ma200Series: MaPoint[]
  buckets: {
    regime: 'GOLDEN' | 'DEATH'
    total: number
    growthValue: number
    growthAsset: string
    growthShares: number
    growthPct: number
    cashValue: number
    cashPct: number
    moneyFundRate: number
    monthlyWithdrawal: number
    lastWithdrawalMonth: string
    lastRebalanceYear: number
    nextRebalanceYear: number
    warnings: string[]
  }
  fearGreed: {
    value: number
    rating: string
    ratingZh: string
    asOf: string
    source: string
    available: boolean
  }
  advice: {
    signal: string
    regime: 'GOLDEN' | 'DEATH'
    text: string
    detail: string
    tone: 'success' | 'warning' | 'danger'
  }
}

export const INITIAL_CAPITAL = 20_000_000
export const BASELINE_DATE = '2026-07-31'

export function fmtWan(v: number): string {
  return (v / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}

#!/usr/bin/env python3
"""QQQ 80/20 双桶投资法 · 云端每日数据更新（GitHub Actions 运行，纯标准库）。

流程：拉取 QQQ 日线 -> 读取仓库内 state.json -> 计提货基收益 / 每月提款 /
均线信号判定（金叉/死叉切换）/ 年度再平衡 -> 写回 state.json 与 src/data.json。
"""
import csv
import io
import json
import subprocess
import sys
import time
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / "state.json"
DATA_PATH = ROOT / "src" / "data.json"

INITIAL_CAPITAL = 20_000_000
MONTHLY_WITHDRAWAL = 40_000
MONEY_FUND_RATE = 0.02
CANDLES_KEEP = 250

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


def http_get(url, retries=3):
    """urllib 优先，失败重试；仍失败回退到 curl（部分网络环境下 urllib 握手不稳定）。"""
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8")
        except Exception as e:  # noqa: BLE001
            last = e
            print(f"[warn] urllib 第 {attempt + 1} 次请求失败: {e}", file=sys.stderr)
            time.sleep(2)
    print("[warn] 回退到 curl", file=sys.stderr)
    out = subprocess.run(["curl", "-sL", "-m", "40", "-A", UA["User-Agent"], url],
                         capture_output=True, text=True, timeout=60)
    if out.returncode != 0 or not out.stdout.strip():
        raise RuntimeError(f"curl 也失败: {out.stderr.strip() or last}")
    return out.stdout


def fetch_json(url):
    return json.loads(http_get(url))


def fetch_candles_yahoo(host):
    """Yahoo Finance chart API（GitHub 运行器可用）。返回升序 OHLC 列表。"""
    d = fetch_json(f"https://{host}/v8/finance/chart/QQQ?range=2y&interval=1d&includePrePost=false")
    res = d["chart"]["result"][0]
    tz_off = int(res["meta"].get("gmtoffset", -14400))
    q = res["indicators"]["quote"][0]
    rows = []
    from datetime import timedelta, timezone
    for ts, o, h, l, c in zip(res["timestamp"], q["open"], q["high"], q["low"], q["close"]):
        if c is None or o is None:
            continue
        dt = datetime.fromtimestamp(ts + tz_off, tz=timezone.utc).date()
        rows.append({"date": str(dt), "open": round(o, 2), "high": round(h, 2),
                     "low": round(l, 2), "close": round(c, 2)})
    return rows


def fetch_candles_stooq():
    text = http_get("https://stooq.com/q/d/l/?s=qqq.us&i=d")
    rows = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            rows.append({"date": row["Date"], "open": round(float(row["Open"]), 2),
                         "high": round(float(row["High"]), 2), "low": round(float(row["Low"]), 2),
                         "close": round(float(row["Close"]), 2)})
        except (KeyError, ValueError):
            continue
    return rows


def fetch_candles():
    """多数据源依次尝试：雅虎 query1 -> 雅虎 query2 -> Stooq。"""
    errors = []
    for name, fn in [("yahoo-query1", lambda: fetch_candles_yahoo("query1.finance.yahoo.com")),
                     ("yahoo-query2", lambda: fetch_candles_yahoo("query2.finance.yahoo.com")),
                     ("stooq", fetch_candles_stooq)]:
        try:
            rows = fn()
            if len(rows) >= 210:
                print(f"行情数据源: {name}（{len(rows)} 条）")
                return rows
            errors.append(f"{name}: 仅 {len(rows)} 条")
        except Exception as e:  # noqa: BLE001
            errors.append(f"{name}: {e}")
            print(f"[warn] {name} 失败: {e}", file=sys.stderr)
    raise RuntimeError("所有行情数据源均失败 -> " + " | ".join(errors))


def fetch_fear_greed():
    """CNN 恐惧与贪婪指数；失败时保留现有数据，否则 available=false，不影响主流程。"""
    zh = {"extreme fear": "极度恐惧", "fear": "恐惧", "neutral": "中性",
          "greed": "贪婪", "extreme greed": "极度贪婪"}
    try:
        url = "https://production.dataviz.cnn.com/index/fearandgreed/graphdata"
        req_headers = dict(UA)
        req_headers["Referer"] = "https://edition.cnn.com/markets/fear-and-greed"
        req = urllib.request.Request(url, headers=req_headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode("utf-8"))
        except Exception:
            d = fetch_json(url)
        fg = d["fear_and_greed"]
        rating = str(fg.get("rating", "")).lower()
        return {
            "value": round(float(fg["score"]), 1),
            "rating": rating.title(),
            "ratingZh": zh.get(rating, rating),
            "asOf": str(fg.get("timestamp", ""))[:10],
            "source": "CNN",
            "available": True,
        }
    except Exception as e:  # noqa: BLE001
        print(f"[warn] 恐惧贪婪指数获取失败: {e}", file=sys.stderr)
        try:
            prev = json.loads(DATA_PATH.read_text(encoding="utf-8")).get("fearGreed") or {}
            if prev.get("available") and prev.get("value") is not None:
                print(f"[warn] 保留上次指数: {prev['value']} ({prev.get('asOf')})", file=sys.stderr)
                return prev
        except Exception:  # noqa: BLE001
            pass
        return {"value": None, "rating": "", "ratingZh": "", "asOf": "",
                "source": "CNN", "available": False}


def ma_series(closes, window):
    """与 closes 等长的移动平均序列；不足窗口的位置为 None。"""
    out, s = [], 0.0
    for i, c in enumerate(closes):
        s += c
        if i >= window:
            s -= closes[i - window]
        out.append(round(s / window, 2) if i >= window - 1 else None)
    return out


def main():
    if "--from-existing" in sys.argv:
        # 本地验证模式：用现有 data.json 的 K 线验证计算逻辑（不访问网络行情）
        candles_all = json.loads(DATA_PATH.read_text(encoding="utf-8"))["candles"]
        print(f"[验证模式] 使用现有 data.json 的 {len(candles_all)} 根 K 线")
    else:
        candles_all = fetch_candles()
    closes = [c["close"] for c in candles_all]
    latest = candles_all[-1]
    prev = candles_all[-2]
    cur_date = date.fromisoformat(latest["date"])
    print(f"最新交易日 {cur_date} 收盘 {latest['close']}")

    ma50_all = ma_series(closes, 50)
    ma200_all = ma_series(closes, 200)
    ma50, ma200 = ma50_all[-1], ma200_all[-1]

    # ---- 双桶状态 ----
    state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    regime = state.get("regime", "GOLDEN")
    shares = float(state.get("sharesQQQ", 0))
    parked = float(state.get("parkedValue", 0))
    cash = float(state.get("cashValue", 0))
    last_wd = state.get("lastWithdrawalMonth", "")
    last_rb = int(state.get("lastRebalanceYear", cur_date.year))
    last_upd = date.fromisoformat(state.get("lastUpdatedDate", str(cur_date)))
    warnings = []

    # 1. 计提货基日收益
    days = max((cur_date - last_upd).days, 0)
    if days:
        factor = (1 + MONEY_FUND_RATE / 365) ** days
        cash *= factor
        parked *= factor

    # 2. 每月固定提取 4 万生活费
    cur_month = f"{cur_date.year:04d}-{cur_date.month:02d}"
    if cur_month != last_wd:
        if cash < MONTHLY_WITHDRAWAL:
            warnings.append(f"{cur_month} 生活费提取：现金桶余额不足 4 万")
        cash -= MONTHLY_WITHDRAWAL
        last_wd = cur_month

    # 3. 信号判定与状态切换
    signal = "GOLDEN_CROSS" if ma50 > ma200 else "DEATH_CROSS"
    if regime == "GOLDEN" and ma50 < ma200:
        parked = shares * latest["close"]
        shares = 0.0
        regime = "DEATH"
        warnings.append("死叉触发，股票桶已转货基/短债")
    elif regime == "DEATH" and ma50 > ma200:
        total = parked + cash
        shares = round(0.8 * total / latest["close"], 6)
        cash = 0.2 * total
        parked = 0.0
        regime = "GOLDEN"
        warnings.append("再次金叉，已恢复 80/20")

    # 4. 年度再平衡（仅金叉期）
    if regime == "GOLDEN" and cur_date.year != last_rb:
        total = shares * latest["close"] + cash
        shares = round(0.8 * total / latest["close"], 6)
        cash = 0.2 * total
        last_rb = cur_date.year
        warnings.append(f"{cur_date.year} 年度再平衡完成，恢复 80/20")

    # 5. 汇总
    growth_value = shares * latest["close"] if regime == "GOLDEN" else parked
    growth_asset = "QQQ" if regime == "GOLDEN" else "货基/短债"
    total = growth_value + cash
    growth_pct = round(growth_value / total * 100, 1) if total else 0.0

    # 6. 写回状态
    STATE_PATH.write_text(json.dumps({
        "regime": regime,
        "sharesQQQ": round(shares, 6),
        "parkedValue": round(parked, 2),
        "cashValue": round(cash, 2),
        "moneyFundRate": MONEY_FUND_RATE,
        "lastWithdrawalMonth": last_wd,
        "lastRebalanceYear": last_rb,
        "lastUpdatedDate": str(cur_date),
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 7. 生成网站数据（近 250 根 K 线 + 对齐均线）
    tail = candles_all[-CANDLES_KEEP:]
    n0 = len(candles_all) - len(tail)
    cross_dist = round((ma50 - ma200) / ma200 * 100, 1)
    golden = regime == "GOLDEN"
    artifact = {
        "asOf": str(cur_date),
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "market": {
            "symbol": "QQQ",
            "close": latest["close"],
            "prevClose": prev["close"],
            "changePct": round((latest["close"] - prev["close"]) / prev["close"] * 100, 1),
            "ma50": ma50,
            "ma200": ma200,
            "crossDistPct": cross_dist,
            "goldenCross": golden,
            "signal": signal,
            "regime": regime,
            "currency": "USD",
        },
        "candles": tail,
        "ma50Series": [{"date": c["date"], "value": ma50_all[n0 + i]}
                       for i, c in enumerate(tail) if ma50_all[n0 + i] is not None],
        "ma200Series": [{"date": c["date"], "value": ma200_all[n0 + i]}
                        for i, c in enumerate(tail) if ma200_all[n0 + i] is not None],
        "buckets": {
            "regime": regime,
            "total": round(total),
            "growthValue": round(growth_value),
            "growthAsset": growth_asset,
            "growthShares": round(shares, 6),
            "growthPct": growth_pct,
            "cashValue": round(cash),
            "cashPct": round(100 - growth_pct, 1),
            "moneyFundRate": MONEY_FUND_RATE,
            "monthlyWithdrawal": MONTHLY_WITHDRAWAL,
            "lastWithdrawalMonth": last_wd,
            "lastRebalanceYear": last_rb,
            "nextRebalanceYear": last_rb + 1,
            "warnings": warnings,
        },
        "fearGreed": fetch_fear_greed(),
        "advice": {
            "signal": signal,
            "regime": regime,
            "text": (f"MA50（{ma50}）在 MA200（{ma200}）上方，维持 80% QQQ 正常运作。" if golden
                     else f"MA50（{ma50}）跌破 MA200（{ma200}），股票桶已转货基/短债，静等金叉恢复。"),
            "detail": f"MA50 = {ma50} 美元，MA200 = {ma200} 美元，偏离 {'+' if cross_dist >= 0 else ''}{cross_dist}%。",
            "tone": "success" if golden else "danger",
        },
    }
    payload = json.dumps(artifact, ensure_ascii=False, indent=2) + "\n"
    DATA_PATH.write_text(payload, encoding="utf-8")
    # 同时输出到 public/，随 Pages 部署为同源静态文件（国内访问比 raw.githubusercontent.com 稳定）
    (ROOT / "public").mkdir(exist_ok=True)
    (ROOT / "public" / "data.json").write_text(payload, encoding="utf-8")
    print(f"完成：regime={regime} total={round(total):,} 累计收益率={(total - INITIAL_CAPITAL) / INITIAL_CAPITAL * 100:+.1f}%")


if __name__ == "__main__":
    main()

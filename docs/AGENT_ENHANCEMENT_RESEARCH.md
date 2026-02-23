# Agent Enhancement Research Report

> Generated: 2026 | PerpsClaw Trading Agents Competitive Analysis & Enhancement Roadmap

## Executive Summary

This report synthesizes research from academic papers, industry best practices, and quantitative trading literature to identify key improvements for making PerpsClaw trading agents market-competitive.

**Current State**: Demo/retail grade with fixed parameters and basic indicators
**Target State**: Approaching institutional grade with adaptive systems and crypto-specific alpha

---

## 1. ADAPTIVE PARAMETER SYSTEMS

### Problem

Current agents use **fixed parameters** (SMA 10/30, BB 20/2, RSI 14). Modern systems use **dynamic reoptimization**.

### Research Sources

- [CGA-Agent Framework](https://arxiv.org/html/2510.07943v1) - Genetic algorithm with rolling-window backtesting
- [QuantEvolve](https://arxiv.org/html/2510.18569v1) - Multi-agent evolutionary strategy generation
- [Automated Adaptive Trading Systems](https://link.springer.com/article/10.1186/s40854-025-00754-3) - Outperforms buy-and-hold after risk adjustment

### Recommended Implementation

| Approach                          | Description                                                               |
| --------------------------------- | ------------------------------------------------------------------------- |
| **Rolling Window Reoptimization** | Re-optimize parameters every 30 trading days using walk-forward analysis  |
| **ATR-Scaled Parameters**         | Scale indicator periods by current volatility (high vol = longer periods) |
| **Bayesian Optimization**         | Use Optuna/TPE to efficiently search parameter space                      |

### Code Example

```typescript
// Current (fixed)
const SMA_FAST = 10;
const SMA_SLOW = 30;

// Adaptive (ATR-scaled)
const atr14 = calculateATR(prices, 14);
const volatilityMultiplier = atr14 / avgATR; // Compare to 30-day avg
const SMA_FAST = Math.round(10 * volatilityMultiplier);
const SMA_SLOW = Math.round(30 * volatilityMultiplier);
```

---

## 2. REGIME DETECTION

### Problem

Agents apply the same strategy in all market conditions. Markets have **distinct regimes** requiring different approaches.

### Research Sources

- [QuantStart HMM Tutorial](https://www.quantstart.com/articles/market-regime-detection-using-hidden-markov-models-in-qstrader/)
- [Regime-Switching Factor Investing](https://www.mdpi.com/1911-8074/13/12/311)
- [GitHub: market-regime-detection](https://github.com/Sakeeb91/market-regime-detection)
- [Macrosynergy Hurst Exponent Research](https://macrosynergy.com/research/detecting-trends-and-mean-reversion-with-the-hurst-exponent/)

### Hidden Markov Model Approach

| Regime            | Characteristics                   | Strategy Response                   |
| ----------------- | --------------------------------- | ----------------------------------- |
| **Bull/Low Vol**  | Positive returns, low volatility  | Shark (momentum) active             |
| **Bear/High Vol** | Negative returns, high volatility | Reduce exposure, tighten stops      |
| **Ranging**       | Mixed returns, medium volatility  | Wolf (mean reversion) + Grid active |

### Hurst Exponent Classification

```typescript
// H > 0.55 = trending → use Shark (momentum)
// H < 0.45 = mean reverting → use Wolf
// 0.45 < H < 0.55 = random walk → use Grid or reduce exposure

const hurst = calculateHurstExponent(prices, 100);
if (hurst > 0.55) enableAgent("shark");
else if (hurst < 0.45) enableAgent("wolf");
else enableAgent("grid");
```

### Key Insight

> "The Hurst exponent is a single scalar value that indicates if a time series is purely random, trending, or rather mean reverting. Thus, it can validate either momentum or mean-reverting strategies."

---

## 3. VOLATILITY-ADAPTIVE RISK MANAGEMENT

### Research Sources

- [LuxAlgo ATR Stop-Loss Strategies](https://www.luxalgo.com/blog/how-to-use-atr-for-volatility-based-stop-losses/)
- [TrendSpider ATR Trailing Stops](https://trendspider.com/learning-center/atr-trailing-stops-a-guide-to-better-risk-management/)
- [Risk-Constrained Kelly Criterion](https://blog.quantinsti.com/risk-constrained-kelly-criterion/)
- [Kelly, VIX, and Hybrid Approaches](https://arxiv.org/html/2508.16598v1)

### ATR-Based Stops vs Fixed Stops

| Current (Fixed)      | Recommended (Dynamic)                     |
| -------------------- | ----------------------------------------- |
| Stop-loss: -5%       | Stop-loss: 2× ATR(14)                     |
| Take-profit: +10%    | Take-profit: 3× ATR(14)                   |
| Static trailing stop | ATR trailing stop that widens in high vol |

### ATR Stop Implementation

```typescript
const atr = calculateATR(prices, 14);
const stopDistance = atr * 2.0; // 2x ATR multiplier
const stopPrice = entryPrice - stopDistance; // for longs

// Trailing stop logic
if (currentPrice > highWaterMark) {
  highWaterMark = currentPrice;
  trailingStop = highWaterMark - atr * 1.5;
}
```

### Kelly Criterion Position Sizing

```typescript
// Full Kelly = (winRate * avgWin - lossRate * avgLoss) / avgWin
// Use Half-Kelly for safety (75% growth, 50% less drawdown)

const winRate = historicalWinRate; // e.g., 0.55
const avgWinLossRatio = avgWin / avgLoss; // e.g., 1.5
const kellyFraction =
  (winRate * avgWinLossRatio - (1 - winRate)) / avgWinLossRatio;
const halfKelly = kellyFraction / 2;
const positionSize = accountValue * halfKelly;
```

### Key Insight

> "Full Kelly maximizes growth but creates extreme volatility. Half Kelly captures approximately 75% of optimal growth with approximately 50% less drawdown. Most professional traders use Quarter to Half Kelly."

---

## 4. ORDER FLOW & MICROSTRUCTURE SIGNALS

### Research Sources

- [Order Flow Analysis of Cryptocurrency Markets](https://link.springer.com/article/10.1007/s42521-019-00007-w)
- [Explainable Patterns in Cryptocurrency Microstructure](https://arxiv.org/html/2602.00776)
- [Bitcoin Order Flow Toxicity](https://www.sciencedirect.com/science/article/pii/S0275531925004192)

### Key Signals

| Signal                   | Description                                         | Trading Use                        |
| ------------------------ | --------------------------------------------------- | ---------------------------------- |
| **Order Imbalance**      | (bid_volume - ask_volume) / total_volume            | Predict short-term direction       |
| **VPIN**                 | Volume-synchronized probability of informed trading | Predict volatility/jumps           |
| **Trade Flow Imbalance** | Net buy vs sell market orders                       | Stronger than order book imbalance |

### Key Findings

> "Trade flow imbalance is better at explaining contemporaneous price changes than aggregate order flow imbalance."

> "VPIN significantly predicts future price jumps, with positive serial correlation observed in both VPIN and jump size."

### Implementation

```typescript
const bidVolume = sumBidDepth(levels, 5); // Top 5 levels
const askVolume = sumAskDepth(levels, 5);
const imbalance = (bidVolume - askVolume) / (bidVolume + askVolume);

// Strong buy signal when imbalance > 0.3
// Strong sell signal when imbalance < -0.3
```

---

## 5. CRYPTO-SPECIFIC ALPHA SIGNALS

### Research Sources

- [Funding Rate Arbitrage Guide](https://blog.amberdata.io/the-ultimate-guide-to-funding-rate-arbitrage-amberdata)
- [Funding Rates Impact on Perpetual Swaps](https://blog.amberdata.io/funding-rates-how-they-impact-perpetual-swap-positions)
- [Liquidation Cascade Analysis](https://blog.amberdata.io/liquidations-in-crypto-how-to-anticipate-volatile-market-moves)
- [Liquidation Cascade Alpha (Sharpe 3.58)](https://medium.com/@tigroblanc/chasing-liquidation-cascade-alpha-in-crypto-how-to-get-299-return-with-sharpe-3-58-322ef625a8d1)
- [Nansen Solana On-Chain Analytics](https://www.nansen.ai/solana-onchain-data)

### Funding Rate Analysis

```typescript
// Extreme positive funding = crowded longs, expect reversal
// Extreme negative funding = crowded shorts, expect reversal
const fundingRate = await getFundingRate("SOL-PERP");

if (fundingRate > 0.01) {
  // >1% = extreme
  signal.bias = "bearish"; // Longs about to get squeezed
  signal.confidence *= 0.7; // Reduce long confidence
}
if (fundingRate < -0.01) {
  signal.bias = "bullish"; // Shorts about to get squeezed
}
```

### Liquidation Cascade Detection

```typescript
const openInterest = await getOpenInterest("SOL-PERP");
const recentLiquidations = await getLiquidations24h();

// High OI + low liquidation = leverage building up (danger)
// Dropping OI + high liquidation = cascade in progress
const cascadeRisk =
  openInterest.change24h > 0.1 && recentLiquidations < avgLiquidations;

if (cascadeRisk) {
  reduceExposure(0.5); // Cut position size in half
  widenStops(1.5); // Widen stops by 50%
}
```

### Key Insight

> "CFI (Cascade Flow Index) predicts tail risk with a Q5/Q1 crash rate ratio of 5.13x. High CFI indicates elevated crash probability and is useful as a regime filter."

### On-Chain Whale Tracking

```typescript
// Exchange inflows = bearish (selling pressure incoming)
// Exchange outflows = bullish (accumulation)
const netExchangeFlow = await getExchangeNetFlow("SOL", "24h");
if (netExchangeFlow > 100000) {
  // >100k SOL flowing to exchanges
  signal.bias = "bearish";
}
```

---

## 6. MACHINE LEARNING INTEGRATION PATH

### Research Sources

- [Deep Learning for Algorithmic Trading](https://www.sciencedirect.com/science/article/pii/S2590005625000177)
- [Machine Learning for Trading (GitHub)](https://github.com/stefan-jansen/machine-learning-for-trading)
- [Deep Q-Network Portfolio Optimization](https://dl.acm.org/doi/10.1145/3711542.3711567)
- [Pro Trader RL Framework](https://www.sciencedirect.com/science/article/pii/S0957417424013319)

### Recommended Progression

| Phase       | Approach                        | Complexity  |
| ----------- | ------------------------------- | ----------- |
| **Phase 1** | Rule-based + regime filter      | Low         |
| **Phase 2** | Random Forest regime classifier | Medium      |
| **Phase 3** | LSTM for price direction        | Medium-High |
| **Phase 4** | Deep Q-Network for execution    | High        |
| **Phase 5** | PPO/A2C for full strategy       | Very High   |

### Key Algorithms

- **DQN (Deep Q-Networks)**: Real-time portfolio management
- **PPO (Proximal Policy Optimization)**: Optimal trading actions
- **LSTM**: Capture temporal dependencies in price data
- **Multi-Agent RL**: Cooperative/competitive agents for market dynamics

### Key Insight

> "RL models can identify potential market patterns and generate efficient trading signals by analyzing historical market data. Furthermore, RL's application in portfolio optimization demonstrates its flexibility, allowing for dynamic adjustments based on real-time market changes."

---

## 7. BACKTESTING & VALIDATION

### Research Sources

- [Walk-Forward Analysis Guide](https://medium.com/funny-ai-quant/ai-algorithmic-trading-walk-forward-analysis-a-comprehensive-guide-to-advanced-backtesting-f3f8b790554a)
- [Walk-Forward Optimization](https://blog.quantinsti.com/walk-forward-optimization-introduction/)
- [Interactive Brokers WFA Deep Dive](https://www.interactivebrokers.com/campus/ibkr-quant-news/the-future-of-backtesting-a-deep-dive-into-walk-forward-analysis/)

### Walk-Forward Optimization (WFO)

```
Historical Data (2 years)
├── Training Window 1 (3 months) → Optimize params → Test Window 1 (1 month)
├── Training Window 2 (3 months) → Optimize params → Test Window 2 (1 month)
├── Training Window 3 (3 months) → Optimize params → Test Window 3 (1 month)
└── ... rolling forward

Aggregate out-of-sample results = true strategy performance
```

### Key Insight

> "Traditional backtesting does not reflect real-world performance. A strategy that appears profitable in backtests may collapse in live trading because fixed-period validation does not test its ability to adapt to new data."

### Validation Metrics

| Metric        | Target                         | Meaning                   |
| ------------- | ------------------------------ | ------------------------- |
| Sharpe Ratio  | > 1.5 (backtest), > 1.0 (live) | Risk-adjusted returns     |
| Profit Factor | > 1.5                          | Gross profit / gross loss |
| Max Drawdown  | < 20%                          | Worst peak-to-trough      |
| Win Rate      | > 45%                          | % of winning trades       |
| Expectancy    | > 0                            | Avg profit per trade      |

### Key Warning

> "Live trading often involves greater drawdowns than backtesting suggests - typically 1.5x to 2x higher - due to slippage and real-world costs."

---

## 8. IMPLEMENTATION PRIORITY MATRIX

| Priority | Enhancement                      | Impact   | Effort | Status |
| -------- | -------------------------------- | -------- | ------ | ------ |
| **1**    | ATR-based stops/exits            | High     | Low    | TODO   |
| **2**    | Hurst exponent regime filter     | High     | Medium | TODO   |
| **3**    | Funding rate signal              | High     | Low    | TODO   |
| **4**    | Walk-forward backtester          | Critical | High   | TODO   |
| **5**    | Kelly/Half-Kelly position sizing | Medium   | Low    | TODO   |
| **6**    | Hidden Markov regime detection   | High     | Medium | TODO   |
| **7**    | Order flow imbalance             | Medium   | Medium | TODO   |
| **8**    | Liquidation cascade detection    | Medium   | Medium | TODO   |
| **9**    | On-chain whale tracking          | Medium   | High   | TODO   |
| **10**   | ML regime classifier             | High     | High   | TODO   |

---

## 9. CURRENT VS. ENHANCED COMPARISON

| Aspect                | Current              | Enhanced                                    |
| --------------------- | -------------------- | ------------------------------------------- |
| **Parameters**        | Fixed (SMA 10/30)    | Adaptive (ATR-scaled, rolling optimization) |
| **Stops**             | Fixed % (-3% to -8%) | Dynamic ATR trailing (2-3× ATR)             |
| **Position Sizing**   | Fixed (0.4-0.5 SOL)  | Kelly/Half-Kelly based on win rate          |
| **Regime Awareness**  | None                 | Hurst + HMM classification                  |
| **Crypto Signals**    | None                 | Funding rate, OI, liquidation risk          |
| **Validation**        | Unit tests only      | Walk-forward backtesting                    |
| **Competitive Level** | Demo/retail          | Approaching institutional                   |

---

## References

### Adaptive Algorithms

- [CGA-Agent Framework](https://arxiv.org/html/2510.07943v1)
- [QuantEvolve Multi-Agent Framework](https://arxiv.org/html/2510.18569v1)
- [Adaptive Trading Strategy Optimization](https://link.springer.com/article/10.1007/s10489-025-06423-3)
- [Automated Adaptive Trading Systems](https://link.springer.com/article/10.1186/s40854-025-00754-3)

### Machine Learning

- [Deep Learning for Algorithmic Trading](https://www.sciencedirect.com/science/article/pii/S2590005625000177)
- [Machine Learning for Trading](https://github.com/stefan-jansen/machine-learning-for-trading)
- [Deep Q-Network Portfolio Optimization](https://dl.acm.org/doi/10.1145/3711542.3711567)

### Risk Management

- [Risk-Constrained Kelly Criterion](https://blog.quantinsti.com/risk-constrained-kelly-criterion/)
- [Kelly, VIX, and Hybrid Approaches](https://arxiv.org/html/2508.16598v1)
- [ATR Stop-Loss Strategies](https://www.luxalgo.com/blog/5-atr-stop-loss-strategies-for-risk-control/)

### Market Microstructure

- [Order Flow Analysis of Cryptocurrency Markets](https://link.springer.com/article/10.1007/s42521-019-00007-w)
- [Crypto Microstructure Patterns](https://arxiv.org/html/2602.00776)

### Regime Detection

- [Market Regime Detection with HMM](https://www.quantstart.com/articles/market-regime-detection-using-hidden-markov-models-in-qstrader/)
- [Hurst Exponent Trading](https://macrosynergy.com/research/detecting-trends-and-mean-reversion-with-the-hurst-exponent/)
- [GitHub: market-regime-detection](https://github.com/Sakeeb91/market-regime-detection)

### Crypto-Specific

- [Funding Rate Arbitrage](https://blog.amberdata.io/the-ultimate-guide-to-funding-rate-arbitrage-amberdata)
- [Liquidation Cascade Analysis](https://blog.amberdata.io/liquidations-in-crypto-how-to-anticipate-volatile-market-moves)
- [Nansen Solana Analytics](https://www.nansen.ai/solana-onchain-data)

### Backtesting

- [Walk-Forward Analysis](https://medium.com/funny-ai-quant/ai-algorithmic-trading-walk-forward-analysis-a-comprehensive-guide-to-advanced-backtesting-f3f8b790554a)
- [Walk-Forward Optimization](https://blog.quantinsti.com/walk-forward-optimization-introduction/)

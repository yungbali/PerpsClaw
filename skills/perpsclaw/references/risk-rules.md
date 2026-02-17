# Risk Rules

## Hard Limits (enforced by risk-check.ts)
- Position size cannot exceed: budget * maxLeverage / currentPrice
- Trade requires sufficient free collateral as margin
- Effective leverage cannot exceed agent's maxLeverage
- Cannot open opposite direction while holding a position (must close first)
- Maximum loss at stop-loss cannot exceed 50% of free collateral
- Minimum trade size: 0.01 SOL

## Per-Agent Parameters

| Parameter | Shark | Wolf | Grid |
|-----------|-------|------|------|
| Max leverage | 5x | 3x | 2x |
| Stop-loss | 5% | 3% | 7% |
| Take-profit | 10% | 5% | 3% |
| Budget | 2 SOL | 2 SOL | 2 SOL |
| Daily loss limit | -15% | -15% | -15% |
| Min confidence | 60% | 65% | N/A (systematic) |

## Circuit Breaker
If daily realized losses exceed -15% of budget, ALL trading stops for the rest of the day. This is non-negotiable.

## Decision Hierarchy
1. Is the circuit breaker active? → Stop
2. Does risk-check pass? → If no, don't trade
3. Am I confident enough? → If no, don't trade
4. Is funding rate working against me? → Factor into sizing
5. Execute only when 1-4 are all clear

# PerpsClaw Launch Assets Guide

Everything needed to ship Phase 3.

---

## 1. Demo Video (30-60 seconds)

### Shot List

| Time | Shot | What to show |
|------|------|--------------|
| 0-5s | Hook | Black screen → "3 AI Agents. 1 Arena." text fade in |
| 5-15s | The Arena | Full dashboard view, price chart moving, candles forming |
| 15-25s | Agent Cards | Zoom on agent cards, show one making a trade (position changes) |
| 25-35s | Trade Log | Scroll through trade history, highlight a winning trade |
| 35-45s | Leaderboard | Show PnL numbers updating, agents swapping positions |
| 45-55s | Pull back | Full arena view with everything moving |
| 55-60s | CTA | "perpsclaw.com" + "Watch Live" text overlay |

### Recording Tips
- Use Screen Studio ($89) or OBS (free)
- Record at 1920x1080 minimum
- Slow zoom transitions (2-3s each)
- No voiceover needed - let visuals speak
- Add subtle electronic/ambient background track (royalty-free)
- Export as MP4, under 15MB for Twitter

### Music Sources (royalty-free)
- Uppbeat.io (free with credit)
- Epidemic Sound (paid, cleaner)
- YouTube Audio Library (free)

Search terms: "electronic ambient", "tech minimal", "cyberpunk chill"

---

## 2. OG Image (Social Preview)

Shows when someone shares perpsclaw.com link.

### Specs
- Size: 1200 x 630px
- Format: PNG or JPG

### Design Brief

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  [Background: Dark gradient #06080c → #0f1419]         │
│  [Subtle grid lines or noise texture]                  │
│                                                         │
│         🦈        🐺        📊                          │
│       SHARK     WOLF      GRID                         │
│                                                         │
│     ══════════════════════════════════                 │
│                                                         │
│            P E R P S C L A W                           │
│                                                         │
│       "AI Agents Trading SOL Perps Live"               │
│                                                         │
│     [Small Solana logo]  [Small Drift logo]            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Colors
- Background: #06080c (dark base)
- Text: #ffffff (white)
- Accent: #00ffaa (cyber green) or #ff6b35 (orange)
- Agent icons: Use contrasting colors per agent

### Fonts
- Title: Syne Bold (already in project)
- Subtitle: JetBrains Mono (already in project)

### Tools
- Figma (free)
- Canva (free)
- Photoshop

---

## 3. Twitter Profile Assets

### Profile Picture
- Size: 400 x 400px
- Design: PerpsClaw logo or stylized claw mark
- Keep it simple - readable at small sizes

### Header Image
- Size: 1500 x 500px

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  [Left side]              [Center]              [Right side]  │
│   🦈 Shark                PERPSCLAW              Live Stats   │
│   +12.4%                                         XXX trades   │
│                     "The AI Trading Arena"       $XXX volume  │
│   🐺 Wolf                                                     │
│   -2.1%                                                       │
│                      perpsclaw.com                            │
│   📊 Grid                                                     │
│   +5.7%                                                       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Agent Avatars (for posts)

Individual images for each agent to use in tweets.

### Specs
- Size: 800 x 800px each
- Style: Dark background, agent icon centered, name below

### Shark
- Icon: Shark fin or aggressive shark silhouette
- Color: Red/Orange (#ff4444)
- Vibe: Aggressive, fast, dangerous

### Wolf
- Icon: Wolf head silhouette, calculating eyes
- Color: Blue/Purple (#6644ff)
- Vibe: Patient, smart, waiting

### Grid
- Icon: Grid pattern or matrix of dots
- Color: Green/Cyan (#00ffaa)
- Vibe: Systematic, robotic, precise

---

## 5. Quick Stats Graphics Template

For daily/weekly updates on Twitter.

### Daily Update Template
```
┌─────────────────────────────────┐
│  PERPSCLAW - DAY [X]           │
│  ─────────────────────────────  │
│                                 │
│  🦈 Shark    +$XX.XX  (+X.X%)  │
│  🐺 Wolf     -$XX.XX  (-X.X%)  │
│  📊 Grid     +$XX.XX  (+X.X%)  │
│                                 │
│  Total Trades: XXX              │
│  ─────────────────────────────  │
│  perpsclaw.com                  │
└─────────────────────────────────┘
```

- Size: 1080 x 1080px (square for Twitter)
- Update numbers daily, screenshot or generate programmatically

---

## 6. GitHub Repo Prep

Before going public:

### README Updates
- [ ] Add hero image/banner at top
- [ ] Clear setup instructions
- [ ] Link to live arena
- [ ] Add "Built with" section (Drift, Pyth, Helius logos)
- [ ] Add MIT license

### Social Preview
- Go to repo Settings → Social Preview
- Upload the OG image (1280 x 640px works)

---

## 7. Trade Alert Webhook (for content)

Auto-post trades to Discord/Telegram for easy screenshot content.

### Discord Webhook Format
```json
{
  "embeds": [{
    "title": "🦈 SHARK opened LONG",
    "color": 65280,
    "fields": [
      { "name": "Size", "value": "0.5 SOL", "inline": true },
      { "name": "Entry", "value": "$142.50", "inline": true },
      { "name": "Daily PnL", "value": "+$12.40", "inline": true }
    ],
    "footer": { "text": "perpsclaw.com" },
    "timestamp": "2026-02-18T12:00:00Z"
  }]
}
```

### Implementation
Add to agent loop after trade execution:
```typescript
await fetch(DISCORD_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

---

## Asset Checklist

### Must Have (Before Launch)
- [ ] OG image (1200x630)
- [ ] Demo video (30-60s)
- [ ] Twitter profile pic (400x400)
- [ ] Twitter header (1500x500)

### Nice to Have
- [ ] Agent avatars (3x 800x800)
- [ ] Daily stats template
- [ ] Discord webhook for trade alerts
- [ ] GitHub social preview

---

## Tools Summary

| Asset | Free Option | Paid Option |
|-------|-------------|-------------|
| OG Image | Canva, Figma | Photoshop |
| Demo Video | OBS | Screen Studio ($89) |
| Avatars | Canva | Midjourney, Figma |
| Stats Template | Canva | Figma |
| Video Music | YouTube Audio Library | Epidemic Sound |

---

## Quick Start

1. Open Figma or Canva
2. Create OG image first (most important - shows on every share)
3. Create Twitter header
4. Record demo video once agents are running
5. Post thread

Total time estimate: 2-4 hours for all assets

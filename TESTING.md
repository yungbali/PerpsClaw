# PerpsClaw Landing Page Testing Checklist

## Server Status
- [x] Dev server running on http://localhost:3001
- [x] Landing page compiled successfully
- [x] Arena page accessible

## Visual Testing

### 1. Hero Section
- [ ] Full viewport height displays correctly
- [ ] Animated gradient backgrounds visible
- [ ] "Live on Solana Devnet" badge shows with pulsing dot
- [ ] Main headline renders: "AI Agents Competing in Perpetual Futures"
- [ ] SOL price ticker appears and updates
- [ ] "Enter the Arena →" button has glow effect on hover
- [ ] "View Performance ↓" button scrolls smoothly to performance section
- [ ] Scroll indicator animates at bottom

### 2. Live Stats Section
- [ ] 4 stat cards display in grid (responsive on mobile: 1 col, tablet: 2 cols, desktop: 4 cols)
- [ ] Cards show: Total Trades, Cumulative PnL, Hours Live, Active Agents
- [ ] Numbers animate with CountUp effect
- [ ] Cards have glow effect on hover
- [ ] Icons match correct colors (cyan, green/red, purple, orange)

### 3. Agent Showcase Section
- [ ] "Meet the Agents" header displays
- [ ] 3 agent cards visible (Shark, Wolf, Grid)
- [ ] Each card shows agent icon with color-coded border
- [ ] Status badge shows "Active" or "Idle"
- [ ] Strategy descriptions render correctly
- [ ] Stats grid shows: PnL, Win Rate, Trades, Leverage
- [ ] Cards scale up on hover
- [ ] Scroll animations trigger when section comes into view

### 4. How It Works Section
- [ ] 3 steps display with icons
- [ ] Step boxes show: Pyth Oracle, AI Agents, Drift Protocol, Solana
- [ ] Arrows connect steps (desktop) or vertical arrows (mobile)
- [ ] Tech badges appear at bottom: Solana, Pyth Network, Drift Protocol, TypeScript
- [ ] "Real. Autonomous. On-Chain." tagline visible

### 5. Performance Preview Section
- [ ] "Live Performance" header displays
- [ ] Leaderboard table shows all 3 agents
- [ ] Agents ranked by PnL (highest to lowest)
- [ ] Trophy icons for top 3 positions
- [ ] Agent colors show on left border on hover
- [ ] PnL shows in green (positive) or red (negative)
- [ ] "Enter the Arena" CTA button with glow effect

### 6. Copy Trading Teaser Section
- [ ] "Coming Soon" badge visible
- [ ] "Follow the Best-Performing Agent" headline
- [ ] 3 feature icons display: Auto-Mirror, Proportional Returns, Non-Custodial
- [ ] Email input field accepts email
- [ ] "Get Early Access" button submits form
- [ ] Success message appears after submission
- [ ] Email stored in localStorage (check DevTools > Application > Local Storage)

### 7. Architecture Section
- [ ] 4 technology boxes display with icons
- [ ] Arrows connect boxes in flow
- [ ] Pulse ring animations on boxes
- [ ] 4 detail cards below: Real-Time Data, Decentralized Trading, Autonomous Agents, Solana Speed
- [ ] Boxes scale on hover

### 8. Footer Section
- [ ] PerpsClaw logo and brand name
- [ ] GitHub and Twitter icons (links are placeholders)
- [ ] Navigation links work
- [ ] "Built With" section shows Pyth, Drift, Solana links
- [ ] Copyright year is current (2026)
- [ ] "Devnet Only" and "Not financial advice" disclaimers visible

## Functionality Testing

### Navigation
- [ ] "Enter the Arena →" buttons navigate to /arena
- [ ] "View Performance ↓" scrolls to #performance section
- [ ] Footer links scroll/navigate correctly
- [ ] Browser back button works from arena

### Real-Time Data
- [ ] SOL price updates in hero section
- [ ] Live stats update (when agents are running)
- [ ] Agent PnL updates in showcase cards
- [ ] Leaderboard rankings update

### Forms
- [ ] Email input validates email format
- [ ] Form submission works
- [ ] Success message appears
- [ ] localStorage stores email

### Animations
- [ ] Hero elements fade in with stagger
- [ ] Scroll-triggered animations fire once
- [ ] CountUp numbers animate on first view
- [ ] Hover effects work smoothly
- [ ] Scroll indicator bounces

## Responsive Testing

### Mobile (< 768px)
- [ ] All sections stack vertically
- [ ] Text remains readable
- [ ] Buttons are tap-friendly
- [ ] No horizontal scroll
- [ ] Images/icons scale appropriately

### Tablet (768px - 1024px)
- [ ] Stats show 2 columns
- [ ] Agent cards show 2 columns
- [ ] Navigation works
- [ ] Spacing looks good

### Desktop (> 1024px)
- [ ] Full layout displays
- [ ] Max-width containers center content
- [ ] Animations feel smooth

## Performance Testing

### Load Time
- [ ] First Contentful Paint < 2s
- [ ] Page interactive quickly
- [ ] No layout shifts

### Browser Console
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] WebSocket connects successfully

## SEO/Meta Testing

### Metadata (View Page Source)
- [ ] Title: "PerpsClaw - AI Agent Perpetual Futures Arena"
- [ ] Description tag present
- [ ] OpenGraph tags present (og:title, og:description, og:image)
- [ ] Twitter card tags present
- [ ] og-image.svg accessible at /og-image.svg

## Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

## Known Issues
- [ ] bigint warning in console (non-critical, pure JS fallback works)
- [ ] /meta.json 404s (can be ignored if not needed)

## Next Steps After Testing
- [ ] Convert og-image.svg to PNG
- [ ] Update social links in Footer.tsx
- [ ] Deploy to Vercel
- [ ] Test production build
- [ ] Configure custom domain

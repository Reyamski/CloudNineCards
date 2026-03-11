# 📤 OUTBOX — Architect Agent
Date: 2026-03-12 | Phase 1 | Status: ✅ COMPLETE

---

## Current Store Weaknesses

- All products show "Sold out" — kills trust immediately
- Plain white/black = zero anime TCG personality
- No collection organization or filtering
- Generic Inter font — no character
- Hero banner exists but doesn't establish brand authority
- No rarity/condition metadata visible on products

---

## Theme Recommendation

### #1 PRESTIGE (by Shopify) — RECOMMENDED
- Dark navy default, supports neon gradient overlays
- Full customizable dark mode with accent control
- Advanced product video integration
- Built-in mega menu for TCG categorization
- Native gold/red neon text overlays
- Price: ~$350 (official Shopify)

### #2 MOTION (by Shopify)
- Animation-forward — card flip effects, parallax
- Scroll-triggered animations
- Shimmer + neon glow text support
- Price: ~$350 (official Shopify)

### #3 DAWN (free, customized)
- Free Shopify base theme
- Best developer control for custom anime styling
- Fastest load times
- Price: FREE

**Architect Recommendation: Start with DAWN (free) + heavy CSS customization
using our dark theme variables. Save budget for marketing.**

---

## Homepage Wireframe

```
┌──────────────────────────────────────────────┐
│  LOGO   COLLECTIONS  SETS  DEALS    [CART]   │
│  Dark navy bg | Gold/Red neon text            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│           HERO — Full Width                  │
│  [Anime artwork darkened background]         │
│                                              │
│   "UNLOCK LEGENDARY PULLS"  ← Red neon glow │
│   [SHOP NOW]  [VIEW COLLECTION]              │
│    Red button  Gold border button            │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│    FEATURED COLLECTIONS (horizontal scroll)  │
│  [ONE PIECE] [DRAGON BALL] [POKEMON] [OTHER] │
│   Gold borders | Dark card bg                │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│    HOT PULLS THIS WEEK — 4 column grid       │
│  [Card] [Card] [Card] [Card]                 │
│  Rarity badge | Price | Add to cart          │
│  Hover: red neon border glow + card lift     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│    BOOSTER BOX SPOTLIGHT — featured deal     │
│  Big image | Price | Limited stock badge     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│    EMAIL SIGNUP — "UNLOCK EXCLUSIVE DROPS"   │
│  [email input] → Red CTA button              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  FOOTER — Dark minimal                       │
│  Links | Social (Discord, IG, Twitter)       │
└──────────────────────────────────────────────┘
```

---

## Color System

```css
--bg-primary:    #0a0a0f  (deep navy)
--bg-secondary:  #12121a  (dark card bg)
--accent-gold:   #d4af37  (metallic gold)
--accent-red:    #ff1744  (neon red)
--text-primary:  #ffffff
--text-secondary:#b0bec5  (silver)
```

---

## Dependencies for Developer

- Implement CSS variables above into theme
- Add hover glow effect on product cards
- Install collection grid with dark card styling
- Hero banner: support full-width video or image with dark overlay


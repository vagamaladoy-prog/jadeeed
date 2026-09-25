# Jadeeed — DESIGN.md

> Base reference: **Refero Styles → "Intercom — Warm cream editorial spread"**
> (styles.refero.design/style/12255b63-e506-4bc1-a4cd-d05487de32f3, category *Editorial / Premium*).
> Taken from it: warm paper canvas, hairline borders instead of shadows, a single 4px radius,
> light-weight display type with tight tracking, uppercase tracked labels, 4px spacing grid,
> 64–96px section rhythm, one accent colour used sparingly.
> Adapted for Jadeeed: palette (below), accent fonts, Atlas pattern, Motion.

All tokens live in `src/app/tokens.css` (CSS variables) and are exposed to Tailwind via
`@theme` in `src/app/globals.css`. **Never hard-code a colour, size, radius or duration in components.**

---

## 1. Colour

Three brand colours. Everything else is derived.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0B0B0C` | primary text, dark sections, footer, primary buttons |
| `--paper` | `#F5F3EE` | storefront canvas (warm white) |
| `--white` | `#FFFFFF` | surfaces on paper, text on dark |
| `--navy` | `#16224A` | **Atlas navy** — active states, links, badges, selected size, atlas pattern |
| `--muted` | `#5B5E66` | secondary text (5.85:1 on paper — AA) |
| `--line` | `#E4E2DC` | hairline borders, dividers |
| `--navy-2` | `#2C3E7A` | lighter navy — **only inside the atlas pattern** |
| `--paper-2` | `#ECE9E2` | derived: alternating section / image well (paper darkened 3%) |
| `--ink-2` | `#1A1A1C` | derived: raised surface on dark |
| `--on-ink-muted` | `#A9AAB0` | derived: secondary text on ink (8.5:1 — AA) |

Contrast (WCAG AA ≥ 4.5:1 for body):
ink/paper 17.7:1 · muted/paper 5.85:1 · muted/paper-2 5.35:1 · navy/paper 13.9:1 · white/navy 15.4:1 · white/ink 19.7:1 (computed, WCAG 2.1).

Forbidden: any other bright hue, gradients, neon, glow, glass blur panels
(the only blur allowed is the functional header/tab-bar backdrop on scroll).
Product colours (a t-shirt can be any colour) are content, not UI palette.

Admin uses ink / white / muted / line only (+ status tints derived from ink opacity).

## 2. Typography

| Role | Font | Why |
|---|---|---|
| Accent: brand phrases, display headings, footer wordmark | **Unbounded** (variable 200–900) | wide geometric grotesque with character; echoes the heavy geometric "J" of the logo; full Latin-Ext + Cyrillic incl. `oʻ gʻ ʼ` |
| Interface: body, buttons, forms, labels | **Onest** (variable 100–900) | neutral grotesque designed for Cyrillic + Latin together; excellent at small sizes |

Display is set **light (300)** as in the reference, never heavier than 500.

| Token | Size (mobile → desktop) | LH | Tracking | Font / weight |
|---|---|---|---|---|
| `display-xl` | 44 → 112px (`clamp`) | 0.95 | -0.04em | Unbounded 300 |
| `display` | 36 → 72px | 1.0 | -0.03em | Unbounded 300 |
| `heading-lg` | 28 → 40px | 1.15 | -0.02em | Unbounded 300 |
| `heading` | 22 → 28px | 1.25 | -0.01em | Unbounded 400 |
| `subheading` | 18 → 20px | 1.35 | -0.01em | Onest 500 |
| `body` | 16px | 1.5 | -0.01em | Onest 400 |
| `body-sm` | 14px | 1.45 | 0 | Onest 400 |
| `label` | 12px uppercase | 1.4 | 0.1em | Onest 500 (replaces SaansMono labels) |

## 3. Spacing & layout

4px base: `1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 12=48 16=64 20=80 24=96 28=112`.

- Container max width **1440px**, side gutter 16px (mobile) / 24px (tablet) / 48px (desktop).
- Section vertical rhythm: 64px mobile, 96px desktop.
- Card padding 16–24px. Element gap 8–16px.
- Mobile tab bar height **60px** + `env(safe-area-inset-bottom)`; page content has matching bottom padding.
- Tap targets ≥ 44×44px, ≥ 8px apart.

## 4. Radius, borders, elevation

- Radius: **4px everywhere** (`--radius`). Pills (size chips, badges): `--radius-pill: 999px`.
  Banner: **0** (edge to edge). Bottom sheet top corners: 12px (`--radius-sheet`) — the only exception, it's a physical sheet.
- Borders: `1px solid var(--line)`. On ink: `1px solid rgb(255 255 255 / .14)`.
- **No shadows.** Depth = tone steps: paper → paper-2 → white; ink → ink-2.
  The sheet/drawer overlay is `ink / 40%`.

## 5. Components (shadcn/ui re-skinned)

- **Button primary**: ink bg, white text, 48px tall (44 min), 4px radius, Onest 500 15px, hover → navy (150ms).
- **Button outline**: transparent, 1px ink border, ink text; hover → ink bg / white text.
- **Button ghost / link**: navy text, underline offset 4px.
- **Input**: 48px, white bg, 1px line border, focus = 2px navy ring (outline, not shadow).
- **Size chip**: 44×44 min, pill, 1px line border; selected = navy bg + white text, spring scale.
- **Badge** (`Ko'z tegmasin.`): navy bg, white, Unbounded 10–11px, pill.
- **Discount badge**: ink bg, white, Onest 500 12px.
- **Product card**: no border, no shadow; image well paper-2 at 4:5; title body-sm, price body 500.
- **Tabs / segmented (uz|ru)**: 2px ink underline or sliding pill (navy) — motion `layoutId`.
- **Bottom sheet**: vaul drawer, paper bg, 12px top radius, grabber 36×4 line colour, swipe-down to close.
- **Tab bar (mobile)**: white 85% + backdrop blur 12px, 1px top line, active = ink icon + navy dot.
- **Toast** (`Men o'sha.`): ink bg, white Unbounded text, bottom-center above tab bar.

## 6. Atlas pattern

Jadeeed's visual signature is **Uzbek atlas (ikat)** rendered as a modern graphic device —
vertical wavy warp bands whose edges are "torn" and slightly blurred, like resist-dyed threads.

Generated in SVG by `scripts/generate-atlas.mjs` → `public/atlas/*.svg` (and as React
`<AtlasPattern variant=…>`). Colours: **ink, white/paper, navy, navy-2 only.**

Construction (modelled on how real ikat is made — dye first, weave second):
1. Tile 480×960, seamless both ways (every wave period divides 960; first/last band match).
2. 10 vertical bands whose edges are sine waves (amplitude 10–26px, period 240/320/480/960px).
3. The motif is sampled per **warp thread** (3px wide, 4px steps). Every thread is shifted
   vertically by its own offset (±16px, loosely bundled with its neighbours) — exactly the
   misregistration that gives ikat its blurred, "torn" edge.
4. "Flames": each thread pushes the band edges sideways in short blocks (24–48px);
   most blocks move 3px, a few leap 10px — irregular tongues of colour bleeding into the neighbour.
5. Two bands carry the classic atlas "eye" — a stacked chain of almond lenses
   (ink core, paper ring, navy-2 rim). One band has a navy comb rhythm.
6. Deterministic seed → identical output on every build. `shape-rendering: crispEdges`, no filters
   (cheap to rasterise and to animate).

Variants:

| Variant | Where | Spec |
|---|---|---|
| `dense` | "Siz o'shami?" block, footer, "Rahmat" page, brand-phrase plate | full-contrast navy / ink / paper bands |
| `light` | section backgrounds | same tile, **opacity 0.04–0.08** on paper |
| `strip` | divider between big sections, preloader | 12px tall, horizontal repeat of warp threads, 480×12 |
| `loading` | product image placeholder (instead of grey skeleton) | `light` tile at 0.12 + slow flow |

Rules — **use rarely so it stays special**:
- ✅ banner-adjacent phrase block, section dividers, footer, thank-you page, image loading fill, plate behind brand phrases.
- ❌ never on every card, never under body copy that must be read, never in admin.
- Text on `dense` sits on a solid ink/paper plate or is Unbounded ≥ 32px with ≥ 4.5:1 against the darkest band.
- The pattern **flows**: `translateY` loop 0 → −960px over 60s (linear, infinite), paused off-screen,
  disabled under `prefers-reduced-motion`.

## 7. Motion

Libraries: **Motion** (`motion/react`) for component motion, **Lenis** smooth scroll (storefront only,
not admin, not Mini App; initialised on the first mouse-wheel event so it costs nothing on phones
and during page load), **React Bits** components (copied into `src/components/bits/` and recoloured
to tokens: *Magnet*; the letter "writing" of `BrandPhrase` is adapted from *BlurText*), **Embla** for swipe.
Continuous effects (atlas flow, marquee, story bars) are CSS transform animations — no JS per frame.

Tokens (`src/lib/motion.ts` + CSS vars):

| Token | Value |
|---|---|
| `--dur-hover` | 180ms |
| `--dur-in` | 500ms (appearances 400–600) |
| `--dur-scene` | 1100ms (banner, phrase block ≤ 1.2s) |
| `ease.out` | `cubic-bezier(0.22, 1, 0.36, 1)` — all appearances |
| `spring` | `{ type: "spring", stiffness: 300, damping: 30 }` — all interactive |
| stagger | 60ms |

Rules:
- Animate **only `transform` and `opacity`** (the atlas flow is a transform too).
- Every reveal runs **once** (`viewport: { once: true }`).
- `prefers-reduced-motion: reduce` → everything static (`MotionConfig reducedMotion="user"` + CSS kill-switch).
- Touch devices: no cursor effects (magnetic, cursor-parallax, zoom-on-hover) — replaced by scroll/tap.
- Mini App: no preloader, no Lenis, no banner parallax. Everything else stays.
- Motion never blocks buying: CTAs are interactive immediately, nothing waits for an animation.

Inventory:
| Element | Motion |
|---|---|
| Banner | fade-in + scale 1.06→1 (1.1s); parallax 0.25 on scroll; crossfade every 5.5s; swipe; story-style progress bars |
| "Siz o'shami?" | letter-by-letter "writing" (adapted from React Bits *BlurText*, ≤45ms/char), atlas flows down, shifts ±12px with cursor / scroll |
| Marquee | brand phrases + ✦, ink bg, white Unbounded, 40s CSS transform loop (no JS per frame), pauses on hover |
| Product card | stagger reveal; hover: front→back crossfade, zoom 1.04, sizes slide up |
| Product page | gallery crossfade/slide, cursor zoom (desktop), swipe (touch); size chip spring; fly-to-cart; badge bounce; toast "Men o'sha." |
| Catalog | `layout` animations + AnimatePresence popLayout on filter change |
| Header | desktop: transparent over banner → compact + blurred on scroll down, returns on scroll up; mobile top strip hides on scroll down |
| Tab bar | active indicator `layoutId` spring; cart icon bounce; hides on scroll down |
| Language switch | segmented, sliding `layoutId` thumb |
| Cart | desktop: right drawer; mobile: full-height bottom sheet, swipe down to close |
| Preloader | first visit only, ≤ 1.2s: atlas strip "stitches" L→R (scaleX), "Aylanib kelay..." |
| Thank-you | atlas rises bottom→top (translateY), then "Ko'z tegmasin." + order no. No confetti. |
| Footer | giant "Jadeeed" wordmark rises from below when reached |

## 8. Voice

Brand phrases are **always Uzbek, never translated**, stored in DB, rendered in Unbounded:
`Siz o'shami?` · `Men o'sha.` · `Aylanib kelay...` · `Ko'z tegmasin.`
UI copy is short, calm, no exclamation marks, no filler ("Добро пожаловать в мир стиля" is banned).

## 9. Forbidden ("AI design")

Gradient blobs, glassmorphism cards, neon, 3D icons, emoji (except ✦ in marquee), stock
illustrations, identical shadowed cards everywhere, placeholder copy.

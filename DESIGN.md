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

Concept: **"a Jadid manuscript that came alive in streetwear"** — a rare 1920s Turkestan book with a cinematic edge.
Colours are pulled from the brand photos (brick, carved wood, suzani, pomegranate, the teal door).
Proportions: ~70% Siyoh + Qog'oz · 20% Anor + Firuza · 10% Za'faron (tiny highlights only).

| Token | Name | Hex | Role |
|---|---|---|---|
| `--ink` | Siyoh (ink) | `#141012` | dark base: text, dark sections, footer |
| `--paper` | Qog'oz (old paper) | `#E6D5B8` | light base: storefront canvas — warm beige |
| `--anor` | Anor (pomegranate) | `#9B1D2E` | main accent: primary buttons, hover, active states, links, selected size |
| `--firuza` | Firuza (Samarkand teal) | `#1E7F80` | second accent: "new" badges, Qodiriy moments |
| `--zafaron` | Za'faron (saffron) | `#E2A23B` | highlight — only stars, dots, underlines |
| `--gisht` | G'isht (brick) | `#C27A45` | warm neutral (decor) |
| `--qaymoq` | Qaymoq (sage) | `#7F9170` | soft neutral (decor) |
| `--white` | — | `#FFFFFF` | surfaces on paper, text on dark |
| `--muted` | — | `#574E47` | secondary text (5.64:1 on paper, 4.96:1 on paper-2) |
| `--line` | — | `#D3C09E` | hairline borders |
| `--paper-2` | — | `#DBC8A6` | alternating section / image well |
| `--ink-2` | — | `#201A1C` | raised surface on dark |
| `--on-ink-muted` | — | `#A99F95` | secondary text on ink (7.26:1) |
| `--navy-2` | — | `#2C3E7A` | only inside the atlas pattern |

Contrast: ink/paper 13.1:1 · white/anor 8.05:1 · anor/paper 5.59:1 · white/firuza 4.77:1 · ink/za'faron 8.51:1.
Firuza on paper is 3.78:1 — use it for fills with white text or large type, never for small text on paper.
Za'faron is never a text colour on paper.

Alternating sections: dark ink sections with paper text, then paper sections with ink text — like turning pages.
A paper-grain / acid-wash noise layer sits over the whole storefront (`body.grain::after`, 9%, no clicks).

## 2. Typography

| Role | Font | Utility |
|---|---|---|
| Quotes, big headlines | **Playfair Display** (variable 400–900) — echoes the "Men o'sha" print | `font-display`, `phrase` |
| Emotional accents ("Aylanib ketay…") | **Great Vibes** script | `script` |
| Small labels, dates | **Cormorant SC** (500/600) — Art-Deco feel of the "Abdulla Qodiriy" back print | `deco` |
| Body, buttons, forms | **Manrope** (variable) | `font-sans` |

All four cover Latin-Ext + Cyrillic (o', g', ʻ). Display is set at 400, tracking −0.02em (serif — never tighter).

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

- **Button primary**: anor bg, white text, 48px tall (44 min), 4px radius, Manrope 500, hover → ink (150ms). Variant `ink`: ink bg, hover → anor.
- **Button outline**: transparent, 1px ink border, ink text; hover → ink bg / white text.
- **Button ghost / link**: anor text, underline offset 4px.
- **Input**: 48px, white bg, 1px line border, focus = 2px anor ring (outline, not shadow).
- **Size chip**: 44×44 min, pill, 1px line border; selected = anor bg + white text, spring scale.
- **Badge** (`Ko'z tegmasin.`): firuza bg, white, Playfair Display 10–11px, pill.
- **Discount badge**: ink bg, white, Manrope 500 12px.
- **Product card**: no border, no shadow; image well paper-2 at 4:5; title body-sm, price body 500.
- **Tabs / segmented (uz|ru)**: 2px ink underline or sliding pill (anor) — motion `layoutId`.
- **Bottom sheet**: vaul drawer, paper bg, 12px top radius, grabber 36×4 line colour, swipe-down to close.
- **Tab bar (mobile)**: white 85% + backdrop blur 12px, 1px top line, active = ink icon + anor dot.
- **Toast** (`Men o'sha.`): ink bg, white Playfair Display text, bottom-center above tab bar.

## 6. Atlas pattern (retired 2026-11 — replaced by suzani, see §7)

Jadeeed's visual signature is **Uzbek atlas (ikat)** rendered as a modern graphic device —
vertical wavy warp bands whose edges are "torn" and slightly blurred, like resist-dyed threads.

Source: **a photo of real ikat fabric** (`assets/brand/atlas-source.webp`) — not drawn.
`scripts/process-atlas.mjs` mirrors it into a seamless 2×2 tile (ikat motifs are symmetric, so the
mirror joins are invisible) → `public/atlas/ikat.webp` (1×) / `ikat@2x.webp`, served with CSS `image-set`,
and a 16px band through a motif row → `public/atlas/ikat-strip.webp` for dividers and the preloader.
The fabric brings its own dyes (cornflower blues, sage, ink on white); they appear **only inside the pattern**,
never as UI colours. React: `<AtlasPattern variant=…>` / `<AtlasStrip>`.

Variants:

| Variant | Where | Spec |
|---|---|---|
| `dense` | "Siz o'shami?" block, footer, "Rahmat" page, brand-phrase plate | full-contrast ikat bands (the fabric's own dyes) |
| `light` | section backgrounds | same tile, **opacity 0.04–0.08** on paper |
| `strip` | divider between big sections, preloader | 16px band cut through a row of motifs, repeated along x |
| `loading` | product image placeholder (instead of grey skeleton) | `light` tile at 0.12 + slow flow |

Rules — **use rarely so it stays special**:
- ✅ banner-adjacent phrase block, section dividers, footer, thank-you page, image loading fill, plate behind brand phrases.
- ❌ never on every card, never under body copy that must be read, never in admin.
- Text on `dense` sits on a solid ink/paper plate or is Playfair Display ≥ 32px with ≥ 4.5:1 against the darkest band.
- The pattern **flows**: `translateY` loop over one tile height (800px) in 60s (linear, infinite), paused off-screen,
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
| Marquee | brand phrases + ✦, ink bg, white Playfair Display, 40s CSS transform loop (no JS per frame), pauses on hover |
| Product card | stagger reveal; hover: front→back crossfade, zoom 1.04, sizes slide up |
| Product page | gallery crossfade/slide, cursor zoom (desktop), swipe (touch); size chip spring; fly-to-cart; badge bounce; toast "Men o'sha." |
| Catalog | `layout` animations + AnimatePresence popLayout on filter change |
| Header | desktop: transparent over banner → compact + blurred on scroll down, returns on scroll up; mobile top strip hides on scroll down |
| Tab bar | active indicator `layoutId` spring; cart icon bounce; hides on scroll down |
| Language switch | segmented, sliding `layoutId` thumb |
| Cart | desktop: right drawer; mobile: full-height bottom sheet, swipe down to close |
| Preloader | first visit only, ≤ 1.2s: atlas strip "stitches" L→R (scaleX), "Aylanib ketay..." |
| Thank-you | atlas rises bottom→top (translateY), then "Ko'z tegmasin." + order no. No confetti. |
| Footer | giant "Jadeeed" wordmark rises from below when reached |

## 8. Voice

Brand phrases are **always Uzbek, never translated**, stored in DB, rendered in Playfair Display:
`Siz o'shami?` · `Men o'sha.` · `Aylanib ketay...` · `Ko'z tegmasin.`
UI copy is short, calm, no exclamation marks, no filler ("Добро пожаловать в мир стиля" is banned).

## 9. Forbidden ("AI design")

Gradient blobs, glassmorphism cards, neon, 3D icons, emoji (except ✦ in marquee), stock
illustrations, identical shadowed cards everywhere, placeholder copy.

## 7. "Jadid manuscript" devices (2026-11 redesign)

The site reads like a rare 1920s Turkestan book with a cinematic edge. Imagery comes only from the brand shoot
(`assets/photos/2026-11` → `scripts/process-brand-photos.mjs` → `public/photos/jd/*.webp`).

| Device | Where | Spec |
|---|---|---|
| Intro | first visit per session | black book cover, "Aylanib ketay…" written in script (clip-path), cover opens (rotateY) — ~2.9 s, CSS only (`preloader.tsx`) |
| Hero | home | full-screen shoot photo with a 26 s breathing zoom, no text over it — only the "Collection" button at the foot (owner's call: the photo must stay visible) |
| Manifesto | home | Jadidlar / Madaniyat / Kelajak over pomegranate, teal and saffron suzani; cloth drifts with scroll (`jd-drift`, `animation-timeline: view()`) |
| Wardrobe backdrop | home wardrobe | carved door, chest and brick of the shoot in warm sepia (`wardrobe-backdrop.webp`) under a 45% paper veil, fading into the page |
| Arch | collection, lookbook, product cards, Qodiriy | `arch` utility: semicircle top, square foot — the windows of the shoot |
| Brick grid | every ink section | `brick-grid` utility: 96×32 brick-bond hairlines at 5% white |
| Boteh / Qodiriy medallion | ornaments, timeline progress, cursor | `components/jd/ornament.tsx`, redrawn from the back print; cursor `public/cursor-boteh*.svg` (mouse only) |
| Timeline | Qodiriy section | hairline thread filled with saffron and a turning medallion, both driven by the section's view timeline |
| Page wipe | every navigation | Anor sheet wiping right→left (`[locale]/template.tsx`) |
| Suzani border | above the footer, about | embroidered border cut from the suzani wall of the shoot |

Inner pages open with a full-bleed ink band (`PageHeader`) — dark page, then the paper page: turning pages.
Dates are written our way (DD.MM.YYYY): 10.04.1894 – 04.10.1938.
The atlas (ikat) pattern is retired from the storefront; its files remain for reference only.

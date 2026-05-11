# PressKit.pro — Profile Editor Redesign Spec v2
**Component:** `/dashboard/profile/[id]` — Left-panel editor  
**Status:** Design spec v2.0  
**Scope:** Layout & UX only — zero palette changes, zero name changes  
**Reference aesthetic:** Meshy.ai (compact dark panel, segmented controls, icon sidebar)  
**Brand tokens to preserve:** `#0a0a0a` bg · `#141414` surface · `#1f1f1f` border · `#ff6b00` accent · `#f0ede6` text · `#7a7670` muted

---

## 1. Reference Design Analysis (Meshy.ai)

The Meshy.ai UI delivers three things the current editor lacks:

| Meshy pattern | What it solves |
|---|---|
| Compact card-style panel with a clear inner scroll area | Everything feels contained and purposeful — not an infinite scroll of fields |
| Segmented button groups for choices (None / A-Pose / T-Pose) | Replaces invisible dropdowns — user sees all options at once |
| Sticky CTA at the bottom of the panel (Generate button) | Primary action always reachable without scrolling |
| Icon-labeled sidebar for top-level navigation | Tabs scannable at a glance, never lost |
| Subtle inner borders between field groups | Creates breathing room without heavy dividers |

Apply all five patterns to PressKit.pro's existing 3-tab structure.

---

## 2. Existing Tabs — Keep Exactly As-Is

The three tabs are:

1. **SECTIONS** — all profile content fields
2. **THEME** — colors, fonts, layout presets  
3. **PRESETS** (currently called "Design" — rename to "Presets" per user preference)

No new tabs. No name changes inside the tabs. Structure only.

---

## 3. Panel Shell

```
┌─────────────────────────────────────────────────────┐
│  STICKY TOP BAR                                     │
│  height: 48px · background: #141414                 │
│  border-bottom: 1px solid #1f1f1f                  │
│                                                     │
│  [←]  jeanpastordj          ● Draft  [Publish ▶]  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  TAB STRIP (sticky, below top bar)                  │
│  height: 40px · background: #0a0a0a                 │
│  border-bottom: 1px solid #1f1f1f                  │
│                                                     │
│  [ SECTIONS ]  [ THEME ]  [ PRESETS ]              │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                                                     │
│  SCROLLABLE PANEL CONTENT                           │
│  padding: 0 · overflow-y: auto                      │
│  flex: 1                                            │
│                                                     │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  STICKY BOTTOM CTA  (Meshy "Generate" pattern)      │
│  height: 64px · background: #141414                 │
│  border-top: 1px solid #1f1f1f · padding: 12px 16px │
│                                                     │
│  [Auto-save: saved 8s ago]         [◀ Preview]      │
└─────────────────────────────────────────────────────┘
```

### Top bar spec

```
LEFT:   ← icon (16px, #7a7670) + " Dashboard" (12px, #7a7670) + " / " + slug (12px, #f0ede6, 500)
CENTER: Status pill — see below
RIGHT:  [Publish] button — #ff6b00 fill, #0a0a0a text, 32px height, 8px radius, Manrope 13px 500

Status pill variants:
  Draft      → background: #1f1f1f  · dot: #7a7670  · text: "Draft"
  Published  → background: #0f2a1a  · dot: #00c853  · text: "Published"
  Unsaved    → background: #2a1a00  · dot: #ff6b00 (pulsing) · text: "Unsaved changes"

Publish button states:
  Default (draft, has changes)  → orange fill
  Up to date (no new changes)   → #1f1f1f fill, #7a7670 text, disabled cursor
  Published (first publish)     → orange fill, label "Publish"
  After publish + new edits     → orange fill, label "Update"
```

### Tab strip spec

```
Font: Manrope 12px, 500, letter-spacing: 0.06em, uppercase
Active:   color #ff6b00, border-bottom 2px solid #ff6b00, background transparent
Inactive: color #7a7670, no border, hover → #f0ede6
Tab width: equal thirds of panel width
Height: 40px
```

### Bottom bar spec

```
LEFT:  auto-save state text (12px, #7a7670)
       States: "Saving…" | "Saved 8s ago" | "Save failed – retry"
RIGHT: Preview toggle button (ghost, 12px): "◀ Preview" / "Editor ▶"
       — collapses preview pane on small screens
```

---

## 4. SECTIONS Tab

Meshy-style: each section is a **card block** with a header row. The field content lives inside. One section open at a time (accordion). Header always visible.

### Section card anatomy (direct Meshy reference)

```
┌──────────────────────────────────────────────────┐
│  HERO                                    ∨  ⣿   │  ← header: 44px, #141414
├──────────────────────────────────────────────────┤
│                                                  │
│  [form fields]                                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

```
CARD:
  background: #141414
  border: 1px solid #1f1f1f
  border-radius: 8px
  margin: 0 12px 8px 12px

HEADER ROW:
  padding: 0 14px
  height: 44px
  display: flex; align-items: center; justify-content: space-between
  cursor: pointer

  Left:  section label (Manrope 13px, 500, #f0ede6 when closed; #ff6b00 when open)
  Right: chevron icon (14px, #7a7670) + drag handle (ti-grip-vertical, visible on hover only)

OPEN STATE:
  header label: #ff6b00
  card border-left: 2px solid #ff6b00
  content: visible with 14px padding (top 0, sides 14px, bottom 16px)

CLOSED STATE:
  header label: #f0ede6
  card border: 1px solid #1f1f1f (default)
  hover border: 1px solid #ff6b00 at 40% opacity

ANIMATION:
  max-height transition 200ms ease (guarded by prefers-reduced-motion)
```

### Field style inside sections

All form controls match the compact Meshy aesthetic:

**Text input**
```
height: 36px
background: #0a0a0a
border: 1px solid #1f1f1f
border-radius: 6px
font: Manrope 13px #f0ede6
padding: 0 10px
full-width

Focus: border #ff6b00, box-shadow 0 0 0 3px rgba(255,107,0,0.10)
Error: border #e53935
Success: border #00c853
```

**Label above field**
```
font: Manrope 11px, 500, uppercase, letter-spacing 0.06em
color: #7a7670
margin-bottom: 6px
```

**Segmented button group (Meshy None/A-Pose/T-Pose pattern)**
Use for any field with 2–4 fixed choices:
```
Container: display flex, gap 0, border 1px solid #1f1f1f, border-radius 6px, overflow hidden
Each button: flex 1, height 32px, font Manrope 12px, background #0a0a0a, color #7a7670
  Active: background #ff6b00, color #0a0a0a, font-weight 500
  Hover (inactive): background #141414, color #f0ede6
  No individual borders between buttons — rely on container border only
```

**Image upload dropzone**
```
background: #0a0a0a
border: 1.5px dashed #1f1f1f
border-radius: 6px
padding: 20px 14px
text-align: center
cursor: pointer

Icon: ti-upload (20px, #7a7670)
Line 1: "Click or drag to upload" (13px, #7a7670)
Line 2: "JPG · PNG · WEBP · max 5MB" (11px, #1f1f1f → use #3a3a3a for visibility)

Hover / drag-over: border-color #ff6b00 (dashed), background rgba(255,107,0,0.04)

With image: thumbnail fills the zone (object-fit: cover, same border-radius)
  Hover overlay: semi-dark overlay + [Change] [Remove] buttons (ghost, white text, 12px)
```

**Toggle switch (for on/off fields)**
```
Track: 28px × 16px, border-radius 8px
OFF: #1f1f1f
ON: #ff6b00
Thumb: 12px white circle
Label: Manrope 13px, #f0ede6, left of track
role="switch", aria-checked
```

**URL input with validation badge**
```
Input + badge in a flex row:
  Input: flex 1, same style as text input
  Badge (right, after validation):
    Loading: spinner (ti-loader, 14px, #7a7670, spin animation)
    Valid:   ti-circle-check 14px, #00c853, tooltip "Accessible"
    Error:   ti-circle-x    14px, #e53935, tooltip "Unreachable"
  Badge appears inside input right-padding area (padding-right: 36px when validating)
```

### Section field maps (existing names only)

#### HERO
- Portrait photo — dropzone
- Logo — dropzone (smaller, square crop)  
- Tagline — text input (char count inline bottom-right: "42 / 80")
- CTA label — text input, short (inline beside CTA URL field in a 40/60 split row)
- CTA URL — URL input

#### BIO
- Locale switcher — segmented group: `PT-BR` | `EN`
- Bio text — `<textarea>`, min-height 96px, same border/bg as inputs
- Word count (bottom-right, 11px muted)

#### SERVICES
- List of service cards (each: name input + short description textarea in a #0a0a0a inner card, 8px radius)
- [+ Add service] — ghost button, full width, dashed border, #7a7670 text, hover border #ff6b00

#### SOUNDCLOUD
- Track URL — URL input with validation badge
- Preview row (shown after valid URL): track title (13px, white) + duration (12px, muted)

#### INSTAGRAM
- Up to 6 post URL inputs, each full-width with a small [×] remove button on the right
- [+ Add post] ghost button below list

#### GALLERY
- Multi-file dropzone
- Thumbnail grid (3 columns) with drag-handle + trash on hover
- Alt text drawer: clicking a thumb expands a mini input below it (required, amber outline until filled)

#### PRESS KIT
- URL — URL input with validation + provider auto-badge (e.g. "Google Drive" chip)
- Button label — text input (default "Download Press Kit", max 30)

#### CONTACT
- WhatsApp — input with +55 prefix chip (segmented prefix + number)
- Email — email input
- Show contact form — toggle switch

#### SOCIAL LINKS
- Platform rows (Instagram, SoundCloud, Spotify, Beatport, YouTube, TikTok):  
  Each row: platform icon (20px colored) + URL input + eye toggle (ti-eye / ti-eye-off, 14px muted)
  Hidden rows collapse to 32px (icon + muted URL stub only)

---

## 5. THEME Tab

Three groups, all visible (no accordion here — tab is short enough). Each group is a labeled block matching the Meshy card style.

### Group: Colors

```
Block header: "COLORS" (11px, uppercase, 0.06em, #7a7670)

ROW 1 — Background
  Label: "Background" (11px, uppercase, muted)
  6 swatches in a row:
    Size: 32×32px, border-radius: 6px
    Selected: 2px white ring with 2px offset
    Hover: scale 1.05
    Named below each (10px, muted): "Night" "Coal" "Purple" …
  + Custom hex input (36px wide pill after the 6 swatches, or below if no space)

DIVIDER: 1px solid #1f1f1f, margin 12px 0

ROW 2 — Accent
  Label: "Accent" (11px, uppercase, muted)
  12 swatches in a 6×2 grid (same size as above)
  Selected: white ring offset
  
  LIVE CONTRAST FEEDBACK (immediately after any accent pick):
    Inline row below the grid:
      ✓ "AA contrast passed" → 11px, #00c853
      ✕ "Contrast too low (2.8:1) — pick lighter or darker" → 11px, #e53935
    Never wait until publish to show this
```

### Group: Fonts

```
Block header: "FONTS" (11px, uppercase, muted)

8 cards in a 2-column grid:
  Card: 72px tall, background #0a0a0a, border 1px solid #1f1f1f, border-radius 6px, padding 10px 12px
  
  TOP LINE: "HEADLINE" — rendered in actual display font, 18px
  BOTTOM LINE: "Body text sample" — rendered in actual body font, 11px
  BOTTOM TAG: pair name — 10px, #7a7670

  Selected: border 1.5px solid #ff6b00, background rgba(255,107,0,0.05)
  Hover: border-color rgba(255,107,0,0.4)
```

### Group: Layout

```
Block header: "LAYOUT" (11px, uppercase, muted)

A) Hero style — label "Hero Style" (11px, muted)
  3 thumbnail cards in a row (equal width, ~84px each):
    Each card: 52px tall, background #0a0a0a, border 1px #1f1f1f, border-radius 6px
    Content: minimal SVG wireframe (two rectangles representing layout zones)
    Label below card (11px, #7a7670): "Full Bleed" / "Split" / "Centered"
    Selected: border #ff6b00, label #ff6b00

B) Gallery layout — label "Gallery Layout" (11px, muted), same pattern
    3 cards: "Mosaic" / "Grid" / "Carousel"
    Each with a minimal wireframe: 
      Mosaic → asymmetric 3-box layout
      Grid → 3×2 equal boxes  
      Carousel → single wide rectangle with arrow hints
```

---

## 6. PRESETS Tab (formerly Design)

Meshy's top icon group (Image / Model / Retexture icons) is the direct reference here — visual preset cards the user taps to apply a full theme in one click.

```
Block header: "CHOOSE A PRESET" (11px, uppercase, muted)
Subheader: "Applies colors, fonts and layout together. You can customize after." (12px, #7a7670)

PRESET CARDS — 2-column grid:
  Each card: 100px tall, border 1px solid #1f1f1f, border-radius 8px, overflow hidden
  
  TOP AREA (70px): mini preview of the profile's hero section in that preset's colors
    — rendered as an inline SVG swatch (bg color fill, accent color stripe, font name)
  BOTTOM AREA (30px): preset name (Manrope 12px, 500, #f0ede6), background #141414
  
  Selected: border 1.5px solid #ff6b00
  Hover: border rgba(255,107,0,0.5), slight scale(1.02) on card

PRESET NAMES (keep existing names from code exactly):
  — Show whatever preset names already exist in the codebase.
  — Do not invent new ones.

RESET LINK (bottom of tab):
  "Reset to default preset" — 12px, #7a7670, underline, left-aligned
  Triggers a confirmation inline: "This will overwrite your current theme. Confirm?"
  → [Yes, reset] ghost danger btn + [Cancel] link
```

---

## 7. Spacing Reference Card

```
Panel outer padding (horizontal):  12px (all content inset from panel edges)
Section card margin-bottom:         8px
Section card inner padding:        14px (sides + bottom when open, 0 top)
Field label → input gap:            6px
Field → field gap:                 12px
Group block padding:               14px
Group header margin-bottom:        10px
Segmented button group height:     32px
Standard input height:             36px
Textarea min-height:               72px (services desc), 96px (bio)
Icon size (inline controls):       14px
Icon size (section headers):       16px
```

---

## 8. Control Mapping — Segmented Groups

All binary or 3-way choices become segmented groups (Meshy pattern), replacing any dropdown or radio:

| Field | Options | Old control |
|---|---|---|
| Bio locale | PT-BR · EN | Tab bar |
| Hero style | Full Bleed · Split · Centered | Dropdown |
| Gallery layout | Mosaic · Grid · Carousel | Dropdown |
| Profile status | Draft · Published | Toggle |
| Contact form | On · Off | Checkbox |
| Press kit CTA visibility | Visible · Hidden | Toggle |

---

## 9. What Changes vs Current

| Current element | New treatment | Reason |
|---|---|---|
| Flat field list (no grouping) | Section cards with accordion | Matches Meshy compact panel |
| Invisible tab active state | Orange underline, colored label | Scannable at a glance |
| Dropdowns for layout choices | Segmented button groups | All options visible, no reveal needed |
| Font names as text list | Rendered font pair cards | User sees what they're picking |
| Color swatches — no labels | Named swatches + grouped blocks | No guessing what each does |
| Contrast check only at publish | Live feedback under accent picker | Fail fast, not at gate |
| No sticky save/publish | Sticky top bar + sticky bottom bar | Always reachable |
| "Design" tab label | "PRESETS" | Matches user's preferred naming |
| Preset tab — no previews | Mini color+font preview cards | Matches Meshy icon-card pattern |

## 10. What Does NOT Change

- All section names (HERO, BIO, SERVICES, SOUNDCLOUD, INSTAGRAM, GALLERY, PRESS KIT, CONTACT, SOCIAL LINKS)
- All tab names (SECTIONS, THEME, PRESETS)
- Color palette (all tokens preserved exactly)
- Feature scope (no new fields, no removed fields)
- Two-pane layout (editor left, live preview right)

---

*End of spec v2 — ready for component-level implementation.*

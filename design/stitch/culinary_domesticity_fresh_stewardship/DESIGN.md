---
name: Culinary Domesticity & Fresh Stewardship
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#404940'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#707a6f'
  outline-variant: '#bfc9bd'
  surface-tint: '#1f6c3a'
  primary: '#004c22'
  on-primary: '#ffffff'
  primary-container: '#166534'
  on-primary-container: '#93e0a2'
  inverse-primary: '#8bd79b'
  secondary: '#1b6b51'
  on-secondary: '#ffffff'
  secondary-container: '#a6f2d1'
  on-secondary-container: '#237157'
  tertiary: '#712c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#92400e'
  on-tertiary-container: '#ffc2a5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f4b5'
  primary-fixed-dim: '#8bd79b'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#a6f2d1'
  secondary-fixed-dim: '#8bd6b6'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513b'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#341000'
  on-tertiary-fixed-variant: '#7a3000'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Source Sans 3
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Source Sans 3
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Source Sans 3
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Source Sans 3
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Source Sans 3
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system embodies the warmth, clarity, and reassuring utility of a well-organized home kitchen. Rather than a sterile inventory tracker or an over-gamified productivity tool, it behaves like an intuitive kitchen ledger: welcoming, dependable, and unobtrusive. The interface bridges the gap between daily domestic life and modern food preservation, reducing waste through effortless awareness and serene visual hierarchy.

The design movement is **Warm Functionalist**: a fusion of restrained domestic minimalism, organic warmth, and rigorous editorial utility. Surfaces rely on wholesome, unbleached culinary tones (clotted cream, warm stoneware, and crisp white porcelain) grounded by deep forest herb greens and balanced status hues. The atmosphere avoids harsh cold digital blues and cold industrial grays, favoring gentle tactile domesticity that respects WCAG 2.2 AA accessibility throughout.

## Colors
The palette is calibrated strictly for readability, culinary naturalism, and clear cognitive triage of perishable inventory.

### Core Canvas & Surfaces
- **Canvas Base**: `#FAF8F2` (Warm, comforting cream foundation that reduces eye strain in indoor and kitchen lighting).
- **Surface Elevation / Cards**: `#FFFFFF` (Pristine white offering soft separation from the base canvas).
- **Surface Positive / Optimal**: `#ECFDF5` with `#A7F3D0` border and `#065F46` label.

### Typography & Content
- **Text Primary**: `#1F2937` (Deep charcoal anthracite delivering over 9:1 contrast against both cream and white).
- **Text Secondary**: `#4B5563` (Muted neutral for timestamps, weights, and supportive metadata, preserving > 4.5:1 WCAG AA).
- **Focus Indicator**: `#166534` (2px solid outline with 2px offset).

### Food Perishability & Status Semantics
- **Optimal / Frais**: Background `#ECFDF5`, border `#A7F3D0`, foreground `#065F46`.
- **Warning / Date Proche (Consume Soon)**: Background `#FFFBEB`, border `#FDE68A`, foreground `#92400E`.
- **Urgent / DLC Dépassée (Expired Safety Limit)**: Background `#FEF2F2`, border `#FECACA`, foreground `#B91C1C`.
- **Informative / DDM Dépassée (Best-Before Exceeded, Safe to Taste)**: Background `#EFF6FF`, border `#BFDBFE`, foreground `#1E40AF`.

## Typography
Typography is executed using Source Sans 3—a humanist, open-aperture sans-serif designed for legibility at glances under varying kitchen lighting environments. In native contexts, it gracefully cascades to the platform system font stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, sans-serif).

The default baseline body type is anchored at a comfortable `16px` (`body-md`), preserving clear visual cadence and effortless readability when reading shelf quantities or expiration dates at arm's length. Headlines utilize tight tracking (`-0.01em` to `-0.02em`) with measured weights (600 and 700) to project structural stability without feeling rigid or corporate. Micro-labels and batch tags adopt generous letter spacing to maximize visual decipherability on low-density mobile displays.

## Layout & Spacing
The layout relies on a fluid grid designed for rapid scanning on handheld devices and structured ledger clarity on desktop screens.

### Grid & Canvas Structure
- **Mobile (< 768px)**: 4 fluid columns, `1rem` outer margins, `1rem` gutters. Touch zones prioritize full-width or dual-column tile arrangement.
- **Tablet (768px - 1024px)**: 8 fluid columns, `2rem` margins, `1rem` gutters. Accommodates dual-pane storage split (e.g., categories on left, drawer contents on right).
- **Desktop (> 1024px)**: 12 fluid columns constrained to a max-width container of `1200px`, centered with `3rem` margins and `1.5rem` gutters.

### Spatial Rhythm
Internal components strictly follow the 4px/8px modular scale (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px, `space-xl` = 32px). Element paddings within card containers default to `space-md` on compact screens and step up to `space-lg` in expanded views.

## Elevation & Depth
Depth is expressed through crisp physical planes and subtle tonal layering rather than heavy ambient blur effects.

1. **Base Layer (Level 0)**: The unbleached canvas `#FAF8F2` hosts broad section groupings and scroll views.
2. **Resting Card & Panel Layer (Level 1)**: Crisp white surfaces (`#FFFFFF`) sitting upon `#FAF8F2`. Layering is established primarily through a whisper-thin structural boundary: `1px solid rgba(31, 41, 55, 0.08)`. A faint, warm-tinted shadow (`0 1px 3px rgba(31, 41, 55, 0.04)`) prevents visual flattening.
3. **Interactive Hover & Modal Surfaces (Level 2 & Level 3)**: Floating sheets, batch actions, and modal panels introduce deliberate depth with `0 8px 24px rgba(31, 41, 55, 0.08)` while retaining the delicate outline stroke.
4. **Focus & Selection**: Keyboard and accessible touch focus bypasses drop-shadows entirely, applying an unyielding `2px solid #166534` ring with an explicit `2px` offset spacing.

## Shapes
The shape philosophy is organic, soft, and balanced (`roundedness: 2`). Standard items, input containers, and storage cards leverage an 8px (`0.5rem`) corner radius, reflecting the friendly geometry of domestic kitchen cabinetry and canisters.

Larger container panels and modal bottom sheets utilize `1rem` (`rounded-lg`), while small pill badges, status tags, and floating action buttons adopt fully curved capsule geometries (`rounded-full`) to immediately signal high-priority tap targets and at-a-glance status chips.

## Components

### Buttons & Interactive Controls
- **Primary Button**: Solid `#166534` background with pure `#FFFFFF` typography. Minimum touch target `48px` (height) × `48px` (width), never falling below the WCAG 44×44px threshold. Radius `8px`. Active state applies `#14532D`.
- **Secondary Button**: Crisp `#FFFFFF` surface with `1.5px solid #166534` stroke and `#166534` text.
- **Tertiary / Ghost Button**: Transparent background, `#1F2937` text with underline on hover; retains full `44px` hit box.
- **Focus State**: `outline: 2px solid #166534; outline-offset: 2px;` applied universally to all interactive elements.

### Status Badges & Shelf-Life Indicators
Every status indicator communicates through dual encoding: an explicit semantic icon paired alongside unambiguous text.
- **Frais (Optimal)**: Pill badge with `#ECFDF5` background, `1px solid #A7F3D0`, `#065F46` icon and text.
- **Date Proche (J-2 to J-0)**: Pill badge with `#FFFBEB` background, `1px solid #FDE68A`, `#92400E` clock/hourglass icon and text.
- **DLC Dépassée (Safety Risk)**: Pill badge with `#FEF2F2` background, `1px solid #FECACA`, `#B91C1C` alert triangle icon and bold warning text.
- **DDM Dépassée (Quality Notice)**: Pill badge with `#EFF6FF` background, `1px solid #BFDBFE`, `#1E40AF` informational icon and text ("À consommer de préférence").

### Inventory Cards & Shelf Items
- Cards rest on `#FFFFFF` with `1px solid rgba(31, 41, 55, 0.08)` border.
- Internal content is partitioned into a left zone (ingredient name in `#1F2937`, storage zone tag "Frigo / Bac à légumes" in `#4B5563`) and a right zone containing the dual-encoded status badge and quantity adjuster.
- List view rows preserve a uniform minimum height of `64px` for effortless thumb interaction while sorting groceries.

### Form Inputs & Date Pickers
- **Text Inputs**: Height of `48px`, background `#FFFFFF`, border `1px solid #D1D5DB`, border radius `8px`, typography `#1F2937`.
- **Focus**: Border `#166534`, matching `2px` focus outline offset.
- **Date Selection**: Highlights DLC vs DDM distinction via contextual helper text in `#4B5563` directly under the date input.

### Checkboxes & Segmented Filters
- Checkboxes and radios have an active bounding area of `24px` within a hit zone of `44x44px`. Selected state displays solid `#166534` with an inverted white checkmark.
- Storage segment pills ("Frigo", "Congélateur", "Garde-manger") sit on a recessed cream track (`#F3EFE6`), highlighting the active zone with a white surface tile and `#166534` label.
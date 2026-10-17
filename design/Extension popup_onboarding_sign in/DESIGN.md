---
name: Cozy Canopy
colors:
  surface: '#fff8f6'
  surface-dim: '#ead6cf'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ec'
  surface-container: '#feeae3'
  surface-container-high: '#f8e4dd'
  surface-container-highest: '#f3ded8'
  on-surface: '#241915'
  on-surface-variant: '#59413b'
  inverse-surface: '#3a2e29'
  inverse-on-surface: '#ffede7'
  outline: '#8c7169'
  outline-variant: '#e0bfb6'
  surface-tint: '#ab360d'
  primary: '#a7330a'
  on-primary: '#ffffff'
  primary-container: '#c94b22'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59f'
  secondary: '#1a6c3f'
  on-secondary: '#ffffff'
  secondary-container: '#a4f4bb'
  on-secondary-container: '#227245'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#862300'
  secondary-fixed: '#a4f4bb'
  secondary-fixed-dim: '#89d7a1'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#00522c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#fff8f6'
  on-background: '#241915'
  surface-variant: '#f3ded8'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies a calm, affectionate, and communal learning companion. It channels the delightful motivation of gamified habit trackers while trading aggressive urgency, alarms, and guilt mechanics for a restorative, hearth-like atmosphere. The UI acts as a tranquil digital den where friends encourage each other’s academic and creative journeys alongside a flourishing red panda companion.

### Design Movement & Aesthetic
The aesthetic blends **Tactile Soft UI** with **Warm Editorial Modernism**:
- **Tactile Softness:** Elements have physical charm—plump buttons with subtle undertone depth, plush pill counters, and organic floating cards that feel tangible without slipping into dated skeuomorphism.
- **Calm Playfulness:** Interfaces use organic curves, generous breathing room, and soft terracotta-tinted shadows instead of clinical grays or high-stress neon alarms.
- **Supportive Social Presence:** Shared activity is framed with encouraging motifs, gentle progress trails, and soft celebration moments rather than punishing leaderboards.

## Colors

The color palette centers on earthy warmth, lush organic greens, and rich espresso typography that rests comfortably on ivory foundations.

### Palette Architecture
- **Primary (Red Panda Rust - `#E25D33`):** The primary brand anchor for core actions, streak badges, and active learning milestones. A vibrant warm orange (`#EA6D46`) serves as the hover and focus illumination state.
- **Secondary (Bamboo Fresh - `#3D8A5A`):** Evokes nature, focus, and quiet nourishment. Used for completed modules, verified study blocks, positive group affirmations, and gentle status indicators. Accompanied by a soft mint-tinted tint (`#E8F3EB`) for container fills.
- **Tertiary (Amber Hearth - `#F59E0B`):** Reserved for milestone starbursts, streak sparks, and baby red panda rewards.
- **Neutral (Espresso Slate - `#2C211D`):** Replaces harsh pure black. Dark text sits at `#2C211D`, secondary copy rests at `#4A3B32`, and muted metadata sits at `#7C6E65`.
- **Surfaces & Grounds:**
  - Base canvas: Warm Ivory (`#FDFBF7`)
  - Sub-canvas / Group troughs: Soft Cream (`#F7F3EB`)
  - Elevated card surface: Pure White (`#FFFFFF`) with warm undertones

### Streak Heatmap Progression
The study streak heatmap transitions through a warm ember spectrum:
- Level 0 (Rest day): `#F3EDE2`
- Level 1 (Light focus session): `#FFEDD5`
- Level 2 (Target completed): `#FDBA74`
- Level 3 (Deep study streak): `#FB923C`
- Level 4 (Group study burst): `#EA580C`
- Level 5 (Mastery milestone): `#C2410C`

### Dark Mode (Cocoa Twilight)
In dark mode, the canvas transforms into deep warm cocoa tones:
- Canvas Base: `#1E1916`
- Elevated Container: `#28211D`
- Interactive Surface: `#3A322C`
- Text shifts to high-legibility warm parchment (`#FDFBF7`) and amber-accented highlights.

## Typography

Plus Jakarta Sans is utilized across display, body, and label roles to unify the experience with warm, rounded humanist terminals and robust legibility.

### Hierarchy & Typesetting Rules
- **Display & Headlines:** Headings use bold and extra-bold weights with subtle negative letter spacing to create punchy, companionable titles. Punctuation in headers should be conversational and warm.
- **Body Text:** Never drop below `15px` for primary narrative text. The generous line height ensures extended readability when reviewing study notes, module descriptions, and peer encouraging notes.
- **Numbers & Metrics:** Use tabular figures (`tnum`) for timers, study minutes, chapter counts, and friend streak counters to prevent visual jittering during live sync sessions.

## Layout & Spacing

The layout is grounded in a flexible, human-scaled grid engineered around comfortable handheld interaction and expansive desktop study lounges.

### Responsive Breakpoints & Grids
- **Mobile (< 640px):** 4-column fluid grid. Canvas margins sit at `1rem` (`16px`) with `1rem` gutters. Primary daily goals, mascot status, and the immediate friend pulse stack vertically in a central feed.
- **Tablet (640px – 1024px):** 8-column fluid grid. Outer margins widen to `2rem` (`32px`) with `1.5rem` (`24px`) gutters. Side-by-side split featuring friend progress panels and active course modules.
- **Desktop (> 1024px):** 12-column grid capped at a maximum container width of `1200px` to maintain optimal reading scan lengths. Margins expand to `3rem` (`48px`). The mascot sanctuary and streak map anchor the left, study groups occupy the center, and integrated Coursera/Udemy track logs rest on the right.

### Vertical Rhythm
Interface components adhere strictly to an 8px base rhythm (`4px` for fine label badges). Major content modules separate by `space-xl` (`40px`), card internal paddings use `space-lg` (`24px`), and compact control rows use `space-sm` (`8px`) gaps.

## Elevation & Depth

Visual hierarchy uses warm, diffuse lighting and tactile surfaces rather than cold dropped shadows. Every shadow incorporates an amber-terracotta undertone to preserve the sunlit, cozy den aesthetic.

### Surface Tiers
- **Tier 0 (Base Canvas):** Flat, un-elevated warm cream (`#FDFBF7`).
- **Tier 1 (Resting Cards & Course Tiles):** Elevated on `#FFFFFF` using an ambient warm bloom: `0 4px 16px -2px rgba(74, 59, 50, 0.06), 0 2px 6px -1px rgba(74, 59, 50, 0.04)`. Outlined with a microscopic `1px` inner boundary of `rgba(44, 33, 29, 0.05)` for crisp definition.
- **Tier 2 (Interactive Floating Controls & Modals):** Used for celebration popups, mascot snack bowls, and active study session drawers: `0 12px 32px -4px rgba(74, 59, 50, 0.12), 0 4px 12px -2px rgba(226, 93, 51, 0.08)`.
- **Tier 3 (Tactile Press):** Active buttons dispense with standard downward displacement blur. Instead, they use a physical 3D shelf effect: a solid bottom border or inset shadow (`0 4px 0px #B8431D`) that reduces to `0px` with an immediate `2px` downward translation upon touch or click.

## Shapes

The design system employs a soft, protective shape vocabulary characterized by pill silhouettes and generous corner radii.

### Geometry Specifications
- **Standard UI Elements (`roundedness: 2` - 8px / 0.5rem):** Reserved for interior nested elements like study timers, audio toggles, and metadata tags within lists.
- **Cards & Primary Modules (`rounded-lg` - 16px to `rounded-xl` - 24px):** Daily streak hubs, mascot habit habitat cards, and syllabus tracking panels use deep 16px to 24px organic corners.
- **Pills & Badges (Full Radius - 9999px):** All actionable chips, friend avatars, streak tags, and state buttons embrace a pill format to avoid sharp edges and maximize touch comfort.

## Components

### Buttons
- **Primary ("Keep Streak" / "Start Study"):** Deep rust fill (`#E25D33`), bold white text, pill-shaped or `rounded-lg` (`16px`). Rendered with a solid tactile bottom lip (`4px` darker rust `#B8431D`). On hover, lightens to `#EA6D46`. On active press, translates down 2px with bottom lip compressed to 2px.
- **Secondary (Bamboo Cheer / "Nudge"):** Soft green tinted fill (`#E8F3EB`), forest green label (`#3D8A5A`), border `1.5px` solid `#D1E6D7`. On hover, background deepens to `#DCEDE1`.
- **Ghost / Neutral:** Espresso tinted borderless button for tertiary dismissals and history viewing, hovering into soft cream (`#F7F3EB`).

### Chips & Streak Badges
- **Streak Pill:** Displays an ember fire icon + count. Gradient fill from `#FFEDD5` to `#FEE2D5` with an espresso numeral (`#2C211D`) and rust-tinted border (`#FDBA74`).
- **Filter Chips:** Pill shape with `space-sm` vertical and `space-md` horizontal padding. Selected: rust background with crisp white text. Unselected: ivory background with `#4A3B32` text and subtle outline.

### Course & Goal Cards
- Encased in pure white (`#FFFFFF`) with a `20px` radius. Divided into three clear sections:
  1. **Header:** Platform badge (e.g., Coursera blue or Udemy crimson mini-pill), course title in `headline-sm`, and course completion percentage.
  2. **Body:** Visual progress bar filled in bamboo green (`#3D8A5A`) against a cream track (`#F7F3EB`).
  3. **Footer:** Micro-avatars of study group friends currently logged into that course module.

### Mascots & Progression Indicators
- **Mascot Habitat Container:** Enclosed sanctuary area with an organic curved frame (`rounded-xl`). Background adapts to time of day via gentle pastels (morning mist ivory, golden afternoon amber, starry cocoa night).
- **Hunger & Growth Bar:** Playful stacked progress bar depicting baby red panda growth steps (Cub → Explorer → Red Panda Scholar) utilizing rounded leaf icons as stepping nodes.

### Checkboxes & Study Milestone Checkers
- **Checkbox:** `24px x 24px` circular shape with a 2px espresso border (`#4A3B32`). When checked, springs into a bamboo green circle (`#3D8A5A`) with a crisp white checkmark accompanied by a subtle micro-bounce animation.

### Input Fields
- Generous `52px` height with a 16px radius, warm ivory fill (`#FDFBF7`), and neutral espresso border. When focused, transitions to a 2px rust border (`#E25D33`) with a soft glowing rust focus ring (`rgba(226, 93, 51, 0.15)`). Placeholder copy is styled in supportive, warm slate (`#7C6E65`).

### Group Study Lounge (Social Activity List)
- Friends list items sit on unified soft cream cards (`#F7F3EB`) with 16px radius. Each item features an avatar enclosed in an active streak ring, display name, course currently studying, and a one-tap emoji reaction drawer (send bamboo snack, high five, or quiet applause).
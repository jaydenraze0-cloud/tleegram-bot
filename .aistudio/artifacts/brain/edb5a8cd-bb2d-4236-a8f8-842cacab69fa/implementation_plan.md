# Fix Canvas Headline Typography & Layout: Balanced 2-Line News Card

This update resolves the cluttered text wrapping, badge gaps, and watermark collisions seen in Telegram posts by introducing a structured 2-line balanced typography engine, snug rectangular keyword badges, and fixed watermark positioning on the 1080x1080 canvas.

> [!IMPORTANT]
> **Confirmed Decisions from Phase 1 Clarification:**
> - **Headline Structure**: Automatic 2-line balanced layout with structured line breaks (`\n` support and intelligent word balancing) to ensure crisp editorial rows instead of erratic wrap.
> - **Badge Styling**: Snug rectangular badge matching exact word height with clean padding (`px-2.5 py-0.5 rounded-[4px]`, pure black on crisp white, tight vertical alignment).
> - **Watermark Clearance**: Channel handle (`@Stark-News-x`) anchored at a fixed bottom position (`bottom: 44px; left: 48px`) with guaranteed vertical clearance below the headline lines.

---

### 1. Overview & Core Concept

When rendering news graphics for Telegram broadcast, long headlines without structured breaks can wrap unpredictably into 3 staggered lines, causing highlight boxes to stretch, awkward whitespace gaps, and collisions with the channel watermark.

This change transforms the canvas typography engine into a **structured multi-line headline composer**:
1. **Balanced 2-Line Architecture**: Headlines are formatted into 2 distinct rows (`Line 1` and `Line 2`), each rendered as its own inline flex row so tokens stay cohesive without awkward mid-phrase breaks.
2. **Snug Rectangular Badges**: Highlighted keywords are contained in tightly padded rectangular contrast boxes (`rounded-[4px]`, `leading-none`) that fit the text snugly, exactly like the reference Stark News design.
3. **Decoupled Footer Watermark**: Moves the `@Stark-News-x` watermark out of the flowing headline block into a dedicated layer anchored at `bottom: 44px`, completely eliminating any chance of text overlap.
4. **Gemini 2-Line Synthesis**: Updates the Gemini 3.8 Flash headline prompt to return balanced 2-line headlines with targeted keywords placed strategically across lines.

---

### 2. User Experience & Visual Design

#### Visual Comparison: Before vs. After
- **Before (Messy Wrap)**:
  - Line 1: `VESSEL TARGETED IN`
  - Line 2: `[HORMUZ                    ]` (wide gap, awkward spacing)
  - Line 3: `          TRAFFIC HALTED`
  - Watermark: Overlapped by Line 2/3 text.
- **After (Structured Stark 2-Line Card)**:
  - Row 1: `VESSEL TARGETED IN [HORMUZ]`
  - Row 2: `[STRAIT] TRAFFIC HALTED`
  - *Or matching the reference:*
  - Row 1: `[IRAN STRIKES] SIX COMMERCIAL`
  - Row 2: `VESSELS NEAR [HORMUZ]`
  - Watermark: Cleanly resting at `bottom: 44px` with 30px+ clear margin above it.

#### Component Layout & Geometry
- **Master Canvas (1080x1080 px)**:
  - Top Gradient: Soft dark vignette (`0 - 240px`).
  - Bottom Gradient: Solid black fade (`45% - 100%`) ensuring 100% text readability.
  - Accent Divider: `w-20 h-0.5 bg-white mb-3`.
  - Headline Box: Positioned at `bottom: 100px`, allowing 2 lines of 50–54px text with `leading-[1.12]`.
  - Handle Watermark: Positioned at `bottom: 44px, left: 48px`, `font-mono font-bold text-sm text-neutral-300`.

---

### 3. Key Product Decisions & Trade-Offs

- **Structured Line Splitting (Newline & Auto-Balance)**:
  - *Approach*: If the headline contains a newline (`\n`), respect it strictly. If it is a single string, automatically split it into 2 balanced lines around the midpoint while keeping highlighted phrases together.
  - *Why*: Gives users full manual control (press Enter to break lines) while keeping automated Gemini-generated headlines balanced without manual intervention.
- **Dedicated Watermark Layer vs Flowing Footer**:
  - *Approach*: Uncouple `@handle` from the headline div. Place it in its own absolute container at `bottom: 44px`.
  - *Why*: Headline height variations will never push or pull the handle, guaranteeing zero overlap.
- **Snug Badge CSS Metrics**:
  - *Approach*: Use `inline-flex items-center px-2.5 py-0.5 rounded-[4px] mx-1 align-baseline leading-none` with `font-black`.
  - *Why*: Completely removes vertical jitter and awkward trailing spaces inside the badge.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1080x1080 Master Canvas                         │
│                                                                        │
│  [Logo / §]                                                            │
│                                                                        │
│                                                                        │
│                                                                        │
│  ──────────────────────── (Accent Divider Line)                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Row 1: [IRAN STRIKES] SIX COMMERCIAL                             │  │
│  │ Row 2: VESSELS NEAR [HORMUZ]                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  @Stark-News-x (Fixed at bottom: 44px, left: 48px)                     │
└────────────────────────────────────────────────────────────────────────┘
```

#### Files to Update:
1. `src/components/SquareEditor.tsx`:
   - Rewrite `renderStyledHeadline()` to split into balanced lines (`lines.map(...)`).
   - Style highlight badges with snug rectangular box (`px-2.5 py-0.5 rounded-[4px] leading-none`).
   - Move `handleFooter` to a fixed absolute position at `bottom: 44px`.
   - Update default `fontSize` (50px) and `headlineY` for balanced vertical rhythm.
2. `server.ts`:
   - Update `/api/ai/smart-headline` Gemini prompt to output clean 2-line headlines (`LINE 1 \n LINE 2`).
   - Ensure the Telegram post caption generator maintains the exact format.
3. `src/components/CaptionsPanel.tsx`:
   - Support multi-line headline textarea and line break indicators.

---

### 5. Step-by-Step Implementation Sequence

1. **Canvas Typography Engine Upgrade (`SquareEditor.tsx`)**:
   - Implement line splitting logic (`splitHeadlineIntoLines`).
   - Render each line as a distinct flex row with inline badge tokens.
   - Separate watermark handle into a dedicated absolute bottom layer.
2. **Gemini 2-Line Prompt Enhancement (`server.ts`)**:
   - Prompt Gemini 3.8 Flash to return balanced 2-line headlines formatted with `\n` and appropriate highlight keywords.
3. **Verification**:
   - Run `compile_applet` and verify rendering on the canvas.
   - Test export and simulated post to verify text clarity and zero overlap.

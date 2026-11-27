# Orbit — 6-Phase Master Upgrade & Evolution Plan

This plan preserves your existing Orbit GUI, HUD layout, 15 bundled tracks, 19 wave mechanics, Orb economy, and `RainbowBrite38@*` dev access while transforming Orbit into a 240Hz CBS-calibrated rhythm experience with 10 Daily levels, 5 Weekly Demon levels, Overdrive, Practice Start Positions, Replay Theater, full-UI skinning themes, expanded mods, lively motion, and a built-in Dev Level Editor.

---

## User Review & Confirmed Decisions

> [!IMPORTANT]
> All core architectural and gameplay choices below incorporate your answers and repository assets (`Daily/`, `Weekly/`, and `ConseptsFT/`). We will build and verify this **1 phase at a time** so you can playtest and review after each phase.

- **Confirmed — Existing Assets & Folders**: Use your newly pushed `Daily/` (`1.mp3`–`10.mp3`) and `Weekly/` (5 Demon tracks) folders directly, building dedicated playable charts for all **10 Daily** tracks and all **5 Weekly Demon** tracks. *(Note: `W1.mp3` is currently a 2-byte placeholder in the repo—we will build its full Demon chart and seamlessly pair it with a playable fallback/synth audio until you drop in or upload the final MP3 via the Dev Editor.)*
- **Confirmed — Overdrive Behavior**: Filling the Overdrive bar via **Perfect** hits (and Fever Spinners) activates a **10-second Overdrive Surge** granting **2× Orbs**, bonus score surge, and an **anime-inspired fire/plasma aura** blazing around the orbital bezel and combo readout.
- **Confirmed — Full-UI Theme Transformations**: Unlockable special themes (**Neon Sakura**, **Cozy Christmas 2026**, and **Krampusnacht 2026**) overhaul the entire UI—custom dial artwork, font pairings, background scenes, particle effects, surface materials, and main menu atmosphere—using your `ConseptsFT/` concepts purely as creative inspiration without copying repetitive AI patterns.
- **Confirmed — Dev Level Editor & Persistence**: Entering `RainbowBrite38@*` unlocks a **high-contrast black-and-white Dev Studio panel** right below `Settings` on the Title Screen, backed by a lightweight Express server that saves uploaded MP3s, tagged releases (`Daily`, `Weekly`, `None`), and level charts directly into project folders (plus one-click Git auto-push when credentials are configured).

---

## 1. Overview & Core Concept

- **What It Does**: Elevates Orbit from a 60fps browser rhythm game into a precision, arcade-grade circular rhythm platform featuring sub-frame 240Hz CBS timing, daily/weekly live-ops rotations with permanent archives, deterministic Replay Theater, GD-style Practice Mode, full-UI progression themes, and an integrated timeline Beatmap Editor.
- **Target Audience**: Both casual rhythm newcomers (assisted by visible Perfect zones, calibration wizards, Practice Start Positions, and Assist Mods) and hardcore Demon-tier grinders chasing SS mastery, Weekly Demons, and prestige badges.
- **Key Value**: Zero audio desync, responsive hold mechanics, endless replayability through Daily/Weekly archives and 25+ new features, and frictionless content creation directly inside the game.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Title Screen & Progression Hub**: Displays your signature disc turntable, live audio-reactive chrome, Mastery Rank progress, Daily/Weekly live status strip, and (when Dev Mode is unlocked) the **Black & White Dev Studio** entry card pinned directly beneath `Settings`.
2. **Track Select & Archives**: Features category tabs including **All**, **Daily Today + Daily Archive**, **Weekly Demon + Weekly Archive**, **Christmas**, **Arcade**, **Electronic**, **Tutorial**, and **Custom**—with instant search, BPM/Star/Rank sorting, and live audio preview crossfades.
3. **Active Orbital Play & HUD**:
   - Crisp **Overdrive Gauge** integrated cleanly beside the HUD combo/score zone, erupting into an anime fire aura at 100%.
   - **Visible Perfect Band** rendered inside every target sector plus **Next-Cue Ghost Radar** and contraction halos for unmistakable visual anticipation.
   - **Practice HUD Mode** with Start-Pos timeline bar, Checkpoint drop/teleport controls, and playback speed slider.
4. **Post-Run Summary & Replay Theater**: Shows accuracy breakdown, hit-error distribution graph, Mastery & Badge progress, and a **"Watch Replay"** launch button that plays back your exact run with timeline scrubbing and click markers.
5. **Dev Studio & Timeline Editor**: Black-and-white brutalist workspace listing **Songs With Levels**, **Songs Without Levels**, and **Upload New Song**, opening into a **waveform timeline editor** with wave-mode palette, beat-grid snap, tag/schedule selector (`Daily`, `Weekly`, `None`), and live gameplay preview.

### Visual Identity & Theme Architecture

- **Base Orbit Cabinet (Default & Shop Themes)**: Retains your signature dark arcade surface (`#07080d` canvas, `#0b0e16` bezel, `Outfit` / `Plus Jakarta Sans` UI + `JetBrains Mono` tabular telemetry) with the 60-30-10 color budget, zero-pill clean metadata (`·` separators), and 1-level surface elevation.
- **Special Full-UI Unlockable Skins** (changing fonts, dial geometry, menu chrome, materials, and particle atmospheres):
  - **Neon Sakura (Japanese Theme)** — *Unlock: `S` or `SS` on any Demon track*: Deep lacquer obsidian & warm washi-paper accents, `Shippori Mincho` + `Zen Kaku Gothic New` typography, drifting cherry blossom petals, kintsugi gold-veined orbital ring, and traditional lattice framing.
  - **Cozy Christmas 2026** — *Unlock: `S` or `SS` on both 2026 Christmas tracks (`Winter Solstice` & `Carol of the Bells`) on any difficulty*: Frosted evergreen & hearth-amber glass surfaces, `Fraunces` display typography, gentle snowfall particles, candy-stripe progress ring, and ribbon-wrapped dial bezel.
  - **Krampusnacht 2026 (Dark Christmas Upgrade)** — *Unlock: `S` or `SS` on both 2026 Christmas tracks on **DEMON** difficulty*: Volcanic charcoal & frostbite crimson steel material, `Cinzel` display typography, dual ash-and-snow particle storm, forged-iron spiked bezel ticks, and glowing ember core.
- **Interactive Feedback & Motion**: Spring-physics menu transitions (`motion/react`), staggered card entrances, disc spin-up hover response, rank-stamp impact animations, and `prefers-reduced-motion` compliance—all kept within $\le 200\text{ms}$ response budgets using compositor-only transforms/opacity.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — 240Hz Fixed Physics + CBS Sub-Frame Input + Audio-Clock Master**
  - *Chosen Approach*: Drive simulation via a fixed **240Hz (4.167ms) accumulator** locked to `AudioContext.currentTime`, while **CBS (Click-Between-Steps)** captures exact `performance.now()` input timestamps and interpolates the needle angle at the exact microsecond of the click/key press.
  - *Why*: Eliminates frame-rate-dependent lag spikes, keeps music 100% locked to visuals over 3+ minute tracks, and gives Geometry-Dash-grade responsiveness.
  - *Alternatives Considered*: Keeping variable `requestAnimationFrame` delta timing (causes drift and dropped inputs on 60Hz screens).
- **Decision 2 — Deterministic Replay Theater Over Simple Ghost Dots**
  - *Chosen Approach*: Record a lightweight stream of input events (`songTime`, `angle`, `action`, `judgment`, `offsetDeg`) plus initial RNG seed per run so any Personal Best or recent attempt can be re-simulated pixel-accurately in Replay Theater.
  - *Why*: Lets players scrub, slow down to 0.5x, and visually diagnose *why* they missed a Hold or Burst, which is far more useful than an opaque ghost needle.
- **Decision 3 — Full-Stack Express Backend for Folder Persistence & Editor Publishing**
  - *Chosen Approach*: Run Vite + Express (`server.ts` on port 3000) so the Dev Level Editor can read/write MP3s and chart JSON files directly inside `Daily/`, `Weekly/`, and `src/data/` manifests, and optionally execute a guarded Git commit/push when configured.
  - *Why*: Directly satisfies saving songs into real Daily/Weekly folders and scheduling future releases without losing edits on refresh.

---

## 4. Technical Architecture & 6-Phase Roadmap

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         ORBIT CLIENT (React + Vite)                       │
├───────────────────────┬───────────────────────────┬───────────────────────┤
│   Navigation & Skins  │   240Hz + CBS Core Engine │   Dev Studio & Tools  │
│  • Title + Mastery    │  • AudioContext Master    │  • B&W Dev Dashboard  │
│  • Track Select +     │  • 240Hz Tick Accumulator │  • Waveform Timeline  │
│    Daily/Weekly Arch. │  • CBS Sub-Frame Input    │  • Beat-Grid & Tags   │
│  • Full-UI Theme      │  • Overdrive & Hold Fix   │  • Live Playtest      │
│    Engine (3 Skins)   │  • Practice Start-Pos     │  • Calibration Wizard │
│  • Animated Mod/Shop  │  • Replay Theater Player  │                       │
└───────────┬───────────┴─────────────┬─────────────┴───────────┬───────────┘
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                  STATE & EXPRESS BACKEND (server.ts :3000)                │
│  • Player Profile + Mastery + Replays + Practice Checkpoints              │
│  • Rotation Clock Engine (Daily 24h UTC · Weekly Sunday 8:00 AM Demon)    │
│  • Media & Chart API (reads/writes Daily/, Weekly/, & custom level JSON)  │
│  • Optional Git Sync Bridge (auto-stage/commit/push on Dev publish)       │
└───────────────────────────────────────────────────────────────────────────┘
```

### 25+ New Features & Improvements Included Across the 6 Phases

1. **240Hz Fixed-Timestep Physics Loop** · 2. **CBS Sub-Frame Input Interpolation** · 3. **Audio-Clock Drift Auto-Correction** · 4. **Tap-to-Beat Calibration Wizard** · 5. **Hold Arc Tap-Anchored Physics Fix** · 6. **Visible Perfect Hit Zone Inside Every Sector** · 7. **Next-Note Ghost Radar Preview** · 8. **Pre-Flip Polarity Warning Pulse** · 9. **10-Second Overdrive Bar + 2× Orbs + Anime Fire Aura** · 10. **10 Daily Levels (`1`–`10`) with 24h Non-Repeating Rotation** · 11. **Daily Archive Browser + Daily Streak Counter** · 12. **5 Weekly Demon Levels with Sunday 8:00 AM Launch Countdown** · 13. **Weekly Demon Archive Browser** · 14. **GD-Style Practice Mode with Custom Start Pos** · 15. **Live Practice Checkpoints (Drop/Respawn/Clear)** · 16. **Practice Speed Multiplier (0.5×–1.0×)** · 17. **Deterministic Replay Theater with Timeline Scrubber** · 18. **Replay Hit-Error Inspector & Playback Speed (0.5×/1×/2×)** · 19. **10+ New Assist & Challenge Mods (Mechanic-Altering)** · 20. **3 Full-UI Unlockable Transformation Themes (Neon Sakura, Cozy Christmas 2026, Krampusnacht 2026)** · 21. **SS Mastery Prestige System & 20+ Badges** · 22. **Alive Spring-Motion GUI Transitions & Rank Stamp Slams** · 23. **Quick-Restart (`R`), Song Search, & BPM/Star/Rank Sorting** · 24. **Live Track Preview Crossfade on Hover/Select** · 25. **Black-and-White Dev Studio Dashboard (`RainbowBrite38@*`)** · 26. **Waveform Timeline Beatmap Editor with Beat-Grid Snap** · 27. **Auto-Chart Generator Assist + Scheduled Release Date Picker (`Daily`/`Weekly`/`None`)** · 28. **Direct Server Asset Saving + Optional Git Auto-Push Bridge**.

---

### 6-Phase Build Schedule *(1 Phase Per Review Cycle)*

#### **Phase 1: Core Orbit Port, 240Hz CBS Engine, Hold Fix & Timing Calibration**
- Port the full Orbit-v1 codebase and assets cleanly into the Express + Vite workspace on port 3000.
- Replace the variable-framerate gameplay loop with a deterministic **240Hz physics tick + CBS sub-frame input** synced tightly to `AudioContext.currentTime`.
- Fix **Hold Arc** physics so holds anchor to your actual tap angle and complete cleanly right at the end diamond cap.
- Render the **Visible Perfect Window Zone** inside every target sector + add the **Tap-to-Beat Calibration Wizard** & **Quick-Restart (`R`)**.

#### **Phase 2: Overdrive System, Visual Anticipation & Practice + Replay Theater**
- Implement the **Overdrive Bar** (charged by Perfect hits & Fever Spinners) triggering a **10-second 2× Orbs + Anime Fire Aura** surge.
- Upgrade visual anticipation: **Next-Note Ghost Radar**, **Pre-Flip Polarity Warning Pulses**, beat-synced perimeter shockwaves, and live HUD hit-error bar.
- Build **Practice Mode** (custom Start Position scrubber, live Checkpoint drop/respawn, 0.5×–1.0× speed) and **Replay Theater** (deterministic recording, timeline scrubbing, speed toggle, click-marker inspection).

#### **Phase 3: Daily (10 Tracks) & Weekly Demon (5 Tracks) Live Rotation + Archives**
- Wire all **10 Daily MP3s (`1`–`10`)** and **5 Weekly Demon MP3s** into dedicated catalogs with **hand-tuned/synced charts built for every single Daily (10) and Weekly (5) song**.
- Implement the **24-hour non-repeating Daily rotation** + **Daily Streak**, and the **7-day Demon-only Weekly rotation** with a **live countdown timer locking the first Weekly until Sunday at 8:00 AM**.
- Add dedicated **Daily Archive** and **Weekly Archive** views inside Track Select plus song search, BPM/Star/Rank sorting, and audio preview crossfades.

#### **Phase 4: Expanded Mods, SS Mastery Prestige & Badge Overhaul**
- Expand `MOD_CATALOG` with **10+ new Assist & Challenge Mods** that inject real mechanics (e.g., Guide Rail Auto-Hold, Slow Approach, Double Reversal, Hazard Overdrive, Portal Chaos, Sniper Micro, Blackout Flash).
- Build the **Mastery Prestige System** tracking SS/S clears across Main, Daily, Weekly, and Demon tiers, unlocking **20+ Badges** with a dedicated Mastery Overview panel in The Index and Title Screen.

#### **Phase 5: Full-UI Unlockable Transformation Themes & Animated GUI Overhaul**
- Upgrade the theme engine from accent swaps to **Full-UI Skin Packs** (custom fonts, orbital dial artwork, particle systems, surface materials, and menu layouts):
  - **Neon Sakura** (S on any Demon)
  - **Cozy Christmas 2026** (S on both Christmas tracks, any difficulty)
  - **Krampusnacht 2026** (S on both Christmas tracks on Demon)
- Upgrade GUI animations across every screen (Title Screen, Track Select carousel, Mod Drawer, Orb Shop, Index, Run Summary rank stamp) with crisp spring motion and theme-reactive micro-interactions.

#### **Phase 6: Black-and-White Dev Studio, Timeline Beatmap Editor & Scheduled Publishing**
- Add the **Black & White Dev Studio** entry panel right below `Settings` on the Title Screen (unlocked via `RainbowBrite38@*`).
- Build the Dev Dashboard listing **Songs With Levels**, **Songs Without Levels**, and **MP3 Upload** (saving directly to `Daily/`, `Weekly/`, or main assets via Express).
- Build the **Waveform Timeline Beatmap Editor** (orbit-native hybrid of GD Editor + Replay scrubber) with beat-grid snapping, all 19 wave modes, Hold duration editing, **Auto-Chart Assist**, live **Playtest from Playhead**, **Tagging & Release Scheduling** (`Daily`, `Weekly`, `None`, target date/time), and optional **Git Auto-Push** integration.

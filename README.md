# Frost & Wonder — Minimalist Christmas Countdown Lock Screen for macOS

**Handshake Challenge Submission: "Your Deadline, Your Design: Create a Countdown Lock Screen"**

**Frost & Wonder** is a minimalist, high-contrast Christmas countdown lock-screen experience and high-resolution wallpaper generator designed for macOS around the **December 25, 2026** holiday deadline.

---

## Core Lock-Screen Features

1. **Prominent Christmas Countdown (`36 Days Until Christmas`)**
   - Displays a clean, high-contrast countdown of the days remaining until **December 25, 2026** in refined display serif typography (`Cormorant Garamond`).
   - Preserves generous negative space in the upper portion of the frame for the native macOS Sonoma / Sequoia Lock-Screen system clock (`9:41`).

2. **Enchanted Winter Scenery & Optional Snow Globe Centerpiece**
   - Features an original glowing winter ice palace amidst snow-covered peaks, soft icy-blue and lavender aurora lighting, and optional drifting snowfall.
   - Includes a toggleable jewel-like **Enchanted Snow Globe** centerpiece (housing an illuminated winter Ferris wheel, warm-lit alpine castle towers, snow-laden evergreens, and a midnight-blue porcelain pedestal with champagne-gold botanical filigree) or a pure, uncluttered winter landscape view.

3. **Three or Four Minimal Milestone Dates**
   - Displays 3 or 4 chronological holiday preparation milestones in a single minimal timeline beneath the main countdown using concise titles and dates:
     - **Nov 29** · *Tree & Winter Lights*
     - **Dec 14** · *Shipping Cutoff*
     - **Dec 21** · *Wrapping Night*
     - **Dec 24** · *Christmas Eve*
   - Clicking any milestone allows quick inline customization of its short title or date.

4. **Downloadable High-Resolution Mac Lock-Screen Wallpaper (`.PNG`)**
   - Exports a clean, artwork-first `.PNG` lock-screen wallpaper in accurately labeled **`2560 × 1440 (QHD / 1440p)`** or **`3840 × 2160 (True 4K UHD)`** resolutions.
   - The exported `.PNG` excludes all web interface buttons and leaves the top macOS system clock zone completely unobstructed.

5. **Optional Calendar Reminder Export (`.ICS`)**
   - Generates a standards-compliant RFC 5545 `.ICS` calendar file with embedded 24-hour `VALARM` triggers for the milestone dates.
   - Note: Downloading an `.ICS` file does not schedule a reminder automatically until the user opens and imports the file into Apple Calendar.

---

## Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server (Port 3000):**
   ```bash
   npm run dev
   ```

3. **Run unit tests (`node:test`):**
   ```bash
   npx --yes tsx --test src/utils/holidayLogic.test.ts
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

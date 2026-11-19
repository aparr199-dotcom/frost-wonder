# Frost & Wonder — Native macOS Companion Project (`macos-native/`)

This directory contains the genuinely buildable native macOS Swift companion project for **Frost & Wonder**, engineered for macOS Sonoma (14.0+) and macOS Sequoia (15.0+).

---

## Directory Structure

```text
macos-native/
├── Package.swift                                    # Swift Package Manager manifest (Xcode 15/16+ compatible)
├── build-macos.sh                                   # One-step script building .app and .saver bundles
├── Sources/
│   ├── FrostWonderShared/
│   │   └── ChristmasCountdownMath.swift             # Shared local-timezone & year-rollover countdown math
│   ├── FrostWonderMacApp/
│   │   └── FrostWonderMacApp.swift                  # Native SwiftUI App + MenuBarExtra + SMAppService
│   ├── FrostWonderSaver/
│   │   ├── FrostWonderSaverView.swift               # Self-contained offline ScreenSaverView (.saver)
│   │   └── Info.plist                               # ScreenSaver bundle Info.plist
│   └── FrostWonderWidget/
│       ├── FrostWonderWidget.swift                  # WidgetKit Desktop & Notification Center Widget
│       └── Info.plist                               # WidgetKit extension Info.plist
└── Tests/
    └── FrostWonderSharedTests/
        └── ChristmasCountdownMathTests.swift        # XCTest unit tests verifying Dec 25 & year rollover
```

---

## How to Build & Run on Your Mac

### Option A — Automated Build Script (Recommended)
Open Terminal on your Mac (with Xcode or Xcode Command Line Tools installed) and run:

```bash
cd macos-native
chmod +x build-macos.sh
./build-macos.sh
```

This script:
1. Runs `swift test` to verify `ChristmasCountdownMathTests` (pre-Christmas countdown, December 25 celebration state, and December 26 automatic rollover to the next year).
2. Builds `build/FrostWonderMacApp.app` (which launches both the native SwiftUI window and the macOS top-right **Menu Bar Countdown `🎄 Xd Yh to Christmas`**).
3. Compiles `build/FrostWonderSaver.saver` — a **100% self-contained native SwiftUI/Canvas screen saver** that renders the glowing Ice Palace, drifting snow, and live December 25 countdown with **zero dependency on `localhost:3000` or any web server**.

To install the screen saver into macOS System Settings → Screen Saver:
```bash
cp -R build/FrostWonderSaver.saver ~/Library/Screen\ Savers/
```

### Option B — Open Directly in Xcode
1. Double-click `macos-native/Package.swift` (or run `open macos-native/Package.swift`) to open the project in Xcode 15/16+.
2. Select the **`FrostWonderMacApp`** scheme and target **My Mac**, then press **Cmd + R** to run the native companion app and Menu Bar item.
3. To attach the **WidgetKit Extension (`FrostWonderWidget.swift`)** to a signed App Store / Developer ID app target in Xcode:
   - Choose **File → New → Target → macOS → Widget Extension**, name it `FrostWonderWidget`, and replace the template file with `Sources/FrostWonderWidget/FrostWonderWidget.swift`.

---

## Platform Security & macOS Limitations (Transparent Engineering Report)

1. **macOS System Lock Screen (`loginwindow`) Restrictions**:
   - macOS does not permit third-party applications or web pages to replace or overlay interactive custom views directly onto the system authentication Lock Screen (`loginwindow`) in order to protect Touch ID and FileVault password entry against spoofing.
   - **Supported Solutions**:
     - Use the **Coordinated 4K Lock Screen Wallpaper Generator** inside the web app to export a 2560×1440 wallpaper formatted around the macOS Sonoma/Sequoia Lock Screen clock.
     - Use **`FrostWonderSaver.saver`** for an animated full-screen countdown when your Mac is idle.
     - Use **`FrostWonderWidget`** (`WidgetKit`) to place the frosted-glass countdown widget directly on your macOS Sonoma/Sequoia Desktop.
2. **Code Signing & Gatekeeper Notarization**:
   - `build-macos.sh` applies an ad-hoc local signature (`codesign --force --sign -`) so the `.app` and `.saver` bundles run on the machine where they are compiled.
   - Distributing `.saver` or `WidgetKit` extensions to other Macs requires signing with an Apple Developer ID certificate, and `SMAppService.mainApp.register()` (Launch at Login) requires the `.app` bundle to reside in `/Applications`.

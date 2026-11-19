#!/usr/bin/env bash
# build-macos.sh — Automated Native macOS Builder for Frost & Wonder
# Compiles the Swift Package (FrostWonderMacApp + MenuBarExtra), runs XCTest unit tests,
# and builds the self-contained FrostWonderSaver.saver bundle for ~/Library/Screen Savers/

set -euo pipefail

cd "$(dirname "$0")"

echo "❄️ [1/3] Running Swift Package XCTest suite (ChristmasCountdownMathTests)..."
swift test

echo "❄️ [2/3] Building FrostWonderMacApp (Native macOS Window + MenuBarExtra + SMAppService)..."
swift build -c release

mkdir -p build/FrostWonderMacApp.app/Contents/MacOS
mkdir -p build/FrostWonderMacApp.app/Contents/Resources
cp .build/release/FrostWonderMacApp build/FrostWonderMacApp.app/Contents/MacOS/FrostWonderMacApp

cat > build/FrostWonderMacApp.app/Contents/Info.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>FrostWonderMacApp</string>
    <key>CFBundleIdentifier</key>
    <string>com.frostandwonder.macos.app</string>
    <key>CFBundleName</key>
    <string>Frost &amp; Wonder</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

echo "❄️ [3/3] Compiling Self-Contained FrostWonderSaver.saver Bundle (No localhost dependency)..."
mkdir -p build/FrostWonderSaver.saver/Contents/MacOS
cp Sources/FrostWonderSaver/Info.plist build/FrostWonderSaver.saver/Contents/Info.plist

xcrun swiftc \
  -target "$(uname -m)-apple-macos14.0" \
  -emit-library \
  -module-name FrostWonderSaver \
  -Xlinker -bundle \
  -framework ScreenSaver \
  -framework SwiftUI \
  -framework AppKit \
  Sources/FrostWonderSaver/FrostWonderSaverView.swift \
  -o build/FrostWonderSaver.saver/Contents/MacOS/FrostWonderSaver

codesign --force --sign - build/FrostWonderMacApp.app || true
codesign --force --sign - build/FrostWonderSaver.saver || true

echo "🎄 Build complete!"
echo "   • App Bundle:          $(pwd)/build/FrostWonderMacApp.app"
echo "   • Screen Saver Bundle: $(pwd)/build/FrostWonderSaver.saver"
echo ""
echo "To install the Screen Saver on your Mac, run:"
echo "   cp -R build/FrostWonderSaver.saver ~/Library/Screen\\ Savers/"

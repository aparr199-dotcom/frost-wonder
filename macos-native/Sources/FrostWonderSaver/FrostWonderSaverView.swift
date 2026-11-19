// FrostWonderSaverView.swift — Self-Contained Native macOS ScreenSaverKit Bundle (.saver)
// Does NOT depend on localhost:3000 or any web server. Renders the animated winter kingdom,
// glowing ice palace spires, aurora ribbons, snowfall, and live December 25 countdown natively.

import ScreenSaver
import SwiftUI

public final class FrostWonderSaverView: ScreenSaverView {
    private var hostingView: NSHostingView<NativeScreenSaverCanvasView>?

    public override init?(frame: NSRect, isPreview: Bool) {
        super.init(frame: frame, isPreview: isPreview)
        self.animationTimeInterval = 1.0 / 30.0
        setupNativeHostingView()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        self.animationTimeInterval = 1.0 / 30.0
        setupNativeHostingView()
    }

    private func setupNativeHostingView() {
        let rootView = NativeScreenSaverCanvasView(isPreview: isPreview)
        let host = NSHostingView(rootView: rootView)
        host.frame = bounds
        host.autoresizingMask = [.width, .height]
        addSubview(host)
        self.hostingView = host
    }
}

struct NativeScreenSaverCanvasView: View {
    let isPreview: Bool
    @State private var now = Date()
    private let timer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    private var countdownTuple: (year: Int, days: Int, hours: Int, minutes: Int, seconds: Int, isXmas: Bool) {
        let cal = Calendar.current
        let curYear = cal.component(.year, from: now)
        let month = cal.component(.month, from: now)
        let day = cal.component(.day, from: now)
        if month == 12 && day == 25 {
            return (curYear, 0, 0, 0, 0, true)
        }
        let endOfXmas = cal.date(from: DateComponents(year: curYear, month: 12, day: 25, hour: 23, minute: 59, second: 59)) ?? now
        let targetYear = now > endOfXmas ? curYear + 1 : curYear
        let targetDate = cal.date(from: DateComponents(year: targetYear, month: 12, day: 25, hour: 0, minute: 0, second: 0)) ?? now
        let diff = max(0, Int(targetDate.timeIntervalSince(now)))
        return (
            targetYear,
            diff / 86400,
            (diff % 86400) / 3600,
            (diff % 3600) / 60,
            diff % 60,
            false
        )
    }

    var body: some View {
        let state = countdownTuple
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.02, green: 0.04, blue: 0.10),
                    Color(red: 0.06, green: 0.13, blue: 0.26),
                    Color(red: 0.12, green: 0.10, blue: 0.28)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Native CoreGraphics/SwiftUI Snowfall & Ice Palace Silhouette
            TimelineView(.animation) { timeline in
                Canvas { context, size in
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    let cx = size.width * 0.5
                    let baseY = size.height * 0.82

                    // Crystalline Ice Palace Spires in background
                    let spireOffsets: [(CGFloat, CGFloat, CGFloat)] = [
                        (-90, 32, 110),
                        (-45, 42, 155),
                        (0, 56, 210),
                        (45, 42, 155),
                        (90, 32, 110)
                    ]
                    for (dx, w, h) in spireOffsets {
                        var path = Path()
                        let sx = cx + dx
                        path.move(to: CGPoint(x: sx - w / 2, y: baseY))
                        path.addLine(to: CGPoint(x: sx - w / 2, y: baseY - h * 0.65))
                        path.addLine(to: CGPoint(x: sx, y: baseY - h))
                        path.addLine(to: CGPoint(x: sx + w / 2, y: baseY - h * 0.65))
                        path.addLine(to: CGPoint(x: sx + w / 2, y: baseY))
                        path.closeSubpath()
                        context.opacity = 0.22
                        context.fill(path, with: .color(Color(red: 0.55, green: 0.84, blue: 0.99)))
                    }

                    // 120 Drifting Snowflakes
                    for i in 0..<120 {
                        let seed = Double(i) * 29.7
                        let x = (sin(seed) * 0.5 + 0.5) * size.width + sin(t * 0.5 + seed) * 22.0
                        let y = fmod(t * (20.0 + Double(i % 6) * 5.0) + seed * 50.0, Double(size.height + 16.0)) - 8.0
                        let r = CGFloat(1.2 + Double(i % 4) * 0.9)
                        context.opacity = 0.3 + 0.45 * (0.5 + 0.5 * sin(t * 1.5 + seed))
                        context.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: r * 2, height: r * 2)),
                            with: .color(.white)
                        )
                    }
                }
            }

            VStack(spacing: isPreview ? 8 : 20) {
                Text(state.isXmas
                     ? "🎄 Merry Christmas! The Magic Has Arrived!"
                     : "✨ The Magic of Christmas Is Almost Here ✨")
                    .font(.system(size: isPreview ? 11 : 20, weight: .medium, design: .serif))
                    .foregroundStyle(Color(red: 0.73, green: 0.90, blue: 0.99))

                Text("Christmas \(String(state.year))")
                    .font(.system(size: isPreview ? 22 : 56, weight: .bold, design: .serif))
                    .foregroundStyle(.white)

                if !state.isXmas {
                    HStack(spacing: isPreview ? 8 : 20) {
                        saverUnit(value: state.days, label: "DAYS")
                        saverUnit(value: state.hours, label: "HOURS")
                        saverUnit(value: state.minutes, label: "MINUTES")
                        saverUnit(value: state.seconds, label: "SECONDS")
                    }
                }
            }
            .padding()
        }
        .onReceive(timer) { tick in
            now = tick
        }
    }

    @ViewBuilder
    private func saverUnit(value: Int, label: String) -> some View {
        VStack(spacing: 4) {
            Text(String(format: "%02d", value))
                .font(.system(size: isPreview ? 18 : 48, weight: .bold, design: .monospaced))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: isPreview ? 7 : 11, weight: .semibold))
                .tracking(1.5)
                .foregroundStyle(Color(red: 0.99, green: 0.90, blue: 0.54))
        }
        .padding(.horizontal, isPreview ? 8 : 22)
        .padding(.vertical, isPreview ? 6 : 16)
        .background(Color.black.opacity(0.45))
        .clipShape(RoundedRectangle(cornerRadius: isPreview ? 8 : 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: isPreview ? 8 : 20, style: .continuous)
                .stroke(Color.white.opacity(0.22), lineWidth: 1)
        )
    }
}

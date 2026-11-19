import SwiftUI
import ServiceManagement
import FrostWonderShared

@main
struct FrostWonderMacApp: App {
    @State private var now = Date()
    @State private var simulateChristmas = false
    @State private var launchAtLogin = (SMAppService.mainApp.status == .enabled)
    @State private var loginStatusMessage: String = ""

    private let timer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    private var countdown: NativeCountdownState {
        ChristmasCountdownMath.calculate(
            now: now,
            simulateChristmasMorning: simulateChristmas
        )
    }

    var body: some Scene {
        WindowGroup("Frost & Wonder — Enchanted Winter Companion") {
            NativeEnchantedCountdownView(
                countdown: countdown,
                simulateChristmas: $simulateChristmas,
                launchAtLogin: $launchAtLogin,
                loginStatusMessage: $loginStatusMessage,
                onToggleLaunchAtLogin: updateLaunchAtLogin
            )
            .frame(minWidth: 760, minHeight: 520)
            .onReceive(timer) { tick in
                now = tick
            }
        }

        // Native macOS System Menu Bar Countdown Extra
        MenuBarExtra(countdown.menuBarLabel, systemImage: "snowflake") {
            VStack(alignment: .leading, spacing: 10) {
                Text("✨ Frost & Wonder Countdown")
                    .font(.headline)

                if countdown.isChristmasMorning {
                    Text("🎄 Merry Christmas! The Magic Has Arrived!")
                        .font(.subheadline)
                        .foregroundStyle(.yellow)
                } else {
                    Text("\(countdown.days)d \(countdown.hours)h \(countdown.minutes)m \(countdown.seconds)s until Dec 25, \(String(countdown.targetYear))")
                        .font(.system(.subheadline, design: .monospaced))
                    Text("Atmosphere: \(countdown.magicStageLabel) (Level \(countdown.magicIntensity)/5)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Divider()

                Toggle("Preview Christmas Morning", isOn: $simulateChristmas)

                Toggle("Launch at Login on Mac Sign-In", isOn: $launchAtLogin)
                    .onChange(of: launchAtLogin) { _, enabled in
                        updateLaunchAtLogin(enabled)
                    }

                if !loginStatusMessage.isEmpty {
                    Text(loginStatusMessage)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                Divider()

                Button("Quit Frost & Wonder") {
                    NSApplication.shared.terminate(nil)
                }
                .keyboardShortcut("q")
            }
            .padding(12)
        }
    }

    private func updateLaunchAtLogin(_ enabled: Bool) {
        do {
            if enabled {
                try SMAppService.mainApp.register()
                loginStatusMessage = "Registered with macOS Login Items (SMAppService)."
            } else {
                try SMAppService.mainApp.unregister()
                loginStatusMessage = "Removed from macOS Login Items."
            }
        } catch {
            loginStatusMessage = "Note: SMAppService requires a signed .app bundle in /Applications (\(error.localizedDescription))."
        }
    }
}

struct NativeEnchantedCountdownView: View {
    let countdown: NativeCountdownState
    @Binding var simulateChristmas: Bool
    @Binding var launchAtLogin: Bool
    @Binding var loginStatusMessage: String
    let onToggleLaunchAtLogin: (Bool) -> Void

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.03, green: 0.05, blue: 0.12),
                    Color(red: 0.07, green: 0.14, blue: 0.28),
                    Color(red: 0.12, green: 0.11, blue: 0.30)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Self-Contained Native Snowfall & Ice Palace Canvas
            TimelineView(.animation) { timeline in
                Canvas { context, size in
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    for i in 0..<90 {
                        let seed = Double(i) * 37.13
                        let x = (sin(seed) * 0.5 + 0.5) * size.width + sin(t * 0.6 + seed) * 18.0
                        let y = (fmod((t * (18.0 + Double(i % 5) * 6.0)) + seed * 40.0, Double(size.height + 20.0))) - 10.0
                        let r = CGFloat(1.5 + Double(i % 3) * 1.1)
                        let rect = CGRect(x: x, y: y, width: r * 2, height: r * 2)
                        context.opacity = 0.35 + 0.35 * sin(t + seed)
                        context.fill(Path(ellipseIn: rect), with: .color(.white))
                    }
                }
            }

            VStack(spacing: 22) {
                Text(countdown.isChristmasMorning
                     ? "🎄 Merry Christmas! The Magic Has Arrived!"
                     : "✨ The Magic of Christmas Is Almost Here ✨")
                    .font(.system(size: 16, weight: .semibold, design: .serif))
                    .foregroundStyle(Color(red: 0.73, green: 0.90, blue: 0.99))

                Text(countdown.isChristmasMorning
                     ? "Rejoice in the Enchanted Winter Kingdom"
                     : "Frost & Wonder Christmas \(String(countdown.targetYear))")
                    .font(.system(size: 40, weight: .bold, design: .serif))
                    .foregroundStyle(.white)

                HStack(spacing: 18) {
                    unitBox(value: countdown.days, label: "DAYS")
                    unitBox(value: countdown.hours, label: "HOURS")
                    unitBox(value: countdown.minutes, label: "MINUTES")
                    unitBox(value: countdown.seconds, label: "SECONDS")
                }

                Text("Atmosphere Level \(countdown.magicIntensity)/5 · \(countdown.magicStageLabel)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.8))

                HStack(spacing: 16) {
                    Toggle("Preview Christmas Morning", isOn: $simulateChristmas)
                        .toggleStyle(.switch)
                        .foregroundStyle(.white)

                    Toggle("Launch at Mac Sign-In", isOn: $launchAtLogin)
                        .toggleStyle(.switch)
                        .foregroundStyle(.white)
                        .onChange(of: launchAtLogin) { _, enabled in
                            onToggleLaunchAtLogin(enabled)
                        }
                }
                .padding(.top, 8)

                if !loginStatusMessage.isEmpty {
                    Text(loginStatusMessage)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .padding(36)
        }
    }

    @ViewBuilder
    private func unitBox(value: Int, label: String) -> some View {
        VStack(spacing: 6) {
            Text(String(format: "%02d", value))
                .font(.system(size: 44, weight: .bold, design: .monospaced))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .tracking(2)
                .foregroundStyle(Color(red: 0.99, green: 0.90, blue: 0.54))
        }
        .frame(width: 128, height: 108)
        .background(.ultraThinMaterial.opacity(0.65))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.22), lineWidth: 1)
        )
    }
}

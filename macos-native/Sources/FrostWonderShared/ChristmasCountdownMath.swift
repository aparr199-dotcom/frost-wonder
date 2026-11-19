import Foundation

public struct NativeCountdownState: Equatable, Sendable {
    public let targetDate: Date
    public let targetYear: Int
    public let days: Int
    public let hours: Int
    public let minutes: Int
    public let seconds: Int
    public let totalSeconds: Int
    public let isChristmasMorning: Bool
    public let magicIntensity: Int
    public let magicStageLabel: String

    public var menuBarLabel: String {
        if isChristmasMorning {
            return "🎄 Merry Christmas!"
        }
        return "🎄 \(days)d \(hours)h to Christmas"
    }
}

public enum ChristmasCountdownMath {
    /// Mathematically matches the web application's `calculateChristmasCountdown` in local time.
    /// - Counts down to December 25 00:00:00 in the user's local Calendar/TimeZone.
    /// - On December 25 (00:00:00 through 23:59:59), transitions into Christmas Morning celebration state (`isChristmasMorning = true`).
    /// - After December 25 (Dec 26–31), automatically rolls over to December 25 of `currentYear + 1`.
    public static func calculate(
        now: Date = Date(),
        calendar: Calendar = .current,
        targetYearOverride: Int? = nil,
        simulateChristmasMorning: Bool = false
    ) -> NativeCountdownState {
        let currentYear = calendar.component(.year, from: now)
        let month = calendar.component(.month, from: now)
        let day = calendar.component(.day, from: now)
        let isActualChristmasDay = (month == 12 && day == 25)

        if simulateChristmasMorning {
            let target = calendar.date(from: DateComponents(year: currentYear, month: 12, day: 25, hour: 0, minute: 0, second: 0)) ?? now
            return NativeCountdownState(
                targetDate: target,
                targetYear: currentYear,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                totalSeconds: 0,
                isChristmasMorning: true,
                magicIntensity: 5,
                magicStageLabel: "Christmas Morning Enchantment"
            )
        }

        var targetYear = currentYear
        if let overrideYear = targetYearOverride, overrideYear >= currentYear {
            targetYear = overrideYear
        } else {
            let endOfChristmasDay = calendar.date(from: DateComponents(year: currentYear, month: 12, day: 25, hour: 23, minute: 59, second: 59)) ?? now
            if now > endOfChristmasDay {
                targetYear = currentYear + 1
            }
        }

        let targetDate = calendar.date(from: DateComponents(year: targetYear, month: 12, day: 25, hour: 0, minute: 0, second: 0)) ?? now

        if isActualChristmasDay && targetYear == currentYear {
            return NativeCountdownState(
                targetDate: targetDate,
                targetYear: targetYear,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                totalSeconds: 0,
                isChristmasMorning: true,
                magicIntensity: 5,
                magicStageLabel: "Christmas Morning Enchantment"
            )
        }

        let diffSeconds = max(0, Int(targetDate.timeIntervalSince(now)))
        let days = diffSeconds / 86400
        let hours = (diffSeconds % 86400) / 3600
        let minutes = (diffSeconds % 3600) / 60
        let seconds = diffSeconds % 60

        let intensity: Int
        let label: String
        if days <= 3 {
            intensity = 5
            label = "Solstice Aurora Peak"
        } else if days <= 14 {
            intensity = 4
            label = "Starlight Palace Glow"
        } else if days <= 30 {
            intensity = 3
            label = "Enchanted Advent Frost"
        } else if days <= 60 {
            intensity = 2
            label = "First Snowfall Shimmer"
        } else {
            intensity = 1
            label = "Early Winter Whisper"
        }

        return NativeCountdownState(
            targetDate: targetDate,
            targetYear: targetYear,
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            totalSeconds: diffSeconds,
            isChristmasMorning: false,
            magicIntensity: intensity,
            magicStageLabel: label
        )
    }
}

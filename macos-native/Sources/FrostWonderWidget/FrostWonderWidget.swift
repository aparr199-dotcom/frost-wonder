// FrostWonderWidget.swift — macOS Sonoma / Sequoia Desktop & Notification Center Widget
import WidgetKit
import SwiftUI

struct ChristmasEntry: TimelineEntry {
    let date: Date
    let targetYear: Int
    let daysRemaining: Int
    let hoursRemaining: Int
    let minutesRemaining: Int
    let isChristmasMorning: Bool
    let nextMilestone: String
}

struct FrostWonderProvider: TimelineProvider {
    func placeholder(in context: Context) -> ChristmasEntry {
        ChristmasEntry(
            date: Date(),
            targetYear: 2026,
            daysRemaining: 37,
            hoursRemaining: 14,
            minutesRemaining: 22,
            isChristmasMorning: false,
            nextMilestone: "Tree Decorating"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (ChristmasEntry) -> ()) {
        completion(makeEntry(for: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ChristmasEntry>) -> ()) {
        var entries: [ChristmasEntry] = []
        let now = Date()
        for minuteOffset in 0..<60 {
            if let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: now) {
                entries.append(makeEntry(for: entryDate))
            }
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func makeEntry(for date: Date) -> ChristmasEntry {
        let cal = Calendar.current
        let curYear = cal.component(.year, from: date)
        let month = cal.component(.month, from: date)
        let day = cal.component(.day, from: date)

        if month == 12 && day == 25 {
            return ChristmasEntry(
                date: date,
                targetYear: curYear,
                daysRemaining: 0,
                hoursRemaining: 0,
                minutesRemaining: 0,
                isChristmasMorning: true,
                nextMilestone: "🎄 Merry Christmas!"
            )
        }

        let endOfXmas = cal.date(from: DateComponents(year: curYear, month: 12, day: 25, hour: 23, minute: 59, second: 59)) ?? date
        let targetYear = date > endOfXmas ? curYear + 1 : curYear
        let target = cal.date(from: DateComponents(year: targetYear, month: 12, day: 25, hour: 0, minute: 0, second: 0)) ?? date
        let diff = max(0, Int(target.timeIntervalSince(date)))

        return ChristmasEntry(
            date: date,
            targetYear: targetYear,
            daysRemaining: diff / 86400,
            hoursRemaining: (diff % 86400) / 3600,
            minutesRemaining: (diff % 3600) / 60,
            isChristmasMorning: false,
            nextMilestone: "Christmas Morning"
        )
    }
}

struct FrostWonderWidgetEntryView: View {
    var entry: FrostWonderProvider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("✨ FROST & WONDER")
                .font(.system(size: 10, weight: .semibold, design: .rounded))
                .foregroundStyle(.cyan.opacity(0.9))

            if entry.isChristmasMorning {
                Text("🎄 Merry Christmas!")
                    .font(.system(size: 20, weight: .bold, design: .serif))
                Text("The Magic Has Arrived!")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    Text("\(entry.daysRemaining)d")
                        .font(.system(size: 34, weight: .bold, design: .monospaced))
                    Text("\(entry.hoursRemaining)h \(entry.minutesRemaining)m")
                        .font(.system(size: 16, weight: .medium, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
                Text("Until Dec 25, \(String(entry.targetYear)) · \(entry.nextMilestone)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .containerBackground(.ultraThinMaterial, for: .widget)
    }
}

@main
struct FrostWonderWidget: Widget {
    let kind: String = "FrostWonderWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FrostWonderProvider()) { entry in
            FrostWonderWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Frost & Wonder Countdown")
        .description("Counts down to December 25 on your Mac Desktop and Notification Center.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

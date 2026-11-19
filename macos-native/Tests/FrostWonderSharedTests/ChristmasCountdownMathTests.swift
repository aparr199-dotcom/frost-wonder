import XCTest
@testable import FrostWonderShared

final class ChristmasCountdownMathTests: XCTestCase {
    func testPreChristmasCountdown() {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(secondsFromGMT: 0)!
        let nov12 = cal.date(from: DateComponents(year: 2026, month: 11, day: 12, hour: 6, minute: 0, second: 0))!
        let state = ChristmasCountdownMath.calculate(now: nov12, calendar: cal)
        XCTAssertEqual(state.targetYear, 2026)
        XCTAssertFalse(state.isChristmasMorning)
        XCTAssertEqual(state.days, 42)
        XCTAssertEqual(state.hours, 18)
        XCTAssertEqual(state.minutes, 0)
        XCTAssertEqual(state.seconds, 0)
    }

    func testChristmasDayCelebrationAndYearRollover() {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(secondsFromGMT: 0)!

        // On Dec 25 morning -> isChristmasMorning == true
        let dec25 = cal.date(from: DateComponents(year: 2026, month: 12, day: 25, hour: 9, minute: 30, second: 0))!
        let xmasState = ChristmasCountdownMath.calculate(now: dec25, calendar: cal)
        XCTAssertTrue(xmasState.isChristmasMorning)
        XCTAssertEqual(xmasState.days, 0)

        // On Dec 26 -> automatically rolls over to Dec 25, 2027
        let dec26 = cal.date(from: DateComponents(year: 2026, month: 12, day: 26, hour: 12, minute: 0, second: 0))!
        let nextYearState = ChristmasCountdownMath.calculate(now: dec26, calendar: cal)
        XCTAssertFalse(nextYearState.isChristmasMorning)
        XCTAssertEqual(nextYearState.targetYear, 2027)
        XCTAssertEqual(nextYearState.days, 363)
    }
}

import XCTest
import WebKit
import AVFAudio
@testable import Hatcheat

@MainActor
final class HatcheatTests: XCTestCase {
    var defaults: UserDefaults!
    var suite: String!
    var controller: HatcheatViewController!
    var host: UIWindow!

    override func setUp() async throws {
        suite = "hatcheat.test.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suite)!
        host = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        try await launch()
    }

    override func tearDown() async throws {
        host.isHidden = true
        host.rootViewController = nil
        controller = nil
        defaults.removePersistentDomain(forName: suite)
    }

    func launch() async throws {
        controller = HatcheatViewController(progress: ProgressStore(defaults: defaults))
        host.rootViewController = controller
        host.makeKeyAndVisible()
        try await until("!!document.getElementById('give') && document.getElementById('offline-status').textContent.includes('준비가 됐어요')")
    }

    func js(_ code: String) async throws -> Any? {
        try await controller.webView.evaluateJavaScript(code)
    }

    func until(_ condition: String, seconds: Double = 10) async throws {
        let deadline = Date().addingTimeInterval(seconds)
        while Date() < deadline {
            if (try? await js(condition)) as? Bool == true { return }
            try await Task.sleep(for: .milliseconds(100))
        }
        XCTFail("Condition did not become true: \(condition)")
    }

    func testOfflinePackageGivingAndBackgroundPrivacy() async throws {
        let title = try await js("document.title") as? String
        XCTAssertEqual(title, "해칫 — 마음을 건네는 곳")
        try await until("Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)")
        _ = try await js("document.getElementById('draft').value='테스트용 원문'; document.getElementById('draft').dispatchEvent(new Event('input')); document.getElementById('give').click(); null")
        try await until("!document.getElementById('done-view').hidden")
        let afterGiving = try await js("document.getElementById('draft').value") as? String
        XCTAssertEqual(afterGiving, "")
        _ = try await js("document.querySelector('[data-view=write]').click(); document.getElementById('draft').value='배경 전환 테스트'; document.getElementById('draft').dispatchEvent(new Event('input')); null")
        controller.protectContent()
        try await until("document.getElementById('draft').value === ''")
        XCTAssertNil(defaults.data(forKey: ProgressStore.key))
    }

    func testProgressAndCardsPersistAcrossNewWebViews() async throws {
        _ = try await js("document.querySelector('[data-view=ink]').click(); document.getElementById('grind-once').click(); null")
        try await until("JSON.parse(window.hatcheatNativeStorage.getItem('hatcheat.progress.v1')).turns === 1")
        try await Task.sleep(for: .milliseconds(200))
        try await launch()
        let turns = try await js("JSON.parse(window.hatcheatNativeStorage.getItem('hatcheat.progress.v1')).turns") as? Int
        XCTAssertEqual(turns, 1)
        _ = try await js("document.querySelector('[data-view=ink]').click(); for(let i=0;i<99;i++) document.getElementById('grind-once').click(); null")
        try await until("document.getElementById('quote-dialog').open")
        try await Task.sleep(for: .milliseconds(200))
        try await launch()
        let cards = try await js("JSON.parse(window.hatcheatNativeStorage.getItem('hatcheat.progress.v1')).collection.length") as? Int
        XCTAssertEqual(cards, 1)
        let afterCard = try await js("JSON.parse(window.hatcheatNativeStorage.getItem('hatcheat.progress.v1')).turns") as? Int
        XCTAssertEqual(afterCard, 0)
    }

    func testStoreRejectsInvalidProgressAndStripsPrivateFields() {
        let store = ProgressStore(defaults: defaults)
        XCTAssertTrue(store.save(#"{"version":1,"turns":5,"book":"random","sound":false,"collection":[],"draft":"never persist"}"#))
        XCTAssertFalse(store.json.contains("draft"))
        XCTAssertFalse(store.json.contains("never persist"))
        XCTAssertFalse(store.save(#"{"version":1,"turns":100,"book":"random","sound":false,"collection":[]}"#))
        XCTAssertFalse(store.save(#"{"version":1,"turns":1,"book":"random","sound":false,"collection":["private text"]}"#))
    }

    func testBundledEffectsRespectMuteAndStopBeforeBackgroundJavaScript() async throws {
        for cue in HatcheatSoundEffects.cues {
            let url = try XCTUnwrap(Bundle.main.url(forResource: cue, withExtension: "wav", subdirectory: "Web/assets/audio"))
            XCTAssertGreaterThan(try AVAudioPlayer(contentsOf: url).duration, 0.1)
        }
        _ = try await js("window.hatcheatNativeFeedback.prepare(); window.hatcheatNativeFeedback.play('paper-fold'); null")
        try await Task.sleep(for: .milliseconds(100))
        XCTAssertTrue(controller.soundEffects.playingCues.isEmpty, "Default sound-off must be enforced natively")

        _ = try await js("document.getElementById('settings-open').click(); const toggle=document.getElementById('sound-toggle'); toggle.checked=true; toggle.dispatchEvent(new Event('change')); null")
        try await until("JSON.parse(window.hatcheatNativeStorage.getItem('hatcheat.progress.v1')).sound")
        try await Task.sleep(for: .milliseconds(100))
        XCTAssertEqual(AVAudioSession.sharedInstance().category, .ambient)
        XCTAssertTrue(controller.soundEffects.playingCues.contains("paper-fold"))
        controller.soundEffects.startGrinding()
        XCTAssertTrue(controller.soundEffects.playingCues.contains("ink-grind"))
        controller.soundEffects.stopGrinding()
        XCTAssertFalse(controller.soundEffects.playingCues.contains("ink-grind"))
        controller.protectContent()
        XCTAssertTrue(controller.soundEffects.playingCues.isEmpty)
        XCTAssertFalse(controller.soundEffects.isPrepared)
        controller.soundEffects.play("paper-fold")
        XCTAssertTrue(controller.soundEffects.playingCues.isEmpty, "A delayed cue cannot restart sound after backgrounding")

        controller.restoreContent()
        _ = try await js("window.hatcheatNativeFeedback.prepare(); window.hatcheatNativeFeedback.play('card-reveal'); null")
        try await Task.sleep(for: .milliseconds(100))
        XCTAssertTrue(controller.soundEffects.playingCues.contains("card-reveal"))
        _ = try await js("document.getElementById('sound-toggle').checked=false; document.getElementById('sound-toggle').dispatchEvent(new Event('change')); null")
        try await Task.sleep(for: .milliseconds(100))
        XCTAssertTrue(controller.soundEffects.playingCues.isEmpty)
        XCTAssertFalse(controller.soundEffects.isPrepared)
        XCTAssertFalse(ProgressStore(defaults: defaults).soundEnabled)
    }

    func testUnknownCueAndInterruptionCannotResumePlayback() async throws {
        controller.soundEffects.prepare()
        controller.soundEffects.play("../../untrusted")
        XCTAssertTrue(controller.soundEffects.playingCues.isEmpty)
        controller.soundEffects.play("settle")
        XCTAssertTrue(controller.soundEffects.playingCues.contains("settle"))
        NotificationCenter.default.post(name: AVAudioSession.interruptionNotification, object: nil)
        XCTAssertTrue(controller.soundEffects.playingCues.isEmpty)
        XCTAssertFalse(controller.soundEffects.isPrepared)
    }
}

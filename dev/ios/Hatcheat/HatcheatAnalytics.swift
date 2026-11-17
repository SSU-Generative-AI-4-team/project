import UIKit
import AppTrackingTransparency
import FirebaseCore
import FirebaseAnalytics
import FacebookCore

/// iOS 앱 측정. 설정이 없으면 어떤 SDK도 켜지 않는다.
/// - Firebase(GA4 iOS 스트림 → Google Ads 전환): `Hatcheat/GoogleService-Info.plist`가 앱에 들어 있을 때
/// - Meta SDK: 빌드 설정 `META_APP_ID`·`META_CLIENT_TOKEN`이 채워져 있을 때
/// 웹 화면(analytics.js)이 `app_` 이벤트를 넘기면 여기서 두 SDK로 보낸다. 원문은 웹 쪽에서부터 넘어오지 않는다.
enum HatcheatAnalytics {
    private(set) static var firebase = false
    private(set) static var meta = false
    static var isEnabled: Bool { firebase || meta }

    static func start(_ application: UIApplication, launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
            FirebaseApp.configure()
            Analytics.setDefaultEventParameters(["surface": "app"])
            firebase = true
        }
        let appID = Bundle.main.object(forInfoDictionaryKey: "HatcheatMetaAppID") as? String ?? ""
        let token = Bundle.main.object(forInfoDictionaryKey: "HatcheatMetaClientToken") as? String ?? ""
        if !appID.isEmpty, !token.isEmpty {
            Settings.shared.appID = appID
            Settings.shared.clientToken = token
            Settings.shared.displayName = "해칫"
            ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
            meta = true
        }
        guard isEnabled else { return }
        // 추적 허용 창은 앱이 활성 상태일 때만 뜬다. 한 번 답하면 다시 묻지 않는다.
        var observer: NSObjectProtocol?
        observer = NotificationCenter.default.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { _ in
            if let observer { NotificationCenter.default.removeObserver(observer) }
            guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
            ATTrackingManager.requestTrackingAuthorization { _ in }
        }
    }

    /// 웹 화면에서 온 `{"ga":"app_…","meta":"App…"|null,"params":{…}}`를 검사해 보낸다.
    static func log(_ json: String) {
        guard isEnabled, let data = json.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let ga = object["ga"] as? String, matches(ga, "^app_[a-z_]{1,36}$") else { return }
        var params: [String: Any] = [:]
        for (key, value) in object["params"] as? [String: Any] ?? [:] where matches(key, "^[a-z_]{1,40}$") {
            if let text = value as? String, matches(text, "^[A-Za-z0-9_-]{1,40}$") { params[key] = text }
            else if let number = value as? NSNumber { params[key] = number }
        }
        if firebase { Analytics.logEvent(ga, parameters: params) }
        if meta, let name = object["meta"] as? String, matches(name, "^App[A-Za-z]{1,36}$") {
            var metaParams: [AppEvents.ParameterName: Any] = [:]
            for (key, value) in params { metaParams[AppEvents.ParameterName(key)] = value }
            AppEvents.shared.logEvent(AppEvents.Name(name), parameters: metaParams)
        }
    }

    private static func matches(_ text: String, _ pattern: String) -> Bool {
        text.range(of: pattern, options: .regularExpression) != nil
    }
}

final class HatcheatAppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        HatcheatAnalytics.start(application, launchOptions: launchOptions)
        return true
    }
}

import UIKit
import WebKit
import AVFAudio

final class HatcheatViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private(set) var webView: WKWebView!
    private let progress: ProgressStore
    let soundEffects = HatcheatSoundEffects()
    private let cover = UIView()
    private var mustClear = false
    private let paper = UIColor(red: 244/255, green: 243/255, blue: 240/255, alpha: 1)

    init(progress: ProgressStore = ProgressStore()) {
        self.progress = progress
        super.init(nibName: nil, bundle: nil)
    }
    required init?(coder: NSCoder) { fatalError("Use init(progress:)") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = paper
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.userContentController.add(WeakMessageHandler(self), name: "progress")
        config.userContentController.add(WeakMessageHandler(self), name: "feedback")
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = paper
        webView.scrollView.backgroundColor = paper
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        webView.isInspectable = true
        #endif
        view.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        cover.backgroundColor = paper
        cover.isHidden = true
        cover.isAccessibilityElement = true
        cover.accessibilityLabel = "해칫"
        view.addSubview(cover)
        let label = UILabel()
        label.text = "해칫"
        label.textColor = UIColor(red: 42/255, green: 96/255, blue: 144/255, alpha: 1)
        label.font = .systemFont(ofSize: 24, weight: .regular)
        label.translatesAutoresizingMaskIntoConstraints = false
        cover.addSubview(label)
        NSLayoutConstraint.activate([label.centerXAnchor.constraint(equalTo: cover.centerXAnchor), label.centerYAnchor.constraint(equalTo: cover.centerYAnchor)])
        NotificationCenter.default.addObserver(self, selector: #selector(protectContent), name: UIApplication.willResignActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(restoreContent), name: UIApplication.didBecomeActiveNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(audioInterrupted), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(audioRouteChanged), name: AVAudioSession.routeChangeNotification, object: nil)
        loadApp()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        cover.frame = view.bounds
    }

    private func loadApp() {
        let source = """
        (() => {
          let value = JSON.stringify(\(progress.json));
          window.hatcheatNativeStorage = {
            getItem(key) { return key === 'hatcheat.progress.v1' ? value : null; },
            setItem(key, next) {
              if (key !== 'hatcheat.progress.v1') throw new Error('Unsupported storage key');
              window.webkit.messageHandlers.progress.postMessage(next);
              value = next;
            }
          };
          window.hatcheatNativeFeedback = {
            prepare() { window.webkit.messageHandlers.feedback.postMessage('prepare'); },
            play(cue) { window.webkit.messageHandlers.feedback.postMessage(cue); },
            startGrinding() { window.webkit.messageHandlers.feedback.postMessage('grind-start'); },
            stopGrinding() { window.webkit.messageHandlers.feedback.postMessage('grind-stop'); },
            stop() { window.webkit.messageHandlers.feedback.postMessage('stop'); },
            suspend() { window.webkit.messageHandlers.feedback.postMessage('suspend'); }
          };
        })();
        """
        webView.configuration.userContentController.removeAllUserScripts()
        webView.configuration.userContentController.addUserScript(WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web")!
        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    @objc func protectContent() {
        soundEffects.stop(suspend: true)
        mustClear = true
        cover.isHidden = false
        webView.accessibilityElementsHidden = true
        view.endEditing(true)
        webView.evaluateJavaScript("window.dispatchEvent(new Event('hatcheat:background'))", completionHandler: nil)
    }

    @objc func restoreContent() {
        guard mustClear else { return }
        webView.evaluateJavaScript("window.dispatchEvent(new Event('hatcheat:background'))") { [weak self] _, error in
            guard let self, UIApplication.shared.applicationState == .active else { return }
            if error != nil { self.loadApp(); return }
            self.mustClear = false
            self.cover.isHidden = true
            self.webView.accessibilityElementsHidden = false
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if mustClear { restoreContent() }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        soundEffects.stop(suspend: true)
        loadApp()
    }

    @objc private func audioInterrupted() {
        soundEffects.stop(suspend: true)
        webView.evaluateJavaScript("window.dispatchEvent(new Event('hatcheat:audio-interrupted'))", completionHandler: nil)
    }

    @objc private func audioRouteChanged(_ notification: Notification) {
        guard let reason = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
              reason == AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue else { return }
        audioInterrupted()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true,
              let payload = message.body as? String else { return }
        if message.name == "feedback" {
            switch payload {
            case "stop": soundEffects.stop()
            case "suspend": soundEffects.stop(suspend: true)
            case "prepare": if progress.soundEnabled { soundEffects.prepare() }
            case "grind-start": if progress.soundEnabled { soundEffects.startGrinding() }
            case "grind-stop": soundEffects.stopGrinding()
            default: if progress.soundEnabled { soundEffects.play(payload) }
            }
            return
        }
        guard message.name == "progress" else { return }
        if !progress.save(payload) {
            webView.evaluateJavaScript("document.getElementById('storage-notice').textContent='진행을 저장하지 못했어요.';document.getElementById('storage-notice').hidden=false", completionHandler: nil)
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let directory = Bundle.main.resourceURL!.appendingPathComponent("Web").standardizedFileURL.path + "/"
        if url.isFileURL && url.standardizedFileURL.path.hasPrefix(directory) {
            if navigationAction.navigationType == .linkActivated && url.fragment == nil {
                decisionHandler(.cancel)
                loadApp()
            } else { decisionHandler(.allow) }
        } else {
            decisionHandler(.cancel)
            if navigationAction.navigationType == .linkActivated, url.scheme == "https" {
                UIApplication.shared.open(url)
            }
        }
    }

    deinit { NotificationCenter.default.removeObserver(self) }
}

// Uses the same original PCM assets as the web app. Only known effect names are accepted.
final class HatcheatSoundEffects {
    static let cues: Set<String> = ["paper-fold", "paper-glide", "haechi-bite", "settle", "ink-grind", "page-open", "card-reveal"]
    private var players: [String: AVAudioPlayer] = [:]
    private(set) var isPrepared = false
    var playingCues: Set<String> { Set(players.filter { $0.value.isPlaying }.keys) }

    func prepare() {
        guard UIApplication.shared.applicationState == .active else { return }
        if isPrepared { return }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.ambient, mode: .default)
            try session.setActive(true)
            isPrepared = true
            if let url = Bundle.main.url(forResource: "ink-grind", withExtension: "wav", subdirectory: "Web/assets/audio") {
                let player = try AVAudioPlayer(contentsOf: url)
                player.numberOfLoops = -1
                player.prepareToPlay()
                players["ink-grind"] = player
            }
        } catch { isPrepared = false }
    }

    func startGrinding() {
        guard isPrepared, UIApplication.shared.applicationState == .active,
              let player = players["ink-grind"], !player.isPlaying else { return }
        player.currentTime = 0
        player.play()
    }

    func stopGrinding() {
        players["ink-grind"]?.stop()
        players["ink-grind"]?.currentTime = 0
    }

    func play(_ cue: String) {
        guard isPrepared, UIApplication.shared.applicationState == .active,
              Self.cues.contains(cue), cue != "ink-grind" else { return }
        do {
            if players[cue] == nil {
                guard let url = Bundle.main.url(forResource: cue, withExtension: "wav", subdirectory: "Web/assets/audio") else { return }
                players[cue] = try AVAudioPlayer(contentsOf: url)
            }
            // Repeated taps restart a cue; they never accumulate a loud stack.
            if playingCues.count >= 3 { players.values.forEach { $0.stop() } }
            let player = players[cue]!
            player.stop()
            player.currentTime = 0
            player.play()
        } catch { /* Sound failure never interrupts the writing ritual. */ }
    }

    func stop(suspend: Bool = false) {
        players.values.forEach { $0.stop() }
        if suspend && isPrepared {
            isPrepared = false
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        }
    }
}

private final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}

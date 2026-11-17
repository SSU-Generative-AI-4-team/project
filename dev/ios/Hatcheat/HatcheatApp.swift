import SwiftUI

@main
struct HatcheatApp: App {
    @UIApplicationDelegateAdaptor(HatcheatAppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            HatcheatScreen()
                .ignoresSafeArea()
                .preferredColorScheme(.light)
        }
    }
}

private struct HatcheatScreen: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> HatcheatViewController { HatcheatViewController() }
    func updateUIViewController(_ controller: HatcheatViewController, context: Context) {}
}

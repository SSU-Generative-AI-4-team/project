import SwiftUI

@main
struct HatcheatApp: App {
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

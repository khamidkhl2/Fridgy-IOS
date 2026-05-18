import SwiftUI

@main
struct FridgyApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if !appState.isAuthenticated {
                AuthView()
            } else if !appState.hasCompletedOnboarding {
                OnboardingView()
            } else {
                MainTabView()
            }
        }
        .onOpenURL { url in
            appState.handleOpenURL(url)
        }
        .preferredColorScheme(appState.appearance.themeMode.colorScheme)
        .dynamicTypeSize(appState.appearance.textSize.dynamicTypeSize)
        .font(
            appState.appearance.fontStyle.font(
                size: 17 * appState.appearance.textSize.previewScale,
                boldText: appState.appearance.boldText
            )
        )
        .tint(appState.appearance.accentColor.color)
    }
}

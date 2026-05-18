import SwiftUI
import UIKit

enum FridgyTheme {
    static let ink = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.05, green: 0.055, blue: 0.045, alpha: 1)
            : UIColor(red: 0.98, green: 0.972, blue: 0.94, alpha: 1)
    })
    static let espresso = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.12, green: 0.095, blue: 0.075, alpha: 1)
            : UIColor(red: 0.935, green: 0.915, blue: 0.865, alpha: 1)
    })
    static let garden = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.08, green: 0.12, blue: 0.08, alpha: 1)
            : UIColor(red: 0.90, green: 0.94, blue: 0.88, alpha: 1)
    })
    static let porcelain = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.965, green: 0.945, blue: 0.895, alpha: 1)
            : UIColor(red: 0.12, green: 0.115, blue: 0.095, alpha: 1)
    })
    static let porcelainMuted = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.78, green: 0.75, blue: 0.68, alpha: 1)
            : UIColor(red: 0.48, green: 0.465, blue: 0.42, alpha: 1)
    })
    static let herb = Color(red: 0.25, green: 0.65, blue: 0.35)
    static let brass = Color(red: 0.90, green: 0.64, blue: 0.28)
    static let berry = Color(red: 0.70, green: 0.22, blue: 0.30)
    static let glass = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor.white.withAlphaComponent(0.075)
            : UIColor.white.withAlphaComponent(0.72)
    })
    static let border = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor.white.withAlphaComponent(0.14)
            : UIColor.black.withAlphaComponent(0.065)
    })
    static let iconSurface = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.965, green: 0.945, blue: 0.895, alpha: 1)
            : UIColor.white.withAlphaComponent(0.76)
    })
    static let iconForeground = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.05, green: 0.055, blue: 0.045, alpha: 1)
            : UIColor(red: 0.22, green: 0.205, blue: 0.17, alpha: 1)
    })
    static let gentleShadow = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor.black.withAlphaComponent(0.28)
            : UIColor.black.withAlphaComponent(0.10)
    })

    static var background: LinearGradient {
        LinearGradient(
            colors: [ink, espresso, garden],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

extension AppThemeMode {
    var title: String {
        switch self {
        case .system: "System"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    var detail: String {
        switch self {
        case .system: "Follow iPhone"
        case .light: "Bright kitchen"
        case .dark: "Evening kitchen"
        }
    }

    var symbolName: String {
        switch self {
        case .system: "iphone"
        case .light: "sun.max.fill"
        case .dark: "moon.fill"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}

extension AppAccentColor {
    var title: String {
        switch self {
        case .forest: "Forest"
        case .ocean: "Ocean"
        case .lavender: "Lavender"
        case .amber: "Amber"
        case .rose: "Rose"
        case .teal: "Teal"
        }
    }

    var color: Color {
        switch self {
        case .forest: Color(red: 0.28, green: 0.64, blue: 0.38)
        case .ocean: Color(red: 0.24, green: 0.53, blue: 0.82)
        case .lavender: Color(red: 0.56, green: 0.36, blue: 0.74)
        case .amber: FridgyTheme.brass
        case .rose: Color(red: 0.72, green: 0.34, blue: 0.48)
        case .teal: Color(red: 0.20, green: 0.61, blue: 0.63)
        }
    }
}

extension AppFontStyle {
    var title: String {
        switch self {
        case .classic: "Classic"
        case .rounded: "Rounded"
        case .elegant: "Elegant"
        case .mono: "Mono"
        }
    }

    var detail: String {
        switch self {
        case .classic: "Familiar and clear"
        case .rounded: "Friendly and soft"
        case .elegant: "Refined and graceful"
        case .mono: "Sharp and technical"
        }
    }

    func font(size: CGFloat, weight: Font.Weight = .regular, boldText: Bool = false) -> Font {
        let resolvedWeight: Font.Weight = boldText && weight == .regular ? .semibold : weight
        switch self {
        case .classic:
            return .system(size: size, weight: resolvedWeight)
        case .rounded:
            return .system(size: size, weight: resolvedWeight, design: .rounded)
        case .elegant:
            return .system(size: size, weight: resolvedWeight, design: .serif)
        case .mono:
            return .system(size: size, weight: resolvedWeight, design: .monospaced)
        }
    }
}

extension AppTextSize {
    var title: String {
        switch self {
        case .compact: "Compact"
        case .standard: "Standard"
        case .generous: "Generous"
        }
    }

    var detail: String {
        switch self {
        case .compact: "Slightly smaller"
        case .standard: "Default"
        case .generous: "Slightly larger"
        }
    }

    var dynamicTypeSize: DynamicTypeSize {
        switch self {
        case .compact: .small
        case .standard: .large
        case .generous: .xLarge
        }
    }

    var previewScale: CGFloat {
        switch self {
        case .compact: 0.94
        case .standard: 1
        case .generous: 1.08
        }
    }
}

extension View {
    func premiumCard(padding: CGFloat = 16) -> some View {
        modifier(PremiumCardModifier(padding: padding))
    }

    func fridgyFont(size: CGFloat, weight: Font.Weight = .regular) -> some View {
        modifier(FridgyFontModifier(size: size, weight: weight))
    }

    func fridgyIcon(size: CGFloat, weight: Font.Weight = .regular) -> some View {
        modifier(FridgyIconFontModifier(size: size, weight: weight))
    }
}

private struct FridgyFontModifier: ViewModifier {
    @EnvironmentObject private var appState: AppState
    var size: CGFloat
    var weight: Font.Weight

    func body(content: Content) -> some View {
        content.font(
            appState.appearance.fontStyle.font(
                size: size * appState.appearance.textSize.previewScale,
                weight: weight,
                boldText: appState.appearance.boldText
            )
        )
    }
}

private struct FridgyIconFontModifier: ViewModifier {
    @EnvironmentObject private var appState: AppState
    var size: CGFloat
    var weight: Font.Weight

    func body(content: Content) -> some View {
        content.font(.system(size: size * appState.appearance.textSize.previewScale, weight: weight))
    }
}

struct PremiumCardModifier: ViewModifier {
    var padding: CGFloat

    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(padding)
            .background(.ultraThinMaterial.opacity(0.72))
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .shadow(color: FridgyTheme.gentleShadow, radius: 18, x: 0, y: 12)
    }
}

struct ScreenBackground<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        ZStack {
            FridgyTheme.background
                .ignoresSafeArea()
            content
        }
    }
}

struct PrimaryActionButton: View {
    var title: String
    var systemImage: String
    var isLoading: Bool = false
    var isDisabled: Bool = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if isLoading {
                    ProgressView()
                        .tint(FridgyTheme.ink)
                } else {
                    Image(systemName: systemImage)
                        .fridgyIcon(size: 17, weight: .semibold)
                }
                Text(title)
                    .fridgyFont(size: 17, weight: .semibold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
            }
            .foregroundStyle(FridgyTheme.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(FridgyTheme.porcelain)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isLoading || isDisabled)
        .opacity(isLoading || isDisabled ? 0.58 : 1)
    }
}

struct SecondaryActionButton: View {
    var title: String
    var systemImage: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .fridgyFont(size: 15, weight: .semibold)
                .foregroundStyle(FridgyTheme.porcelain)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(FridgyTheme.glass)
                .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(FridgyTheme.border, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct ChoiceChip: View {
    @EnvironmentObject private var appState: AppState
    var title: String
    var subtitle: String?
    var isSelected: Bool
    var action: () -> Void

    init(_ title: String, subtitle: String? = nil, isSelected: Bool, action: @escaping () -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.isSelected = isSelected
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .fridgyFont(size: 15, weight: .semibold)
                    .foregroundStyle(isSelected ? FridgyTheme.ink : FridgyTheme.porcelain)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                if let subtitle {
                    Text(subtitle)
                        .fridgyFont(size: 12)
                        .foregroundStyle(isSelected ? FridgyTheme.ink.opacity(0.72) : FridgyTheme.porcelainMuted)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 12)
            .padding(.horizontal, 12)
            .background(isSelected ? FridgyTheme.porcelain : FridgyTheme.glass)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(isSelected ? appState.appearance.accentColor.color : FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct MacroBadge: View {
    var title: String
    var value: String
    var tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .fridgyFont(size: 11, weight: .bold)
                .foregroundStyle(FridgyTheme.porcelainMuted)
            Text(value)
                .fridgyFont(size: 17, weight: .bold)
                .foregroundStyle(FridgyTheme.porcelain)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(tint.opacity(0.18))
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(tint.opacity(0.55), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct SectionHeader: View {
    var title: String
    var subtitle: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .fridgyFont(size: 20, weight: .bold)
                .foregroundStyle(FridgyTheme.porcelain)
            if let subtitle {
                Text(subtitle)
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct EmptyStateCard: View {
    @EnvironmentObject private var appState: AppState
    var systemImage: String
    var title: String
    var detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: systemImage)
                .fridgyIcon(size: 30, weight: .bold)
                .foregroundStyle(appState.appearance.accentColor.color)
                .frame(width: 46, height: 46)
                .background(appState.appearance.accentColor.color.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .fridgyFont(size: 17, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text(detail)
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .premiumCard()
    }
}

struct ChefCoachView: View {
    @EnvironmentObject private var appState: AppState
    var message: String
    var detail: String
    @State private var pulse = false

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(appState.appearance.accentColor.color.opacity(pulse ? 0.18 : 0.55), lineWidth: pulse ? 16 : 5)
                    .frame(width: 68, height: 68)
                    .scaleEffect(pulse ? 1.08 : 0.96)
                Circle()
                    .fill(FridgyTheme.iconSurface)
                    .frame(width: 58, height: 58)
                Image(systemName: "person.crop.circle.badge.checkmark")
                    .fridgyIcon(size: 35, weight: .semibold)
                    .foregroundStyle(FridgyTheme.iconForeground, appState.appearance.accentColor.color)
                Image(systemName: "fork.knife")
                    .fridgyIcon(size: 13, weight: .bold)
                    .foregroundStyle(appState.appearance.accentColor.color)
                    .offset(x: 21, y: -21)
            }
            VStack(alignment: .leading, spacing: 5) {
                Text(message)
                    .fridgyFont(size: 17, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                Text(detail)
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .premiumCard()
        .onAppear {
            withAnimation(.easeInOut(duration: 1.55).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

extension Array where Element: Equatable {
    mutating func toggleMembership(_ element: Element) {
        if let index = firstIndex(of: element) {
            remove(at: index)
        } else {
            append(element)
        }
    }
}

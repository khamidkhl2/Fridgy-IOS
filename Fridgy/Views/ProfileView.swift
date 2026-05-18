import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appState: AppState

    private var displayName: String {
        appState.nutritionProfile.displayName.isEmpty ? "Fridgy Member" : appState.nutritionProfile.displayName
    }

    private var email: String {
        appState.currentSession?.email ?? "Signed in"
    }

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("Settings")
                        .fridgyFont(size: 44, weight: .black)
                        .foregroundStyle(FridgyTheme.porcelain)
                        .padding(.top, 20)

                    NavigationLink {
                        ProfileSettingsView()
                    } label: {
                        ProfileHeroCard(name: displayName, email: email)
                    }
                    .buttonStyle(.plain)

                    SettingsGroup(title: "Preferences") {
                        NavigationLink {
                            AppearanceSettingsView()
                        } label: {
                            SettingsNavigationRow(
                                icon: "paintbrush.pointed.fill",
                                title: "Appearance",
                                subtitle: "\(appState.appearance.themeMode.title) theme, \(appState.appearance.accentColor.title) accent"
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    SettingsGroup(title: "Nutrition") {
                        NavigationLink {
                            ProfileSettingsView()
                        } label: {
                            SettingsNavigationRow(
                                icon: "target",
                                title: "Goals & Food Profile",
                                subtitle: "\(appState.nutritionProfile.goal.title) - \(appState.nutritionProfile.dailyTarget.calories) kcal - \(appState.nutritionProfile.selectedFitnessSummary)"
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    SettingsGroup(title: "Info") {
                        NavigationLink {
                            PrivacySettingsView()
                        } label: {
                            SettingsNavigationRow(
                                icon: "lock.shield.fill",
                                title: "Privacy & Confidentiality",
                                subtitle: appState.privacySettings.publicProfile ? "Public profile enabled" : "Private by default"
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    Button {
                        Task { await appState.signOut() }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Sign Out")
                        }
                        .fridgyFont(size: 17, weight: .bold)
                        .foregroundStyle(FridgyTheme.berry)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(FridgyTheme.glass)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .stroke(FridgyTheme.berry.opacity(0.25), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.bottom, 28)
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ProfileHeroCard: View {
    @EnvironmentObject private var appState: AppState
    var name: String
    var email: String

    private var initial: String {
        String(name.trimmingCharacters(in: .whitespacesAndNewlines).prefix(1)).uppercased()
    }

    var body: some View {
        HStack(spacing: 16) {
            Text(initial.isEmpty ? "F" : initial)
                .fridgyFont(size: 30, weight: .black)
                .foregroundStyle(appState.appearance.accentColor.color)
                .frame(width: 70, height: 70)
                .background(appState.appearance.accentColor.color.opacity(0.16))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .fridgyFont(size: 20, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text(email)
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .lineLimit(1)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .fridgyIcon(size: 17, weight: .bold)
                .foregroundStyle(FridgyTheme.porcelainMuted)
        }
        .premiumCard(padding: 14)
    }
}

private struct SettingsGroup<Content: View>: View {
    var title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .fridgyFont(size: 12, weight: .black)
                .foregroundStyle(FridgyTheme.porcelainMuted)
                .padding(.horizontal, 4)

            VStack(spacing: 0) {
                content
            }
            .premiumCard(padding: 0)
        }
    }
}

private struct SettingsNavigationRow: View {
    @EnvironmentObject private var appState: AppState
    var icon: String
    var title: String
    var subtitle: String?

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .fridgyIcon(size: 17, weight: .bold)
                .foregroundStyle(appState.appearance.accentColor.color)
                .frame(width: 34)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .fridgyFont(size: 17, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                if let subtitle {
                    Text(subtitle)
                        .fridgyFont(size: 12)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .fridgyIcon(size: 15, weight: .bold)
                .foregroundStyle(FridgyTheme.porcelainMuted)
        }
        .padding(16)
    }
}

struct ProfileSettingsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var draft = NutritionProfile.default

    private let columns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10)
    ]

    private var targetPreview: MacroTarget {
        NutritionCalculator.target(for: draft)
    }

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    SettingsDetailHeader(title: "Profile", subtitle: "Update your goals without restarting onboarding.")

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Name", subtitle: "Shown in Fridgy and used for a warmer tone.")
                        TextField("Your name", text: $draft.displayName)
                            .settingsTextField()
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Body Metrics", subtitle: "Used for daily calories, macros, and micronutrient targets.")
                        WheelNumberPicker(title: "Age", unit: "years", range: 13...85, selection: $draft.bodyMetrics.age)
                        HeightWheelPicker(metrics: $draft.bodyMetrics)
                        WeightWheelPicker(metrics: $draft.bodyMetrics)
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Primary Goal", subtitle: "Used to rank recipes, portions, calories, and macros.")
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(WellnessGoal.allCases) { goal in
                                ChoiceChip(goal.title, subtitle: goal.detail, isSelected: draft.goal == goal) {
                                    draft.goal = goal
                                }
                            }
                        }
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Eating Style", subtitle: "Pick one or more styles, including religious food filters.")
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(DietaryStyle.allCases) { style in
                                ChoiceChip(style.title, subtitle: style.profileDetail, isSelected: draft.dietaryStyles.contains(style)) {
                                    draft.dietaryStyles.toggleMembership(style)
                                }
                            }
                        }
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Allergies", subtitle: "These stay as hard filters.")
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(Allergy.allCases) { allergy in
                                ChoiceChip(allergy.title, subtitle: allergy.profileDetail, isSelected: draft.allergies.contains(allergy)) {
                                    draft.allergies.toggleMembership(allergy)
                                }
                            }
                        }
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Training Focus", subtitle: "Pick multiple styles and the weekly level they usually create.")
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ACTIVITY LEVEL")
                                .fridgyFont(size: 11, weight: .black)
                                .foregroundStyle(FridgyTheme.brass)

                            LazyVGrid(columns: columns, spacing: 10) {
                                ForEach(TrainingActivityLevel.allCases) { level in
                                    ChoiceChip(level.title, subtitle: level.detail, isSelected: draft.activityLevel == level) {
                                        draft.activityLevel = level
                                    }
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 16) {
                            ForEach(FitnessDirection.sections) { section in
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(section.title.uppercased())
                                        .fridgyFont(size: 11, weight: .black)
                                        .foregroundStyle(FridgyTheme.brass)

                                    LazyVGrid(columns: columns, spacing: 10) {
                                        ForEach(section.directions) { direction in
                                            ChoiceChip(direction.title, subtitle: direction.profileDetail, isSelected: draft.fitnessDirections.contains(direction)) {
                                                draft.toggleFitnessDirection(direction)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .premiumCard()

                    DailyTargetPreviewCard(target: targetPreview)

                    PrimaryActionButton(title: "Save Profile", systemImage: "checkmark") {
                        appState.updateNutritionProfile(draft)
                        dismiss()
                    }
                    .padding(.bottom, 28)
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            draft = appState.nutritionProfile
        }
    }
}

struct AppearanceSettingsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    SettingsDetailHeader(title: "Appearance", subtitle: "Tune Fridgy without losing its kitchen mood.")

                    AppearanceSection(title: "Theme", subtitle: "Choose how bright the app should feel.") {
                        VStack(spacing: 10) {
                            ForEach(AppThemeMode.allCases) { mode in
                                AppearanceOptionRow(
                                    title: mode.title,
                                    subtitle: mode.detail,
                                    icon: mode.symbolName,
                                    isSelected: appState.appearance.themeMode == mode
                                ) {
                                    appState.updateAppearance { $0.themeMode = mode }
                                }
                            }
                        }
                    }

                    AppearanceSection(title: "Accent Color", subtitle: "Keep the base design, change the highlight.") {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(AppAccentColor.allCases) { accent in
                                AccentColorButton(
                                    accent: accent,
                                    isSelected: appState.appearance.accentColor == accent
                                ) {
                                    appState.updateAppearance { $0.accentColor = accent }
                                }
                            }
                        }

                        AppearancePreviewCard()
                    }

                    AppearanceSection(title: "Font Style", subtitle: "Pick a typeface mood for Fridgy surfaces.") {
                        VStack(spacing: 10) {
                            ForEach(AppFontStyle.allCases) { style in
                                AppearanceOptionRow(
                                    title: style.title,
                                    subtitle: style.detail,
                                    icon: "textformat",
                                    previewFontStyle: style,
                                    isSelected: appState.appearance.fontStyle == style
                                ) {
                                    appState.updateAppearance { $0.fontStyle = style }
                                }
                            }

                            Toggle(isOn: Binding(
                                get: { appState.appearance.boldText },
                                set: { value in appState.updateAppearance { $0.boldText = value } }
                            )) {
                                HStack(spacing: 14) {
                                    Text("B")
                                        .fridgyFont(size: 17, weight: .black)
                                        .foregroundStyle(appState.appearance.accentColor.color)
                                        .frame(width: 34)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text("Bold Text")
                                            .fridgyFont(size: 17, weight: .bold)
                                            .foregroundStyle(FridgyTheme.porcelain)
                                        Text("Make interface text heavier.")
                                            .fridgyFont(size: 12)
                                            .foregroundStyle(FridgyTheme.porcelainMuted)
                                    }
                                }
                            }
                            .tint(appState.appearance.accentColor.color)
                            .padding(16)
                            .background(FridgyTheme.glass)
                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        }
                    }

                    AppearanceSection(title: "Text Size", subtitle: "Adjust how large text and icons appear.") {
                        VStack(spacing: 10) {
                            ForEach(AppTextSize.allCases) { size in
                                AppearanceOptionRow(
                                    title: size.title,
                                    subtitle: size.detail,
                                    icon: "textformat.size",
                                    isSelected: appState.appearance.textSize == size
                                ) {
                                    appState.updateAppearance { $0.textSize = size }
                                }
                            }
                        }
                    }
                    .padding(.bottom, 28)
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct PrivacySettingsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    SettingsDetailHeader(
                        title: "Privacy",
                        subtitle: "Choose what can become visible when social food profiles go online."
                    )

                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Profile Visibility", subtitle: "Fridgy stays private unless you decide otherwise.")

                        PrivacyToggleRow(
                            title: "Public Profile",
                            subtitle: "Allow other people to find your profile later.",
                            icon: "person.2.fill",
                            isOn: appState.privacySettings.publicProfile
                        ) { value in
                            appState.updatePrivacySettings { $0.publicProfile = value }
                        }

                        PrivacyToggleRow(
                            title: "Show Nutrition Goals",
                            subtitle: "Let shared profiles include goals and macro targets.",
                            icon: "target",
                            isOn: appState.privacySettings.showNutritionGoals
                        ) { value in
                            appState.updatePrivacySettings { $0.showNutritionGoals = value }
                        }
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Food Sharing", subtitle: "Control future food photos and diary sharing.")

                        PrivacyToggleRow(
                            title: "Share Food Photos",
                            subtitle: "Allow scanned meal and fridge photos on your public profile.",
                            icon: "photo.on.rectangle.angled",
                            isOn: appState.privacySettings.shareFoodPhotos
                        ) { value in
                            appState.updatePrivacySettings { $0.shareFoodPhotos = value }
                        }

                        PrivacyToggleRow(
                            title: "Share Food Diary",
                            subtitle: "Allow meals, recipes, and logged foods to be visible.",
                            icon: "fork.knife.circle.fill",
                            isOn: appState.privacySettings.shareFoodDiary
                        ) { value in
                            appState.updatePrivacySettings { $0.shareFoodDiary = value }
                        }
                    }
                    .premiumCard()
                    .padding(.bottom, 28)
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct PrivacyToggleRow: View {
    @EnvironmentObject private var appState: AppState
    var title: String
    var subtitle: String
    var icon: String
    var isOn: Bool
    var onChange: (Bool) -> Void

    var body: some View {
        Toggle(isOn: Binding(get: { isOn }, set: onChange)) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .fridgyIcon(size: 17, weight: .bold)
                    .foregroundStyle(appState.appearance.accentColor.color)
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .fridgyFont(size: 16, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                    Text(subtitle)
                        .fridgyFont(size: 12)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .tint(appState.appearance.accentColor.color)
        .padding(14)
        .background(FridgyTheme.glass)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

private struct SettingsDetailHeader: View {
    var title: String
    var subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .fridgyFont(size: 38, weight: .black)
                .foregroundStyle(FridgyTheme.porcelain)
            Text(subtitle)
                .fridgyFont(size: 17)
                .foregroundStyle(FridgyTheme.porcelainMuted)
        }
        .padding(.top, 18)
    }
}

private struct AppearanceSection<Content: View>: View {
    var title: String
    var subtitle: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: title, subtitle: subtitle)
            content
        }
        .premiumCard()
    }
}

private struct AppearanceOptionRow: View {
    @EnvironmentObject private var appState: AppState
    var title: String
    var subtitle: String
    var icon: String
    var previewFontStyle: AppFontStyle?
    var isSelected: Bool
    var action: () -> Void

    private func displayFont(size: CGFloat, weight: Font.Weight) -> Font {
        (previewFontStyle ?? appState.appearance.fontStyle).font(
            size: size * appState.appearance.textSize.previewScale,
            weight: weight,
            boldText: appState.appearance.boldText
        )
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: isSelected ? "checkmark.circle.fill" : icon)
                    .fridgyIcon(size: 20, weight: .bold)
                    .foregroundStyle(isSelected ? appState.appearance.accentColor.color : FridgyTheme.porcelainMuted)
                    .frame(width: 34)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(displayFont(size: 17, weight: .bold))
                        .foregroundStyle(FridgyTheme.porcelain)
                    Text(subtitle)
                        .font(displayFont(size: 12, weight: .regular))
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                }

                Spacer()
            }
            .padding(14)
            .background(isSelected ? appState.appearance.accentColor.color.opacity(0.12) : FridgyTheme.glass)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(isSelected ? appState.appearance.accentColor.color.opacity(0.55) : FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct AccentColorButton: View {
    @EnvironmentObject private var appState: AppState
    var accent: AppAccentColor
    var isSelected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(accent.color)
                        .frame(width: 48, height: 48)
                        .shadow(color: accent.color.opacity(0.34), radius: 12, x: 0, y: 8)

                    if isSelected {
                        Image(systemName: "checkmark")
                            .fridgyIcon(size: 17, weight: .black)
                            .foregroundStyle(.white)
                    }
                }

                Text(accent.title)
                    .fridgyFont(size: 12, weight: isSelected ? .bold : .semibold)
                    .foregroundStyle(isSelected ? appState.appearance.accentColor.color : FridgyTheme.porcelainMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isSelected ? accent.color.opacity(0.10) : Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(isSelected ? accent.color.opacity(0.50) : Color.clear, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct AppearancePreviewCard: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Fridge Dinner")
                    .fridgyFont(size: 22, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text("24 min • \(appState.nutritionProfile.goal.title)")
                    .fridgyFont(size: 14, weight: .medium)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }

            Spacer()

            Text("92%")
                .fridgyFont(size: 18, weight: .black)
                .foregroundStyle(FridgyTheme.ink)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(appState.appearance.accentColor.color)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .padding(14)
        .background(FridgyTheme.glass)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

private extension DietaryStyle {
    var profileDetail: String {
        switch self {
        case .omnivore: "Flexible meals"
        case .highProtein: "Protein first"
        case .vegetarian: "No meat"
        case .vegan: "Plant only"
        case .pescatarian: "Fish included"
        case .mediterranean: "Olive oil, plants"
        case .glutenFree: "Avoid gluten"
        case .halal: "Permitted foods"
        case .kosher: "Kosher rules"
        }
    }
}

private extension Allergy {
    var profileDetail: String {
        switch self {
        case .peanuts: "Strict filter"
        case .treeNuts: "Strict filter"
        case .dairy: "Milk products"
        case .eggs: "Egg products"
        case .shellfish: "Crustaceans"
        case .fish: "Fish products"
        case .soy: "Soy products"
        case .wheat: "Wheat products"
        case .sesame: "Seeds and oil"
        case .gluten: "Gluten grains"
        case .lactose: "Milk sugar"
        case .corn: "Corn products"
        case .mustard: "Mustard seeds"
        case .celery: "Celery stalks"
        case .lupin: "Lupin flour"
        case .mollusks: "Clams, mussels"
        case .sulfites: "Preservatives"
        case .coconut: "Coconut products"
        case .strawberries: "Berry filter"
        case .kiwi: "Fruit filter"
        }
    }
}

private extension FitnessDirection {
    var profileDetail: String {
        switch self {
        case .gym: "Strength days"
        case .running: "Run fuel"
        case .crossfit: "High intensity"
        case .yoga: "Light balance"
        case .cycling: "Endurance rides"
        case .homeTraining: "Home workouts"
        case .pilates: "Core control"
        case .zumba: "Dance cardio"
        case .football: "Match fuel"
        case .basketball: "Explosive play"
        case .volleyball: "Power jumps"
        case .tennis: "Court energy"
        case .swimming: "Pool recovery"
        case .boxing: "Combat rounds"
        case .martialArts: "Skill and power"
        case .dance: "Rhythm cardio"
        case .hiking: "Long walks"
        case .none: "No focus"
        }
    }
}

private extension View {
    func settingsTextField() -> some View {
        self
            .fridgyFont(size: 17, weight: .medium)
            .foregroundStyle(FridgyTheme.porcelain)
            .padding(.horizontal, 14)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(FridgyTheme.glass)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

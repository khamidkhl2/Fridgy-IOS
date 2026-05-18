import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var appState: AppState
    @State private var profile = NutritionProfile.default
    @State private var currentStep: OnboardingStep = .profile
    @State private var noKnownAllergies = true

    private let columns = [
        GridItem(.flexible(), spacing: 10),
        GridItem(.flexible(), spacing: 10)
    ]

    private var currentIndex: Int {
        OnboardingStep.allCases.firstIndex(of: currentStep) ?? 0
    }

    private var isLastStep: Bool {
        currentIndex == OnboardingStep.allCases.count - 1
    }

    private var targetPreview: MacroTarget {
        NutritionCalculator.target(for: profile)
    }

    private var canContinue: Bool {
        switch currentStep {
        case .profile:
            !profile.displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        case .age:
            profile.bodyMetrics.age >= 13
                && profile.bodyMetrics.age <= 85
        case .height:
            profile.bodyMetrics.heightCm >= 120
                && profile.bodyMetrics.heightCm <= 230
        case .weight:
            profile.bodyMetrics.weightKg >= 35
                && profile.bodyMetrics.weightKg <= 250
        case .goal:
            true
        case .eatingStyle:
            !profile.dietaryStyles.isEmpty
        case .allergies:
            noKnownAllergies || !profile.allergies.isEmpty
        case .fitness:
            true
        case .summary:
            true
        }
    }

    var body: some View {
        ScreenBackground {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        header
                            .padding(.top, 42)

                        progressDots

                        VStack(alignment: .leading, spacing: 18) {
                            OnboardingPageTitle(step: currentStep)
                            pageContent
                        }
                        .premiumCard(padding: 18)

                        if !canContinue {
                            Text(currentStep.requirement)
                                .fridgyFont(size: 13, weight: .medium)
                                .foregroundStyle(FridgyTheme.brass)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding(22)
                }

                bottomControls
                    .padding(.horizontal, 22)
                    .padding(.top, 12)
                    .padding(.bottom, 20)
                    .background(.ultraThinMaterial.opacity(0.32))
            }
        }
        .onAppear {
            profile = appState.nutritionProfile
            noKnownAllergies = appState.nutritionProfile.allergies.isEmpty
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Set Your Table")
                .fridgyFont(size: 38, weight: .black)
                .foregroundStyle(FridgyTheme.porcelain)
            Text("A few details before the kitchen opens.")
                .fridgyFont(size: 17)
                .foregroundStyle(FridgyTheme.porcelainMuted)
        }
    }

    private var progressDots: some View {
        HStack(spacing: 8) {
            Text("Step \(currentIndex + 1) of \(OnboardingStep.allCases.count)")
                .fridgyFont(size: 12, weight: .bold)
                .foregroundStyle(FridgyTheme.brass)

            Spacer()

            ForEach(OnboardingStep.allCases) { step in
                Capsule()
                    .fill(step.index <= currentIndex ? FridgyTheme.porcelain : FridgyTheme.border)
                    .frame(width: step == currentStep ? 26 : 8, height: 8)
            }
        }
    }

    @ViewBuilder
    private var pageContent: some View {
        switch currentStep {
        case .profile:
            VStack(alignment: .leading, spacing: 12) {
                TextField("Your name", text: $profile.displayName)
                    .textContentType(.name)
                    .premiumField()

                DetailLine(
                    icon: "person.text.rectangle.fill",
                    title: "Personalized tone",
                    detail: "Your profile starts with a simple name, then meals can feel less generic."
                )
            }
        case .age:
            VStack(alignment: .leading, spacing: 14) {
                DetailLine(
                    icon: "calendar",
                    title: "Age baseline",
                    detail: "Age helps estimate your daily energy needs before goals and training are applied."
                )

                WheelNumberPicker(
                    title: "Age",
                    unit: "years",
                    range: 13...85,
                    selection: $profile.bodyMetrics.age
                )
            }
        case .height:
            VStack(alignment: .leading, spacing: 14) {
                DetailLine(
                    icon: "ruler.fill",
                    title: "Height",
                    detail: "Choose the unit that feels natural. Fridgy converts it quietly for nutrition math."
                )

                HeightWheelPicker(metrics: $profile.bodyMetrics)
            }
        case .weight:
            VStack(alignment: .leading, spacing: 14) {
                DetailLine(
                    icon: "scalemass.fill",
                    title: "Weight",
                    detail: "This has the biggest effect on protein and calorie targets, so use your current best estimate."
                )

                WeightWheelPicker(metrics: $profile.bodyMetrics)
            }
        case .goal:
            VStack(alignment: .leading, spacing: 12) {
                DetailLine(
                    icon: "target",
                    title: "Main outcome",
                    detail: "Choose the goal that should guide calories, protein, and portion balance."
                )

                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(WellnessGoal.allCases) { goal in
                        ChoiceChip(goal.title, subtitle: goal.detail, isSelected: profile.goal == goal) {
                            profile.goal = goal
                        }
                    }
                }
            }
        case .eatingStyle:
            VStack(alignment: .leading, spacing: 12) {
                DetailLine(
                    icon: "fork.knife.circle.fill",
                    title: "Food boundaries",
                    detail: "Pick one or more styles so recipe ideas stay inside your normal kitchen."
                )

                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(DietaryStyle.allCases) { style in
                        ChoiceChip(style.title, subtitle: style.onboardingDetail, isSelected: profile.dietaryStyles.contains(style)) {
                            profile.dietaryStyles.toggleMembership(style)
                        }
                    }
                }
            }
        case .allergies:
            VStack(alignment: .leading, spacing: 12) {
                DetailLine(
                    icon: "exclamationmark.shield.fill",
                    title: "Safety filters",
                    detail: "Select allergies that should never appear in a generated recipe."
                )

                ChoiceChip("No Known Allergies", subtitle: "Keep recipes open unless you add a restriction.", isSelected: noKnownAllergies) {
                    noKnownAllergies = true
                    profile.allergies.removeAll()
                }

                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(Allergy.allCases) { allergy in
                        ChoiceChip(allergy.title, isSelected: profile.allergies.contains(allergy)) {
                            if noKnownAllergies {
                                noKnownAllergies = false
                            }
                            profile.allergies.toggleMembership(allergy)
                        }
                    }
                }
            }
        case .fitness:
            VStack(alignment: .leading, spacing: 12) {
                DetailLine(
                    icon: "figure.strengthtraining.traditional",
                    title: "Training rhythm",
                    detail: "Pick every training style that shapes your week, then choose how hard that week usually feels."
                )

                VStack(alignment: .leading, spacing: 8) {
                    Text("ACTIVITY LEVEL")
                        .fridgyFont(size: 11, weight: .black)
                        .foregroundStyle(FridgyTheme.brass)

                    LazyVGrid(columns: columns, spacing: 10) {
                        ForEach(TrainingActivityLevel.allCases) { level in
                            ChoiceChip(level.title, subtitle: level.detail, isSelected: profile.activityLevel == level) {
                                profile.activityLevel = level
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
                                    ChoiceChip(direction.title, subtitle: direction.onboardingDetail, isSelected: profile.fitnessDirections.contains(direction)) {
                                        profile.toggleFitnessDirection(direction)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        case .summary:
            VStack(alignment: .leading, spacing: 14) {
                DetailLine(
                    icon: "chart.pie.fill",
                    title: "Targets calculated",
                    detail: "These numbers use your age, height, weight, goal, activity level, training choices, and food filters."
                )

                DailyTargetPreviewCard(target: targetPreview)
            }
        }
    }

    private var bottomControls: some View {
        HStack(spacing: 10) {
            if currentIndex > 0 {
                Button {
                    withAnimation(.easeInOut(duration: 0.22)) {
                        currentStep = OnboardingStep.allCases[currentIndex - 1]
                    }
                } label: {
                    Image(systemName: "chevron.left")
                        .fridgyIcon(size: 17, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                        .frame(width: 54, height: 54)
                        .background(FridgyTheme.glass)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .stroke(FridgyTheme.border, lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            PrimaryActionButton(
                title: isLastStep ? "Enter Kitchen" : "Continue",
                systemImage: isLastStep ? "arrow.right" : "chevron.right",
                isDisabled: !canContinue
            ) {
                advance()
            }
        }
    }

    private func advance() {
        guard canContinue else { return }

        if isLastStep {
            appState.completeOnboarding(with: profile)
            return
        }

        withAnimation(.easeInOut(duration: 0.22)) {
            currentStep = OnboardingStep.allCases[currentIndex + 1]
        }
    }
}

private enum OnboardingStep: String, CaseIterable, Identifiable {
    case profile
    case age
    case height
    case weight
    case goal
    case eatingStyle
    case allergies
    case fitness
    case summary

    var id: String { rawValue }

    var index: Int {
        Self.allCases.firstIndex(of: self) ?? 0
    }

    var eyebrow: String {
        switch self {
        case .profile: "Profile"
        case .age: "Age"
        case .height: "Height"
        case .weight: "Weight"
        case .goal: "Goal"
        case .eatingStyle: "Eating Style"
        case .allergies: "Allergies"
        case .fitness: "Fitness"
        case .summary: "Targets"
        }
    }

    var title: String {
        switch self {
        case .profile: "What should Fridgy call you?"
        case .age: "How old are you?"
        case .height: "How tall are you?"
        case .weight: "What is your current weight?"
        case .goal: "What are you optimizing for?"
        case .eatingStyle: "How do you usually eat?"
        case .allergies: "What should stay out?"
        case .fitness: "What kind of movement shapes your week?"
        case .summary: "Here is your starting target"
        }
    }

    var subtitle: String {
        switch self {
        case .profile: "Start with the one detail every meal plan should know."
        case .age: "Scroll to choose the number."
        case .height: "Scroll to choose the number and unit."
        case .weight: "Scroll to choose the number and unit."
        case .goal: "Pick the direction that best matches the next few months."
        case .eatingStyle: "Keep this broad. You can combine styles when needed."
        case .allergies: "This is the strictest part of the profile."
        case .fitness: "A light signal is enough. No need to overconfigure."
        case .summary: "Calories and macros are calculated after the full setup."
        }
    }

    var requirement: String {
        switch self {
        case .profile: "Enter your name to continue."
        case .age: "Choose an age from the wheel to continue."
        case .height: "Choose your height to continue."
        case .weight: "Choose your weight to continue."
        case .goal: "Choose one goal to continue."
        case .eatingStyle: "Choose at least one eating style to continue."
        case .allergies: "Choose no known allergies or select at least one allergy."
        case .fitness: "Choose at least one fitness focus to continue."
        case .summary: "Review your calculated target to continue."
        }
    }
}

private struct OnboardingPageTitle: View {
    var step: OnboardingStep

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(step.eyebrow.uppercased())
                .fridgyFont(size: 12, weight: .black)
                .foregroundStyle(FridgyTheme.brass)
            Text(step.title)
                .fridgyFont(size: 22, weight: .black)
                .foregroundStyle(FridgyTheme.porcelain)
                .fixedSize(horizontal: false, vertical: true)
            Text(step.subtitle)
                .fridgyFont(size: 15)
                .foregroundStyle(FridgyTheme.porcelainMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct DetailLine: View {
    var icon: String
    var title: String
    var detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .fridgyIcon(size: 17, weight: .bold)
                .foregroundStyle(FridgyTheme.brass)
                .frame(width: 28, height: 28)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .fridgyFont(size: 15, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text(detail)
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(FridgyTheme.glass)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct WheelNumberPicker: View {
    var title: String
    var unit: String
    var range: ClosedRange<Int>
    @Binding var selection: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title.uppercased())
                    .fridgyFont(size: 11, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                Spacer()
                Text("\(selection) \(unit)")
                    .fridgyFont(size: 13, weight: .bold)
                    .foregroundStyle(FridgyTheme.brass)
            }

            Picker(title, selection: $selection) {
                ForEach(Array(range), id: \.self) { value in
                    Text("\(value)")
                        .fridgyFont(size: 24, weight: .black)
                        .tag(value)
                }
            }
            .pickerStyle(.wheel)
            .frame(maxWidth: .infinity)
            .frame(height: 170)
            .clipped()
            .animation(.easeInOut(duration: 0.18), value: selection)
        }
        .padding(14)
        .background(FridgyTheme.glass)
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(FridgyTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct HeightWheelPicker: View {
    @Binding var metrics: BodyMetrics

    private var cmSelection: Binding<Int> {
        Binding(
            get: { metrics.roundedHeightCm },
            set: { metrics.roundedHeightCm = $0 }
        )
    }

    private var feetSelection: Binding<Int> {
        Binding(
            get: { metrics.heightFeet },
            set: { metrics.setHeight(feet: $0) }
        )
    }

    private var inchesSelection: Binding<Int> {
        Binding(
            get: { metrics.heightInches },
            set: { metrics.setHeight(inches: $0) }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("Height Unit", selection: $metrics.heightUnit) {
                ForEach(HeightUnit.allCases) { unit in
                    Text(unit.title).tag(unit)
                }
            }
            .pickerStyle(.segmented)
            .tint(FridgyTheme.brass)

            if metrics.heightUnit == .cm {
                WheelNumberPicker(title: "Height", unit: "cm", range: 120...230, selection: cmSelection)
            } else {
                HStack(spacing: 10) {
                    WheelNumberPicker(title: "Feet", unit: "ft", range: 3...7, selection: feetSelection)
                    WheelNumberPicker(title: "Inches", unit: "in", range: 0...11, selection: inchesSelection)
                }
            }
        }
    }
}

struct WeightWheelPicker: View {
    @Binding var metrics: BodyMetrics

    private var kgSelection: Binding<Int> {
        Binding(
            get: { metrics.roundedWeightKg },
            set: { metrics.roundedWeightKg = $0 }
        )
    }

    private var lbsSelection: Binding<Int> {
        Binding(
            get: { metrics.roundedWeightLbs },
            set: { metrics.roundedWeightLbs = $0 }
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("Weight Unit", selection: $metrics.weightUnit) {
                ForEach(WeightUnit.allCases) { unit in
                    Text(unit.title).tag(unit)
                }
            }
            .pickerStyle(.segmented)
            .tint(FridgyTheme.brass)

            if metrics.weightUnit == .kg {
                WheelNumberPicker(title: "Weight", unit: "kg", range: 35...250, selection: kgSelection)
            } else {
                WheelNumberPicker(title: "Weight", unit: "lbs", range: 77...550, selection: lbsSelection)
            }
        }
    }
}

struct MetricIntField: View {
    var title: String
    var unit: String
    @Binding var value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .fridgyFont(size: 11, weight: .black)
                .foregroundStyle(FridgyTheme.porcelainMuted)

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                TextField(title, value: $value, format: .number)
                    .keyboardType(.numberPad)
                    .fridgyFont(size: 20, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text(unit)
                    .fridgyFont(size: 12, weight: .bold)
                    .foregroundStyle(FridgyTheme.brass)
            }
        }
        .padding(12)
        .background(FridgyTheme.glass)
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(FridgyTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct MetricDoubleField: View {
    var title: String
    var unit: String
    @Binding var value: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .fridgyFont(size: 11, weight: .black)
                .foregroundStyle(FridgyTheme.porcelainMuted)

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                TextField(title, value: $value, format: .number.precision(.fractionLength(0)))
                    .keyboardType(.decimalPad)
                    .fridgyFont(size: 20, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text(unit)
                    .fridgyFont(size: 12, weight: .bold)
                    .foregroundStyle(FridgyTheme.brass)
            }
        }
        .padding(12)
        .background(FridgyTheme.glass)
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(FridgyTheme.border, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct DailyTargetPreviewCard: View {
    var target: MacroTarget

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Calculated Daily Target", subtitle: "Estimated from body metrics, goal, and training load.")

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                MacroBadge(title: "Calories", value: "\(target.calories)", tint: FridgyTheme.brass)
                MacroBadge(title: "Protein", value: "\(target.protein)g", tint: FridgyTheme.herb)
                MacroBadge(title: "Carbs", value: "\(target.carbs)g", tint: .blue)
                MacroBadge(title: "Fat", value: "\(target.fat)g", tint: FridgyTheme.berry)
            }

            HStack(spacing: 8) {
                TargetMiniPill(title: "Fiber", value: "\(target.fiber)g", tint: .teal)
                TargetMiniPill(title: "Sugar", value: "\(target.sugar)g", tint: FridgyTheme.berry)
                TargetMiniPill(title: "Sodium", value: "\(target.sodium)mg", tint: FridgyTheme.brass)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("MICROS")
                    .fridgyFont(size: 11, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelainMuted)

                ForEach(target.micronutrients.prefix(4)) { nutrient in
                    HStack {
                        Text(nutrient.name)
                            .fridgyFont(size: 13, weight: .semibold)
                            .foregroundStyle(FridgyTheme.porcelain)
                        Spacer()
                        Text(nutrient.formattedAmount)
                            .fridgyFont(size: 13, weight: .bold)
                            .foregroundStyle(FridgyTheme.brass)
                    }
                }
            }
        }
        .padding(14)
        .background(FridgyTheme.glass)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

private struct TargetMiniPill: View {
    var title: String
    var value: String
    var tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title.uppercased())
                .fridgyFont(size: 10, weight: .black)
                .foregroundStyle(FridgyTheme.porcelainMuted)
            Text(value)
                .fridgyFont(size: 12, weight: .bold)
                .foregroundStyle(tint)
                .lineLimit(1)
                .minimumScaleFactor(0.74)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(tint.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

private extension DietaryStyle {
    var onboardingDetail: String {
        switch self {
        case .omnivore: "Flexible meals"
        case .highProtein: "Protein first"
        case .vegetarian: "No meat"
        case .vegan: "Plant only"
        case .pescatarian: "Fish included"
        case .mediterranean: "Olive oil, plants"
        case .glutenFree: "Avoid gluten"
        case .halal: "Halal filter"
        case .kosher: "Kosher filter"
        }
    }
}

private extension FitnessDirection {
    var onboardingDetail: String {
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
    func premiumField() -> some View {
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

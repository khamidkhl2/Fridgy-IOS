import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView {
            NavigationStack {
                KitchenDashboardView()
            }
            .tabItem {
                Label("Kitchen", systemImage: "refrigerator.fill")
            }

            NavigationStack {
                RecipeBookView()
            }
            .tabItem {
                Label("Recipes", systemImage: "book.closed.fill")
            }

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.crop.circle.fill")
            }
        }
        .tint(appState.appearance.accentColor.color)
    }
}

struct KitchenDashboardView: View {
    @EnvironmentObject private var appState: AppState
    @State private var mealEntryRequest: MealEntryRequest?

    private var target: MacroTarget {
        appState.nutritionProfile.dailyTarget
    }

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Kitchen")
                            .fridgyFont(size: 40, weight: .black)
                            .foregroundStyle(FridgyTheme.porcelain)
                        Text("Track today, then cook from what is already in the fridge.")
                            .fridgyFont(size: 17)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }
                    .padding(.top, 18)

                    DailyCaloriesCard(
                        total: appState.dailyNutritionTotal,
                        target: target
                    )

                    MacroProgressGrid(
                        total: appState.dailyNutritionTotal,
                        target: target
                    )

                    PriorityMicrosCard(
                        total: appState.dailyNutritionTotal,
                        target: target,
                        trainingSummary: appState.nutritionProfile.selectedFitnessSummary
                    )

                    NavigationLink {
                        PantryScanView()
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "camera.viewfinder")
                                .fridgyIcon(size: 23, weight: .bold)
                                .foregroundStyle(appState.appearance.accentColor.color)
                                .frame(width: 46, height: 46)
                                .background(appState.appearance.accentColor.color.opacity(0.13))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .stroke(appState.appearance.accentColor.color.opacity(0.22), lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Scan Fridge")
                                    .fridgyFont(size: 17, weight: .bold)
                                    .foregroundStyle(FridgyTheme.porcelain)
                                Text("Recognize food and use it for recipes or meal tracking.")
                                    .fridgyFont(size: 13)
                                    .foregroundStyle(FridgyTheme.porcelainMuted)
                                    .lineLimit(2)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(FridgyTheme.porcelainMuted)
                        }
                        .premiumCard()
                    }
                    .buttonStyle(.plain)

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Today's Meals", subtitle: "Add food to each section and Fridgy will total the day.")
                        ForEach(MealSection.allCases) { meal in
                            MealTrackerCard(
                                meal: meal,
                                entries: appState.foodEntries(for: meal),
                                total: appState.nutritionTotal(for: meal)
                            ) {
                                mealEntryRequest = MealEntryRequest(meal: meal)
                            }
                        }
                    }

                    if !appState.pantryItems.isEmpty || !appState.recipes.isEmpty {
                        VStack(alignment: .leading, spacing: 14) {
                            if !appState.pantryItems.isEmpty {
                                SectionHeader(title: "Current Pantry", subtitle: "\(appState.selectedPantryItems.count) confirmed items")
                                ForEach(appState.pantryItems.prefix(3)) { item in
                                    PantryCompactRow(item: item)
                                }
                            }

                            if !appState.recipes.isEmpty {
                                SectionHeader(title: "Recipe Matches", subtitle: "Generated from confirmed food and your profile.")
                                ForEach(appState.recipes.prefix(2)) { recipe in
                                    NavigationLink {
                                        RecipeDetailView(recipe: recipe)
                                    } label: {
                                        RecipeCompactRow(recipe: recipe)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        .premiumCard()
                    }
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $mealEntryRequest) { request in
            ManualFoodEntrySheet(meal: request.meal)
                .presentationDetents([.medium, .large])
        }
    }
}

private struct MealEntryRequest: Identifiable {
    let id = UUID()
    var meal: MealSection
}

struct DailyCaloriesCard: View {
    @EnvironmentObject private var appState: AppState
    var total: NutritionSummary
    var target: MacroTarget

    private var progress: Double {
        NutritionProgress.fraction(Double(total.calories), target: Double(target.calories))
    }

    private var remainingCalories: Int {
        max(0, target.calories - total.calories)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .center, spacing: 18) {
                ZStack {
                    Circle()
                        .stroke(FridgyTheme.glass, lineWidth: 13)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            appState.appearance.accentColor.color,
                            style: StrokeStyle(lineWidth: 13, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 2) {
                        Text("\(total.calories)")
                            .fridgyFont(size: 27, weight: .black)
                            .foregroundStyle(FridgyTheme.porcelain)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Text("kcal")
                            .fridgyFont(size: 12, weight: .bold)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }
                }
                .frame(width: 118, height: 118)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Daily Calories")
                        .fridgyFont(size: 22, weight: .black)
                        .foregroundStyle(FridgyTheme.porcelain)
                    Text("\(remainingCalories) kcal remaining")
                        .fridgyFont(size: 15, weight: .semibold)
                        .foregroundStyle(appState.appearance.accentColor.color)
                    Text("Target \(target.calories) kcal based on your goal, activity, and training.")
                        .fridgyFont(size: 13)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            HStack(spacing: 10) {
                DailyStatPill(title: "Eaten", value: "\(total.calories)", tint: FridgyTheme.brass)
                DailyStatPill(title: "Target", value: "\(target.calories)", tint: appState.appearance.accentColor.color)
                DailyStatPill(title: "Left", value: "\(remainingCalories)", tint: FridgyTheme.herb)
            }
        }
        .premiumCard()
    }
}

private struct DailyStatPill: View {
    var title: String
    var value: String
    var tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title.uppercased())
                .fridgyFont(size: 10, weight: .bold)
                .foregroundStyle(FridgyTheme.porcelainMuted)
            Text(value)
                .fridgyFont(size: 16, weight: .black)
                .foregroundStyle(FridgyTheme.porcelain)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 10)
        .padding(.horizontal, 11)
        .background(tint.opacity(0.14))
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(tint.opacity(0.36), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct MacroProgressGrid: View {
    var total: NutritionSummary
    var target: MacroTarget

    private var rows: [MacroProgressItem] {
        [
            MacroProgressItem(title: "Protein", value: total.protein, target: Double(target.protein), unit: "g", tint: FridgyTheme.herb),
            MacroProgressItem(title: "Carbs", value: total.carbs, target: Double(target.carbs), unit: "g", tint: .blue),
            MacroProgressItem(title: "Fat", value: total.fat, target: Double(target.fat), unit: "g", tint: FridgyTheme.berry),
            MacroProgressItem(title: "Fiber", value: total.fiber, target: Double(target.fiber), unit: "g", tint: .teal)
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Macros", subtitle: "Protein, carbs, fat, and fiber for the day.")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(rows) { item in
                    MacroProgressTile(item: item)
                }
            }
        }
        .premiumCard()
    }
}

private struct MacroProgressItem: Identifiable {
    var title: String
    var value: Double
    var target: Double
    var unit: String
    var tint: Color

    var id: String { title }
}

private struct MacroProgressTile: View {
    var item: MacroProgressItem

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack {
                Text(item.title)
                    .fridgyFont(size: 13, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Spacer()
                Text("\(NutritionProgress.format(item.value))/\(Int(item.target))\(item.unit)")
                    .fridgyFont(size: 11, weight: .semibold)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(FridgyTheme.glass)
                    Capsule()
                        .fill(item.tint)
                        .frame(width: proxy.size.width * NutritionProgress.fraction(item.value, target: item.target))
                }
            }
            .frame(height: 8)
        }
        .padding(12)
        .background(item.tint.opacity(0.12))
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(item.tint.opacity(0.32), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct PriorityMicrosCard: View {
    var total: NutritionSummary
    var target: MacroTarget
    var trainingSummary: String

    private var micros: [NutrientLine] {
        target.micronutrients
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Training Micros", subtitle: "Prioritized for \(trainingSummary).")

            if micros.isEmpty {
                Text("Micronutrient targets will appear after onboarding.")
                    .fridgyFont(size: 14)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            } else {
                VStack(spacing: 10) {
                    ForEach(micros.prefix(5)) { nutrient in
                        MicroProgressRow(
                            nutrient: nutrient,
                            consumed: total.amount(for: nutrient.name)
                        )
                    }
                }
            }
        }
        .premiumCard()
    }
}

private struct MicroProgressRow: View {
    var nutrient: NutrientLine
    var consumed: Double

    private var progress: Double {
        NutritionProgress.fraction(consumed, target: nutrient.amount)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text(nutrient.name)
                    .fridgyFont(size: 14, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Spacer()
                Text("\(NutritionProgress.format(consumed))/\(NutritionProgress.format(nutrient.amount)) \(nutrient.unit)")
                    .fridgyFont(size: 12, weight: .semibold)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(FridgyTheme.glass)
                    Capsule()
                        .fill(FridgyTheme.brass)
                        .frame(width: proxy.size.width * progress)
                }
            }
            .frame(height: 7)
        }
        .padding(.vertical, 3)
    }
}

struct MealTrackerCard: View {
    @EnvironmentObject private var appState: AppState
    var meal: MealSection
    var entries: [DailyFoodEntry]
    var total: NutritionSummary
    var addAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: meal.symbolName)
                    .fridgyIcon(size: 18, weight: .bold)
                    .foregroundStyle(appState.appearance.accentColor.color)
                    .frame(width: 38, height: 38)
                    .background(appState.appearance.accentColor.color.opacity(0.13))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                VStack(alignment: .leading, spacing: 2) {
                    Text(meal.title)
                        .fridgyFont(size: 17, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                    Text("\(total.calories) kcal • P \(NutritionProgress.format(total.protein))g • C \(NutritionProgress.format(total.carbs))g • F \(NutritionProgress.format(total.fat))g")
                        .fridgyFont(size: 12, weight: .semibold)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                }

                Spacer()

                Button(action: addAction) {
                    Image(systemName: "plus")
                        .fridgyIcon(size: 16, weight: .black)
                        .foregroundStyle(FridgyTheme.ink)
                        .frame(width: 34, height: 34)
                        .background(FridgyTheme.porcelain)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Add food to \(meal.title)")
            }

            if entries.isEmpty {
                Text("No food logged yet.")
                    .fridgyFont(size: 13)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            } else {
                VStack(spacing: 10) {
                    ForEach(entries) { entry in
                        DailyFoodEntryRow(entry: entry)
                    }
                }
            }
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

private struct DailyFoodEntryRow: View {
    @EnvironmentObject private var appState: AppState
    var entry: DailyFoodEntry

    var body: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.name)
                    .fridgyFont(size: 14, weight: .semibold)
                    .foregroundStyle(FridgyTheme.porcelain)
                    .lineLimit(1)
                Text("\(entry.detailLine) • P \(NutritionProgress.format(entry.nutrition.protein))g • C \(NutritionProgress.format(entry.nutrition.carbs))g • F \(NutritionProgress.format(entry.nutrition.fat))g")
                    .fridgyFont(size: 11)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
            Spacer()
            Button {
                appState.removeDailyFoodEntry(entry)
            } label: {
                Image(systemName: "xmark")
                    .fridgyIcon(size: 11, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .frame(width: 28, height: 28)
                    .background(FridgyTheme.glass)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Remove \(entry.name)")
        }
    }
}

private struct PantryCompactRow: View {
    var item: PantryItem

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: item.category.symbolName)
                .foregroundStyle(FridgyTheme.herb)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .foregroundStyle(FridgyTheme.porcelain)
                    .fridgyFont(size: 15, weight: .semibold)
                Text(item.foodDataDetailLabel)
                    .fridgyFont(size: 12)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }
            Spacer()
            Text("\(item.confidencePercent)%")
                .fridgyFont(size: 13, weight: .black)
                .foregroundStyle(FridgyTheme.ink)
                .padding(.horizontal, 9)
                .padding(.vertical, 6)
                .background(FridgyTheme.brass)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}

struct ManualFoodEntrySheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    var meal: MealSection

    @State private var foodName = ""
    @State private var grams = 150
    @State private var calories = 0
    @State private var protein = 0
    @State private var carbs = 0
    @State private var fat = 0
    @State private var isSaving = false
    @State private var isSearchingUSDA = false
    @State private var hasSearchedUSDA = false
    @State private var usdaResults: [FoodNutritionSnapshot] = []
    @State private var selectedUSDAFood: FoodNutritionSnapshot?
    @State private var showFallbackNutrition = false

    private var trimmedName: String {
        foodName.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var hasManualNutrition: Bool {
        calories > 0 || protein > 0 || carbs > 0 || fat > 0
    }

    private var shouldShowWeight: Bool {
        selectedUSDAFood != nil || (showFallbackNutrition && !trimmedName.isEmpty)
    }

    private var canSave: Bool {
        let hasNutritionSource = selectedUSDAFood != nil || (showFallbackNutrition && hasManualNutrition)
        return !trimmedName.isEmpty && grams > 0 && hasNutritionSource && !isSaving
    }

    var body: some View {
        NavigationStack {
            ScreenBackground {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Add \(meal.title)")
                                .fridgyFont(size: 32, weight: .black)
                                .foregroundStyle(FridgyTheme.porcelain)
                            Text("Fridgy will try to match the food with USDA data. Your estimates are used if there is no match.")
                                .fridgyFont(size: 15)
                                .foregroundStyle(FridgyTheme.porcelainMuted)
                        }

                        VStack(alignment: .leading, spacing: 14) {
                            Text("Food")
                                .fridgyFont(size: 13, weight: .bold)
                                .foregroundStyle(FridgyTheme.porcelainMuted)
                            TextField("Chicken breast, rice, yogurt...", text: $foodName)
                                .textInputAutocapitalization(.words)
                                .fridgyFont(size: 17, weight: .semibold)
                                .foregroundStyle(FridgyTheme.porcelain)
                                .padding(14)
                                .background(FridgyTheme.glass)
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                            USDASearchResultsList(
                                isSearching: isSearchingUSDA,
                                hasSearched: hasSearchedUSDA,
                                results: usdaResults,
                                selectedFood: selectedUSDAFood,
                                grams: grams
                            ) { food in
                                selectedUSDAFood = food
                                showFallbackNutrition = false
                            }

                            if shouldShowWeight {
                                ExactWeightField(grams: $grams)
                            }
                        }
                        .premiumCard()

                        if showFallbackNutrition {
                            VStack(alignment: .leading, spacing: 14) {
                                SectionHeader(title: "Custom Nutrition", subtitle: "Use this when the food is not in the search results.")
                                ManualNutritionStepper(title: "Calories", value: $calories, range: 0...2500, step: 25, unit: "kcal", tint: FridgyTheme.brass)
                                ManualNutritionStepper(title: "Protein", value: $protein, range: 0...250, step: 1, unit: "g", tint: FridgyTheme.herb)
                                ManualNutritionStepper(title: "Carbs", value: $carbs, range: 0...350, step: 1, unit: "g", tint: .blue)
                                ManualNutritionStepper(title: "Fat", value: $fat, range: 0...200, step: 1, unit: "g", tint: FridgyTheme.berry)
                            }
                            .premiumCard()
                        } else {
                            Button {
                                selectedUSDAFood = nil
                                showFallbackNutrition = true
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "square.and.pencil")
                                        .fridgyIcon(size: 15, weight: .bold)
                                    Text("Didn't find what you're looking for?")
                                        .fridgyFont(size: 14, weight: .semibold)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .fridgyIcon(size: 12, weight: .bold)
                                }
                                .foregroundStyle(FridgyTheme.porcelain)
                                .padding(.vertical, 13)
                                .padding(.horizontal, 14)
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
                            title: "Add to \(meal.title)",
                            systemImage: "plus",
                            isLoading: isSaving,
                            isDisabled: !canSave
                        ) {
                            saveEntry()
                        }
                    }
                    .padding(22)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .foregroundStyle(FridgyTheme.porcelain)
                }
            }
        }
        .task(id: foodName) {
            await searchUSDAForCurrentFood()
        }
    }

    private func saveEntry() {
        guard canSave else { return }
        isSaving = true
        let fallback = NutritionSummary(
            calories: calories,
            protein: Double(protein),
            carbs: Double(carbs),
            fat: Double(fat),
            fiber: 0,
            sugar: 0,
            sodium: 0,
            micronutrients: []
        )

        Task {
            await appState.addManualFoodEntry(
                name: selectedUSDAFood?.matchedDescription ?? trimmedName,
                meal: meal,
                grams: grams,
                fallbackNutrition: fallback,
                verifiedNutrition: selectedUSDAFood
            )
            isSaving = false
            dismiss()
        }
    }

    private func searchUSDAForCurrentFood() async {
        selectedUSDAFood = nil
        usdaResults = []
        hasSearchedUSDA = false
        if !showFallbackNutrition {
            grams = 150
        }

        let query = trimmedName
        guard query.count >= 2 else {
            isSearchingUSDA = false
            return
        }

        do {
            try await Task.sleep(nanoseconds: 450_000_000)
        } catch {
            return
        }

        guard !Task.isCancelled else { return }
        isSearchingUSDA = true
        let results = await appState.searchFoodNutrition(matching: query)
        guard !Task.isCancelled else { return }
        guard trimmedName == query else {
            isSearchingUSDA = false
            return
        }
        usdaResults = results
        selectedUSDAFood = nil
        hasSearchedUSDA = true
        isSearchingUSDA = false
    }
}

private struct USDASearchResultsList: View {
    var isSearching: Bool
    var hasSearched: Bool
    var results: [FoodNutritionSnapshot]
    var selectedFood: FoodNutritionSnapshot?
    var grams: Int
    var selectFood: (FoodNutritionSnapshot) -> Void

    var body: some View {
        Group {
            if isSearching {
                HStack(spacing: 9) {
                    ProgressView()
                        .scaleEffect(0.78)
                        .tint(FridgyTheme.porcelainMuted)
                    Text("Searching foods...")
                        .fridgyFont(size: 12, weight: .semibold)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                    Spacer()
                }
                .padding(.vertical, 2)
            } else if results.isEmpty {
                if hasSearched {
                    Text("No match found. You can add it manually below.")
                        .fridgyFont(size: 12)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            } else {
                VStack(spacing: 9) {
                    ForEach(results.prefix(5), id: \.fdcId) { food in
                        USDAFoodResultRow(
                            food: food,
                            isSelected: selectedFood?.fdcId == food.fdcId,
                            grams: grams
                        ) {
                            selectFood(food)
                        }
                    }
                }
            }
        }
    }
}

private struct ExactWeightField: View {
    @Binding var grams: Int

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Weight")
                    .fridgyFont(size: 13, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text("Enter exact grams")
                    .fridgyFont(size: 11)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }

            Spacer()

            HStack(spacing: 6) {
                TextField("150", value: $grams, format: .number)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
                    .fridgyFont(size: 17, weight: .black)
                    .foregroundStyle(FridgyTheme.porcelain)
                    .frame(width: 76)
                Text("g")
                    .fridgyFont(size: 14, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
            .background(FridgyTheme.glass)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .onChange(of: grams) { _, newValue in
            grams = min(1500, max(1, newValue))
        }
    }
}
private struct USDAFoodResultRow: View {
    var food: FoodNutritionSnapshot
    var isSelected: Bool
    var grams: Int
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .fridgyIcon(size: 18, weight: .semibold)
                    .foregroundStyle(isSelected ? FridgyTheme.herb : FridgyTheme.porcelainMuted)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 4) {
                    Text(food.matchedDescription)
                        .fridgyFont(size: 13, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                        .lineLimit(2)
                    Text("\(food.dataType) - FDC \(food.fdcId)")
                        .fridgyFont(size: 11, weight: .semibold)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                    Text(food.macroLine(grams: grams))
                        .fridgyFont(size: 11, weight: .semibold)
                        .foregroundStyle(FridgyTheme.brass)
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                }
                Spacer()
            }
            .padding(10)
            .background(isSelected ? FridgyTheme.herb.opacity(0.12) : Color.clear)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(isSelected ? FridgyTheme.herb.opacity(0.45) : FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct ManualNutritionStepper: View {
    var title: String
    @Binding var value: Int
    var range: ClosedRange<Int>
    var step: Int
    var unit: String
    var tint: Color

    var body: some View {
        Stepper(value: $value, in: range, step: step) {
            HStack {
                Text(title)
                    .fridgyFont(size: 15, weight: .semibold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Spacer()
                Text("\(value) \(unit)")
                    .fridgyFont(size: 14, weight: .black)
                    .foregroundStyle(tint)
            }
        }
    }
}

private enum NutritionProgress {
    static func fraction(_ value: Double, target: Double) -> Double {
        guard target > 0 else { return 0 }
        return min(1, max(0, value / target))
    }

    static func format(_ value: Double) -> String {
        if value.rounded() == value {
            return "\(Int(value))"
        }
        return String(format: "%.1f", value)
    }
}

struct RecipeCompactRow: View {
    var recipe: Recipe

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 5) {
                Text(recipe.title)
                    .fridgyFont(size: 15, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                    .lineLimit(1)
                Text("\(recipe.totalMinutes) min • \(recipe.nutrition.calories) kcal • \(Int(recipe.nutrition.protein))g protein")
                    .fridgyFont(size: 12)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }
            Spacer()
            Text("\(recipe.matchScore)%")
                .fridgyFont(size: 12, weight: .black)
                .foregroundStyle(FridgyTheme.ink)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(FridgyTheme.brass)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .padding(.vertical, 8)
    }
}

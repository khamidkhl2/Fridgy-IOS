import SwiftUI

struct RecipeBookView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Recipes")
                            .fridgyFont(size: 40, weight: .black)
                            .foregroundStyle(FridgyTheme.porcelain)
                        Text("Built from your fridge, filtered by your body.")
                            .fridgyFont(size: 17)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }
                    .padding(.top, 18)

                    if appState.recipes.isEmpty {
                        EmptyStateCard(
                            systemImage: "book.closed",
                            title: "No recipes yet",
                            detail: "Generate recipes after a fridge scan and they will appear here."
                        )

                        NavigationLink {
                            PantryScanView()
                        } label: {
                            HStack(spacing: 14) {
                                Image(systemName: "camera.viewfinder")
                                    .fridgyIcon(size: 24, weight: .bold)
                                    .foregroundStyle(appState.appearance.accentColor.color)
                                    .frame(width: 48, height: 48)
                                    .background(appState.appearance.accentColor.color.opacity(0.13))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                            .stroke(appState.appearance.accentColor.color.opacity(0.22), lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                Text("Scan Fridge")
                                    .fridgyFont(size: 17, weight: .bold)
                                    .foregroundStyle(FridgyTheme.porcelain)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .fridgyIcon(size: 15, weight: .bold)
                                    .foregroundStyle(FridgyTheme.porcelainMuted)
                            }
                            .premiumCard(padding: 14)
                        }
                        .buttonStyle(.plain)
                    } else {
                        ForEach(appState.recipes) { recipe in
                            NavigationLink {
                                RecipeDetailView(recipe: recipe)
                            } label: {
                                RecipeCard(recipe: recipe)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(22)
            }
        }
    }
}

struct RecipeCard: View {
    var recipe: Recipe

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(recipe.title)
                        .fridgyFont(size: 20, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(recipe.subtitle)
                        .fridgyFont(size: 15)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                        .lineLimit(2)
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

            HStack(spacing: 8) {
                Label("\(recipe.totalMinutes)m", systemImage: "clock.fill")
                Label(recipe.difficulty, systemImage: "gauge.with.dots.needle.67percent")
                Label("\(recipe.nutrition.calories) kcal", systemImage: "flame.fill")
            }
            .fridgyFont(size: 12, weight: .semibold)
            .foregroundStyle(FridgyTheme.porcelainMuted)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                MacroBadge(title: "Calories", value: "\(recipe.nutrition.calories)", tint: FridgyTheme.brass)
                MacroBadge(title: "Protein", value: "\(Int(recipe.nutrition.protein))g", tint: FridgyTheme.herb)
                MacroBadge(title: "Carbs", value: "\(Int(recipe.nutrition.carbs))g", tint: .blue)
                MacroBadge(title: "Fat", value: "\(Int(recipe.nutrition.fat))g", tint: FridgyTheme.berry)
            }
        }
        .premiumCard()
    }
}

struct RecipeDetailView: View {
    var recipe: Recipe
    @State private var currentStep = 0
    @State private var isCooking = false

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(recipe.title)
                            .fridgyFont(size: 34, weight: .black)
                            .foregroundStyle(FridgyTheme.porcelain)
                            .lineLimit(3)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(recipe.subtitle)
                            .fridgyFont(size: 17)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }

                    ChefCoachView(
                        message: isCooking ? "Step \(currentStep + 1): \(recipe.steps[currentStep].title)" : "Nutrition-first cooking.",
                        detail: isCooking ? recipe.steps[currentStep].coachTip : "I will keep the method practical and the macros visible while you cook."
                    )

                    NutritionPanel(nutrition: recipe.nutrition)

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Ingredients", subtitle: "Fridge items are marked first.")
                        ForEach(recipe.ingredients) { ingredient in
                            HStack {
                                Image(systemName: ingredient.isFromFridge ? "checkmark.seal.fill" : "plus.circle")
                                    .foregroundStyle(ingredient.isFromFridge ? FridgyTheme.herb : FridgyTheme.brass)
                                Text(ingredient.name)
                                    .fridgyFont(size: 15, weight: .semibold)
                                    .foregroundStyle(FridgyTheme.porcelain)
                                Spacer()
                                Text(ingredient.amount)
                                    .fridgyFont(size: 15)
                                    .foregroundStyle(FridgyTheme.porcelainMuted)
                            }
                        }
                    }
                    .premiumCard()

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(title: "Cook Flow", subtitle: "\(recipe.totalMinutes) minutes total")
                        ForEach(Array(recipe.steps.enumerated()), id: \.element.id) { index, step in
                            Button {
                                currentStep = index
                                isCooking = true
                            } label: {
                                CookingStepRow(step: step, index: index, isSelected: currentStep == index && isCooking)
                            }
                            .buttonStyle(.plain)
                        }

                        PrimaryActionButton(
                            title: isCooking && currentStep < recipe.steps.count - 1 ? "Next Step" : "Start Cooking",
                            systemImage: isCooking ? "forward.fill" : "play.fill"
                        ) {
                            if isCooking && currentStep < recipe.steps.count - 1 {
                                currentStep += 1
                            } else {
                                currentStep = 0
                                isCooking = true
                            }
                        }
                    }
                    .premiumCard()
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct NutritionPanel: View {
    var nutrition: NutritionSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Nutrition", subtitle: "Estimated for one final serving.")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                MacroBadge(title: "Calories", value: "\(nutrition.calories)", tint: FridgyTheme.brass)
                MacroBadge(title: "Protein", value: "\(Int(nutrition.protein))g", tint: FridgyTheme.herb)
                MacroBadge(title: "Carbs", value: "\(Int(nutrition.carbs))g", tint: .blue)
                MacroBadge(title: "Fat", value: "\(Int(nutrition.fat))g", tint: FridgyTheme.berry)
            }

            HStack(spacing: 8) {
                NutritionMiniPill(title: "Fiber", value: "\(Int(nutrition.fiber))g", tint: .teal)
                NutritionMiniPill(title: "Sugar", value: "\(Int(nutrition.sugar))g", tint: FridgyTheme.berry)
                NutritionMiniPill(title: "Sodium", value: "\(Int(nutrition.sodium))mg", tint: FridgyTheme.brass)
            }

            Divider()
                .overlay(FridgyTheme.border)

            Text("Micros")
                .fridgyFont(size: 13, weight: .black)
                .foregroundStyle(FridgyTheme.porcelainMuted)

            ForEach(nutrition.micronutrients) { nutrient in
                HStack {
                    Text(nutrient.name)
                        .fridgyFont(size: 15, weight: .semibold)
                        .foregroundStyle(FridgyTheme.porcelain)
                    Spacer()
                    Text(nutrient.formattedAmount)
                        .fridgyFont(size: 15)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                    if let percent = nutrient.dailyValuePercent {
                        Text("\(percent)%")
                            .fridgyFont(size: 12, weight: .bold)
                            .foregroundStyle(FridgyTheme.brass)
                            .frame(width: 44, alignment: .trailing)
                    }
                }
            }
        }
        .premiumCard()
    }
}

private struct NutritionMiniPill: View {
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
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(tint.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct CookingStepRow: View {
    var step: RecipeStep
    var index: Int
    var isSelected: Bool

    private var visualSymbol: String {
        let title = step.title.lowercased()
        if title.contains("season") { return "sparkles" }
        if title.contains("sear") || title.contains("brown") { return "flame.fill" }
        if title.contains("sauce") { return "drop.fill" }
        if title.contains("assemble") || title.contains("plate") { return "fork.knife" }
        if title.contains("rice") || title.contains("toast") { return "frying.pan.fill" }
        if title.contains("green") || title.contains("wilt") { return "leaf.fill" }
        if title.contains("egg") || title.contains("set") { return "circle.circle.fill" }
        return "timer"
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack(alignment: .bottomTrailing) {
                Image(systemName: visualSymbol)
                    .fridgyIcon(size: 20, weight: .bold)
                    .foregroundStyle(isSelected ? FridgyTheme.ink : FridgyTheme.brass)
                    .frame(width: 44, height: 44)
                    .background(isSelected ? FridgyTheme.brass : FridgyTheme.glass)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                Text("\(index + 1)")
                    .fridgyFont(size: 10, weight: .black)
                    .foregroundStyle(FridgyTheme.ink)
                    .frame(width: 18, height: 18)
                    .background(FridgyTheme.porcelain)
                    .clipShape(Circle())
                    .offset(x: 5, y: 5)
            }

            VStack(alignment: .leading, spacing: 5) {
                HStack {
                    Text(step.title)
                        .fridgyFont(size: 15, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                    Spacer()
                    Text("\(step.minutes)m")
                        .fridgyFont(size: 12, weight: .bold)
                        .foregroundStyle(FridgyTheme.brass)
                }
                Text(step.detail)
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 8)
    }
}

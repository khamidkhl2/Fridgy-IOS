import Foundation

enum WellnessGoal: String, CaseIterable, Codable, Identifiable {
    case balanced
    case leanMuscle
    case fatLoss
    case endurance
    case recomposition
    case calorieMaintenance
    case longevity

    var id: String { rawValue }

    var title: String {
        switch self {
        case .balanced: "Balanced"
        case .leanMuscle: "Lean Muscle"
        case .fatLoss: "Fat Loss"
        case .endurance: "Endurance"
        case .recomposition: "Recomposition"
        case .calorieMaintenance: "Calorie Maintenance"
        case .longevity: "Longevity"
        }
    }

    var detail: String {
        switch self {
        case .balanced: "Flexible macros and steady energy."
        case .leanMuscle: "Protein-forward meals after training."
        case .fatLoss: "High-satiety recipes with lighter calories."
        case .endurance: "Carb-aware meals for longer sessions."
        case .recomposition: "Build muscle while staying lean."
        case .calorieMaintenance: "Stable calories without strict cutting."
        case .longevity: "Fiber, micronutrients, and low processing."
        }
    }
}

enum DietaryStyle: String, CaseIterable, Codable, Identifiable {
    case omnivore
    case highProtein
    case vegetarian
    case vegan
    case pescatarian
    case mediterranean
    case glutenFree
    case halal
    case kosher

    var id: String { rawValue }

    var title: String {
        switch self {
        case .omnivore: "Omnivore"
        case .highProtein: "High Protein"
        case .vegetarian: "Vegetarian"
        case .vegan: "Vegan"
        case .pescatarian: "Pescatarian"
        case .mediterranean: "Mediterranean"
        case .glutenFree: "Gluten Free"
        case .halal: "Halal"
        case .kosher: "Kosher"
        }
    }
}

enum Allergy: String, CaseIterable, Codable, Identifiable {
    case peanuts
    case treeNuts
    case dairy
    case eggs
    case shellfish
    case fish
    case soy
    case wheat
    case sesame
    case gluten
    case lactose
    case corn
    case mustard
    case celery
    case lupin
    case mollusks
    case sulfites
    case coconut
    case strawberries
    case kiwi

    var id: String { rawValue }

    var title: String {
        switch self {
        case .peanuts: "Peanuts"
        case .treeNuts: "Tree Nuts"
        case .dairy: "Dairy"
        case .eggs: "Eggs"
        case .shellfish: "Shellfish"
        case .fish: "Fish"
        case .soy: "Soy"
        case .wheat: "Wheat"
        case .sesame: "Sesame"
        case .gluten: "Gluten"
        case .lactose: "Lactose"
        case .corn: "Corn"
        case .mustard: "Mustard"
        case .celery: "Celery"
        case .lupin: "Lupin"
        case .mollusks: "Mollusks"
        case .sulfites: "Sulfites"
        case .coconut: "Coconut"
        case .strawberries: "Strawberries"
        case .kiwi: "Kiwi"
        }
    }
}

enum FitnessDirection: String, CaseIterable, Codable, Identifiable {
    case gym
    case running
    case crossfit
    case yoga
    case cycling
    case homeTraining
    case pilates
    case zumba
    case football
    case basketball
    case volleyball
    case tennis
    case swimming
    case boxing
    case martialArts
    case dance
    case hiking
    case none

    var id: String { rawValue }

    var title: String {
        switch self {
        case .gym: "Gym"
        case .running: "Running"
        case .crossfit: "CrossFit"
        case .yoga: "Yoga"
        case .cycling: "Cycling"
        case .homeTraining: "Home Training"
        case .pilates: "Pilates"
        case .zumba: "Zumba"
        case .football: "Football"
        case .basketball: "Basketball"
        case .volleyball: "Volleyball"
        case .tennis: "Tennis"
        case .swimming: "Swimming"
        case .boxing: "Boxing"
        case .martialArts: "Martial Arts"
        case .dance: "Dance"
        case .hiking: "Hiking"
        case .none: "No Focus"
        }
    }
}

struct FitnessDirectionSection: Identifiable, Equatable {
    var title: String
    var directions: [FitnessDirection]

    var id: String { title }
}

extension FitnessDirection {
    static let sections: [FitnessDirectionSection] = [
        FitnessDirectionSection(
            title: "Strength",
            directions: [.gym, .crossfit, .homeTraining, .boxing, .martialArts]
        ),
        FitnessDirectionSection(
            title: "Cardio",
            directions: [.running, .cycling, .swimming, .hiking]
        ),
        FitnessDirectionSection(
            title: "Sports",
            directions: [.football, .basketball, .volleyball, .tennis]
        ),
        FitnessDirectionSection(
            title: "Mobility",
            directions: [.yoga, .pilates, .zumba, .dance]
        ),
        FitnessDirectionSection(
            title: "Simple",
            directions: [.none]
        )
    ]
}

struct MacroTarget: Codable, Equatable {
    var calories: Int
    var protein: Int
    var carbs: Int
    var fat: Int
    var fiber: Int
    var sugar: Int
    var sodium: Int
    var micronutrients: [NutrientLine]

    static let balanced = MacroTarget(
        calories: 2200,
        protein: 130,
        carbs: 240,
        fat: 75,
        fiber: 31,
        sugar: 55,
        sodium: 2300,
        micronutrients: NutritionCalculator.defaultMicronutrients
    )
}

enum WeightUnit: String, CaseIterable, Codable, Identifiable {
    case kg
    case lbs

    var id: String { rawValue }

    var title: String {
        switch self {
        case .kg: "kg"
        case .lbs: "lbs"
        }
    }
}

enum HeightUnit: String, CaseIterable, Codable, Identifiable {
    case cm
    case ft

    var id: String { rawValue }

    var title: String {
        switch self {
        case .cm: "cm"
        case .ft: "ft"
        }
    }
}

enum TrainingActivityLevel: String, CaseIterable, Codable, Identifiable {
    case light
    case steady
    case intense

    var id: String { rawValue }

    var title: String {
        switch self {
        case .light: "Light"
        case .steady: "Steady"
        case .intense: "Intense"
        }
    }

    var detail: String {
        switch self {
        case .light: "1-2 easy sessions"
        case .steady: "3-4 normal sessions"
        case .intense: "5+ hard sessions"
        }
    }
}

struct BodyMetrics: Codable, Equatable {
    var age: Int
    var heightCm: Double
    var weightKg: Double
    var heightUnit: HeightUnit
    var weightUnit: WeightUnit

    static let `default` = BodyMetrics(
        age: 28,
        heightCm: 175,
        weightKg: 75,
        heightUnit: .cm,
        weightUnit: .kg
    )

    var roundedHeightCm: Int {
        get { Int(heightCm.rounded()) }
        set { heightCm = Double(newValue) }
    }

    var roundedWeightKg: Int {
        get { Int(weightKg.rounded()) }
        set { weightKg = Double(newValue) }
    }

    var roundedWeightLbs: Int {
        get { Int((weightKg * 2.20462).rounded()) }
        set { weightKg = Double(newValue) / 2.20462 }
    }

    var heightFeet: Int {
        Int((heightCm / 2.54) / 12)
    }

    var heightInches: Int {
        let totalInches = Int((heightCm / 2.54).rounded())
        return max(0, totalInches - (heightFeet * 12))
    }

    mutating func setHeight(feet: Int? = nil, inches: Int? = nil) {
        let resolvedFeet = feet ?? heightFeet
        let resolvedInches = inches ?? heightInches
        heightCm = Double((resolvedFeet * 12) + resolvedInches) * 2.54
    }
}

struct NutritionProfile: Codable, Equatable {
    var displayName: String
    var goal: WellnessGoal
    var dietaryStyles: [DietaryStyle]
    var allergies: [Allergy]
    var fitnessDirections: [FitnessDirection]
    var activityLevel: TrainingActivityLevel
    var bodyMetrics: BodyMetrics
    var dailyTarget: MacroTarget

    static let `default` = NutritionProfile(
        displayName: "",
        goal: .balanced,
        dietaryStyles: [.omnivore],
        allergies: [],
        fitnessDirections: [.gym],
        activityLevel: .steady,
        bodyMetrics: .default,
        dailyTarget: .balanced
    )

    var selectedFitnessSummary: String {
        let selected = fitnessDirections.filter { $0 != .none }
        let directions = selected.isEmpty ? [.none] : selected
        return directions.prefix(3).map(\.title).joined(separator: ", ")
    }

    mutating func toggleFitnessDirection(_ direction: FitnessDirection) {
        if direction == .none {
            fitnessDirections = [.none]
            return
        }

        fitnessDirections.removeAll { $0 == .none }
        if fitnessDirections.contains(direction) {
            fitnessDirections.removeAll { $0 == direction }
        } else {
            fitnessDirections.append(direction)
        }

        if fitnessDirections.isEmpty {
            fitnessDirections = [.none]
        }
    }

    mutating func recalculateDailyTarget() {
        dailyTarget = NutritionCalculator.target(for: self)
    }

    func withCalculatedTargets() -> NutritionProfile {
        var copy = self
        copy.recalculateDailyTarget()
        return copy
    }
}

enum NutritionCalculator {
    static let defaultMicronutrients: [NutrientLine] = [
        NutrientLine(name: "Calcium", amount: 1000, unit: "mg", dailyValuePercent: nil),
        NutrientLine(name: "Iron", amount: 18, unit: "mg", dailyValuePercent: nil),
        NutrientLine(name: "Magnesium", amount: 400, unit: "mg", dailyValuePercent: nil),
        NutrientLine(name: "Potassium", amount: 3400, unit: "mg", dailyValuePercent: nil),
        NutrientLine(name: "Zinc", amount: 11, unit: "mg", dailyValuePercent: nil),
        NutrientLine(name: "Vitamin C", amount: 90, unit: "mg", dailyValuePercent: nil),
        NutrientLine(name: "Vitamin D", amount: 20, unit: "mcg", dailyValuePercent: nil),
        NutrientLine(name: "B12", amount: 2.4, unit: "mcg", dailyValuePercent: nil),
        NutrientLine(name: "Folate", amount: 400, unit: "mcg", dailyValuePercent: nil)
    ]

    static func target(for profile: NutritionProfile) -> MacroTarget {
        let metrics = profile.bodyMetrics
        let age = Double(min(85, max(13, metrics.age)))
        let height = min(230, max(120, metrics.heightCm))
        let weight = min(250, max(35, metrics.weightKg))

        let neutralBMR = (10 * weight) + (6.25 * height) - (5 * age) - 78
        let trainingCount = profile.fitnessDirections.filter { $0 != .none }.count
        let activityMultiplier = multiplier(for: profile.activityLevel) + min(Double(trainingCount) * 0.025, 0.10)
        let goalAdjustedCalories = neutralBMR * activityMultiplier * goalMultiplier(for: profile.goal)
        let calories = roundToNearest25(goalAdjustedCalories)

        let protein = Int((weight * proteinPerKg(for: profile.goal, activityLevel: profile.activityLevel)).rounded())
        let fat = Int(((Double(calories) * fatShare(for: profile.goal)) / 9).rounded())
        let carbs = max(80, Int(((Double(calories) - Double((protein * 4) + (fat * 9))) / 4).rounded()))
        let fiber = max(22, Int((Double(calories) / 1000 * 14).rounded()))
        let sugar = Int((Double(calories) * 0.10 / 4).rounded())

        return MacroTarget(
            calories: calories,
            protein: protein,
            carbs: carbs,
            fat: fat,
            fiber: fiber,
            sugar: sugar,
            sodium: 2300,
            micronutrients: priorityMicronutrients(for: profile)
        )
    }

    static func priorityMicronutrients(for profile: NutritionProfile) -> [NutrientLine] {
        let directions = Set(profile.fitnessDirections.filter { $0 != .none })
        var orderedNames = ["Magnesium", "Potassium", "Iron", "Calcium", "Vitamin D"]

        let strengthDirections: Set<FitnessDirection> = [.gym, .crossfit, .homeTraining, .boxing, .martialArts]
        let enduranceDirections: Set<FitnessDirection> = [.running, .cycling, .swimming, .hiking]
        let sportDirections: Set<FitnessDirection> = [.football, .basketball, .volleyball, .tennis]
        let mobilityDirections: Set<FitnessDirection> = [.yoga, .pilates, .zumba, .dance]

        if !directions.isDisjoint(with: strengthDirections) {
            orderedNames.insert(contentsOf: ["Zinc", "B12"], at: 0)
        }
        if !directions.isDisjoint(with: enduranceDirections) {
            orderedNames.insert(contentsOf: ["Sodium", "Vitamin C"], at: 0)
        }
        if !directions.isDisjoint(with: sportDirections) {
            orderedNames.insert(contentsOf: ["Sodium", "Magnesium", "Potassium"], at: 0)
        }
        if !directions.isDisjoint(with: mobilityDirections) {
            orderedNames.insert(contentsOf: ["Calcium", "Folate"], at: 0)
        }
        if profile.goal == .longevity {
            orderedNames.insert(contentsOf: ["Vitamin C", "Folate"], at: 0)
        }

        var seenNames: Set<String> = []
        return orderedNames.compactMap { name in
            guard !seenNames.contains(name) else { return nil }
            seenNames.insert(name)
            return micronutrientTarget(named: name)
        }
        .prefix(6)
        .map { $0 }
    }

    private static func micronutrientTarget(named name: String) -> NutrientLine? {
        switch name {
        case "Calcium": NutrientLine(name: "Calcium", amount: 1000, unit: "mg", dailyValuePercent: nil)
        case "Iron": NutrientLine(name: "Iron", amount: 18, unit: "mg", dailyValuePercent: nil)
        case "Magnesium": NutrientLine(name: "Magnesium", amount: 400, unit: "mg", dailyValuePercent: nil)
        case "Potassium": NutrientLine(name: "Potassium", amount: 3400, unit: "mg", dailyValuePercent: nil)
        case "Zinc": NutrientLine(name: "Zinc", amount: 11, unit: "mg", dailyValuePercent: nil)
        case "Vitamin C": NutrientLine(name: "Vitamin C", amount: 90, unit: "mg", dailyValuePercent: nil)
        case "Vitamin D": NutrientLine(name: "Vitamin D", amount: 20, unit: "mcg", dailyValuePercent: nil)
        case "B12": NutrientLine(name: "B12", amount: 2.4, unit: "mcg", dailyValuePercent: nil)
        case "Folate": NutrientLine(name: "Folate", amount: 400, unit: "mcg", dailyValuePercent: nil)
        case "Sodium": NutrientLine(name: "Sodium", amount: 2300, unit: "mg", dailyValuePercent: nil)
        default: nil
        }
    }

    private static func multiplier(for activityLevel: TrainingActivityLevel) -> Double {
        switch activityLevel {
        case .light: 1.35
        case .steady: 1.55
        case .intense: 1.75
        }
    }

    private static func goalMultiplier(for goal: WellnessGoal) -> Double {
        switch goal {
        case .balanced: 1
        case .leanMuscle: 1.10
        case .fatLoss: 0.85
        case .endurance: 1.08
        case .recomposition: 0.97
        case .calorieMaintenance: 1
        case .longevity: 0.96
        }
    }

    private static func proteinPerKg(for goal: WellnessGoal, activityLevel: TrainingActivityLevel) -> Double {
        let base: Double
        switch goal {
        case .leanMuscle: base = 2.2
        case .fatLoss, .recomposition: base = 2.0
        case .endurance: base = 1.7
        case .balanced, .calorieMaintenance: base = 1.6
        case .longevity: base = 1.45
        }

        return activityLevel == .intense ? base + 0.1 : base
    }

    private static func fatShare(for goal: WellnessGoal) -> Double {
        switch goal {
        case .fatLoss: 0.28
        case .endurance: 0.22
        case .leanMuscle, .recomposition: 0.25
        case .balanced, .calorieMaintenance, .longevity: 0.27
        }
    }

    private static func roundToNearest25(_ value: Double) -> Int {
        Int((value / 25).rounded() * 25)
    }
}

enum AppThemeMode: String, CaseIterable, Codable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }
}

enum AppAccentColor: String, CaseIterable, Codable, Identifiable {
    case forest
    case ocean
    case lavender
    case amber
    case rose
    case teal

    var id: String { rawValue }
}

enum AppFontStyle: String, CaseIterable, Codable, Identifiable {
    case classic
    case rounded
    case elegant
    case mono

    var id: String { rawValue }
}

enum AppTextSize: String, CaseIterable, Codable, Identifiable {
    case compact
    case standard
    case generous

    var id: String { rawValue }
}

struct AppAppearance: Codable, Equatable {
    var themeMode: AppThemeMode
    var accentColor: AppAccentColor
    var fontStyle: AppFontStyle
    var boldText: Bool
    var textSize: AppTextSize

    static let `default` = AppAppearance(
        themeMode: .dark,
        accentColor: .amber,
        fontStyle: .classic,
        boldText: false,
        textSize: .standard
    )
}

struct AppPrivacySettings: Codable, Equatable {
    var publicProfile: Bool
    var shareFoodPhotos: Bool
    var shareFoodDiary: Bool
    var showNutritionGoals: Bool

    static let `default` = AppPrivacySettings(
        publicProfile: false,
        shareFoodPhotos: false,
        shareFoodDiary: false,
        showNutritionGoals: false
    )
}

enum FoodCategory: String, CaseIterable, Codable, Identifiable {
    case protein
    case produce
    case dairy
    case grains
    case pantry
    case frozen
    case drink
    case unknown

    var id: String { rawValue }

    var title: String {
        switch self {
        case .protein: "Protein"
        case .produce: "Produce"
        case .dairy: "Dairy"
        case .grains: "Grains"
        case .pantry: "Pantry"
        case .frozen: "Frozen"
        case .drink: "Drink"
        case .unknown: "Unknown"
        }
    }

    var symbolName: String {
        switch self {
        case .protein: "flame.fill"
        case .produce: "leaf.fill"
        case .dairy: "drop.fill"
        case .grains: "circle.grid.2x2.fill"
        case .pantry: "cabinet.fill"
        case .frozen: "snowflake"
        case .drink: "cup.and.saucer.fill"
        case .unknown: "questionmark.circle.fill"
        }
    }
}

enum MealSection: String, CaseIterable, Codable, Identifiable {
    case breakfast
    case lunch
    case dinner
    case snack

    var id: String { rawValue }

    var title: String {
        switch self {
        case .breakfast: "Breakfast"
        case .lunch: "Lunch"
        case .dinner: "Dinner"
        case .snack: "Snack"
        }
    }

    var subtitle: String {
        switch self {
        case .breakfast: "Start clean"
        case .lunch: "Midday fuel"
        case .dinner: "Recovery plate"
        case .snack: "Small add-ons"
        }
    }

    var symbolName: String {
        switch self {
        case .breakfast: "sunrise.fill"
        case .lunch: "fork.knife"
        case .dinner: "moon.stars.fill"
        case .snack: "takeoutbag.and.cup.and.straw.fill"
        }
    }
}

struct PantryItem: Identifiable, Codable, Equatable {
    var id = UUID()
    var name: String
    var category: FoodCategory
    var quantity: Double
    var unit: String
    var confidence: Double
    var isSelected: Bool
    var notes: String
    var verifiedNutrition: FoodNutritionSnapshot?

    var displayQuantity: String {
        if quantity.rounded() == quantity {
            return "\(Int(quantity)) \(unit)"
        }
        return String(format: "%.1f %@", quantity, unit)
    }

    var estimatedGrams: Int {
        if unit == "g" {
            return Int(quantity.rounded())
        }

        let normalizedName = name.lowercased()
        if normalizedName.contains("egg") { return Int((quantity * 50).rounded()) }
        if normalizedName.contains("chicken") { return Int((quantity * 170).rounded()) }
        if normalizedName.contains("yogurt") { return Int((quantity * 245).rounded()) }
        if normalizedName.contains("cucumber") { return Int((quantity * 300).rounded()) }

        switch category {
        case .protein: return Int((quantity * 150).rounded())
        case .produce: return Int((quantity * 120).rounded())
        case .dairy: return Int((quantity * 240).rounded())
        case .grains: return Int((quantity * 160).rounded())
        case .pantry: return Int((quantity * 100).rounded())
        case .frozen: return Int((quantity * 140).rounded())
        case .drink: return Int((quantity * 240).rounded())
        case .unknown: return Int(quantity.rounded())
        }
    }

    var weightLabel: String {
        unit == "g" ? displayQuantity : "\(displayQuantity) - ~\(estimatedGrams) g"
    }

    var foodDataDetailLabel: String {
        var details = [weightLabel]
        if let caloriesEstimateLabel {
            details.append(caloriesEstimateLabel)
        }
        if verifiedNutrition != nil {
            details.append("USDA")
        }
        return details.joined(separator: " - ")
    }

    var confidencePercent: Int {
        min(99, max(1, Int((confidence * 100).rounded())))
    }

    var caloriesEstimateLabel: String? {
        guard let caloriesPer100g = verifiedNutrition?.caloriesPer100g else { return nil }
        let calories = (caloriesPer100g * Double(estimatedGrams) / 100).rounded()
        return "\(Int(calories)) kcal"
    }

    var verifiedMacroLine: String? {
        guard let verifiedNutrition else { return nil }

        let scale = Double(estimatedGrams) / 100
        let macros: [String] = [
            formattedMacro("P", verifiedNutrition.proteinPer100g, scale: scale),
            formattedMacro("C", verifiedNutrition.carbsPer100g, scale: scale),
            formattedMacro("F", verifiedNutrition.fatPer100g, scale: scale)
        ].compactMap { $0 }

        guard !macros.isEmpty else { return nil }
        return macros.joined(separator: " - ")
    }

    var digestionSpeed: String {
        let normalizedName = name.lowercased()
        if normalizedName.contains("rice") { return "Medium digestion" }
        if normalizedName.contains("yogurt") { return "Easy digestion" }
        if normalizedName.contains("egg") { return "Medium digestion" }

        switch category {
        case .produce: return "Fast digestion"
        case .protein, .dairy: return "Slow digestion"
        case .grains: return "Medium digestion"
        case .drink: return "Fast digestion"
        case .pantry, .frozen, .unknown: return "Mixed digestion"
        }
    }

    var micronutrientHighlights: [String] {
        let normalizedName = name.lowercased()
        if normalizedName.contains("spinach") { return ["Vitamin K", "Folate"] }
        if normalizedName.contains("tomato") { return ["Vitamin C", "Potassium"] }
        if normalizedName.contains("yogurt") { return ["Calcium", "B12"] }
        if normalizedName.contains("egg") { return ["Choline", "B12"] }
        if normalizedName.contains("chicken") { return ["B6", "Selenium"] }
        if normalizedName.contains("rice") { return ["Manganese", "Magnesium"] }

        switch category {
        case .produce: return ["Fiber", "Potassium"]
        case .protein: return ["B vitamins", "Selenium"]
        case .dairy: return ["Calcium", "B12"]
        case .grains: return ["Magnesium", "Manganese"]
        case .pantry: return ["Minerals"]
        case .frozen: return ["Varies"]
        case .drink: return ["Hydration"]
        case .unknown: return ["Needs review"]
        }
    }

    var resolvedMicronutrientHighlights: [String] {
        let verifiedMicros = verifiedNutrition?.micronutrients
            .prefix(2)
            .map(\.name) ?? []
        return verifiedMicros.isEmpty ? micronutrientHighlights : verifiedMicros
    }

    func dailyFoodEntry(meal: MealSection, gramsOverride: Int? = nil) -> DailyFoodEntry {
        let grams = gramsOverride ?? estimatedGrams
        return DailyFoodEntry(
            meal: meal,
            name: name,
            grams: grams,
            nutrition: nutritionSummary(grams: grams)
        )
    }

    func nutritionSummary(grams: Int? = nil) -> NutritionSummary {
        let resolvedGrams = Double(grams ?? estimatedGrams)
        let scale = resolvedGrams / 100

        guard let verifiedNutrition else {
            return fallbackNutritionSummary(grams: Int(resolvedGrams.rounded()))
        }

        return NutritionSummary(
            calories: Int(((verifiedNutrition.caloriesPer100g ?? 0) * scale).rounded()),
            protein: (verifiedNutrition.proteinPer100g ?? 0) * scale,
            carbs: (verifiedNutrition.carbsPer100g ?? 0) * scale,
            fat: (verifiedNutrition.fatPer100g ?? 0) * scale,
            fiber: (verifiedNutrition.fiberPer100g ?? 0) * scale,
            sugar: (verifiedNutrition.sugarPer100g ?? 0) * scale,
            sodium: (verifiedNutrition.sodiumPer100g ?? 0) * scale,
            micronutrients: verifiedNutrition.micronutrients.map { nutrient in
                NutrientLine(
                    name: nutrient.name,
                    amount: nutrient.amount * scale,
                    unit: nutrient.unit,
                    dailyValuePercent: nutrient.dailyValuePercent
                )
            }
        )
    }

    private func formattedMacro(_ label: String, _ valuePer100g: Double?, scale: Double) -> String? {
        guard let valuePer100g else { return nil }
        let value = valuePer100g * scale
        if value.rounded() == value {
            return "\(label) \(Int(value))g"
        }
        return "\(label) \(String(format: "%.1f", value))g"
    }

    private func fallbackNutritionSummary(grams: Int) -> NutritionSummary {
        let scale = Double(grams) / 100
        let per100g: (calories: Double, protein: Double, carbs: Double, fat: Double, fiber: Double)

        switch category {
        case .protein:
            per100g = (165, 28, 0, 5, 0)
        case .produce:
            per100g = (38, 1.6, 7.5, 0.3, 2.5)
        case .dairy:
            per100g = (90, 8, 6, 3, 0)
        case .grains:
            per100g = (130, 3, 28, 1, 1.3)
        case .pantry:
            per100g = (180, 5, 28, 5, 3)
        case .frozen:
            per100g = (120, 5, 14, 4, 2)
        case .drink:
            per100g = (42, 0.4, 10, 0, 0)
        case .unknown:
            per100g = (100, 4, 12, 3, 1)
        }

        return NutritionSummary(
            calories: Int((per100g.calories * scale).rounded()),
            protein: per100g.protein * scale,
            carbs: per100g.carbs * scale,
            fat: per100g.fat * scale,
            fiber: per100g.fiber * scale,
            sugar: 0,
            sodium: 0,
            micronutrients: micronutrientHighlights.map {
                NutrientLine(name: $0, amount: 0, unit: "", dailyValuePercent: nil)
            }
        )
    }
}

struct FoodNutritionSnapshot: Codable, Equatable {
    var fdcId: Int
    var matchedDescription: String
    var dataType: String
    var source: String
    var caloriesPer100g: Double?
    var proteinPer100g: Double?
    var carbsPer100g: Double?
    var fatPer100g: Double?
    var fiberPer100g: Double?
    var sugarPer100g: Double?
    var sodiumPer100g: Double?
    var micronutrients: [NutrientLine]
}

extension FoodNutritionSnapshot {
    func nutritionSummary(grams: Int) -> NutritionSummary {
        let scale = Double(grams) / 100
        return NutritionSummary(
            calories: Int(((caloriesPer100g ?? 0) * scale).rounded()),
            protein: (proteinPer100g ?? 0) * scale,
            carbs: (carbsPer100g ?? 0) * scale,
            fat: (fatPer100g ?? 0) * scale,
            fiber: (fiberPer100g ?? 0) * scale,
            sugar: (sugarPer100g ?? 0) * scale,
            sodium: (sodiumPer100g ?? 0) * scale,
            micronutrients: micronutrients.map { nutrient in
                NutrientLine(
                    name: nutrient.name,
                    amount: nutrient.amount * scale,
                    unit: nutrient.unit,
                    dailyValuePercent: nutrient.dailyValuePercent
                )
            }
        )
    }

    func macroLine(grams: Int) -> String {
        let nutrition = nutritionSummary(grams: grams)
        return "\(nutrition.calories) kcal - P \(nutrition.formattedMacro(nutrition.protein))g - C \(nutrition.formattedMacro(nutrition.carbs))g - F \(nutrition.formattedMacro(nutrition.fat))g"
    }
}

struct UserSession: Identifiable, Codable, Equatable {
    var id = UUID()
    var email: String
    var provider: String
}

struct PantryAnalysis: Codable, Equatable {
    var items: [PantryItem]
    var questions: [String]
}

struct RecipeIngredient: Identifiable, Codable, Equatable {
    var id = UUID()
    var name: String
    var amount: String
    var isFromFridge: Bool
}

struct RecipeStep: Identifiable, Codable, Equatable {
    var id = UUID()
    var title: String
    var detail: String
    var minutes: Int
    var coachTip: String
}

struct NutrientLine: Identifiable, Codable, Equatable {
    var id = UUID()
    var name: String
    var amount: Double
    var unit: String
    var dailyValuePercent: Int?

    var formattedAmount: String {
        if amount.rounded() == amount {
            return "\(Int(amount)) \(unit)"
        }
        return String(format: "%.1f %@", amount, unit)
    }
}

struct NutritionSummary: Codable, Equatable {
    var calories: Int
    var protein: Double
    var carbs: Double
    var fat: Double
    var fiber: Double
    var sugar: Double
    var sodium: Double
    var micronutrients: [NutrientLine]
}

extension NutritionSummary {
    static let zero = NutritionSummary(
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        micronutrients: []
    )

    mutating func add(_ other: NutritionSummary) {
        calories += other.calories
        protein += other.protein
        carbs += other.carbs
        fat += other.fat
        fiber += other.fiber
        sugar += other.sugar
        sodium += other.sodium

        for nutrient in other.micronutrients {
            guard !nutrient.name.isEmpty else { continue }
            if let index = micronutrients.firstIndex(where: { $0.name == nutrient.name && $0.unit == nutrient.unit }) {
                micronutrients[index].amount += nutrient.amount
            } else {
                micronutrients.append(nutrient)
            }
        }
    }

    func adding(_ other: NutritionSummary) -> NutritionSummary {
        var copy = self
        copy.add(other)
        return copy
    }

    func amount(for nutrientName: String) -> Double {
        if nutrientName == "Sodium" {
            return sodium
        }

        return micronutrients
            .filter { $0.name == nutrientName }
            .reduce(0) { $0 + $1.amount }
    }

    func formattedMacro(_ value: Double) -> String {
        if value.rounded() == value {
            return "\(Int(value))"
        }
        return String(format: "%.1f", value)
    }
}

struct DailyFoodEntry: Identifiable, Codable, Equatable {
    var id = UUID()
    var meal: MealSection
    var name: String
    var grams: Int
    var nutrition: NutritionSummary
    var loggedAt = Date()

    var detailLine: String {
        "\(grams) g - \(nutrition.calories) kcal"
    }
}

struct Recipe: Identifiable, Codable, Equatable {
    var id = UUID()
    var title: String
    var subtitle: String
    var totalMinutes: Int
    var difficulty: String
    var matchScore: Int
    var tags: [String]
    var ingredients: [RecipeIngredient]
    var steps: [RecipeStep]
    var nutrition: NutritionSummary
}

enum SampleData {
    static let pantryItems: [PantryItem] = [
        PantryItem(name: "Chicken breast", category: .protein, quantity: 2, unit: "pcs", confidence: 0.97, isSelected: true, notes: "Lean protein - slow digestion"),
        PantryItem(name: "Greek yogurt", category: .dairy, quantity: 1, unit: "cup", confidence: 0.95, isSelected: true, notes: "Plain yogurt recommended"),
        PantryItem(name: "Cherry tomatoes", category: .produce, quantity: 200, unit: "g", confidence: 0.93, isSelected: true, notes: "Vitamin C and potassium"),
        PantryItem(name: "Spinach", category: .produce, quantity: 120, unit: "g", confidence: 0.92, isSelected: true, notes: "Use soon - rich in vitamin K"),
        PantryItem(name: "Eggs", category: .protein, quantity: 6, unit: "pcs", confidence: 0.96, isSelected: true, notes: "Choline-rich backup protein")
    ]

    static let recipes: [Recipe] = [
        Recipe(
            title: "Herby Chicken Yogurt Bowl",
            subtitle: "High-protein dinner using the fridge staples first.",
            totalMinutes: 24,
            difficulty: "Easy",
            matchScore: 96,
            tags: ["High Protein", "Post-Workout", "Fridge First"],
            ingredients: [
                RecipeIngredient(name: "Chicken breast", amount: "2 pcs", isFromFridge: true),
                RecipeIngredient(name: "Greek yogurt", amount: "1/2 cup", isFromFridge: true),
                RecipeIngredient(name: "Cherry tomatoes", amount: "200 g", isFromFridge: true),
                RecipeIngredient(name: "Spinach", amount: "2 handfuls", isFromFridge: true),
                RecipeIngredient(name: "Olive oil", amount: "1 tbsp", isFromFridge: false)
            ],
            steps: [
                RecipeStep(title: "Season", detail: "Pat the chicken dry, then season with salt, black pepper, paprika, and a little olive oil.", minutes: 4, coachTip: "Dry chicken browns better and keeps the bowl from tasting steamed."),
                RecipeStep(title: "Sear", detail: "Cook chicken over medium-high heat until golden and cooked through, about 6 minutes per side.", minutes: 12, coachTip: "Pull it off the heat when juices run clear, then let it rest."),
                RecipeStep(title: "Build Sauce", detail: "Mix yogurt with lemon, herbs, salt, and pepper until glossy.", minutes: 3, coachTip: "Add a spoon of water for a lighter drizzle."),
                RecipeStep(title: "Assemble", detail: "Slice chicken and serve over spinach with tomatoes and yogurt sauce.", minutes: 5, coachTip: "Tomatoes add acidity, so keep the sauce creamy and simple.")
            ],
            nutrition: NutritionSummary(
                calories: 520,
                protein: 54,
                carbs: 22,
                fat: 24,
                fiber: 6,
                sugar: 10,
                sodium: 710,
                micronutrients: [
                    NutrientLine(name: "Calcium", amount: 240, unit: "mg", dailyValuePercent: 18),
                    NutrientLine(name: "Iron", amount: 4.1, unit: "mg", dailyValuePercent: 23),
                    NutrientLine(name: "Potassium", amount: 980, unit: "mg", dailyValuePercent: 21),
                    NutrientLine(name: "Vitamin C", amount: 42, unit: "mg", dailyValuePercent: 47)
                ]
            )
        ),
        Recipe(
            title: "Spinach Tomato Egg Skillet",
            subtitle: "A fast no-waste skillet for breakfast or late dinner.",
            totalMinutes: 16,
            difficulty: "Easy",
            matchScore: 91,
            tags: ["Fast", "Low Waste", "Vegetarian"],
            ingredients: [
                RecipeIngredient(name: "Eggs", amount: "3 pcs", isFromFridge: true),
                RecipeIngredient(name: "Spinach", amount: "100 g", isFromFridge: true),
                RecipeIngredient(name: "Cherry tomatoes", amount: "150 g", isFromFridge: true),
                RecipeIngredient(name: "Garlic", amount: "1 clove", isFromFridge: false)
            ],
            steps: [
                RecipeStep(title: "Soften", detail: "Cook tomatoes with garlic until they begin to collapse.", minutes: 5, coachTip: "A pinch of salt helps tomatoes release juice faster."),
                RecipeStep(title: "Wilt", detail: "Add spinach and stir until bright and tender.", minutes: 3, coachTip: "Stop while the spinach is still green."),
                RecipeStep(title: "Set Eggs", detail: "Crack eggs into small wells, cover, and cook until whites are set.", minutes: 8, coachTip: "Leave yolks slightly soft for a richer sauce.")
            ],
            nutrition: NutritionSummary(
                calories: 360,
                protein: 24,
                carbs: 18,
                fat: 22,
                fiber: 5,
                sugar: 8,
                sodium: 520,
                micronutrients: [
                    NutrientLine(name: "Choline", amount: 440, unit: "mg", dailyValuePercent: 80),
                    NutrientLine(name: "Vitamin K", amount: 370, unit: "mcg", dailyValuePercent: 308),
                    NutrientLine(name: "Folate", amount: 180, unit: "mcg", dailyValuePercent: 45)
                ]
            )
        )
    ]
}

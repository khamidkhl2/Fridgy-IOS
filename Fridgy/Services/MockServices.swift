import Foundation

protocol AuthServicing {
    func currentSession() async throws -> UserSession?
    func signIn(email: String, password: String) async throws -> UserSession
    func signUp(email: String, password: String, displayName: String) async throws -> AuthServiceResult
    func signInWithApple(idToken: String, nonce: String?, fullName: String?) async throws -> UserSession
    func signInWithGoogle() async throws -> UserSession
    func signOut() async throws
    func handleOpenURL(_ url: URL)
}

enum AuthServiceResult: Equatable {
    case signedIn(UserSession)
    case emailConfirmationRequired(String)
}

protocol PantryAnalyzing {
    func analyzeFridgeImage(imageData: Data?, profile: NutritionProfile) async throws -> PantryAnalysis
}

protocol RecipeGenerating {
    func generateRecipes(from items: [PantryItem], profile: NutritionProfile) async throws -> [Recipe]
}

protocol FoodNutritionLookuping {
    func enrich(_ items: [PantryItem]) async -> [PantryItem]
    func searchFoods(matching query: String) async -> [FoodNutritionSnapshot]
}

enum MockServiceError: LocalizedError {
    case missingPassword
    case emptyPantry

    var errorDescription: String? {
        switch self {
        case .missingPassword: "Enter your password to continue."
        case .emptyPantry: "Select at least one ingredient before creating recipes."
        }
    }
}

struct MockAuthService: AuthServicing {
    func currentSession() async throws -> UserSession? {
        nil
    }

    func signIn(email: String, password: String) async throws -> UserSession {
        try await Task.sleep(nanoseconds: 450_000_000)
        guard !password.isEmpty else { throw MockServiceError.missingPassword }
        return UserSession(email: email, provider: "Email")
    }

    func signUp(email: String, password: String, displayName: String) async throws -> AuthServiceResult {
        try await Task.sleep(nanoseconds: 450_000_000)
        guard !password.isEmpty else { throw MockServiceError.missingPassword }
        return .signedIn(UserSession(email: email, provider: "Email"))
    }

    func signInWithApple(idToken: String, nonce: String?, fullName: String?) async throws -> UserSession {
        try await Task.sleep(nanoseconds: 420_000_000)
        return UserSession(email: "apple-user@fridgy.app", provider: "Apple")
    }

    func signInWithGoogle() async throws -> UserSession {
        try await Task.sleep(nanoseconds: 420_000_000)
        return UserSession(email: "google-user@fridgy.app", provider: "Google")
    }

    func signOut() async throws {}

    func handleOpenURL(_ url: URL) {}
}

struct MockPantryAnalyzer: PantryAnalyzing {
    func analyzeFridgeImage(imageData: Data?, profile: NutritionProfile) async throws -> PantryAnalysis {
        try await Task.sleep(nanoseconds: imageData == nil ? 600_000_000 : 1_150_000_000)

        var items = SampleData.pantryItems
        if profile.goal == .fatLoss {
            items.append(PantryItem(name: "Cucumber", category: .produce, quantity: 1, unit: "pc", confidence: 0.91, isSelected: true, notes: "Low-calorie volume - fast digestion"))
        } else {
            items.append(PantryItem(name: "Cooked rice", category: .grains, quantity: 180, unit: "g", confidence: 0.89, isSelected: true, notes: "Useful carb base - medium digestion"))
        }

        return PantryAnalysis(
            items: items,
            questions: [
                "Is the yogurt plain or sweetened?",
                "Do you want recipes that use the spinach first?"
            ]
        )
    }
}

struct MockRecipeGenerator: RecipeGenerating {
    func generateRecipes(from items: [PantryItem], profile: NutritionProfile) async throws -> [Recipe] {
        try await Task.sleep(nanoseconds: 850_000_000)
        guard !items.isEmpty else { throw MockServiceError.emptyPantry }

        var generated = SampleData.recipes
        if profile.goal == .fatLoss {
            generated[0].title = "Lean Chicken Yogurt Plate"
            generated[0].nutrition.calories = 440
            generated[0].nutrition.fat = 15
            generated[0].tags = ["Lean", "High Protein", "Fridge First"]
        }

        if profile.goal == .recomposition {
            generated[0].title = "Recomp Chicken Yogurt Bowl"
            generated[0].subtitle = "High protein, moderate carbs, and micronutrients for lean progress."
            generated[0].nutrition.calories = 560
            generated[0].nutrition.protein = 58
            generated[0].tags = ["Recomposition", "High Protein", "Micros"]
        }

        if profile.goal == .calorieMaintenance {
            generated[0].title = "Maintenance Chicken Dinner"
            generated[0].subtitle = "Balanced calories and steady macros without aggressive restriction."
            generated[0].tags = ["Maintenance", "Balanced", "Fridge First"]
        }

        if items.contains(where: { $0.name.localizedCaseInsensitiveContains("rice") }) {
            generated.append(
                Recipe(
                    title: "Golden Chicken Rice Skillet",
                    subtitle: "Comforting, macro-balanced, and built from confirmed fridge items.",
                    totalMinutes: 22,
                    difficulty: "Medium",
                    matchScore: 88,
                    tags: ["Balanced", "One Pan", "Meal Prep"],
                    ingredients: [
                        RecipeIngredient(name: "Chicken breast", amount: "1 pc", isFromFridge: true),
                        RecipeIngredient(name: "Cooked rice", amount: "180 g", isFromFridge: true),
                        RecipeIngredient(name: "Spinach", amount: "1 handful", isFromFridge: true),
                        RecipeIngredient(name: "Cherry tomatoes", amount: "120 g", isFromFridge: true)
                    ],
                    steps: [
                        RecipeStep(title: "Brown Chicken", detail: "Slice chicken and brown it in a hot pan with oil and spices.", minutes: 7, coachTip: "Thin slices cook evenly and stay tender."),
                        RecipeStep(title: "Toast Rice", detail: "Add rice and let it crisp lightly before stirring.", minutes: 6, coachTip: "Crispy edges make leftovers feel intentional."),
                        RecipeStep(title: "Finish Greens", detail: "Fold in spinach and tomatoes until warm and glossy.", minutes: 5, coachTip: "Keep the vegetables bright for better texture."),
                        RecipeStep(title: "Plate", detail: "Serve with yogurt sauce or herbs if available.", minutes: 4, coachTip: "A cool sauce balances the warm skillet.")
                    ],
                    nutrition: NutritionSummary(
                        calories: 610,
                        protein: 48,
                        carbs: 62,
                        fat: 18,
                        fiber: 7,
                        sugar: 7,
                        sodium: 690,
                        micronutrients: [
                            NutrientLine(name: "Magnesium", amount: 116, unit: "mg", dailyValuePercent: 28),
                            NutrientLine(name: "Vitamin A", amount: 580, unit: "mcg", dailyValuePercent: 64),
                            NutrientLine(name: "Zinc", amount: 3.2, unit: "mg", dailyValuePercent: 29)
                        ]
                    )
                )
            )
        }

        return generated
    }
}

import Foundation

enum AuthState: Equatable {
    case signedOut
    case signingIn
    case signedIn(UserSession)
    case notice(String)
    case error(String)
}

enum AuthMethod: Equatable {
    case apple
    case google
    case email
}

enum AuthFeedbackTone: Equatable {
    case notice
    case issue
}

struct AuthFeedback: Equatable {
    var message: String
    var method: AuthMethod
    var tone: AuthFeedbackTone
}

enum ScanState: Equatable {
    case idle
    case analyzing
    case review
    case generatingRecipes
    case failed(String)
}

@MainActor
final class AppState: ObservableObject {
    private static let appearanceDefaultsKey = "fridgy.appearance"
    private static let privacyDefaultsKey = "fridgy.privacy"
    private static let dailyFoodEntriesDefaultsKey = "fridgy.dailyFoodEntries"

    @Published var authState: AuthState = .signedOut
    @Published var authFeedback: AuthFeedback?
    @Published var hasCompletedOnboarding = false
    @Published var nutritionProfile = NutritionProfile.default
    @Published var appearance = AppAppearance.default {
        didSet { saveAppearance() }
    }
    @Published var privacySettings = AppPrivacySettings.default {
        didSet { savePrivacySettings() }
    }
    @Published var pantryItems: [PantryItem] = []
    @Published var recipes: [Recipe] = []
    @Published var dailyFoodEntries: [DailyFoodEntry] = [] {
        didSet { saveDailyFoodEntries() }
    }
    @Published var selectedImageData: Data?
    @Published var scanState: ScanState = .idle

    private let authService: AuthServicing
    private let pantryAnalyzer: PantryAnalyzing
    private let recipeGenerator: RecipeGenerating
    private let nutritionLookup: FoodNutritionLookuping

    init(
        authService: AuthServicing = SupabaseAuthService(),
        pantryAnalyzer: PantryAnalyzing = MockPantryAnalyzer(),
        recipeGenerator: RecipeGenerating = MockRecipeGenerator(),
        nutritionLookup: FoodNutritionLookuping = USDAFoodDataService()
    ) {
        self.authService = authService
        self.pantryAnalyzer = pantryAnalyzer
        self.recipeGenerator = recipeGenerator
        self.nutritionLookup = nutritionLookup
        appearance = Self.loadAppearance()
        privacySettings = Self.loadPrivacySettings()
        dailyFoodEntries = Self.loadDailyFoodEntries()

        Task {
            await restoreSession()
        }
    }

    var isAuthenticated: Bool {
        if case .signedIn = authState { return true }
        return false
    }

    var selectedPantryItems: [PantryItem] {
        pantryItems.filter(\.isSelected)
    }

    var todaysFoodEntries: [DailyFoodEntry] {
        dailyFoodEntries.filter { Calendar.current.isDateInToday($0.loggedAt) }
    }

    var dailyNutritionTotal: NutritionSummary {
        todaysFoodEntries.reduce(.zero) { total, entry in
            total.adding(entry.nutrition)
        }
    }

    func foodEntries(for meal: MealSection) -> [DailyFoodEntry] {
        todaysFoodEntries.filter { $0.meal == meal }
    }

    func nutritionTotal(for meal: MealSection) -> NutritionSummary {
        foodEntries(for: meal).reduce(.zero) { total, entry in
            total.adding(entry.nutrition)
        }
    }

    var authErrorMessage: String? {
        guard authFeedback?.tone == .issue else { return nil }
        return authFeedback?.message
    }

    var authNoticeMessage: String? {
        guard authFeedback?.tone == .notice else { return nil }
        return authFeedback?.message
    }

    func authFeedback(for method: AuthMethod) -> AuthFeedback? {
        guard authFeedback?.method == method else { return nil }
        return authFeedback
    }

    func clearAuthFeedback() {
        authFeedback = nil
    }

    func restoreSession() async {
        do {
            if let session = try await authService.currentSession() {
                authState = .signedIn(session)
            }
        } catch {
            authState = .signedOut
        }
    }

    private func beginAuthAttempt(_ method: AuthMethod) {
        if authFeedback?.method == method {
            authFeedback = nil
        }
        authState = .signingIn
    }

    private func completeAuthAttempt(with session: UserSession) {
        authFeedback = nil
        authState = .signedIn(session)
    }

    private func failAuthAttempt(_ message: String, method: AuthMethod) {
        authFeedback = AuthFeedback(message: message, method: method, tone: .issue)
        authState = .signedOut
    }

    private func failAuthAttempt(_ error: Error, method: AuthMethod) {
        failAuthAttempt(friendlyAuthMessage(for: error, method: method), method: method)
    }

    private func noticeAuthAttempt(_ message: String, method: AuthMethod) {
        authFeedback = AuthFeedback(message: message, method: method, tone: .notice)
        authState = .signedOut
    }

    private func friendlyAuthMessage(for error: Error, method: AuthMethod) -> String {
        let rawMessage = error.localizedDescription.lowercased()

        if rawMessage.contains("cancel") {
            return "Sign-in was cancelled. You can try again when you are ready."
        }

        switch method {
        case .apple:
            return "Apple sign-in did not finish. Please try again."
        case .google:
            return "Google sign-in did not finish. Please choose an account and try again."
        case .email:
            return "We could not sign in with those details. Check your email and password, then try again."
        }
    }

    func signIn(email: String, password: String) async {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            failAuthAttempt("Enter your email to continue.", method: .email)
            return
        }

        beginAuthAttempt(.email)
        do {
            let session = try await authService.signIn(email: email, password: password)
            completeAuthAttempt(with: session)
        } catch {
            failAuthAttempt(error, method: .email)
        }
    }

    func signUp(email: String, password: String) async {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            failAuthAttempt("Enter your email to continue.", method: .email)
            return
        }
        guard !password.isEmpty else {
            failAuthAttempt("Enter your password to continue.", method: .email)
            return
        }

        beginAuthAttempt(.email)
        do {
            let result = try await authService.signUp(
                email: email,
                password: password,
                displayName: nutritionProfile.displayName
            )
            switch result {
            case let .signedIn(session):
                completeAuthAttempt(with: session)
            case let .emailConfirmationRequired(message):
                noticeAuthAttempt(message, method: .email)
            }
        } catch {
            failAuthAttempt(error, method: .email)
        }
    }

    func signInWithApple(idToken: String, nonce: String?, fullName: String?) async {
        beginAuthAttempt(.apple)
        do {
            let session = try await authService.signInWithApple(
                idToken: idToken,
                nonce: nonce,
                fullName: fullName
            )
            completeAuthAttempt(with: session)
        } catch {
            failAuthAttempt(error, method: .apple)
        }
    }

    func signInWithGoogle() async {
        beginAuthAttempt(.google)
        do {
            let session = try await authService.signInWithGoogle()
            completeAuthAttempt(with: session)
        } catch {
            failAuthAttempt(error, method: .google)
        }
    }

    func presentAuthError(_ error: Error, method: AuthMethod) {
        failAuthAttempt(error, method: method)
    }

    func presentAuthIssue(_ message: String, method: AuthMethod) {
        failAuthAttempt(message, method: method)
    }

    func handleOpenURL(_ url: URL) {
        authService.handleOpenURL(url)
    }

    func completeOnboarding(with profile: NutritionProfile) {
        nutritionProfile = profile.withCalculatedTargets()
        hasCompletedOnboarding = true
    }

    func updateNutritionProfile(_ profile: NutritionProfile) {
        nutritionProfile = profile.withCalculatedTargets()
    }

    func updateAppearance(_ update: (inout AppAppearance) -> Void) {
        var nextAppearance = appearance
        update(&nextAppearance)
        appearance = nextAppearance
    }

    func updatePrivacySettings(_ update: (inout AppPrivacySettings) -> Void) {
        var nextSettings = privacySettings
        update(&nextSettings)
        privacySettings = nextSettings
    }

    func addDailyFoodEntry(_ entry: DailyFoodEntry) {
        dailyFoodEntries.append(entry)
    }

    func addManualFoodEntry(
        name: String,
        meal: MealSection,
        grams: Int,
        fallbackNutrition: NutritionSummary,
        verifiedNutrition: FoodNutritionSnapshot? = nil
    ) async {
        let item = PantryItem(
            name: name,
            category: .unknown,
            quantity: Double(grams),
            unit: "g",
            confidence: 1,
            isSelected: true,
            notes: "",
            verifiedNutrition: verifiedNutrition
        )

        let enrichedItem = await nutritionLookup.enrich([item]).first ?? item
        let nutrition = enrichedItem.verifiedNutrition == nil ? fallbackNutrition : enrichedItem.nutritionSummary(grams: grams)
        addDailyFoodEntry(
            DailyFoodEntry(
                meal: meal,
                name: name,
                grams: grams,
                nutrition: nutrition
            )
        )
    }

    func searchFoodNutrition(matching query: String) async -> [FoodNutritionSnapshot] {
        await nutritionLookup.searchFoods(matching: query)
    }

    func removeDailyFoodEntry(_ entry: DailyFoodEntry) {
        dailyFoodEntries.removeAll { $0.id == entry.id }
    }

    var currentSession: UserSession? {
        if case let .signedIn(session) = authState { return session }
        return nil
    }

    private static func loadAppearance() -> AppAppearance {
        guard
            let data = UserDefaults.standard.data(forKey: appearanceDefaultsKey),
            let appearance = try? JSONDecoder().decode(AppAppearance.self, from: data)
        else {
            return .default
        }
        return appearance
    }

    private func saveAppearance() {
        guard let data = try? JSONEncoder().encode(appearance) else { return }
        UserDefaults.standard.set(data, forKey: Self.appearanceDefaultsKey)
    }

    private static func loadPrivacySettings() -> AppPrivacySettings {
        guard
            let data = UserDefaults.standard.data(forKey: privacyDefaultsKey),
            let settings = try? JSONDecoder().decode(AppPrivacySettings.self, from: data)
        else {
            return .default
        }
        return settings
    }

    private func savePrivacySettings() {
        guard let data = try? JSONEncoder().encode(privacySettings) else { return }
        UserDefaults.standard.set(data, forKey: Self.privacyDefaultsKey)
    }

    private static func loadDailyFoodEntries() -> [DailyFoodEntry] {
        guard
            let data = UserDefaults.standard.data(forKey: dailyFoodEntriesDefaultsKey),
            let entries = try? JSONDecoder().decode([DailyFoodEntry].self, from: data)
        else {
            return []
        }

        return entries.filter { Calendar.current.isDateInToday($0.loggedAt) }
    }

    private func saveDailyFoodEntries() {
        let todaysEntries = dailyFoodEntries.filter { Calendar.current.isDateInToday($0.loggedAt) }
        guard let data = try? JSONEncoder().encode(todaysEntries) else { return }
        UserDefaults.standard.set(data, forKey: Self.dailyFoodEntriesDefaultsKey)
    }

    func analyzeSelectedImage() async {
        guard selectedImageData != nil else {
            scanState = .failed("Add a fridge photo before analyzing.")
            return
        }

        scanState = .analyzing
        do {
            let analysis = try await pantryAnalyzer.analyzeFridgeImage(
                imageData: selectedImageData,
                profile: nutritionProfile
            )
            pantryItems = await nutritionLookup.enrich(analysis.items)
            scanState = .review
        } catch {
            scanState = .failed(error.localizedDescription)
        }
    }

    func generateRecipesFromPantry() async {
        scanState = .generatingRecipes
        do {
            recipes = try await recipeGenerator.generateRecipes(
                from: selectedPantryItems,
                profile: nutritionProfile
            )
            scanState = .review
        } catch {
            scanState = .failed(error.localizedDescription)
        }
    }

    func signOut() async {
        do {
            try await authService.signOut()
        } catch {
            authFeedback = nil
            authState = .error(error.localizedDescription)
            return
        }
        authState = .signedOut
        authFeedback = nil
        hasCompletedOnboarding = false
        pantryItems = []
        recipes = []
        dailyFoodEntries = []
        selectedImageData = nil
        scanState = .idle
    }
}

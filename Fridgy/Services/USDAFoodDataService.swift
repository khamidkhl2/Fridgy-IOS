import Foundation

struct USDAFoodDataService: FoodNutritionLookuping {
    private let apiKey: String
    private let session: URLSession
    private let baseURL = URL(string: "https://api.nal.usda.gov/fdc/v1")!

    init(
        apiKey: String = USDAFoodDataService.configuredAPIKey(),
        session: URLSession = .shared
    ) {
        self.apiKey = apiKey
        self.session = session
    }

    func enrich(_ items: [PantryItem]) async -> [PantryItem] {
        guard !apiKey.isEmpty else { return items }

        var enrichedItems: [PantryItem] = []
        enrichedItems.reserveCapacity(items.count)

        for var item in items {
            if item.verifiedNutrition == nil {
                item.verifiedNutrition = await nutritionSnapshot(for: item.name)
            }
            enrichedItems.append(item)
        }

        return enrichedItems
    }

    func searchFoods(matching query: String) async -> [FoodNutritionSnapshot] {
        let cleanedQuery = cleanedQuery(query)
        guard !apiKey.isEmpty, !cleanedQuery.isEmpty else { return [] }

        let preferredResults = await searchResults(
            query: cleanedQuery,
            dataTypes: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
            pageSize: 8
        )

        let broadResults = await searchResults(
            query: cleanedQuery,
            dataTypes: nil,
            pageSize: 12
        )

        var seenIDs: Set<Int> = []
        return (preferredResults + broadResults).filter { snapshot in
            guard !seenIDs.contains(snapshot.fdcId) else { return false }
            seenIDs.insert(snapshot.fdcId)
            return true
        }
        .prefix(12)
        .map { $0 }
    }

    private func nutritionSnapshot(for foodName: String) async -> FoodNutritionSnapshot? {
        let query = cleanedQuery(foodName)
        guard !query.isEmpty else { return nil }

        if let snapshot = await search(query: query, dataTypes: ["Foundation", "SR Legacy", "Survey (FNDDS)"]) {
            return snapshot
        }
        return await search(query: query, dataTypes: nil)
    }

    private func search(query: String, dataTypes: [String]?) async -> FoodNutritionSnapshot? {
        await searchResults(query: query, dataTypes: dataTypes, pageSize: 5).first
    }

    private func searchResults(
        query: String,
        dataTypes: [String]?,
        pageSize: Int
    ) async -> [FoodNutritionSnapshot] {
        guard var components = URLComponents(
            url: baseURL.appendingPathComponent("foods/search"),
            resolvingAgainstBaseURL: false
        ) else {
            return []
        }

        components.queryItems = [
            URLQueryItem(name: "api_key", value: apiKey)
        ]

        guard let url = components.url else { return [] }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 12
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(
            SearchRequest(
                query: query,
                dataType: dataTypes,
                pageSize: pageSize,
                pageNumber: 1
            )
        )

        do {
            let (data, response) = try await session.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return [] }

            let decoded = try JSONDecoder().decode(FoodSearchResponse.self, from: data)
            return decoded.foods
                .compactMap(makeSnapshot(from:))
        } catch {
            return []
        }
    }

    private func makeSnapshot(from food: SearchFood) -> FoodNutritionSnapshot? {
        let nutrients = food.foodNutrients ?? []
        let calories = nutrientValue(
            in: nutrients,
            ids: [1008],
            numbers: ["208"],
            names: ["energy"],
            unit: "KCAL"
        )

        let micronutrients = microDefinitions.compactMap { definition -> NutrientLine? in
            guard let amount = nutrientValue(
                in: nutrients,
                ids: definition.ids,
                numbers: definition.numbers,
                names: definition.names,
                unit: nil
            ), amount > 0 else {
                return nil
            }

            return NutrientLine(
                name: definition.title,
                amount: amount,
                unit: definition.unit,
                dailyValuePercent: nil
            )
        }

        return FoodNutritionSnapshot(
            fdcId: food.fdcId,
            matchedDescription: food.description.capitalized,
            dataType: food.dataType ?? "FoodData Central",
            source: "FoodData Central",
            caloriesPer100g: calories,
            proteinPer100g: nutrientValue(in: nutrients, ids: [1003], numbers: ["203"], names: ["protein"], unit: "G"),
            carbsPer100g: nutrientValue(in: nutrients, ids: [1005], numbers: ["205"], names: ["carbohydrate, by difference"], unit: "G"),
            fatPer100g: nutrientValue(in: nutrients, ids: [1004], numbers: ["204"], names: ["total lipid"], unit: "G"),
            fiberPer100g: nutrientValue(in: nutrients, ids: [1079], numbers: ["291"], names: ["fiber"], unit: "G"),
            sugarPer100g: nutrientValue(in: nutrients, ids: [2000], numbers: ["269"], names: ["sugars"], unit: "G"),
            sodiumPer100g: nutrientValue(in: nutrients, ids: [1093], numbers: ["307"], names: ["sodium"], unit: "MG"),
            micronutrients: Array(micronutrients.prefix(6))
        )
    }

    private func nutrientValue(
        in nutrients: [SearchNutrient],
        ids: Set<Int>,
        numbers: Set<String>,
        names: Set<String>,
        unit: String?
    ) -> Double? {
        nutrients.first { nutrient in
            let idMatches = nutrient.nutrientId.map(ids.contains) ?? false
            let numberMatches = nutrient.nutrientNumber.map(numbers.contains) ?? false
            let name = nutrient.nutrientName?.lowercased() ?? ""
            let nameMatches = names.contains { name.contains($0) }
            let unitMatches = unit.map { nutrient.unitName?.uppercased().contains($0) == true } ?? true
            return (idMatches || numberMatches || nameMatches) && unitMatches
        }?.value
    }

    private func cleanedQuery(_ value: String) -> String {
        value
            .replacingOccurrences(of: "fresh ", with: "", options: .caseInsensitive)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func configuredAPIKey() -> String {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "USDA_FOODDATA_API_KEY") as? String else {
            return "DEMO_KEY"
        }

        let trimmedKey = key.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmedKey.isEmpty ? "DEMO_KEY" : trimmedKey
    }
}

private struct SearchRequest: Encodable {
    var query: String
    var dataType: [String]?
    var pageSize: Int
    var pageNumber: Int
}

private struct FoodSearchResponse: Decodable {
    var foods: [SearchFood]
}

private struct SearchFood: Decodable {
    var fdcId: Int
    var description: String
    var dataType: String?
    var foodNutrients: [SearchNutrient]?
}

private struct SearchNutrient: Decodable {
    var nutrientId: Int?
    var nutrientName: String?
    var nutrientNumber: String?
    var unitName: String?
    var value: Double?
}

private let microDefinitions: [(title: String, ids: Set<Int>, numbers: Set<String>, names: Set<String>, unit: String)] = [
    ("Calcium", [1087], ["301"], ["calcium"], "mg"),
    ("Iron", [1089], ["303"], ["iron"], "mg"),
    ("Magnesium", [1090], ["304"], ["magnesium"], "mg"),
    ("Potassium", [1092], ["306"], ["potassium"], "mg"),
    ("Zinc", [1095], ["309"], ["zinc"], "mg"),
    ("Vitamin C", [1162], ["401"], ["vitamin c"], "mg"),
    ("Vitamin A", [1106], ["320"], ["vitamin a"], "mcg"),
    ("Folate", [1177], ["417"], ["folate"], "mcg")
]

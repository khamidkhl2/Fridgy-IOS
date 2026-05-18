import Foundation

struct FridgyAppConfiguration {
    var supabaseURL: URL?
    var supabaseAnonKey: String
    var apiBaseURL: URL?
    var authRedirectURL: URL?

    static func fromBundle(_ bundle: Bundle = .main) -> FridgyAppConfiguration {
        let supabaseURLString = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        let anonKey = bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
        let apiBaseURLString = bundle.object(forInfoDictionaryKey: "FRIDGY_API_BASE_URL") as? String ?? ""
        let authRedirectURLString = bundle.object(forInfoDictionaryKey: "FRIDGY_AUTH_REDIRECT_URL") as? String ?? ""

        return FridgyAppConfiguration(
            supabaseURL: URL(string: supabaseURLString),
            supabaseAnonKey: anonKey,
            apiBaseURL: URL(string: apiBaseURLString),
            authRedirectURL: URL(string: authRedirectURLString)
        )
    }

    var isConfigured: Bool {
        guard let supabaseURL, let apiBaseURL else { return false }
        return supabaseURL.host != "your-project.supabase.co"
            && apiBaseURL.host != "your-project.supabase.co"
            && supabaseAnonKey != "replace-with-your-supabase-anon-key"
            && !supabaseAnonKey.isEmpty
    }
}

enum SupabaseGatewayError: LocalizedError {
    case missingBaseURL
    case invalidResponse
    case serverMessage(String)

    var errorDescription: String? {
        switch self {
        case .missingBaseURL: "Supabase Edge Function base URL is not configured."
        case .invalidResponse: "The server returned an invalid response."
        case let .serverMessage(message): message
        }
    }
}

final class SupabaseEdgeGateway {
    private let configuration: FridgyAppConfiguration
    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(configuration: FridgyAppConfiguration = .fromBundle(), session: URLSession = .shared) {
        self.configuration = configuration
        self.session = session
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        encoder.keyEncodingStrategy = .convertToSnakeCase
    }

    func post<Request: Encodable, Response: Decodable>(
        _ payload: Request,
        functionName: String,
        bearerToken: String? = nil
    ) async throws -> Response {
        guard let baseURL = configuration.apiBaseURL else {
            throw SupabaseGatewayError.missingBaseURL
        }

        let url = baseURL.appending(path: functionName)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(configuration.supabaseAnonKey, forHTTPHeaderField: "apikey")
        if let bearerToken {
            request.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try encoder.encode(payload)

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseGatewayError.invalidResponse
        }
        guard 200..<300 ~= httpResponse.statusCode else {
            let message = String(data: data, encoding: .utf8) ?? "Request failed with status \(httpResponse.statusCode)."
            throw SupabaseGatewayError.serverMessage(message)
        }
        return try decoder.decode(Response.self, from: data)
    }
}

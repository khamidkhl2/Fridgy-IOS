import Foundation
import AuthenticationServices
import Supabase
import UIKit

enum SupabaseAuthServiceError: LocalizedError {
    case notConfigured

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            "Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY in Info.plist."
        }
    }
}

final class SupabaseAuthService: AuthServicing {
    private let configuration: FridgyAppConfiguration
    private let client: SupabaseClient?
    private let oauthPresentationContextProvider = FridgyOAuthPresentationContextProvider()

    init(configuration: FridgyAppConfiguration = .fromBundle()) {
        self.configuration = configuration

        guard let supabaseURL = configuration.supabaseURL, configuration.isConfigured else {
            client = nil
            return
        }

        client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: configuration.supabaseAnonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    redirectToURL: configuration.authRedirectURL,
                    flowType: .pkce,
                    emitLocalSessionAsInitialSession: true
                )
            )
        )
    }

    func currentSession() async throws -> UserSession? {
        guard let client else { return nil }
        if let session = client.auth.currentSession {
            return makeUserSession(from: session, fallbackProvider: nil)
        }
        if let session = try? await client.auth.session {
            return makeUserSession(from: session, fallbackProvider: nil)
        }
        return nil
    }

    func signIn(email: String, password: String) async throws -> UserSession {
        let client = try configuredClient()
        let session = try await client.auth.signIn(
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password
        )
        return makeUserSession(from: session, fallbackProvider: "Email")
    }

    func signUp(email: String, password: String, displayName: String) async throws -> AuthServiceResult {
        let client = try configuredClient()
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        let metadata: [String: AnyJSON]? = trimmedName.isEmpty ? nil : ["full_name": .string(trimmedName)]

        let response = try await client.auth.signUp(
            email: trimmedEmail,
            password: password,
            data: metadata,
            redirectTo: configuration.authRedirectURL
        )

        switch response {
        case let .session(session):
            return .signedIn(makeUserSession(from: session, fallbackProvider: "Email"))
        case .user:
            do {
                let session = try await client.auth.signIn(
                    email: trimmedEmail,
                    password: password
                )
                return .signedIn(makeUserSession(from: session, fallbackProvider: "Email"))
            } catch {
                return .emailConfirmationRequired("Account created, but email confirmation is still enabled in Supabase.")
            }
        }
    }

    func signInWithApple(idToken: String, nonce: String?, fullName: String?) async throws -> UserSession {
        let client = try configuredClient()
        let session = try await client.auth.signInWithIdToken(
            credentials: OpenIDConnectCredentials(
                provider: .apple,
                idToken: idToken,
                nonce: nonce
            )
        )

        if let fullName, !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            _ = try? await client.auth.update(
                user: UserAttributes(data: ["full_name": .string(fullName)])
            )
        }

        return makeUserSession(from: session, fallbackProvider: "Apple")
    }

    func signInWithGoogle() async throws -> UserSession {
        let client = try configuredClient()
        let session = try await client.auth.signInWithOAuth(
            provider: .google,
            redirectTo: configuration.authRedirectURL,
            scopes: "openid email profile",
            queryParams: [(name: "prompt", value: "select_account")]
        ) { [oauthPresentationContextProvider] webAuthenticationSession in
            webAuthenticationSession.presentationContextProvider = oauthPresentationContextProvider
            webAuthenticationSession.prefersEphemeralWebBrowserSession = true
        }
        return makeUserSession(from: session, fallbackProvider: "Google")
    }

    func signOut() async throws {
        guard let client else { return }
        try await client.auth.signOut()
    }

    func handleOpenURL(_ url: URL) {
        client?.auth.handle(url)
    }

    private func configuredClient() throws -> SupabaseClient {
        guard let client else {
            throw SupabaseAuthServiceError.notConfigured
        }
        return client
    }

    private func makeUserSession(from session: Session, fallbackProvider: String?) -> UserSession {
        let provider = fallbackProvider ?? session.user.identities?.first?.provider.capitalized ?? "Supabase"
        return UserSession(
            id: session.user.id,
            email: session.user.email ?? "authenticated-user@fridgy.app",
            provider: provider
        )
    }
}

final class FridgyOAuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.fridgyKeyWindow ?? UIWindow()
    }
}

extension UIApplication {
    var fridgyKeyWindow: UIWindow? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }
    }
}

import AuthenticationServices
import CryptoKit
import Security
import SwiftUI
import UIKit

struct AuthView: View {
    @EnvironmentObject private var appState: AppState
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var emailMode: EmailAuthMode = .signIn
    @StateObject private var appleSignInCoordinator = AppleSignInCoordinator()

    private var isSigningIn: Bool {
        if case .signingIn = appState.authState { return true }
        return false
    }

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 28) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Fridgy")
                            .fridgyFont(size: 48, weight: .black)
                            .foregroundStyle(FridgyTheme.porcelain)
                        Text("Your fridge, translated into dinner.")
                            .fridgyFont(size: 20, weight: .medium)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }
                    .padding(.top, 72)

                    VStack(spacing: 12) {
                        Button {
                            beginAppleSignIn()
                        } label: {
                            AppleSignInButtonVisual()
                        }
                        .buttonStyle(.plain)
                        .disabled(isSigningIn)
                        .opacity(isSigningIn ? 0.58 : 1)

                        AuthFeedbackText(feedback: appState.authFeedback(for: .apple))

                        GoogleSignInButton(isDisabled: isSigningIn) {
                            Task {
                                await appState.signInWithGoogle()
                            }
                        }

                        AuthFeedbackText(feedback: appState.authFeedback(for: .google))
                    }

                    VStack(spacing: 12) {
                        TextField("Email", text: $email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .autocorrectionDisabled()
                            .premiumTextField()

                        SecureField("Password", text: $password)
                            .textContentType(emailMode == .signUp ? .newPassword : .password)
                            .premiumTextField()

                        if emailMode == .signUp {
                            SecureField("Confirm Password", text: $confirmPassword)
                                .textContentType(.newPassword)
                                .premiumTextField()
                                .transition(.opacity.combined(with: .move(edge: .top)))
                        }

                        PrimaryActionButton(
                            title: emailMode.primaryTitle,
                            systemImage: emailMode.primaryIcon,
                            isLoading: isSigningIn
                        ) {
                            submitEmailForm()
                        }

                        SecondaryActionButton(title: emailMode.secondaryTitle, systemImage: emailMode.secondaryIcon) {
                            withAnimation(.easeInOut(duration: 0.18)) {
                                emailMode.toggle()
                                confirmPassword = ""
                                appState.clearAuthFeedback()
                            }
                        }

                        AuthFeedbackText(feedback: appState.authFeedback(for: .email))
                    }
                }
                .padding(22)
            }
        }
    }

    private func beginAppleSignIn() {
        let nonce = randomNonceString()
        appleSignInCoordinator.start(nonce: nonce) { result in
            switch result {
            case let .success(credential):
                guard
                    let identityTokenData = credential.identityToken,
                    let identityToken = String(data: identityTokenData, encoding: .utf8)
                else {
                    appState.presentAuthError(AuthViewError.missingAppleIdentityToken, method: .apple)
                    return
                }

                Task {
                    await appState.signInWithApple(
                        idToken: identityToken,
                        nonce: nonce,
                        fullName: credential.fullName?.formatted()
                    )
                }
            case let .failure(error):
                appState.presentAuthError(error, method: .apple)
            }
        }
    }

    private func submitEmailForm() {
        switch emailMode {
        case .signIn:
            Task { await appState.signIn(email: email, password: password) }
        case .signUp:
            guard password == confirmPassword else {
                appState.presentAuthIssue("Passwords do not match. Please double-check them.", method: .email)
                return
            }
            guard password.count >= 6 else {
                appState.presentAuthIssue("Use at least 6 characters for your password.", method: .email)
                return
            }
            Task { await appState.signUp(email: email, password: password) }
        }
    }
}

private enum EmailAuthMode: Equatable {
    case signIn
    case signUp

    var primaryTitle: String {
        switch self {
        case .signIn: "Sign In with Email"
        case .signUp: "Create Account"
        }
    }

    var primaryIcon: String {
        switch self {
        case .signIn: "envelope.fill"
        case .signUp: "person.badge.plus"
        }
    }

    var secondaryTitle: String {
        switch self {
        case .signIn: "Create Email Account"
        case .signUp: "I Already Have an Account"
        }
    }

    var secondaryIcon: String {
        switch self {
        case .signIn: "person.badge.plus"
        case .signUp: "arrow.uturn.left"
        }
    }

    mutating func toggle() {
        self = self == .signIn ? .signUp : .signIn
    }
}

private struct AppleSignInButtonVisual: View {
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "apple.logo")
                .fridgyIcon(size: 22, weight: .semibold)

            Text("Continue with Apple")
                .fridgyFont(size: 19, weight: .semibold)
                .lineLimit(1)
                .minimumScaleFactor(0.86)
        }
        .foregroundStyle(Color.black)
        .frame(maxWidth: .infinity)
        .frame(height: 52)
        .background(Color.white)
        .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

private struct GoogleSignInButton: View {
    @EnvironmentObject private var appState: AppState
    var isDisabled: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image("GoogleG")
                    .resizable()
                    .scaledToFit()
                    .frame(
                        width: 18 * appState.appearance.textSize.previewScale,
                        height: 18 * appState.appearance.textSize.previewScale
                    )

                Text("Continue with Google")
                    .fridgyFont(size: 19, weight: .semibold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.86)
            }
            .foregroundStyle(Color.black)
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(Color.white)
            .contentShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.58 : 1)
    }
}

private final class AppleSignInCoordinator: NSObject, ObservableObject {
    private var completion: ((Result<ASAuthorizationAppleIDCredential, Error>) -> Void)?
    private var authorizationController: ASAuthorizationController?

    func start(
        nonce: String,
        completion: @escaping (Result<ASAuthorizationAppleIDCredential, Error>) -> Void
    ) {
        self.completion = completion

        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        authorizationController = controller
        controller.performRequests()
    }
}

extension AppleSignInCoordinator: ASAuthorizationControllerDelegate {
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            completion?(.failure(AuthViewError.invalidAppleCredential))
            completion = nil
            authorizationController = nil
            return
        }

        completion?(.success(credential))
        completion = nil
        authorizationController = nil
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        completion?(.failure(error))
        completion = nil
        authorizationController = nil
    }
}

extension AppleSignInCoordinator: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        UIApplication.shared.fridgyKeyWindow ?? UIWindow()
    }
}

private struct AuthFeedbackText: View {
    var feedback: AuthFeedback?

    var body: some View {
        if let feedback {
            HStack(alignment: .top, spacing: 7) {
                Image(systemName: feedback.tone == .notice ? "checkmark.circle.fill" : "info.circle.fill")
                    .fridgyIcon(size: 12, weight: .bold)
                    .foregroundStyle(feedback.tone == .notice ? FridgyTheme.herb : FridgyTheme.brass)
                    .padding(.top, 1)
                Text(feedback.message)
                    .fridgyFont(size: 12, weight: .medium)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 2)
        }
    }
}

private enum AuthViewError: LocalizedError {
    case invalidAppleCredential
    case missingAppleIdentityToken

    var errorDescription: String? {
        switch self {
        case .invalidAppleCredential:
            "Apple did not return a valid sign-in credential."
        case .missingAppleIdentityToken:
            "Apple did not return an identity token."
        }
    }
}

private func randomNonceString(length: Int = 32) -> String {
    precondition(length > 0)
    let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
    var result = ""
    var remainingLength = length

    while remainingLength > 0 {
        var randoms = [UInt8](repeating: 0, count: 16)
        let status = SecRandomCopyBytes(kSecRandomDefault, randoms.count, &randoms)
        if status != errSecSuccess {
            fatalError("Unable to generate nonce. SecRandomCopyBytes failed with OSStatus \(status)")
        }

        randoms.forEach { random in
            if remainingLength == 0 { return }
            if random < charset.count {
                result.append(charset[Int(random)])
                remainingLength -= 1
            }
        }
    }

    return result
}

private func sha256(_ input: String) -> String {
    let inputData = Data(input.utf8)
    let hashedData = SHA256.hash(data: inputData)
    return hashedData.map { String(format: "%02x", $0) }.joined()
}

private extension View {
    func premiumTextField() -> some View {
        self
            .fridgyFont(size: 17, weight: .medium)
            .foregroundStyle(FridgyTheme.porcelain)
            .padding(.horizontal, 14)
            .frame(height: 52)
            .background(FridgyTheme.glass)
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(FridgyTheme.border, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

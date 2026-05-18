import PhotosUI
import SwiftUI
import UIKit

struct PantryScanView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var showCamera = false

    private var isAnalyzing: Bool {
        if case .analyzing = appState.scanState { return true }
        return false
    }

    private var isGenerating: Bool {
        if case .generatingRecipes = appState.scanState { return true }
        return false
    }

    var body: some View {
        ScreenBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Fridge Scan")
                            .fridgyFont(size: 38, weight: .black)
                            .foregroundStyle(FridgyTheme.porcelain)
                        Text("Capture the fridge, then confirm what Fridgy found.")
                            .fridgyFont(size: 17)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }

                    VStack(spacing: 14) {
                        imagePreview

                        HStack(spacing: 10) {
                            SecondaryActionButton(title: "Camera", systemImage: "camera.fill") {
                                showCamera = true
                            }
                            PhotosPicker(selection: $selectedPhoto, matching: .images) {
                                Label("Library", systemImage: "photo.fill")
                                    .fridgyFont(size: 15, weight: .semibold)
                                    .foregroundStyle(FridgyTheme.porcelain)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 50)
                                    .background(FridgyTheme.glass)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                                            .stroke(FridgyTheme.border, lineWidth: 1)
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                            }
                        }

                        PrimaryActionButton(
                            title: "Analyze Fridge",
                            systemImage: "sparkles",
                            isLoading: isAnalyzing,
                            isDisabled: appState.selectedImageData == nil
                        ) {
                            Task { await appState.analyzeSelectedImage() }
                        }
                    }
                    .premiumCard()

                    if case let .failed(message) = appState.scanState {
                        Text(message)
                            .fridgyFont(size: 13, weight: .medium)
                            .foregroundStyle(FridgyTheme.berry)
                            .premiumCard()
                    }

                    if appState.pantryItems.isEmpty {
                        EmptyStateCard(
                            systemImage: "checklist",
                            title: "Ingredients will appear here",
                            detail: "After analysis, review quantities and choose what should be used for recipes."
                        )
                    } else {
                        PantryReviewSection()

                        PrimaryActionButton(
                            title: "Create Recipes",
                            systemImage: "fork.knife",
                            isLoading: isGenerating,
                            isDisabled: appState.selectedPantryItems.isEmpty
                        ) {
                            Task { await appState.generateRecipesFromPantry() }
                        }
                    }

                    if !appState.recipes.isEmpty {
                        RecipeSuggestionsStrip()
                    }
                }
                .padding(22)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showCamera) {
            CameraCaptureView(
                imageData: Binding(
                    get: { appState.selectedImageData },
                    set: { appState.selectedImageData = $0 }
                )
            )
            .ignoresSafeArea()
        }
        .task(id: selectedPhoto) {
            guard let selectedPhoto else { return }
            if let data = try? await selectedPhoto.loadTransferable(type: Data.self) {
                appState.selectedImageData = data
            }
        }
    }

    @ViewBuilder
    private var imagePreview: some View {
        if let data = appState.selectedImageData, let image = UIImage(data: data) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(height: 260)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                .overlay(alignment: .topTrailing) {
                    Text("Ready")
                        .fridgyFont(size: 12, weight: .bold)
                        .foregroundStyle(FridgyTheme.ink)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(FridgyTheme.porcelain)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .padding(10)
                }
        } else {
            VStack(spacing: 12) {
                Image(systemName: "refrigerator.fill")
                    .fridgyIcon(size: 56, weight: .bold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text("No photo selected")
                    .fridgyFont(size: 17, weight: .semibold)
                    .foregroundStyle(FridgyTheme.porcelain)
                Text("Use the camera on device or pick a fridge photo from the library.")
                    .fridgyFont(size: 15)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 240)
            .background(FridgyTheme.glass)
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }
}

struct PantryReviewSection: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Review Ingredients", subtitle: "Adjust quantities before recipe generation.")

            ForEach($appState.pantryItems) { $item in
                PantryItemRow(item: $item)
            }
        }
        .premiumCard()
    }
}

struct PantryItemRow: View {
    @Binding var item: PantryItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: item.category.symbolName)
                    .foregroundStyle(item.isSelected ? FridgyTheme.herb : FridgyTheme.porcelainMuted)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.name)
                        .fridgyFont(size: 15, weight: .bold)
                        .foregroundStyle(FridgyTheme.porcelain)
                    Text("\(item.category.title) • \(item.foodDataDetailLabel)")
                        .fridgyFont(size: 12)
                        .foregroundStyle(FridgyTheme.porcelainMuted)
                    if let verifiedMacroLine = item.verifiedMacroLine {
                        Text(verifiedMacroLine)
                            .fridgyFont(size: 11, weight: .semibold)
                            .foregroundStyle(FridgyTheme.porcelainMuted)
                    }
                }
                Spacer()
                Text("\(item.confidencePercent)%")
                    .fridgyFont(size: 13, weight: .black)
                    .foregroundStyle(FridgyTheme.ink)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 6)
                    .background(FridgyTheme.brass)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                Toggle("", isOn: $item.isSelected)
                    .labelsHidden()
                    .tint(FridgyTheme.herb)
            }

            Stepper(value: $item.quantity, in: 0...1000, step: item.unit == "g" ? 10 : 0.5) {
                Text(item.weightLabel)
                    .fridgyFont(size: 12, weight: .semibold)
                    .foregroundStyle(FridgyTheme.brass)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    PantryInfoPill(text: item.digestionSpeed, tint: FridgyTheme.herb)
                    if item.verifiedNutrition != nil {
                        PantryInfoPill(text: "USDA", tint: FridgyTheme.berry)
                    }
                    if let caloriesEstimateLabel = item.caloriesEstimateLabel {
                        PantryInfoPill(text: caloriesEstimateLabel, tint: FridgyTheme.brass)
                    }
                }

                HStack(spacing: 8) {
                    ForEach(item.resolvedMicronutrientHighlights.prefix(2), id: \.self) { nutrient in
                        PantryInfoPill(text: nutrient, tint: FridgyTheme.brass)
                    }
                }
            }

            if !item.notes.isEmpty {
                Text(item.notes)
                    .fridgyFont(size: 12)
                    .foregroundStyle(FridgyTheme.porcelainMuted)
            }
        }
        .padding(.vertical, 8)
    }
}

private struct PantryInfoPill: View {
    var text: String
    var tint: Color

    var body: some View {
        Text(text)
            .fridgyFont(size: 11, weight: .bold)
            .foregroundStyle(tint)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(tint.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct RecipeSuggestionsStrip: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Suggestions", subtitle: "Tap any recipe to open the cook flow.")
            ForEach(appState.recipes) { recipe in
                NavigationLink {
                    RecipeDetailView(recipe: recipe)
                } label: {
                    RecipeCompactRow(recipe: recipe)
                }
                .buttonStyle(.plain)
            }
        }
        .premiumCard()
    }
}

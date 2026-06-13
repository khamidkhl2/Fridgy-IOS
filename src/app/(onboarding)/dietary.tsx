/** Onboarding 3 — Dietary style (multi-select). */
import { MultiSelectScreen, type MultiOption } from '@/components/MultiSelectScreen';
import { DIET_PRIMARY_GROUP, stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: MultiOption[] = [
  { id: 'No restrictions', emoji: '🚫', label: 'No restrictions' },
  { id: 'Vegetarian', emoji: '🌱', label: 'Vegetarian' },
  { id: 'Vegan', emoji: '🌿', label: 'Vegan' },
  { id: 'Pescatarian', emoji: '🐟', label: 'Pescatarian' },
  { id: 'Flexitarian', emoji: '🫐', label: 'Flexitarian' },
  { id: 'Mediterranean', emoji: '🧄', label: 'Mediterranean' },
  { id: 'Keto / Low-carb', emoji: '🥩', label: 'Keto / Low-carb' },
  { id: 'Paleo', emoji: '🫙', label: 'Paleo' },
  { id: 'Gluten-free', emoji: '🌾', label: 'Gluten-free' },
  { id: 'Dairy-free', emoji: '🥛', label: 'Dairy-free' },
  { id: 'Halal', emoji: '☪️', label: 'Halal' },
  { id: 'Kosher', emoji: '✡️', label: 'Kosher' },
  { id: 'Whole30', emoji: '🧘', label: 'Whole30' },
  { id: 'Low FODMAP', emoji: '📉', label: 'Low FODMAP' },
  { id: 'Other', emoji: '✏️', label: 'Other' },
];

export default function DietaryStyleScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <MultiSelectScreen
      step={stepOf('dietary')}
      title="Do you follow a specific diet?"
      subtitle="Pick up to 3 — we'll tailor recipes to match."
      options={OPTIONS}
      exclusiveId="No restrictions"
      exclusiveGroups={[DIET_PRIMARY_GROUP]}
      maxSelect={3}
      otherId="Other"
      otherPlaceholder="e.g. raw, low-sodium…"
      selected={data.dietaryStyles}
      custom={data.customDietaryStyle}
      onSelectedChange={(fn) => update((prev) => ({ dietaryStyles: fn(prev.dietaryStyles) }))}
      onCustomChange={(v) => update({ customDietaryStyle: v })}
      onBack={go.back}
      onContinue={() => go.push('/allergies')}
      onSkip={() => go.push('/allergies')}
    />
  );
}

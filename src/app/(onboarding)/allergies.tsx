/** Onboarding — Allergies (multi-select). */
import { MultiSelectScreen, type MultiOption } from '@/components/MultiSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: MultiOption[] = [
  { id: 'None', emoji: '✅', label: 'None' },
  { id: 'Peanuts', emoji: '🥜', label: 'Peanuts' },
  { id: 'Tree nuts', emoji: '🌰', label: 'Tree nuts' },
  { id: 'Dairy / Milk', emoji: '🥛', label: 'Dairy / Milk' },
  { id: 'Eggs', emoji: '🥚', label: 'Eggs' },
  { id: 'Wheat / Gluten', emoji: '🌾', label: 'Wheat / Gluten' },
  { id: 'Soy', emoji: '🫘', label: 'Soy' },
  { id: 'Shellfish', emoji: '🦐', label: 'Shellfish' },
];

export default function AllergiesScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  // Pescatarian's only animal protein is seafood — flag (don't block) a shellfish
  // allergy so the user knows their plan will effectively skip seafood.
  const notice =
    data.dietaryStyles.includes('Pescatarian') && data.allergies.includes('Shellfish')
      ? "You chose Pescatarian but flagged a shellfish allergy — we'll keep it out, so your recipes will lean vegetarian."
      : null;

  return (
    <MultiSelectScreen
      step={stepOf('allergies')}
      title="Any food allergies?"
      subtitle="We'll keep these out of every recipe we suggest."
      options={OPTIONS}
      exclusiveId="None"
      selected={data.allergies}
      custom={data.customAllergy}
      notice={notice}
      onSelectedChange={(fn) => update((prev) => ({ allergies: fn(prev.allergies) }))}
      onCustomChange={(v) => update({ customAllergy: v })}
      onBack={go.back}
      onContinue={() => go.push('/gender')}
    />
  );
}

/** Onboarding 4 — Allergies (multi-select). */
import { MultiSelectScreen, type MultiOption } from '@/components/MultiSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: MultiOption[] = [
  { id: 'Peanuts', emoji: '🥜', label: 'Peanuts' },
  { id: 'Tree nuts', emoji: '🌰', label: 'Tree nuts' },
  { id: 'Dairy / Milk', emoji: '🥛', label: 'Dairy / Milk' },
  { id: 'Eggs', emoji: '🥚', label: 'Eggs' },
  { id: 'Wheat / Gluten', emoji: '🌾', label: 'Wheat / Gluten' },
  { id: 'Soy', emoji: '🫘', label: 'Soy' },
  { id: 'Fish', emoji: '🐟', label: 'Fish' },
  { id: 'Shellfish', emoji: '🦐', label: 'Shellfish' },
  { id: 'Sesame', emoji: '🌿', label: 'Sesame' },
  { id: 'Corn', emoji: '🌽', label: 'Corn' },
  { id: 'Mustard', emoji: '🌶️', label: 'Mustard' },
  { id: 'Sulphites', emoji: '🧪', label: 'Sulphites' },
  { id: 'Lupin', emoji: '🫘', label: 'Lupin' },
  { id: 'Celery', emoji: '🥬', label: 'Celery' },
  { id: 'Other', emoji: '✏️', label: 'Other' },
  { id: 'None', emoji: '✅', label: 'None' },
];

export default function AllergiesScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <MultiSelectScreen
      step={stepOf('allergies')}
      title="Any food allergies?"
      subtitle="We'll keep these out of every recipe we suggest."
      options={OPTIONS}
      exclusiveId="None"
      otherId="Other"
      otherPlaceholder="e.g. mango, garlic…"
      selected={data.allergies}
      custom={data.customAllergy}
      onSelectedChange={(fn) => update((prev) => ({ allergies: fn(prev.allergies) }))}
      onCustomChange={(v) => update({ customAllergy: v })}
      onBack={go.back}
      onContinue={() => go.push('/gender')}
      onSkip={() => go.push('/gender')}
    />
  );
}

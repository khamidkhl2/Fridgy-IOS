/** Onboarding — Dietary style (single-select). */
import { SingleSelectScreen, type SingleOption } from '@/components/SingleSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: SingleOption[] = [
  { id: 'Balanced', emoji: '🍽️', label: 'Balanced', desc: 'A bit of everything' },
  { id: 'Vegetarian', emoji: '🌱', label: 'Vegetarian', desc: 'No meat or fish' },
  { id: 'Pescatarian', emoji: '🐟', label: 'Pescatarian', desc: 'Fish, no other meat' },
  { id: 'Mediterranean', emoji: '🫒', label: 'Mediterranean', desc: 'Veg, fish, olive oil' },
  { id: 'Keto / Low-carb', emoji: '🥑', label: 'Keto / Low-carb', desc: 'Low carb, high fat' },
  { id: 'Paleo', emoji: '🍖', label: 'Paleo', desc: 'Whole foods, no grains' },
  { id: 'Halal', emoji: '☪️', label: 'Halal' },
  { id: 'Kosher', emoji: '✡️', label: 'Kosher' },
];

export default function DietaryStyleScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <SingleSelectScreen
      step={stepOf('dietary')}
      title="Do you follow a specific diet?"
      subtitle="We'll tailor recipes and targets to match."
      options={OPTIONS}
      value={data.dietaryStyles[0] ?? ''}
      onChange={(id) => update({ dietaryStyles: [id] })}
      onBack={go.back}
      onContinue={() => go.push('/allergies')}
    />
  );
}

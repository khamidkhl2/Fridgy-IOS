/** Onboarding 8 — Daily activity level. */
import { SingleSelectScreen, type SingleOption } from '@/components/SingleSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: SingleOption[] = [
  { id: 'Sedentary', emoji: '🛋️', label: 'Sedentary', desc: 'Mostly sitting, desk job' },
  { id: 'Lightly active', emoji: '🚶', label: 'Lightly active', desc: 'Some walking, on my feet a bit' },
  { id: 'Moderately active', emoji: '🏃', label: 'Moderately active', desc: 'Active job or daily exercise' },
  { id: 'Very active', emoji: '⚡', label: 'Very active', desc: 'Physical job or intense daily training' },
];

export default function ActivityLevelScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <SingleSelectScreen
      step={stepOf('activity')}
      title="How active are you day-to-day?"
      subtitle="Not counting workouts — just daily movement."
      options={OPTIONS}
      value={data.activityLevel}
      onChange={(id) => update({ activityLevel: id })}
      onBack={go.back}
      onContinue={() => go.push('/training')}
    />
  );
}

/** Onboarding 2 — Primary goal. */
import { SingleSelectScreen, type SingleOption } from '@/components/SingleSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const GOALS: SingleOption[] = [
  { id: 'Lose weight', icon: 'trendDown', label: 'Lose weight', desc: 'Burn fat, feel lighter' },
  { id: 'Build muscle', icon: 'dumbbell', label: 'Build muscle', desc: 'Gain strength and size' },
  { id: 'Maintain weight', icon: 'scale', label: 'Maintain weight', desc: 'Stay where I am' },
  { id: 'Eat healthier', icon: 'leaf', label: 'Eat healthier', desc: 'Better habits, more energy' },
];

export default function GoalScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <SingleSelectScreen
      step={stepOf('goal')}
      title="What's your primary goal?"
      subtitle="This shapes your daily nutrition targets."
      options={GOALS}
      value={data.goal}
      onChange={(id) => update({ goal: id })}
      onBack={go.back}
      onContinue={() => go.push('/dietary')}
    />
  );
}

/** Onboarding 5 — Biological sex. */
import { SingleSelectScreen, type SingleOption } from '@/components/SingleSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: SingleOption[] = [
  { id: 'Male', emoji: '♂️', label: 'Male' },
  { id: 'Female', emoji: '♀️', label: 'Female' },
  { id: 'Prefer not to say', emoji: '⚪', label: 'Prefer not to say' },
];

export default function GenderScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <SingleSelectScreen
      step={stepOf('gender')}
      title="What's your biological sex?"
      subtitle="Used to calculate your metabolic rate."
      options={OPTIONS}
      value={data.gender}
      onChange={(id) => update({ gender: id })}
      onBack={go.back}
      onContinue={() => go.push('/birthdate')}
    />
  );
}

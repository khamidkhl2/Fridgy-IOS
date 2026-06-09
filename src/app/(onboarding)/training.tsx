/** Onboarding 9 — Training type (multi-select). */
import { MultiSelectScreen, type MultiOption } from '@/components/MultiSelectScreen';
import { stepOf, useGo, useOnboarding } from '@/lib/onboarding';

const OPTIONS: MultiOption[] = [
  { id: 'Weightlifting', emoji: '🏋️', label: 'Weightlifting' },
  { id: 'Running', emoji: '🏃', label: 'Running' },
  { id: 'Cycling', emoji: '🚴', label: 'Cycling' },
  { id: 'Swimming', emoji: '🏊', label: 'Swimming' },
  { id: 'Yoga', emoji: '🧘', label: 'Yoga' },
  { id: 'Pilates', emoji: '🤸', label: 'Pilates' },
  { id: 'HIIT', emoji: '⚡', label: 'HIIT' },
  { id: 'CrossFit', emoji: '🔄', label: 'CrossFit' },
  { id: 'Boxing / MMA', emoji: '🥊', label: 'Boxing / MMA' },
  { id: 'Team sports', emoji: '⚽', label: 'Team sports' },
  { id: 'Tennis', emoji: '🎾', label: 'Tennis' },
  { id: 'Climbing', emoji: '🧗', label: 'Climbing' },
  { id: 'Rowing', emoji: '🚣', label: 'Rowing' },
  { id: 'Walking', emoji: '🚶', label: 'Walking' },
  { id: 'Dance / Zumba', emoji: '💃', label: 'Dance / Zumba' },
  { id: 'Calisthenics', emoji: '🤼', label: 'Calisthenics' },
  { id: 'Other', emoji: '✏️', label: 'Other' },
  { id: "I don't train", emoji: '💤', label: "I don't train" },
];

export default function TrainingTypeScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  return (
    <MultiSelectScreen
      step={stepOf('training')}
      title="How do you train?"
      subtitle="This fine-tunes your calorie and protein targets."
      options={OPTIONS}
      exclusiveId="I don't train"
      otherId="Other"
      otherPlaceholder="e.g. surfing, polo…"
      selected={data.trainingTypes}
      custom={data.customTrainingType}
      onSelectedChange={(fn) => update((prev) => ({ trainingTypes: fn(prev.trainingTypes) }))}
      onCustomChange={(v) => update({ customTrainingType: v })}
      onBack={go.back}
      onContinue={() => go.push('/loading')}
    />
  );
}

/** Onboarding — Measurement system (single-select). Sets the unit used by the
 *  next screen's height/weight pickers. */
import { SingleSelectScreen, type SingleOption } from '@/components/SingleSelectScreen';
import { stepOf, useGo, useOnboarding, type Unit } from '@/lib/onboarding';

const OPTIONS: SingleOption[] = [
  { id: 'metric', emoji: '🌍', label: 'Metric', desc: 'm, kg, ml' },
  { id: 'imperial', emoji: '🇺🇸', label: 'Imperial', desc: 'ft, lb, fl oz' },
];

const IN_PER_CM = 2.54;
const KG_PER_LB = 0.453592;

export default function MeasurementsScreen() {
  const { data, update } = useOnboarding();
  const go = useGo();

  // Convert the stored height/weight into the chosen unit so the body screen
  // seeds its wheels at a sensible position (height is total inches / cm).
  const choose = (id: string) =>
    update((prev) => {
      const next = id as Unit;
      if (next === prev.unit) return { unit: next };
      return next === 'metric'
        ? { unit: next, height: Math.round(prev.height * IN_PER_CM), weight: Math.round(prev.weight * KG_PER_LB) }
        : { unit: next, height: Math.round(prev.height / IN_PER_CM), weight: Math.round(prev.weight / KG_PER_LB) };
    });

  return (
    <SingleSelectScreen
      step={stepOf('measurements')}
      title="Which units do you use?"
      subtitle="We'll use these throughout the app."
      options={OPTIONS}
      value={data.unit}
      onChange={choose}
      onBack={go.back}
      onContinue={() => go.push('/body')}
    />
  );
}

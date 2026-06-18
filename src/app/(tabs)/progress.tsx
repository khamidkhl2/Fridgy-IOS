/** Progress tab — goal-weight tracking: current vs. goal, a trend chart, and
 *  weight check-ins. */
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H } from '@/components/Headline';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenBg } from '@/components/ScreenBg';
import { Txt } from '@/components/Txt';
import { WeightChart } from '@/components/WeightChart';
import { Wheel, WheelGroup } from '@/components/Wheel';
import { useAuth } from '@/lib/auth';
import { haptics } from '@/lib/haptics';
import { useProfileRow } from '@/lib/profile';
import { kgToUnit, logWeight, unitToKg, useWeights } from '@/lib/weight';
import { useTheme } from '@/theme/ThemeProvider';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const CARD_SHADOW = '0px 8px 22px -12px rgba(30,28,24,0.18)';
const SOFT_SHADOW = '0px 6px 16px -12px rgba(30,28,24,0.16)';

export default function ProgressScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { row, refresh } = useProfileRow();
  const { logs } = useWeights();

  const metric = (row?.unit ?? 'imperial') === 'metric';
  const unit = metric ? 'kg' : 'lb';

  const logKgs = logs.map((l) => l.weight_kg);
  const currentKg = logKgs.length ? logKgs[logKgs.length - 1] : row?.weight_kg ?? null;
  const startKg = logKgs.length ? logKgs[0] : row?.weight_kg ?? null;
  const goalKg = row?.goal_weight_kg ?? null;

  const [modal, setModal] = useState(false);

  const chartKgs = logKgs.length ? logKgs : currentKg != null ? [currentKg] : [];
  const chartValues = chartKgs.map((kg) => kgToUnit(kg, metric));

  // goal progress
  let pct = 0;
  let goalLine = '';
  if (goalKg != null && currentKg != null && startKg != null) {
    const total = Math.abs(startKg - goalKg);
    const done = Math.abs(startKg - currentKg);
    pct = total > 0 ? clamp01(done / total) : currentKg === goalKg ? 1 : 0;
    const remAbs = Math.abs(currentKg - goalKg);
    goalLine = remAbs < 0.5 ? 'Goal reached 🎉' : `${kgToUnit(remAbs, metric)} ${unit} to go`;
  }

  const delta = currentKg != null && startKg != null ? currentKg - startKg : 0;
  const deltaAbs = kgToUnit(Math.abs(delta), metric);

  const contentPad = { paddingTop: insets.top + 8, paddingBottom: 120 };

  // empty state — no weight recorded anywhere yet
  if (currentKg == null) {
    return (
      <ScreenBg>
        <ScrollView contentContainerStyle={contentPad} showsVerticalScrollIndicator={false}>
          <H size={32} style={{ paddingHorizontal: 22, letterSpacing: -0.3 }}>
            Progress
          </H>
          <View style={{ alignItems: 'center', paddingHorizontal: 30, paddingTop: 70, gap: 12 }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="scale" size={40} color={theme.primary} stroke={1.7} />
            </View>
            <H size={24} style={{ textAlign: 'center', marginTop: 6 }}>
              Track your progress
            </H>
            <Txt w={500} size={15} color={theme.inkSec} style={{ textAlign: 'center', lineHeight: 22 }}>
              Log your weight and set a goal — we&apos;ll chart your trend and help you get there.
            </Txt>
            <View style={{ width: '100%', marginTop: 18 }}>
              <PrimaryButton onPress={() => { haptics.light(); setModal(true); }}>Log your weight</PrimaryButton>
            </View>
          </View>
        </ScrollView>
        <LogWeightModal visible={modal} metric={metric} unit={unit} seedKg={70} row={row} onClose={() => setModal(false)} onLogged={refresh} />
      </ScreenBg>
    );
  }

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={contentPad} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 }}>
          <H size={32} style={{ letterSpacing: -0.3 }}>Progress</H>
          <Pressable
            onPress={() => { haptics.light(); setModal(true); }}
            accessibilityRole="button"
            accessibilityLabel="Log weight"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingLeft: 11, paddingRight: 14, borderRadius: 22, backgroundColor: theme.primary }}
          >
            <Icon name="plus" size={16} color={theme.onPrimary} stroke={2.6} />
            <Txt w={800} size={13.5} color={theme.onPrimary}>Log</Txt>
          </Pressable>
        </View>

        {/* current weight + goal */}
        <View style={{ paddingHorizontal: 18, paddingTop: 16 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 22, padding: 22, boxShadow: CARD_SHADOW }}>
            <Txt w={600} size={13.5} color={theme.inkSec}>Current weight</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 }}>
              <H size={46}>{kgToUnit(currentKg, metric)}</H>
              <Txt w={700} size={18} color={theme.inkSec} style={{ marginBottom: 9 }}>{unit}</Txt>
            </View>
            {startKg != null && Math.abs(delta) >= 0.1 && (
              <Txt w={700} size={13.5} color={delta < 0 ? theme.primary : theme.inkSec} style={{ marginTop: 2 }}>
                {delta < 0 ? '▼' : '▲'} {deltaAbs} {unit} since start
              </Txt>
            )}

            {goalKg != null ? (
              <View style={{ marginTop: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Txt w={700} size={13.5} color={theme.ink}>{goalLine}</Txt>
                  <Pressable onPress={() => { haptics.light(); router.push('/edit-field?field=goalweight' as Href); }}>
                    <Txt w={700} size={13} color={theme.primary}>Goal {kgToUnit(goalKg, metric)} {unit}</Txt>
                  </Pressable>
                </View>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: theme.track, overflow: 'hidden' }}>
                  <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 5, backgroundColor: theme.primary }} />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => { haptics.light(); router.push('/edit-field?field=goalweight' as Href); }}
                accessibilityRole="button"
                accessibilityLabel="Set a goal weight"
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.primarySoft }}
              >
                <Icon name="scale" size={17} color={theme.primary} stroke={2} />
                <Txt w={700} size={14.5} color={theme.primary}>Set a goal weight</Txt>
              </Pressable>
            )}
          </View>
        </View>

        {/* trend chart */}
        <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 18, boxShadow: SOFT_SHADOW }}>
            <Txt w={700} size={14} color={theme.ink} style={{ marginBottom: 12 }}>Weight trend</Txt>
            {chartValues.length > 0 ? (
              <WeightChart values={chartValues} goal={goalKg != null ? kgToUnit(goalKg, metric) : null} width={width - 36 - 36} unit={unit} />
            ) : null}
            {logKgs.length < 2 && (
              <Txt w={500} size={12.5} color={theme.inkSec} style={{ marginTop: 8, textAlign: 'center' }}>
                Log your weight regularly to see your trend.
              </Txt>
            )}
          </View>
        </View>
      </ScrollView>

      <LogWeightModal
        visible={modal}
        metric={metric}
        unit={unit}
        seedKg={currentKg ?? 70}
        row={row}
        onClose={() => setModal(false)}
        onLogged={refresh}
      />
    </ScreenBg>
  );
}

const LB = Array.from({ length: 400 - 60 + 1 }, (_, i) => 60 + i);
const KG = Array.from({ length: 250 - 30 + 1 }, (_, i) => 30 + i);

function LogWeightModal({
  visible,
  metric,
  unit,
  seedKg,
  row,
  onClose,
  onLogged,
}: {
  visible: boolean;
  metric: boolean;
  unit: string;
  seedKg: number;
  row: ReturnType<typeof useProfileRow>['row'];
  onClose: () => void;
  onLogged: () => void;
}) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const [v, setV] = useState(() => kgToUnit(seedKg, metric));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session?.user) return;
    setSaving(true);
    const ok = await logWeight({ userId: session.user.id, weightKg: unitToKg(v, metric), row });
    setSaving(false);
    if (!ok) {
      Alert.alert("Couldn't save weight", 'Please check your connection and try again.');
      return;
    }
    haptics.success();
    onLogged();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 28 }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 22 }}>
          <H size={22}>Log weight</H>
          <Txt w={500} size={13.5} color={theme.inkSec} style={{ marginTop: 4, marginBottom: 12 }}>
            Today, in {metric ? 'kilograms' : 'pounds'}.
          </Txt>
          <WheelGroup>
            <Wheel items={metric ? KG : LB} value={v} onChange={setV} format={(x) => `${x} ${unit}`} />
          </WheelGroup>
          <View style={{ marginTop: 18 }}>
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
          </View>
          <Pressable onPress={onClose} style={{ paddingVertical: 10, marginTop: 6 }}>
            <Txt w={700} size={14.5} color={theme.inkSec} style={{ textAlign: 'center' }}>Cancel</Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

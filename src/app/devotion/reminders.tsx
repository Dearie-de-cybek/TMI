import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chips';
import { SettingsRow } from '@/components/ui/content-row';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { space } from '@/design/tokens';
import {
  applyReminders,
  defaultReminders,
  formatReminderTime,
  loadReminders,
  reminderTimes,
  type ReminderSettings,
} from '@/features/devotion/reminders';

/**
 * Prayer reminders.
 *
 * A streak only means something if the member is gently called back to it, so
 * this is where they choose when. Nothing is scheduled until a switch is turned
 * on, and the permission prompt appears then - not before.
 */
export default function RemindersScreen() {
  const toast = useToast();
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminders);
  const [problem, setProblem] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadReminders().then((stored) => {
      setSettings(stored);
      setReady(true);
    });
  }, []);

  async function update(patch: Partial<ReminderSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    setProblem(null);

    const result = await applyReminders(next);
    if (!result.ok) {
      setProblem(result.message);
      // Show the switches as they really are: nothing was scheduled.
      setSettings({ ...next, daily: false, monthly: false });
      return;
    }
    if (patch.daily === true) {
      toast(`Daily reminder set for ${formatReminderTime(next.hour, next.minute)}.`, {
        tone: 'success',
        icon: 'bell',
      });
    }
  }

  return (
    <Screen>
      <NavBar title="Prayer reminders" />
      <ScreenScroll bottomSpace={space.giant}>
        {problem ? (
          <View style={styles.gutter}>
            <Banner tone="warning" message={problem} />
          </View>
        ) : null}

        <SettingsRow
          label="Daily reminder"
          icon="bell"
          hint="Pray the month’s decree and read the day’s word."
          toggle={{
            value: settings.daily,
            disabled: !ready,
            onChange: (value) => void update({ daily: value }),
          }}
        />

        {settings.daily ? (
          <View style={styles.times}>
            <Text variant="caption" color="textSecondary">
              Remind me at
            </Text>
            <View style={styles.timeRow}>
              {reminderTimes.map((time) => (
                <Chip
                  key={time.label}
                  label={time.label}
                  selected={time.hour === settings.hour && time.minute === settings.minute}
                  onPress={() => void update({ hour: time.hour, minute: time.minute })}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Rule inset={space.gutter} />

        <SettingsRow
          label="New decree each month"
          icon="book-open"
          hint="A note on the first of the month when the new prophetic decree is published."
          toggle={{
            value: settings.monthly,
            disabled: !ready,
            onChange: (value) => void update({ monthly: value }),
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
  },
  times: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
});

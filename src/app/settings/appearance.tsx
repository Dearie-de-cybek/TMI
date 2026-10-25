import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { NavBar } from '@/components/ui/header';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SettingsRow } from '@/components/ui/content-row';
import { Text } from '@/components/ui/text';
import { useTheme, type AppearancePreference } from '@/design/theme';
import { radius, space } from '@/design/tokens';

const options: { value: AppearancePreference; label: string; hint: string }[] = [
  { value: 'system', label: 'Match my device', hint: 'Follows your system light or dark setting.' },
  { value: 'light', label: 'Parchment', hint: 'Warm ivory, for daylight reading.' },
  { value: 'dark', label: 'Ink', hint: 'Dark ground, designed for low light.' },
];

/**
 * Appearance.
 *
 * Both schemes are designed, not inverted, so switching is a real choice. Text
 * size follows the device setting everywhere in the app; this screen explains
 * where to change it rather than adding a second, conflicting control.
 */
export default function AppearanceSettingsScreen() {
  const { colors, appearance, setAppearance, reduceMotion, reduceMotionOverride, setReduceMotionOverride } =
    useTheme();

  return (
    <Screen>
      <NavBar title="Appearance" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.block}>
          <SectionHeader title="Theme" />
          {options.map((option) => {
            const selected = appearance === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setAppearance(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${option.label}. ${option.hint}`}
                feedback="none"
                style={[
                  styles.option,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primarySoft : 'transparent',
                  },
                ]}
              >
                <View style={styles.optionText}>
                  <Text variant="bodyStrong" color={selected ? 'primaryOnSoft' : 'text'}>
                    {option.label}
                  </Text>
                  <Text variant="caption" color={selected ? 'primaryOnSoft' : 'textSecondary'}>
                    {option.hint}
                  </Text>
                </View>
                {selected ? <Icon name="check" size="sm" color="primaryOnSoft" /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.block}>
          <SectionHeader title="Motion" />
        </View>
        <Rule />
        <SettingsRow
          label="Reduce motion"
          hint={
            reduceMotionOverride === null
              ? `Following your device setting (currently ${reduceMotion ? 'on' : 'off'}).`
              : 'Set in the app, overriding your device setting.'
          }
          toggle={{
            value: reduceMotion,
            onChange: (next) => setReduceMotionOverride(next),
          }}
        />
        {reduceMotionOverride !== null ? (
          <>
            <Rule inset={space.gutter} />
            <SettingsRow
              label="Follow my device again"
              icon="smartphone"
              onPress={() => setReduceMotionOverride(null)}
            />
          </>
        ) : null}
        <Rule />

        <View style={styles.block}>
          <SectionHeader title="Text size" />
          <Text variant="body" color="textSecondary">
            Kingdom Heralds follows the text size you set for your whole device, so changing it
            there changes it here. Reading screens — sermons, transcripts, lessons — are laid out to
            stay readable at the largest sizes.
          </Text>
          <Text variant="caption" color="textTertiary">
            On iOS: Settings → Display &amp; Brightness → Text Size. On Android: Settings →
            Display → Display size and text.
          </Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: space.gutter,
    paddingTop: space.lg,
    gap: space.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
});

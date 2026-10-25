import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/app/toast';
import { SettingsRow } from '@/components/ui/content-row';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { Text } from '@/components/ui/text';
import { env } from '@/config/env';
import { useRuntimeConfig } from '@/config/runtime';
import { space } from '@/design/tokens';
import { isSafeExternalUrl } from '@/lib/deep-links';

export default function HelpScreen() {
  const router = useRouter();
  const toast = useToast();
  const apiMode = useRuntimeConfig((state) => state.apiMode);

  async function open(target: string) {
    const supported = await Linking.canOpenURL(target).catch(() => false);
    if (!supported) {
      toast('This device cannot open that.', { tone: 'warning' });
      return;
    }
    await Linking.openURL(target);
  }

  return (
    <Screen>
      <NavBar title="Help" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.intro}>
          <Text variant="title">Help and contact</Text>
          <Text variant="body" color="textSecondary">
            For anything about your membership record, a course, a gift or a prayer request, the
            church office is the right place — they can see what this app cannot.
          </Text>
        </View>

        <View style={styles.header}>
          <SectionHeader title="Reach the church" />
        </View>
        <Rule />
        <SettingsRow
          label="Email the office"
          value={env.church.email}
          icon="mail"
          onPress={() => void open(`mailto:${env.church.email}`)}
        />
        {env.church.phone ? (
          <>
            <Rule inset={space.gutter} />
            <SettingsRow
              label="Call the office"
              value={env.church.phone}
              icon="phone"
              onPress={() => void open(`tel:${env.church.phone.replace(/\s/g, '')}`)}
            />
          </>
        ) : null}
        <Rule inset={space.gutter} />
        <SettingsRow
          label="Prayer and pastoral care"
          icon="heart"
          onPress={() => router.push('/prayer')}
        />
        <Rule />

        <View style={styles.header}>
          <SectionHeader title="Policies" />
        </View>
        <Rule />
        <SettingsRow label="Privacy policy" icon="shield" onPress={() => router.push('/legal/privacy')} />
        <Rule inset={space.gutter} />
        <SettingsRow label="Terms of use" icon="file-text" onPress={() => router.push('/legal/terms')} />
        {isSafeExternalUrl(env.church.privacyUrl) ? (
          <>
            <Rule inset={space.gutter} />
            <SettingsRow
              label="Church website"
              icon="globe"
              onPress={() => void WebBrowser.openBrowserAsync(env.church.privacyUrl)}
            />
          </>
        ) : null}
        <Rule />

        <View style={styles.about}>
          <Text variant="metaStrong" color="textSecondary">
            About this app
          </Text>
          <Text variant="meta" color="textSecondary">
            TwainMan Ministry {Constants.expoConfig?.version ?? '1.0.0'} ({Platform.OS})
          </Text>
          <Text variant="caption" color="textTertiary">
            Data source: {apiMode === 'demo' ? 'bundled demo data' : env.apiUrl}
          </Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.sm,
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
  },
  about: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxl,
    gap: 2,
  },
});

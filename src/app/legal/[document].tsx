import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/ui/header';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { env } from '@/config/env';
import { space } from '@/design/tokens';
import { isSafeExternalUrl } from '@/lib/deep-links';

/**
 * Terms, privacy and the church's data statement.
 *
 * The authoritative documents are published by the church on the web, so this
 * screen summarises what the app itself collects and links out rather than
 * holding a copy that could drift out of date.
 */
const documents = {
  terms: {
    title: 'Terms of use',
    url: env.church.termsUrl,
    summary:
      'The terms cover your church account, acceptable use of the community areas, and the limits of what the app provides.',
    points: [
      'Your account is personal to you. Do not share your sign-in details.',
      'Content in the app — teaching, course material, artwork — belongs to the church.',
      'The community areas are moderated by the church, which may remove access.',
    ],
  },
  privacy: {
    title: 'Privacy policy',
    url: env.church.privacyUrl,
    summary:
      'The policy explains what the church holds about you, who can see it, and how long it is kept.',
    points: [
      'This app stores your sign-in token in your device’s secure keychain, and your name, preferences and reading position on the device.',
      'Prayer requests are sent to the audience you choose and are not shown in search, feeds or notifications to other members.',
      'Giving is processed by the church’s payment provider. Card details are never entered in, or stored by, this app.',
      'Push notifications are sent by the church through its own backend. You can turn each type off in Settings.',
    ],
  },
} as const;

export default function LegalDocumentScreen() {
  const params = useLocalSearchParams<{ document?: string; url?: string }>();
  const key = params.document === 'privacy' ? 'privacy' : 'terms';
  const document = documents[key];
  const url = params.url && isSafeExternalUrl(params.url) ? params.url : document.url;

  return (
    <Screen>
      <NavBar title={document.title} />
      <ScreenScroll padded>
        <Text variant="title" style={styles.title}>
          {document.title}
        </Text>
        <Text variant="body" color="textSecondary">
          {document.summary}
        </Text>

        <View style={styles.points}>
          {document.points.map((point, index) => (
            <View key={point} style={styles.point}>
              <Text variant="caption" color="accent" style={styles.pointIndex}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text variant="body" style={styles.pointBody}>
                {point}
              </Text>
            </View>
          ))}
        </View>

        <Banner
          tone="info"
          message="This is a summary written for the app. The church’s published document is the authoritative version."
        />

        {isSafeExternalUrl(url) ? (
          <Button
            label="Read the full document"
            icon="external-link"
            iconPosition="trailing"
            variant="secondary"
            style={styles.action}
            onPress={() => void WebBrowser.openBrowserAsync(url)}
          />
        ) : (
          <Text variant="meta" color="textTertiary" style={styles.action}>
            The church has not published a link for this document yet.
          </Text>
        )}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  points: {
    gap: space.lg,
    paddingVertical: space.xxl,
  },
  point: {
    flexDirection: 'row',
    gap: space.md,
  },
  pointIndex: {
    width: 22,
    paddingTop: 4,
  },
  pointBody: {
    flex: 1,
  },
  action: {
    marginTop: space.lg,
  },
});

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { DecreeProgress, DecreeRow } from '@/components/content/devotion';
import { Band } from '@/components/ui/band';
import { Tag } from '@/components/ui/chips';
import { ContentImage } from '@/components/ui/content-image';
import { NavBar } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Eyebrow, Text } from '@/components/ui/text';
import { useColors } from '@/design/theme';
import { fonts, radius, space } from '@/design/tokens';
import { fetchCurrentDecree } from '@/features/devotion/api';
import { useDevotionProgress } from '@/features/devotion/progress-store';
import { useDevotionSync } from '@/features/devotion/use-devotion-sync';

/**
 * The month's decree in full: the foundation, the pastor's charge, the eleven
 * declarations, and the confession that closes them. A member can read it top
 * to bottom, or step into whichever decree they stopped at.
 */
export default function DecreeScreen() {
  const router = useRouter();
  const colors = useColors();

  useDevotionSync();

  const decree = useQuery({
    queryKey: queryKeys.decree('current'),
    queryFn: ({ signal }) => fetchCurrentDecree(signal),
  });

  const prayedIds = useDevotionProgress((state) => state.prayedSectionIds);
  const confessionDeclaredOn = useDevotionProgress((state) => state.confessionDeclaredOn);

  if (decree.isPending) {
    return (
      <Screen>
        <NavBar title="Prophetic decree" />
        <SkeletonList count={5} withThumbnail={false} />
      </Screen>
    );
  }

  if (decree.isError) {
    return (
      <Screen>
        <NavBar title="Prophetic decree" />
        <ErrorState error={decree.error} onRetry={() => void decree.refetch()} />
      </Screen>
    );
  }

  const data = decree.data;
  const prayedCount = data.sections.filter((section) => prayedIds.includes(section.id)).length;

  return (
    <Screen>
      <NavBar title={data.month_label} subtitle="Prophetic decree and prayers" />
      <ScreenScroll bottomSpace={space.giant}>
        <View style={styles.header}>
          <ContentImage
            uri={data.artwork_url}
            seed={data.theme}
            height={160}
            contentPosition="top center"
            label="The church at prayer"
            style={{ borderRadius: radius.sm }}
          />
          <Eyebrow>{data.subtitle ?? 'Prophetic decree'}</Eyebrow>
          <Text style={[styles.theme, { color: colors.text }]}>{data.theme}</Text>

          {data.scriptural_foundation.length > 0 ? (
            <View style={styles.tags}>
              {data.scriptural_foundation.map((reference) => (
                <Tag key={reference} label={reference} tone="accent" icon="book" />
              ))}
            </View>
          ) : null}

          <DecreeProgress prayed={prayedCount} total={data.sections.length} />
        </View>

        {data.introduction.length > 0 ? (
          <Band tone="primary" style={styles.introBand}>
            <View style={styles.gutter}>
              <Eyebrow color="primaryOnSoft">From the Lead Pastor</Eyebrow>
              {data.introduction.map((paragraph, index) => (
                <Text key={index} variant="bodyLarge" style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          </Band>
        ) : null}

        <View style={styles.gutter}>
          <SectionHeader
            title="The declarations"
            description="Pray them in order, or return to the one you stopped at. Each is marked when you have prayed it."
          />
        </View>

        {data.sections.map((section, index) => (
          <View key={section.id}>
            {index > 0 ? <Rule inset={space.gutter} /> : null}
            <Pressable
              onPress={() => router.push(`/devotion/section/${section.id}`)}
              accessibilityLabel={`Decree ${section.position}: ${section.title}${
                prayedIds.includes(section.id) ? '. Prayed' : ''
              }`}
            >
              <DecreeRow
                position={section.position}
                title={section.title}
                scriptures={section.scriptures}
                prayed={prayedIds.includes(section.id)}
              />
            </Pressable>
          </View>
        ))}

        {data.confession ? (
          <Band tone="accent" style={styles.confessionBand}>
            <Pressable
              onPress={() => router.push('/devotion/confession')}
              accessibilityLabel={`${data.confession.title}${confessionDeclaredOn ? '. Declared today' : ''}`}
              style={styles.confessionRow}
            >
              <View style={styles.confessionText}>
                <Eyebrow color="accentOnSoft">To close the month</Eyebrow>
                <Text variant="headline">{data.confession.title}</Text>
                <Text variant="meta" color="textSecondary" numberOfLines={2}>
                  {data.confession.lead}
                </Text>
              </View>
              <Icon
                name={confessionDeclaredOn ? 'mic' : 'chevron-right'}
                size="md"
                color={confessionDeclaredOn ? 'success' : 'textTertiary'}
              />
            </Pressable>
          </Band>
        ) : null}

        {data.closing_word ? (
          <View style={[styles.gutter, styles.closing]}>
            <SectionHeader eyebrow="A final prophetic word" title={data.author} />
            <Text variant="quote" color="textSecondary">
              {data.closing_word}
            </Text>
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: space.gutter,
  },
  header: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.md,
  },
  theme: {
    fontFamily: fonts.sansBold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  introBand: {
    marginTop: space.xxl,
    paddingTop: space.xl,
  },
  paragraph: {
    paddingTop: space.md,
    maxWidth: 640,
  },
  confessionBand: {
    marginTop: space.xxl,
    paddingTop: space.sm,
  },
  confessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.gutter,
    paddingVertical: space.lg,
  },
  confessionText: {
    flex: 1,
    gap: 3,
  },
  closing: {
    paddingTop: space.xxl,
    gap: space.sm,
  },
});

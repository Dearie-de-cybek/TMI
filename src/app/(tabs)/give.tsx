import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { idempotencyKey } from '@/api/client';
import { describeError, fieldError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type GivingCategory } from '@/api/schemas';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Chip, SegmentedControl } from '@/components/ui/chips';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRuntimeConfig } from '@/config/runtime';
import { fonts, radius, space } from '@/design/tokens';
import { useIsSignedIn, useRequireAuth } from '@/features/auth/use-require-auth';
import { createGivingIntent, fetchGivingCategories } from '@/features/giving/api';
import { churchImages } from '@/lib/artwork';
import { formatMoney } from '@/lib/format';
import { givingAmountError, parseAmountToMinor } from '@/lib/validation';
import { isSafeExternalUrl } from '@/lib/deep-links';

/**
 * Giving.
 *
 * Choosing what to give is separate from paying for it. This screen only builds
 * an intent; the backend creates it with the payment provider and returns a
 * hosted checkout URL. Verification happens on the status screen, against the
 * server - never from the fact that the browser came back.
 */
export default function GiveScreen() {
  const router = useRouter();
  const signedIn = useIsSignedIn();
  const requireAuth = useRequireAuth();
  const demoMode = useRuntimeConfig((state) => state.apiMode) === 'demo';

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [recurrence, setRecurrence] = useState<'one_time' | 'monthly'>('one_time');
  const [amountError, setAmountError] = useState<string | undefined>(undefined);
  // Stable for the whole attempt so a retry cannot create a second charge.
  const [attemptKey, setAttemptKey] = useState(() => idempotencyKey('give'));

  const categories = useQuery({
    queryKey: queryKeys.givingCategories,
    queryFn: ({ signal }) => fetchGivingCategories(signal),
  });

  const category: GivingCategory | undefined = useMemo(
    () => categories.data?.find((item) => item.id === categoryId) ?? categories.data?.[0],
    [categories.data, categoryId]
  );

  const create = useMutation({
    mutationFn: () => {
      const minor = parseAmountToMinor(amount)!;
      return createGivingIntent({
        categoryId: category!.id,
        amountMinor: minor,
        currency: category!.currency,
        recurrence,
        idempotencyKey: attemptKey,
      });
    },
    onSuccess: async (intent) => {
      setAttemptKey(idempotencyKey('give'));
      if (intent.checkout_url && isSafeExternalUrl(intent.checkout_url)) {
        // The provider's own page collects the payment details; this app never does.
        await WebBrowser.openBrowserAsync(intent.checkout_url).catch(() => undefined);
      }
      router.push(`/giving/${encodeURIComponent(intent.reference)}`);
    },
    onError: (error) => {
      setAmountError(fieldError(error, 'amount_minor'));
    },
  });

  const hero = (
    <GiveHero
      onHistory={signedIn ? () => router.push('/giving/history') : undefined}
    />
  );

  if (!signedIn) {
    return (
      <Screen>
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          {hero}
          <View style={styles.block}>
            <SignInPrompt
              title="Sign in to give"
              message="Giving is recorded against your account so the church can issue your receipts and you can see your own history."
              reason="give"
              next="/give"
            />
            <Banner
              tone="info"
              icon="info"
              message="You can also give in person or by bank transfer, the church office has the details."
            />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  const createError = create.error ? describeError(create.error) : null;
  const parsedMinor = parseAmountToMinor(amount);
  const giveLabel =
    parsedMinor && category
      ? `${demoMode ? 'Give (demo)' : 'Give'} ${formatMoney(parsedMinor, category.currency)}`
      : 'Enter an amount to give';

  return (
    <Screen>
      {categories.isPending ? (
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          {hero}
          <SkeletonList count={3} withThumbnail={false} />
        </ScreenScroll>
      ) : categories.isError ? (
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          {hero}
          <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
        </ScreenScroll>
      ) : (
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          {hero}

          <View style={styles.block}>
            <Text variant="title">Give to</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
            style={styles.pillScroller}
            accessibilityRole="radiogroup"
          >
            {categories.data.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                selected={category?.id === item.id}
                onPress={() => {
                  setCategoryId(item.id);
                  if (!item.recurring_supported) setRecurrence('one_time');
                }}
              />
            ))}
          </ScrollView>
          {category?.description ? (
            <Text variant="meta" color="textSecondary" style={styles.description}>
              {category.description}
            </Text>
          ) : null}

          {category ? (
            <>
              {category.recurring_supported ? (
                <View style={styles.block}>
                  <SegmentedControl
                    label="How often"
                    value={recurrence}
                    onChange={setRecurrence}
                    options={[
                      { value: 'one_time', label: 'One-time' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                  />
                </View>
              ) : (
                <Text variant="caption" color="textTertiary" style={styles.description}>
                  This category accepts one-off gifts only.
                </Text>
              )}

              <View style={styles.block}>
                {category.suggested_amounts.length > 0 ? (
                  <View style={styles.suggestions}>
                    {category.suggested_amounts.map((suggested) => (
                      <Chip
                        key={suggested}
                        label={formatMoney(suggested, category.currency)}
                        selected={parsedMinor === suggested}
                        onPress={() => {
                          setAmount(String(suggested / 100));
                          setAmountError(undefined);
                        }}
                      />
                    ))}
                  </View>
                ) : null}

                <TextField
                  label={`Amount (${category.currency})`}
                  value={amount}
                  onChangeText={(value) => {
                    setAmount(value);
                    setAmountError(undefined);
                  }}
                  error={amountError}
                  keyboardType="decimal-pad"
                  placeholder="Other amount"
                  icon="credit-card"
                  hint={
                    category.minimum_amount > 0
                      ? `Minimum ${formatMoney(category.minimum_amount, category.currency)}.`
                      : undefined
                  }
                />
              </View>

              <View style={styles.block}>
                {createError && !amountError ? (
                  <Banner tone="danger" title={createError.title} message={createError.message} />
                ) : null}

                {demoMode ? (
                  <Banner
                    tone="warning"
                    icon="tool"
                    title="Demo mode takes no payment"
                    message="Continuing records a gift marked “not processed” so the states can be checked. No money moves and no card details are collected."
                  />
                ) : null}

                <Button
                  label={giveLabel}
                  variant="gold"
                  size="lg"
                  fullWidth
                  icon="heart"
                  loading={create.isPending}
                  onPress={() => {
                    if (!requireAuth({ reason: 'give', next: '/give' })) return;
                    const error = givingAmountError(
                      amount,
                      category.minimum_amount,
                      category.currency
                    );
                    if (error) {
                      setAmountError(error);
                      return;
                    }
                    setAmountError(undefined);
                    create.mutate();
                  }}
                />

                <View style={styles.secure}>
                  <Icon name="lock" size="sm" color="textTertiary" />
                  <Text variant="caption" color="textTertiary" style={styles.secureText}>
                    Payment is handled on the provider’s own secure page. TwainMan Ministry does not
                    see or store your card details, and this app never asks for them.
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </ScreenScroll>
      )}
    </Screen>
  );
}

/** A photograph of the church with the page's one promise over it. */
function GiveHero({ onHistory }: { onHistory?: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.hero}>
      <Image
        source={churchImages.praiseJoy}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="top center"
        accessibilityLabel="Members of the church rejoicing"
        accessibilityRole="image"
        accessible
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(8,3,5,0.85)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {onHistory ? (
        <View style={[styles.historyButton, { top: insets.top + space.sm }]}>
          <Button label="History" variant="glass" size="sm" icon="clock" onPress={onHistory} />
        </View>
      ) : null}
      <View style={[styles.heroText, { paddingTop: insets.top + space.xxl }]}>
        <Text style={styles.heroTitle}>Give</Text>
        <Text variant="bodyLarge" style={styles.heroSubtitle}>
          Your giving carries the work of the house.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 300,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  historyButton: {
    position: 'absolute',
    right: space.gutter,
  },
  heroText: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.xl,
    gap: space.xs,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.sansExtraBold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
  },
  block: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    gap: space.md,
  },
  pillScroller: {
    flexGrow: 0,
  },
  pills: {
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
  },
  description: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  secure: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  secureText: {
    flex: 1,
  },
});

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { idempotencyKey } from '@/api/client';
import { describeError, fieldError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type GivingCategory } from '@/api/schemas';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { TAB_BAR_HEIGHT } from '@/components/app/tab-bar';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Chip, SegmentedControl } from '@/components/ui/chips';
import { PageHeader } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section';
import { SkeletonList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRuntimeConfig } from '@/config/runtime';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useIsSignedIn, useRequireAuth } from '@/features/auth/use-require-auth';
import { createGivingIntent, fetchGivingCategories } from '@/features/giving/api';
import { formatMoney } from '@/lib/format';
import { givingAmountError, parseAmountToMinor } from '@/lib/validation';
import { isSafeExternalUrl } from '@/lib/deep-links';

/**
 * Giving.
 *
 * Choosing what to give is separate from paying for it. This screen only builds
 * an intent; the backend creates it with the payment provider and returns a
 * hosted checkout URL. Verification happens on the status screen, against the
 * server — never from the fact that the browser came back.
 */
export default function GiveScreen() {
  const router = useRouter();
  const colors = useColors();
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

  if (!signedIn) {
    return (
      <Screen>
        <PageHeader eyebrow="Generosity" title="Give" />
        <ScreenScroll padded bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          <SignInPrompt
            title="Sign in to give"
            message="Giving is recorded against your account so the church can issue your receipts and you can see your own history."
            reason="give"
            next="/give"
          />
          <View style={styles.offlineNote}>
            <Banner
              tone="info"
              icon="info"
              message="You can also give in person or by bank transfer — the church office has the details."
            />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  const createError = create.error ? describeError(create.error) : null;
  const parsedMinor = parseAmountToMinor(amount);

  return (
    <Screen>
      <PageHeader
        eyebrow="Generosity"
        title="Give"
        actions={[
          { icon: 'clock', label: 'Giving history', onPress: () => router.push('/giving/history') },
        ]}
      />

      {categories.isPending ? (
        <SkeletonList count={4} withThumbnail={false} />
      ) : categories.isError ? (
        <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
      ) : (
        <ScreenScroll bottomSpace={TAB_BAR_HEIGHT + space.xxl}>
          <View style={styles.block}>
            <SectionHeader title="What is this for?" />
          </View>

          <View style={styles.categories}>
            {categories.data.map((item) => {
              const selected = category?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setCategoryId(item.id);
                    if (!item.recurring_supported) setRecurrence('one_time');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={item.name}
                  feedback="none"
                  style={[
                    styles.category,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primarySoft : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.categoryText}>
                    <Text variant="bodyStrong" color={selected ? 'primaryOnSoft' : 'text'}>
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text variant="caption" color={selected ? 'primaryOnSoft' : 'textSecondary'}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? <Icon name="check" size="sm" color="primaryOnSoft" /> : null}
                </Pressable>
              );
            })}
          </View>

          {category ? (
            <>
              <View style={styles.block}>
                <SectionHeader title="How much?" />
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
                  placeholder="0.00"
                  icon="credit-card"
                  hint={
                    category.minimum_amount > 0
                      ? `Minimum ${formatMoney(category.minimum_amount, category.currency)}.`
                      : undefined
                  }
                />

                {category.recurring_supported ? (
                  <View style={styles.recurrence}>
                    <SegmentedControl
                      label="How often"
                      value={recurrence}
                      onChange={setRecurrence}
                      options={[
                        { value: 'one_time', label: 'One-off' },
                        { value: 'monthly', label: 'Every month' },
                      ]}
                    />
                  </View>
                ) : (
                  <Text variant="caption" color="textTertiary">
                    This category accepts one-off gifts only.
                  </Text>
                )}
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
                  label={demoMode ? 'Continue (demo)' : 'Continue to payment'}
                  fullWidth
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

                <Text variant="caption" color="textTertiary">
                  Payment is handled on the provider’s own secure page. Kingdom Heralds does not see
                  or store your card details, and this app never asks for them.
                </Text>
              </View>
            </>
          ) : null}
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingHorizontal: space.gutter,
    gap: space.md,
    paddingBottom: space.md,
  },
  categories: {
    paddingHorizontal: space.gutter,
    gap: space.sm,
    paddingBottom: space.lg,
  },
  category: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  recurrence: {
    alignSelf: 'flex-start',
  },
  offlineNote: {
    paddingTop: space.xl,
  },
});

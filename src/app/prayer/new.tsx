import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeError, fieldError } from '@/api/errors';
import { queryKeys } from '@/api/query-client';
import { type PrayerVisibility } from '@/api/schemas';
import { AuthShell } from '@/components/app/auth-shell';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useRuntimeConfig } from '@/config/runtime';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { submitPrayerRequest } from '@/features/prayer/api';
import { prayerVisibilityLabel } from '@/lib/format';
import { prayerRequestSchema, validate, type FieldErrors } from '@/lib/validation';

const options: PrayerVisibility[] = ['pastoral_team', 'prayer_team', 'prayer_community'];

export default function NewPrayerRequestScreen() {
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const demoMode = useRuntimeConfig((state) => state.apiMode) === 'demo';

  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<PrayerVisibility>('pastoral_team');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = useMutation({
    mutationFn: () => submitPrayerRequest({ body, visibility, isAnonymous }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.prayerRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
    onError: (error) => setErrors({ body: fieldError(error, 'body') }),
  });

  if (submit.isSuccess) {
    const chosen = prayerVisibilityLabel(submit.data.visibility);
    return (
      <AuthShell
        title="Your request has been sent"
        description={`It went to: ${chosen.label.toLowerCase()}. ${chosen.description}`}
      >
        {demoMode ? (
          <Banner
            tone="warning"
            title="Demo mode"
            message="Nothing was sent to a church. This request exists only on this device, in the demo data."
          />
        ) : (
          <Banner
            tone="success"
            icon="check-circle"
            message="You can follow its status, add an update, or withdraw it from the prayer screen."
          />
        )}
        <View style={styles.actions}>
          <Button label="Back to prayer" fullWidth onPress={() => router.replace('/prayer')} />
          <Button
            label="Send another"
            variant="ghost"
            fullWidth
            onPress={() => {
              setBody('');
              submit.reset();
            }}
          />
        </View>
      </AuthShell>
    );
  }

  const described = submit.error ? describeError(submit.error) : null;

  return (
    <AuthShell
      title="Prayer request"
      description="Write as much or as little as you want. You choose who reads it."
    >
      {described && !errors.body ? (
        <Banner tone="danger" title={described.title} message={described.message} />
      ) : null}

      <TextField
        label="What would you like prayer for?"
        value={body}
        onChangeText={setBody}
        error={errors.body}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        maxLength={2000}
        hint={`${body.length}/2000`}
      />

      <View style={styles.visibility}>
        <Text variant="metaStrong" color="textSecondary">
          Who can see this?
        </Text>
        {options.map((option) => {
          const label = prayerVisibilityLabel(option);
          const selected = visibility === option;
          return (
            <Pressable
              key={option}
              onPress={() => setVisibility(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${label.label}. ${label.description}`}
              feedback="none"
              style={[
                styles.option,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : 'transparent',
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selected ? colors.primary : colors.borderStrong,
                    backgroundColor: selected ? colors.primary : 'transparent',
                  },
                ]}
              >
                {selected ? <Icon name="check" size="xs" color="textOnAccent" /> : null}
              </View>
              <View style={styles.optionText}>
                <Text variant="bodyStrong" color={selected ? 'primaryOnSoft' : 'text'}>
                  {label.label}
                </Text>
                <Text variant="caption" color={selected ? 'primaryOnSoft' : 'textSecondary'}>
                  {label.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setIsAnonymous((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isAnonymous }}
        accessibilityLabel="Send without my name"
        feedback="none"
        style={styles.anonymous}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: colors.borderStrong,
              backgroundColor: isAnonymous ? colors.primary : 'transparent',
            },
          ]}
        >
          {isAnonymous ? <Icon name="check" size="xs" color="textOnAccent" /> : null}
        </View>
        <View style={styles.optionText}>
          <Text variant="body">Send without my name</Text>
          <Text variant="caption" color="textTertiary">
            The church still knows the request came from your account, so the pastoral team can
            follow up if you ask them to.
          </Text>
        </View>
      </Pressable>

      <Button
        label="Send request"
        fullWidth
        loading={submit.isPending}
        onPress={() => {
          const result = validate(prayerRequestSchema, { body, visibility, isAnonymous });
          if (!result.ok) {
            setErrors(result.errors);
            return;
          }
          setErrors({});
          submit.mutate();
        }}
      />

      <Text variant="caption" color="textTertiary">
        Prayer requests are treated as sensitive information. They are not shown in search, feeds or
        notifications to other members. The church’s privacy policy explains how long they are kept.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  visibility: {
    gap: space.sm,
  },
  option: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    padding: space.lg,
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  anonymous: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  actions: {
    gap: space.sm,
  },
});

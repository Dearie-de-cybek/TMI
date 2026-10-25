import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { AuthShell } from '@/components/app/auth-shell';
import { useToast } from '@/components/app/toast';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chips';
import { Skeleton } from '@/components/ui/skeleton';
import { describeError } from '@/api/errors';
import { space } from '@/design/tokens';
import { fetchInterestOptions, updateProfile } from '@/features/auth/api';
import { useAuth } from '@/features/auth/store';

/**
 * Optional profile completion, shown once after registration.
 *
 * Deliberately short and skippable: it informs what Home leads with, nothing
 * more, and no feature is withheld from a member who skips it.
 */
export default function InterestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const member = useAuth((state) => state.member);
  const setMember = useAuth((state) => state.setMember);

  const [selected, setSelected] = useState<string[]>(member?.interests ?? []);

  const options = useQuery({
    queryKey: queryKeys.interests,
    queryFn: fetchInterestOptions,
    staleTime: 10 * 60_000,
  });

  const save = useMutation({
    mutationFn: () => updateProfile({ interests: selected }),
    onSuccess: (updated) => {
      setMember(updated);
      toast('Saved.', { tone: 'success', icon: 'check' });
      router.replace('/');
    },
  });

  function toggle(interest: string) {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  const described = save.error ? describeError(save.error) : null;

  return (
    <AuthShell
      title="What are you here for?"
      description="Pick anything that applies and Home will lead with it. You can change this later in your profile, or skip it entirely."
    >
      {described ? <Banner tone="danger" title={described.title} message={described.message} /> : null}

      {options.isPending ? (
        <View style={styles.loading}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} width={110} height={36} />
          ))}
        </View>
      ) : options.isError ? (
        <Banner
          tone="warning"
          title="Could not load the list"
          message="You can skip this and set your interests later from your profile."
          action={{ label: 'Try again', onPress: () => void options.refetch() }}
        />
      ) : (
        <View style={styles.chips}>
          {(options.data ?? []).map((interest) => (
            <Chip
              key={interest}
              label={interest}
              selected={selected.includes(interest)}
              onPress={() => toggle(interest)}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Button
          label="Save and continue"
          fullWidth
          loading={save.isPending}
          disabled={options.isPending}
          onPress={() => save.mutate()}
        />
        <Button label="Skip for now" variant="ghost" fullWidth onPress={() => router.replace('/')} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  loading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  actions: {
    gap: space.sm,
    paddingTop: space.md,
  },
});

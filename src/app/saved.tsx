import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native';

import { queryKeys } from '@/api/query-client';
import { SignInPrompt } from '@/components/app/sign-in-prompt';
import { SermonRow } from '@/components/content/rows';
import { NavBar } from '@/components/ui/header';
import { Rule, Screen, ScreenScroll } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { space } from '@/design/tokens';
import { useIsSignedIn } from '@/features/auth/use-require-auth';
import { fetchSavedContent } from '@/features/sermons/api';

export default function SavedScreen() {
  const router = useRouter();
  const signedIn = useIsSignedIn();

  const saved = useQuery({
    queryKey: queryKeys.saved,
    queryFn: fetchSavedContent,
    enabled: signedIn,
  });

  if (!signedIn) {
    return (
      <Screen>
        <NavBar title="Saved" />
        <ScreenScroll padded>
          <SignInPrompt
            title="Saved teaching lives with your account"
            message="Sign in and anything you save is waiting for you on every device you use."
            reason="save"
            next="/saved"
          />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <NavBar title="Saved" />
      {saved.isPending ? (
        <SkeletonList count={5} />
      ) : saved.isError ? (
        <ErrorState error={saved.error} onRetry={() => void saved.refetch()} />
      ) : (
        <FlatList
          data={saved.data.sermons}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Rule inset={space.gutter} />}
          refreshing={saved.isRefetching}
          onRefresh={() => void saved.refetch()}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark"
              title="Nothing saved yet"
              message="Tap the bookmark on a sermon and it will be here, ready for when you have time."
              action={{ label: 'Browse sermons', onPress: () => router.push('/sermons') }}
            />
          }
          renderItem={({ item }) => (
            <SermonRow sermon={item} onPress={() => router.push(`/sermons/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

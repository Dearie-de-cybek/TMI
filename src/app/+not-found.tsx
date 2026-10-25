import { useRouter } from 'expo-router';

import { NavBar } from '@/components/ui/header';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/states';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <NavBar />
      <EmptyState
        icon="compass"
        title="That page does not exist"
        message="The link may be out of date, or the content may have been unpublished by the church."
        action={{ label: 'Go to Home', onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}

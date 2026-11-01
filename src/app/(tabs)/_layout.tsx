import { Tabs } from 'expo-router/js-tabs';

import { ChurchTabBar } from '@/components/app/tab-bar';

/**
 * Four destinations in the bar: Home, Discover, Give, Me. Community still lives
 * at `/community` but is reached from Discover and Me, so the bar stays short.
 * Everything else — sermons, courses, events, prayer, announcements, giving
 * history, settings — is reached from these through nested navigation.
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <ChurchTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="community" options={{ title: 'Community', href: null }} />
      <Tabs.Screen name="give" options={{ title: 'Give' }} />
      <Tabs.Screen name="profile" options={{ title: 'Me' }} />
    </Tabs>
  );
}

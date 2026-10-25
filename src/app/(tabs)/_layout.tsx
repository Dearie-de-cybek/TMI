import { Tabs } from 'expo-router/js-tabs';

import { ChurchTabBar } from '@/components/app/tab-bar';

/**
 * Five destinations, as agreed: Home, Discover, Community, Give, Profile.
 * Everything else — sermons, courses, events, prayer, announcements, giving
 * history, settings — is reached from these through nested navigation.
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <ChurchTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="give" options={{ title: 'Give' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

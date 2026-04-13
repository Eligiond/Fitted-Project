import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="wardrobe" />
      <Tabs.Screen name="outfits" />
      <Tabs.Screen name="planner" />
      <Tabs.Screen name="feed" />
    </Tabs>
  );
}

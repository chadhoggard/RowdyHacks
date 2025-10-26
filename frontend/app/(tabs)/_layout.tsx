import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="rocket" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranch"
        options={{
          title: 'Ranch',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="barn" size={size} color={color} />,
          
          tabBarButton: (props) => (
            <Pressable
              {...props} 
              onPress={(e) => {
                e.preventDefault();

                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                Alert.alert(
                  "How to Visit a Ranch",
                  "Please select a ranch from the Home screen first."
                );
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
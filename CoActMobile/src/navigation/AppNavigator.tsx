/**
 * AppNavigator — Main navigation structure (Auth vs Main app).
 */
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PracticeScreen from '../screens/PracticeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationScreen from '../screens/ConversationScreen';
import ReportScreen from '../screens/ReportScreen';
import { BottomTabBar } from '../components/BottomTabBar';

import { useSessionStore } from '../stores/useSessionStore';

import { Colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props: any) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="PracticeTab" component={PracticeScreen} options={{ title: 'Practice' }} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, setAuth } = useSessionStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockSession = { access_token: 'dummy', user: mockUser };
    setAuth(mockUser as any, mockSession as any);
    setLoading(false);

    return () => {};
  }, [setAuth]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Authenticated Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="Conversation" 
              component={ConversationScreen} 
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen 
              name="Report" 
              component={ReportScreen} 
            />
          </>
        ) : (
          // Unauthenticated Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

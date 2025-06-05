import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DefaultScreen from '../screens/DefaultScreen';
import PrepareScreen from '../screens/PrepareScreen';
import QuestionScreen from '../screens/QuestionScreen';
import AdminScreen from '../screens/AdminScreen';
import { RootStackParamList } from './types';
import { usePlayerState } from '../hooks/usePlayerState';
import { useWebSocketContext } from '../context/WebSocketContext';
import { iQuizSate } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { playerData } = usePlayerState();
  const { quizState, status: wsStatus } = useWebSocketContext();
  const [lastKnownState, setLastKnownState] = useState<iQuizSate | null>(null);

  // Keep track of the last known valid state
  useEffect(() => {
    if (quizState) {
      setLastKnownState(quizState);
    }
  }, [quizState]);

  // Use the effective state (current or last known)
  const effectiveState = quizState || lastKnownState;

  // Log navigation state for debugging
  useEffect(() => {
    if (navigationRef.current?.isReady()) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      console.log('Navigation - Current route:', currentRoute);
      console.log('Navigation - effectiveState:', effectiveState?.state);
      console.log('Navigation - playerData.isActive:', playerData?.isActive);
      console.log('Navigation - WebSocket status:', wsStatus);
    }
  }, [effectiveState, playerData, wsStatus]);

  // Handle navigation based on WebSocket state
  useEffect(() => {
    if (!navigationRef.current?.isReady()) return;

    // Don't navigate if no data
    if (!playerData || !effectiveState) return;

    // If player is not active, always go to default screen
    if (!playerData.isActive) {
      navigationRef.current?.navigate('Default');
      return;
    }

    // Navigate based on quiz state
    const currentRoute = navigationRef.current?.getCurrentRoute()?.name;

    switch (effectiveState.state) {
      case 'QUESTION_PRE':
        // Allow navigation to Prepare only if not already there
        if (currentRoute !== 'Prepare') {
          console.log('Navigating to Prepare screen based on QUESTION_PRE state');
          navigationRef.current?.navigate('Prepare');
        }
        break;
      case 'QUESTION_OPEN':
        // Navigate to Question screen when question opens
        if (currentRoute !== 'Question') {
          console.log('Navigating to Question screen based on QUESTION_OPEN state');
          navigationRef.current?.navigate('Question');
        }
        break;
      case 'IDLE':
      case 'QUESTION_CLOSED':
      case 'QUESTION_COMPLETE':
      case 'BUYOUT_COMPLETE':
        // Return to Default when question is complete or game is idle
        if (currentRoute !== 'Default') {
          console.log('Navigating to Default screen based on state:', effectiveState.state);
          navigationRef.current?.navigate('Default');
        }
        break;
      // Other states don't trigger navigation changes
      default:
        console.log('No navigation change for state:', effectiveState.state);
    }
  }, [effectiveState, playerData, navigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Default"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' }
        }}
      >
        <Stack.Screen name="Default" component={DefaultScreen} />
        <Stack.Screen name="Prepare" component={PrepareScreen} />
        <Stack.Screen name="Question" component={QuestionScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

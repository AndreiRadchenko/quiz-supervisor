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
    if (!playerData || !effectiveState) return;

    if (!playerData.isActive) {
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'Default' }],
      });
      return;
    }

    const currentRoute = navigationRef.current?.getCurrentRoute()?.name;

    switch (effectiveState.state) {
      case 'QUESTION_PRE':
        if (currentRoute !== 'Prepare') {
          console.log('Navigating to Prepare screen');
          navigationRef.current?.navigate('Prepare');
        }
        break;

      case 'QUESTION_OPEN':
      case 'BUYOUT_OPEN':
        if (currentRoute !== 'Question') {
          console.log('Resetting to Question screen to force remount');
          navigationRef.current?.reset({
            index: 0,
            routes: [{
              name: 'Question',
              params: {
                timestamp: Date.now(),
                tierNumber: effectiveState.tierNumber,
                state: effectiveState.state
              }
            }],
          });
        }
        break;

      case 'IDLE':
      case 'QUESTION_CLOSED':
      case 'QUESTION_COMPLETE':
      case 'BUYOUT_COMPLETE':
        if (currentRoute !== 'Default') {
          console.log('Resetting to Default screen');
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'Default' }],
          });
        }
        break;

      default:
        console.log('No navigation change for state:', effectiveState.state);
    }
  }, [effectiveState, playerData]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Default"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#1a1a1a' },
        }}
      >
        <Stack.Screen name="Default" component={DefaultScreen} />
        <Stack.Screen name="Prepare" component={PrepareScreen} />
        <Stack.Screen
          name="Question"
          component={QuestionScreen}
        />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

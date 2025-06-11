import { StatusBar } from 'expo-status-bar';
import './src/i18n'; // Initialize i18n
import { AppProvider } from './src/context/AppContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { ThemeProvider } from './src/theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/store/queryClient';
import AppNavigator from './src/navigation'; // Import the AppNavigator
import { View } from 'react-native'; // Add View import
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';


export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider forcedColorScheme="dark">
        <AppProvider>
          <WebSocketProvider>
            <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
              <AppNavigator /> {/* Render the AppNavigator */}
              <StatusBar style="light" hidden={true} />
            </View>
          </WebSocketProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

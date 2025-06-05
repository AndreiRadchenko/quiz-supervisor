import { StatusBar } from 'expo-status-bar';
import './src/i18n'; // Initialize i18n
import { AppProvider } from './src/context/AppContext';
import { SSEProvider } from './src/context/SSEContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/store/queryClient';
import AppNavigator from './src/navigation'; // Import the AppNavigator
import { View } from 'react-native'; // Add View import
import { enableFullscreen } from './src/utils/fullscreen';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Enable fullscreen mode when app starts
    enableFullscreen();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WebSocketProvider>
          <SSEProvider enabled={true}>
            <View style={{ flex: 1 }}>
              <AppNavigator /> {/* Render the AppNavigator */}
              <StatusBar style="auto" hidden={true} />
            </View>
          </SSEProvider>
        </WebSocketProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import './src/i18n'; // Initialize i18n
import { AppProvider } from './src/context/AppContext';
import { WebSocketProvider } from './src/context/WebSocketContext';
import { ThemeProvider } from './src/theme';
import AppNavigator from './src/navigation'; // Import the AppNavigator

// import 'expo-dev-client';

export default function App() {
  return (
    <ThemeProvider forcedColorScheme="dark">
      <AppProvider>
        <WebSocketProvider>
          <GestureHandlerRootView
            style={{ flex: 1, backgroundColor: '#1a1a1a' }}
          >
            <AppNavigator /> {/* Render the AppNavigator */}
            <StatusBar style="light" hidden={true} />
          </GestureHandlerRootView>
        </WebSocketProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

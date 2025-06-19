import { Platform, StatusBar } from 'react-native';

export const enableFullscreen = () => {
  if (Platform.OS === 'android') {
    // Hide the status bar on Android
    StatusBar.setHidden(true, 'fade');

    // Set immersive mode (hides navigation bar as well)
    if (StatusBar.setBarStyle) {
      StatusBar.setBarStyle('dark-content', true);
    }

    // For Android, we can also set the background color to be transparent
    if (StatusBar.setBackgroundColor) {
      StatusBar.setBackgroundColor('transparent', true);
    }

    // Enable immersive mode if available
    if (StatusBar.setTranslucent) {
      StatusBar.setTranslucent(true);
    }

    // Additional Android-specific fullscreen handling
    try {
      // Use native methods if available for better immersive mode
      const { NativeModules } = require('react-native');
      if (NativeModules.StatusBarManager) {
        NativeModules.StatusBarManager.setHidden(true);
      }
    } catch (error) {
      console.log('Native fullscreen methods not available:', error);
    }
  } else if (Platform.OS === 'ios') {
    // iOS handling - status bar is already hidden via app.json
    StatusBar.setHidden(true, 'fade');
  }
};

export const disableFullscreen = () => {
  if (Platform.OS === 'android') {
    StatusBar.setHidden(false, 'fade');
    if (StatusBar.setBackgroundColor) {
      StatusBar.setBackgroundColor('#000000', true);
    }
  } else if (Platform.OS === 'ios') {
    StatusBar.setHidden(false, 'fade');
  }
};

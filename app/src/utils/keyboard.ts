import { Platform, Keyboard, KeyboardTypeOptions } from 'react-native';
import * as Localization from 'expo-localization';

export const getSimpleKeyboardType = (questionType: 'TEXT' | 'TEXT NUMERIC', locale?: string): KeyboardTypeOptions => {
  if (questionType === 'TEXT NUMERIC') {
    // Use numeric for numbers - simplest numeric keyboard
    return 'decimal-pad';
  }
  
  // For text, use the default keyboard which will respect system locale
  return 'default';
};

export const ensureKeyboardLocale = (locale: string) => {
  // On React Native, the keyboard automatically uses the current system locale
  // The keyboard will respect the device's current input language
  if (Platform.OS === 'ios') {
    // iOS automatically uses the current keyboard language
    return;
  } else if (Platform.OS === 'android') {
    // Android also automatically uses the current input method
    return;
  }
};

export const getKeyboardProps = (questionType: 'TEXT' | 'TEXT NUMERIC', locale?: string) => {
  return {
    keyboardType: getSimpleKeyboardType(questionType, locale),
    autoCorrect: false,
    autoCapitalize: 'none' as const,
    spellCheck: false,
    autoComplete: 'off' as const,
    dataDetectorTypes: 'none' as const,
    returnKeyType: 'done' as const,
    blurOnSubmit: true,
    importantForAutofill: 'no' as const,
  };
};

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import uk from './locales/uk.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    const storedLanguage = await AsyncStorage.getItem(STORE_LANGUAGE_KEY);
    if (storedLanguage) {
      return callback(storedLanguage);
    }
    return callback(Localization.locale.split('-')[0]);
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: en,
      },
      uk: {
        translation: uk,
      },
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    react: {
      useSuspense: false, // Using suspense for translations can be tricky in React Native
    },
  });

export default i18n;

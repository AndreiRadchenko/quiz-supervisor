import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'; // Added ScrollView
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext'; // Corrected path
import { Picker, PickerProps } from '@react-native-picker/picker'; // Import PickerProps
import { useNavigation } from '@react-navigation/native'; // Added useNavigation
import { StackNavigationProp } from '@react-navigation/stack'; // Added StackNavigationProp
import { RootStackParamList } from '../navigation/types'; // Added RootStackParamList
import { useWebSocketContext } from '../context/WebSocketContext'; // Import WebSocket context

const ADMIN_PASSWORD = '12345678'; // Hardcoded for now, move to env or config

type Locale = 'en' | 'uk'; // Explicitly define Locale type

const AdminScreen = () => { // Removed navigation prop, using useNavigation instead
  const { t, i18n } = useTranslation();
  const { seatNumber, serverIP, locale, setSeatNumber, setServerIP, setLocale } = useAppContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Admin'>>(); // Added navigation
  const { status: wsStatus } = useWebSocketContext(); // Get WebSocket status

  const [inputSeatNumber, setInputSeatNumber] = useState(seatNumber?.toString() || '');
  const [inputServerIP, setInputServerIP] = useState(serverIP || '');
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale); // Use Locale type for state
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState('');

  useEffect(() => {
    setInputSeatNumber(seatNumber?.toString() || '');
    setInputServerIP(serverIP || '');
    setSelectedLocale(locale);
  }, [seatNumber, serverIP, locale]);

  const handleSave = () => {
    const newSeat = parseInt(inputSeatNumber, 10);
    if (isNaN(newSeat) || newSeat <= 0) {
      Alert.alert(t('adminScreen.errorTitle'), t('adminScreen.invalidSeat'));
      return;
    }
    // Basic IP validation (very simple)
    if (!inputServerIP.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && !inputServerIP.includes('localhost')) {
        Alert.alert(t('adminScreen.errorTitle'), t('adminScreen.invalidIP'));
        return;
    }

    setSeatNumber(newSeat);
    setServerIP(inputServerIP);
    setLocale(selectedLocale);
    i18n.changeLanguage(selectedLocale);
    Alert.alert(t('adminScreen.successTitle'), t('adminScreen.settingsSaved'));
    navigation.goBack(); // Or navigate to Default screen
  };

  const handlePasswordSubmit = () => {
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsPasswordVerified(true);
    } else {
      Alert.alert(t('adminScreen.errorTitle'), t('adminScreen.incorrectPassword'));
      setPasswordAttempt('');
    }
  };

  if (!isPasswordVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('adminScreen.enterPassword')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('adminScreen.passwordPlaceholder')}
          value={passwordAttempt}
          onChangeText={setPasswordAttempt}
          secureTextEntry
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit={true}
        />
        <Button title={t('adminScreen.submitPassword')} onPress={handlePasswordSubmit} />
        <View style={styles.spacer} />
        <Button title={t('adminScreen.goBack')} onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('adminTitle')}</Text>

      <Text style={styles.label}>{t('serverIP')}</Text>
      <TextInput
        style={styles.input}
        value={inputServerIP}
        onChangeText={setInputServerIP}
        placeholder="e.g., 192.168.1.100"
        keyboardType="url" // Offers . and numbers
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="next"
        blurOnSubmit={false}
      />

      <Text style={styles.label}>{t('seatNumber')}</Text>
      <TextInput
        style={styles.input}
        value={inputSeatNumber}
        onChangeText={setInputSeatNumber}
        placeholder="e.g., 1"
        keyboardType="number-pad"
        returnKeyType="done"
        blurOnSubmit={true}
      />

      <Text style={styles.label}>{t('language')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLocale}
          onValueChange={(itemValue: Locale, itemIndex: number) => { // Type itemValue explicitly
            setSelectedLocale(itemValue);
          }}
          style={styles.picker}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Українська" value="uk" />
        </Picker>
      </View>

      <Button title={t('save')} onPress={handleSave} />
      <View style={styles.spacer} />
      <Button title={t('adminScreen.goBack')} onPress={() => navigation.goBack()} />

      {/* WebSocket Status Display */}
      <View style={styles.wsStatusContainer}>
        <Text style={styles.wsStatusText}>
          {t('adminScreen.websocketStatus')}: {wsStatus}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { // Added for ScrollView
    flex: 1,
  },
  container: {
    flexGrow: 1, // Changed to flexGrow for ScrollView
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
  picker: {
    // height: 50, // Adjust as needed, might not be respected on all platforms
  },
  spacer: {
    height: 10,
  },
  wsStatusContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  wsStatusText: {
    fontSize: 16,
    fontWeight: '500',
  }
});

export default AdminScreen;

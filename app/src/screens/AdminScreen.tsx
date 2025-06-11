import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native'; // Added ScrollView
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext'; // Corrected path
import { Picker, PickerProps } from '@react-native-picker/picker'; // Import PickerProps
import { useNavigation } from '@react-navigation/native'; // Added useNavigation
import { StackNavigationProp } from '@react-navigation/stack'; // Added StackNavigationProp
import { RootStackParamList } from '../navigation/types'; // Added RootStackParamList
import { useWebSocketContext } from '../context/WebSocketContext'; // Import WebSocket context
import { useTheme } from '../theme';

const ADMIN_PASSWORD = '12345678'; // Hardcoded for now, move to env or config

type Locale = 'en' | 'uk'; // Explicitly define Locale type

const AdminScreen = () => { // Removed navigation prop, using useNavigation instead
  const { t, i18n } = useTranslation();
  const { seatNumber, serverIP, locale, setSeatNumber, setServerIP, setLocale } = useAppContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Admin'>>(); // Added navigation
  const { theme } = useTheme();
  
  // Get both connection statuses
  const { status: wsStatus } = useWebSocketContext();

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

  // Create styles using theme
  const styles = StyleSheet.create({
    scrollContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    title: {
      ...theme.components.text.heading,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    label: {
      ...theme.components.text.body,
      fontWeight: theme.fontWeight.medium,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    input: {
      ...theme.components.input,
      marginBottom: theme.spacing.md,
    },
    pickerContainer: {
      backgroundColor: theme.colors.input,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    picker: {
      color: theme.colors.foreground,
    },
    spacer: {
      height: theme.spacing.sm,
    },
    statusContainer: {
      ...theme.components.card,
      marginTop: theme.spacing.lg,
    },
    statusTitle: {
      ...theme.components.text.subheading,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    statusLabel: {
      ...theme.components.text.body,
    },
    statusValue: {
      ...theme.components.text.body,
      fontWeight: theme.fontWeight.medium,
    },
    connected: {
      color: '#10b981', // Green
    },
    disconnected: {
      color: theme.colors.destructive,
    },
    connecting: {
      color: theme.colors.accent,
    },
    error: {
      color: theme.colors.destructive,
    },
  });

  if (!isPasswordVerified) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('adminScreen.enterPassword')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('adminScreen.passwordPlaceholder')}
          placeholderTextColor={theme.colors.mutedForeground}
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
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="url"
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
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="number-pad"
        returnKeyType="done"
        blurOnSubmit={true}
      />

      <Text style={styles.label}>{t('language')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedLocale}
          onValueChange={(itemValue: Locale, itemIndex: number) => {
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

      {/* Connection Status Display */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Connection Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>WebSocket:</Text>
          <Text style={[
            styles.statusValue,
            wsStatus === 'connected' && styles.connected,
            wsStatus === 'disconnected' && styles.disconnected,
            wsStatus === 'connecting' && styles.connecting,
            wsStatus === 'error' && styles.error,
          ]}>
            {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default AdminScreen;

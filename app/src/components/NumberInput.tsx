import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Dimensions } from 'react-native';
import { useTheme } from '../theme';

interface NumberInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onValueChange,
  placeholder = "Enter number...",
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
    },
    inputContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.foreground,
      textAlign: 'center',
      minHeight: 56,
      width: '98%',
      marginInline: 'auto',
    },
    keyboardContainer: {
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
    
    },
    keyboardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
      width: '97%',
      marginInline: 'auto',
    },
    keyButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      minHeight: 48,
      flex: 1,
      marginHorizontal: theme.spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    keyButtonSpecial: {
      backgroundColor: theme.colors.secondary,
    },
    keyButtonBackspace: {
      backgroundColor: theme.colors.destructive,
    },
    keyButtonText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primaryForeground,
    },
    keyButtonTextSpecial: {
      color: theme.colors.secondaryForeground,
    },
    keyButtonTextBackspace: {
      color: theme.colors.destructiveForeground,
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  const handleKeyPress = useCallback((key: string) => {
    if (disabled) return;

    if (key === 'backspace') {
      onValueChange(value.slice(0, -1));
    } else if (key === '.') {
      // Only allow one decimal point
      if (!value.includes('.')) {
        onValueChange(value + key);
      }
    } else if (key === '-') {
      // Only allow dash at the beginning and only one
      if (value === '' || (value.length === 1 && value === '-')) {
        if (value === '-') {
          onValueChange(''); // Remove dash if already there
        } else {
          onValueChange('-' + value);
        }
      }
    } else {
      // Numbers 0-9
      onValueChange(value + key);
    }
  }, [value, onValueChange, disabled]);

  const renderKeyButton = (
    key: string, 
    text: string, 
    style?: 'special' | 'backspace'
  ) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.keyButton,
        style === 'special' && styles.keyButtonSpecial,
        style === 'backspace' && styles.keyButtonBackspace,
        disabled && styles.disabledButton,
      ]}
      onPress={() => handleKeyPress(key)}
      disabled={disabled}
    >
      <Text
        style={[
          styles.keyButtonText,
          style === 'special' && styles.keyButtonTextSpecial,
          style === 'backspace' && styles.keyButtonTextBackspace,
        ]}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Text Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          editable={false} // Prevent system keyboard
          showSoftInputOnFocus={false} // Prevent system keyboard on Android
          caretHidden={true} // Hide cursor since we're using custom keyboard
        />
      </View>

      {/* Custom Number Keyboard */}
      <View style={styles.keyboardContainer}>
        {/* Row 1: 1, 2, 3 */}
        <View style={styles.keyboardRow}>
          {renderKeyButton('1', '1')}
          {renderKeyButton('2', '2')}
          {renderKeyButton('3', '3')}
        </View>

        {/* Row 2: 4, 5, 6 */}
        <View style={styles.keyboardRow}>
          {renderKeyButton('4', '4')}
          {renderKeyButton('5', '5')}
          {renderKeyButton('6', '6')}
        </View>

        {/* Row 3: 7, 8, 9 */}
        <View style={styles.keyboardRow}>
          {renderKeyButton('7', '7')}
          {renderKeyButton('8', '8')}
          {renderKeyButton('9', '9')}
        </View>

        {/* Row 4: -, 0, ., Backspace */}
        <View style={styles.keyboardRow}>
          {renderKeyButton('-', '−', 'special')}
          {renderKeyButton('0', '0')}
          {renderKeyButton('.', '.', 'special')}
          {renderKeyButton('backspace', '⌫', 'backspace')}
        </View>
      </View>
    </View>
  );
};
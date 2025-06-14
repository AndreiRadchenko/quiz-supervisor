import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput as RNTextInput, Dimensions, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

interface CustomTextInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  locale: string;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onValueChange,
  placeholder = "Enter text...",
  disabled = false,
  locale,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const textInputRef = useRef<RNTextInput>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const backspaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Get alphabet based on locale
  const alphabet = t('keyboard.alphabet', { returnObjects: true }) as string[];

  const keyboardPadding = theme.spacing.sm;
  const keyboardWidth = screenWidth - (keyboardPadding * 2);
  const buttonSpacing = 2;
  
  // Calculate button dimensions for consistent sizing
  const isUkrainian = locale === 'uk';
  const row1ButtonCount = isUkrainian ? 11 : 10;
  const row2ButtonCount = isUkrainian ? 11 : 9;
  const row3ButtonCount = isUkrainian ? 10 : 7; // Updated to 10 for Ukrainian
  const specialRowButtonCount = 4;
  
  // Base button width - use the row with most buttons as reference
  const maxButtonsInRow = Math.max(row1ButtonCount, row2ButtonCount);
  const baseButtonWidth = (keyboardWidth - (buttonSpacing * (maxButtonsInRow - 1))) / maxButtonsInRow;
  
  // Make letter buttons narrower and more rectangular
  const letterButtonWidth = baseButtonWidth * 0.75; // 25% narrower than before
  
  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 60,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      borderTopColor: theme.colors.border,
      paddingBottom: 0,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    inputContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 0,
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.normal,
      color: theme.colors.foreground,
      minHeight: 56,
      width: '98%',
      marginInline: 'auto',
    },
    keyboardContainer: {
      backgroundColor: theme.colors.card,
      paddingHorizontal: keyboardPadding,
      paddingTop: 0, // Increased padding for more height
      paddingBottom: 0,
      minHeight: 240, // Increased overall keyboard height
      height: screenHeight * 0.27, // Set to 40% of screen height
      borderBottomLeftRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
    },
    keyboardRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: theme.spacing.md, // Increased spacing between rows
      // height: 50, // Increased row height for taller buttons
      gap: buttonSpacing, // Use gap for consistent spacing
      width: '92%',
      marginInline: 'auto',
    },
    keyButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
      paddingVertical: theme.spacing.md, // Increased for taller buttons
      minHeight: 48, // Increased height for taller rectangular buttons
      // height: 48,
      marginHorizontal: buttonSpacing / 2,
      flexGrow: 1,
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
      width: letterButtonWidth, // Use narrower width for letter buttons
    },
    keyButtonSpecial: {
      backgroundColor: theme.colors.secondary,
      width: letterButtonWidth, // Same size as letter buttons
      paddingVertical: theme.spacing.sm,
    },
    keyButtonBackspace: {
      backgroundColor: theme.colors.destructive,
      width: letterButtonWidth * 1.8, // Wider than letter buttons
    },
    keyButtonSpace: {
      backgroundColor: theme.colors.accent,
      width: letterButtonWidth * 4, // Much wider for space button
      paddingVertical: theme.spacing.sm,
    },
    keyButtonText: {
      fontSize: theme.fontSize.base, // Increased font size for better readability
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primaryForeground,
      textAlign: 'center',
    },
    keyButtonTextSpecial: {
      color: theme.colors.secondaryForeground,
    },
    keyButtonTextBackspace: {
      color: theme.colors.destructiveForeground,
    },
    keyButtonTextSpace: {
      color: theme.colors.accentForeground,
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  const handleKeyPress = useCallback((key: string) => {
    if (disabled) return;

    // Immediate visual feedback
    // setPressedKey(key);
    // setTimeout(() => setPressedKey(null), 10); // Quick feedback reset

    // Use requestAnimationFrame for immediate text update
    requestAnimationFrame(() => {
      if (key === 'backspace') {
        if (selectionStart > 0) {
          const newValue = value.slice(0, selectionStart - 1) + value.slice(selectionStart);
          const newCursorPos = selectionStart - 1;
          
          // Update value and cursor position simultaneously
          onValueChange(newValue);
          setSelectionStart(newCursorPos);
          
          // Force immediate text input update
          if (textInputRef.current) {
            textInputRef.current.setNativeProps({ 
              text: newValue,
              selection: { start: newCursorPos, end: newCursorPos }
            });
          }
        }
      } else {
        // Insert character at cursor position
        const newValue = value.slice(0, selectionStart) + key + value.slice(selectionStart);
        const newCursorPos = selectionStart + 1;
        
        // Update value and cursor position simultaneously
        onValueChange(newValue);
        setSelectionStart(newCursorPos);
        
        // Force immediate text input update
        if (textInputRef.current) {
          textInputRef.current.setNativeProps({ 
            text: newValue,
            selection: { start: newCursorPos, end: newCursorPos }
          });
        }
      }
    });
  }, [value, onValueChange, disabled, selectionStart]);

  const handleClearAll = useCallback(() => {
    if (disabled) return;
    
    // Clear all text
    onValueChange('');
    setSelectionStart(0);
    
    // Force immediate text input update
    if (textInputRef.current) {
      textInputRef.current.setNativeProps({ 
        text: '',
        selection: { start: 0, end: 0 }
      });
    }
  }, [onValueChange, disabled]);

  const handleBackspacePressIn = useCallback(() => {
    if (disabled) return;
    
    // Start the 2-second timer for clearing all text
    backspaceTimeoutRef.current = setTimeout(() => {
      handleClearAll();
    }, 1000); // 1 second
  }, [disabled, handleClearAll]);

  const handleBackspacePressOut = useCallback(() => {
    // Cancel the timer if backspace is released before 2 seconds
    if (backspaceTimeoutRef.current) {
      clearTimeout(backspaceTimeoutRef.current);
      backspaceTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (backspaceTimeoutRef.current) {
        clearTimeout(backspaceTimeoutRef.current);
      }
    };
  }, []);

  const handleTextInputPress = useCallback((event: any) => {
    if (disabled) return;
    
    // Focus the text input to show cursor
    textInputRef.current?.focus();
    
    // Get the selection position from the event
    const { nativeEvent } = event;
    if (nativeEvent.target) {
      // For React Native, we'll use a simple approach
      // Set selection to end by default, user can change it
      setSelectionStart(value.length);
    }
  }, [disabled, value.length]);

  const handleSelectionChange = useCallback((event: any) => {
    if (!disabled) {
      const selection = event.nativeEvent.selection;
      setSelectionStart(selection.start);
    }
  }, [disabled]);

  const renderKeyButton = (
    key: string, 
    text: string, 
    style?: 'special' | 'backspace' | 'space'
  ) => {
    // const isPressed = pressedKey === key;
    
    // Special handling for backspace button with long press
    if (key === 'backspace') {
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.keyButton,
            styles.keyButtonBackspace,
            disabled && styles.disabledButton,
          ]}
          onPress={() => handleKeyPress(key)}
          onPressIn={handleBackspacePressIn}
          onPressOut={handleBackspacePressOut}
          disabled={disabled}
          activeOpacity={0.7}
          delayPressIn={0}
          delayPressOut={0}
        >
          <Text
            style={[
              styles.keyButtonText,
              styles.keyButtonTextBackspace,
            ]}
          >
            {text}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Regular button handling for all other keys
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.keyButton,
          style === 'special' && styles.keyButtonSpecial,
          style === 'space' && styles.keyButtonSpace,
          // isPressed && styles.keyButtonPressed, // Visual feedback when pressed
          disabled && styles.disabledButton,
        ]}
        onPress={() => handleKeyPress(key)}
        disabled={disabled}
        activeOpacity={0.7} // Faster opacity change
        delayPressIn={0} // Immediate press response
        delayPressOut={0} // Immediate release response
      >
        <Text
          style={[
            styles.keyButtonText,
            style === 'special' && styles.keyButtonTextSpecial,
            style === 'space' && styles.keyButtonTextSpace,
          ]}
        >
          {text}
        </Text>
      </TouchableOpacity>
    );
  };

  // Split alphabet into rows for QWERTY layout (iPhone style)
  const getKeyboardRows = () => {
    if (locale === 'uk') {
      // Ukrainian QWERTY layout - 11+11+10 layout for better distribution
      // We have 32 letters, so distribute as 11+11+10
      return [
        alphabet.slice(0, 11), // Row 1: 11 letters
        alphabet.slice(11, 22), // Row 2: 11 letters  
        alphabet.slice(22), // Row 3: remaining 10 letters
        [] // Row 4: Special characters (handled separately)
      ];
    } else {
      // English QWERTY layout - iPhone style 4 rows
      return [
        alphabet.slice(0, 10), // Row 1: q w e r t y u i o p (10 letters)
        alphabet.slice(10, 19), // Row 2: a s d f g h j k l (9 letters, centered)
        alphabet.slice(19, 26), // Row 3: z x c v b n m (7 letters)
        [] // Row 4: Special characters (handled separately)
      ];
    }
  };

  const keyboardRows = getKeyboardRows();

  // Memoize keyboard buttons to prevent unnecessary re-renders
  const memoizedKeyboard = useMemo(() => {
    return (
      <View style={styles.keyboardContainer}>
        {/* Row 1: First row of letters */}
        <View style={styles.keyboardRow}>
          {keyboardRows[0].map((letter) => renderKeyButton(letter, letter))}
        </View>

        {/* Row 2: Second row of letters */}
        <View style={styles.keyboardRow}>
          {keyboardRows[1].map((letter) => renderKeyButton(letter, letter))}
        </View>

        {/* Row 3: Third row of letters + backspace */}
        <View style={styles.keyboardRow}>
          {keyboardRows[2].map((letter) => renderKeyButton(letter, letter))}
          {renderKeyButton('backspace', '⌫', 'backspace')}
        </View>

        {/* Row 4: Special characters row */}
        <View style={styles.keyboardRow}>
          {renderKeyButton('.', '.', 'special')}
          {renderKeyButton(',', ',', 'special')}
          {renderKeyButton(' ', 'SPACE', 'space')}
          {renderKeyButton('-', '−', 'special')}
        </View>
      </View>
    );
  }, [keyboardRows, disabled, styles]);

  return (
    <View style={styles.container}>
      {/* Text Input Field */}
      <View style={styles.inputContainer}>
        <RNTextInput
          ref={textInputRef}
          style={styles.textInput}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.mutedForeground}
          editable={!disabled}
          showSoftInputOnFocus={false} // Prevent system keyboard
          onPress={handleTextInputPress}
          onSelectionChange={handleSelectionChange}
          selection={{ start: selectionStart, end: selectionStart }}
          underlineColorAndroid="transparent" // Disable underline for better performance
          autoCorrect={false} // Disable autocorrect for faster typing
          autoCapitalize="none" // Disable auto-capitalize for speed
          spellCheck={false} // Disable spell check for performance
          allowFontScaling={false} // Prevent font scaling for consistent performance
        />
      </View>

      {/* Custom Text Keyboard */}
      {memoizedKeyboard}
    </View>
  );
};
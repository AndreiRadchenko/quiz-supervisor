import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string; // Make optional for warning dialogs
  onConfirm: () => void;
  onCancel?: () => void; // Make optional for warning dialogs
  confirmButtonStyle?: 'primary' | 'destructive' | 'accent';
  isWarning?: boolean; // New prop to indicate warning dialog
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmButtonStyle = 'primary',
  isWarning = false,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    dialogContainer: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      width: '90%',
      // maxWidth: 400,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    title: {
      ...theme.components.text.heading,
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      color: theme.colors.cardForeground,
    },
    message: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      color: theme.colors.cardForeground,
      lineHeight: theme.fontSize.lg * 1.4,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: theme.colors.border,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    confirmButton: {
      backgroundColor: theme.colors.accent,
    },
    confirmButtonDestructive: {
      backgroundColor: theme.colors.destructive,
    },
    confirmButtonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    cancelButtonText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.foreground,
    },
    confirmButtonText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.accentForeground,
    },
    confirmButtonTextDestructive: {
      color: theme.colors.destructiveForeground,
    },
    confirmButtonTextPrimary: {
      color: theme.colors.primaryForeground,
    },
  });

  const getConfirmButtonStyle = () => {
    switch (confirmButtonStyle) {
      case 'destructive':
        return styles.confirmButtonDestructive;
      case 'primary':
        return styles.confirmButtonPrimary;
      case 'accent':
      default:
        return styles.confirmButton;
    }
  };

  const getConfirmButtonTextStyle = () => {
    switch (confirmButtonStyle) {
      case 'destructive':
        return styles.confirmButtonTextDestructive;
      case 'primary':
        return styles.confirmButtonTextPrimary;
      case 'accent':
      default:
        return styles.confirmButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={isWarning ? onConfirm : onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {!isWarning && cancelText && onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, getConfirmButtonStyle()]}
              onPress={onConfirm}
            >
              <Text
                style={[styles.confirmButtonText, getConfirmButtonTextStyle()]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

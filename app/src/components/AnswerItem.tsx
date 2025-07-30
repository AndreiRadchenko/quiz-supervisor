import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

interface AnswerItemProps {
  item: string;
  onSwipeLeft: (item: string) => void;
  onSwipeRight: (item: string) => void;
}

export const AnswerItem: React.FC<AnswerItemProps> = ({
  item,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.primaryActive,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    answerText: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.destructiveForeground,
      flex: 1,
      textAlign: 'center',
    },
    button: {
      width: 100,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.borderRadius.lg,
    },
    buttonCorrect: {
      backgroundColor: '#0e9467', // Green color for Correct
    },
    buttonIncorrect: {
      backgroundColor: theme.colors.destructive,
    },
    buttonText: {
      color: '#ffffff',
      fontWeight: theme.fontWeight.medium,
      fontSize: theme.fontSize.lg,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonIncorrect]}
          onPress={() => onSwipeRight(item)}
        >
          <Text style={styles.buttonText}>{t('defaultScreen.incorrect')}</Text>
        </TouchableOpacity>

        <Text style={styles.answerText}>{item}</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonCorrect]}
          onPress={() => onSwipeLeft(item)}
        >
          <Text style={styles.buttonText}>{t('defaultScreen.correct')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

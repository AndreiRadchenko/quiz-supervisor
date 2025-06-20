import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

interface QuizHeaderProps {
  tierLegend?: string;
  state?: string;
  questionLabel?: string;
  correctAnswer?: string;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  tierLegend,
  state,
  questionLabel,
  correctAnswer,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    headerContainer: {
      ...theme.components.card,
      // marginBottom: theme.spacing.sm,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing['3xl'],
    },
    row: {
      flexDirection: 'row',
      marginBottom: theme.spacing.sm,
    },
    column: {
      // flex: 1,
      marginHorizontal: theme.spacing.xs,
    },
    headerText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
      textAlign: 'center',
      // marginBottom: theme.spacing.sm,
    },
    headerValueText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
      color: theme.colors.accent,
    },
  });

  return (
    <View style={styles.headerContainer}>
      {/* First Row */}
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={styles.headerText}>
            {t('defaultScreen.currentTierLabel')}
            {'  '}
          </Text>

          <Text style={styles.headerValueText}>
            {tierLegend || t('defaultScreen.noTierInformation')}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerText}>
            {t('defaultScreen.questionLabel')}
            {'  '}
          </Text>
          <Text style={styles.headerValueText}>
            {questionLabel || t('defaultScreen.unknownState')}
          </Text>
        </View>
      </View>

      {/* Second Row */}
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={styles.headerText}>
            {t('defaultScreen.stateLabel')}
            {'  '}
          </Text>
          <Text style={styles.headerValueText}>
            {state || t('defaultScreen.unknownState')}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.headerText}>
            {t('defaultScreen.correctAnswerLabel')}
            {'  '}
          </Text>
          <Text style={styles.headerValueText}>
            {correctAnswer || t('defaultScreen.unknownState')}
          </Text>
        </View>
      </View>
    </View>
  );
};

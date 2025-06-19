import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../theme';
import { iAnswerState } from '../types';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { AnswerItem } from '../components/AnswerItem';

const DefaultScreen = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'Default'>>();
  const { theme } = useTheme();
  const { quizState, answers, setAnswers } = useWebSocketContext();

  // Filter only incorrect answers
  const incorrectAnswers = answers
    .filter(a => a.isCorrect === false)
    .map(a => a.answer);
  const incorrectAnswersSet = new Set(incorrectAnswers);
  const uniqueIncorrectAnswers = Array.from(incorrectAnswersSet);

  const handleSwipeLeft = useCallback((answer: string) => {
    // YES action
    Alert.alert(
      t('defaultScreen.actionTitle'),
      t('defaultScreen.swipeLeftAction', { answer })
    );
  }, []);

  const handleSwipeRight = useCallback(
    (answer: string) => {
      setAnswers((prevAnswers: iAnswerState[]) =>
        prevAnswers.filter((a: iAnswerState) => a.answer !== answer)
      );
    },
    [setAnswers]
  );

  const showTip = () => {
    Alert.alert(
      t('defaultScreen.swipeGesturesTitle'),
      t('defaultScreen.swipeGesturesMessage'),
      [{ text: t('defaultScreen.gotIt') }]
    );
  };

  const renderAnswerItem = ({ item }: { item: string }) => (
    <AnswerItem
      item={item}
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
    />
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      ...theme.components.card,
      marginBottom: theme.spacing.lg,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.lg,
      flexWrap: 'wrap',
      // width: '100%',
      // paddingInline: theme.spacing['4xl'],
    },
    headerText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    headerValueText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
      color: theme.colors.accent,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    section: {
      flex: 1,
      marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.foreground,
    },
    tipButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipText: {
      color: theme.colors.primaryForeground,
      fontSize: 14,
      fontWeight: 'bold',
    },
    tipDescription: {
      fontSize: 14,
      color: theme.colors.mutedForeground,
      marginBottom: theme.spacing.md,
      fontStyle: 'italic',
    },
    listContainer: {
      paddingBottom: theme.spacing.lg,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.mutedForeground,
      fontSize: theme.fontSize.base,
      marginTop: 50,
    },
    adminSection: {
      paddingTop: theme.spacing.lg,
    },
    adminButton: {
      backgroundColor: theme.colors.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    adminButtonText: {
      color: theme.colors.secondaryForeground,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.medium,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          {t('defaultScreen.currentTierLabel')}{' '}
          <Text style={styles.headerValueText}>
            {quizState?.tierLegend || t('defaultScreen.noTierInformation')}
          </Text>
        </Text>
        <Text style={styles.headerText}>
          {t('defaultScreen.stateLabel')}{' '}
          <Text style={styles.headerValueText}>
            {quizState?.state || t('defaultScreen.unknownState')}
          </Text>
        </Text>
        <Text style={[styles.headerText, { width: '80%' }]}>
          {t('defaultScreen.correctAnswerLabel')}{' '}
          <Text style={styles.headerValueText}>
            {quizState?.correctAnswer || t('defaultScreen.unknownState')}
          </Text>
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('defaultScreen.incorrectAnswersTitle')}
            </Text>
            <TouchableOpacity onPress={showTip} style={styles.tipButton}>
              <Text style={styles.tipText}>
                {t('defaultScreen.tipButtonText')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.tipDescription}>
            {t('defaultScreen.swipeInstructions')}
          </Text>

          {incorrectAnswers.length > 0 ? (
            <FlatList
              data={uniqueIncorrectAnswers}
              renderItem={renderAnswerItem}
              keyExtractor={(item, index) => `${item}+${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <Text style={styles.emptyText}>
              {t('defaultScreen.noIncorrectAnswers')}
            </Text>
          )}
        </View>
      </View>

      {/* Connection Status at bottom */}
      <ConnectionStatus />
    </View>
  );
};

export default DefaultScreen;

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../theme';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { AnswerItem } from '../components/AnswerItem';
import { QuizHeader } from '../components/QuizHeader';
import { useAppContext } from '../context/AppContext';
import { setAnswersCorrect, updateQuestionCorrectAnswer } from '../api';

const DefaultScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { serverIP } = useAppContext();
  const { quizState, answers, setAnswers, tiers } = useWebSocketContext();
  const [displayItems, setDisplayItems] = useState<string[]>([]);

  useEffect(() => {
    const questionType = tiers.find(tier => tier.idx === quizState?.tierNumber)
      ?.question?.questionType;

    const filteredAnswers =
      questionType === 'TEXT'
        ? answers.filter(
            a =>
              a.isCorrect === false && a.pass !== true && a.answer.trim() !== ''
          )
        : [];

    const uniqueIncorrectAnswers = Array.from(
      new Set(filteredAnswers.map(a => a.answer))
    );

    setDisplayItems(uniqueIncorrectAnswers);
  }, [answers, tiers, quizState]);

  const handleSwipeLeft = useCallback(
    async (answer: string) => {
      if (quizState?.questionLabel) {
        const matchingAnswers = answers.filter(
          a => a.answer === answer && !a.isCorrect
        );
        const seats = matchingAnswers.map(a => a.seat);

        try {
          await updateQuestionCorrectAnswer(
            quizState.questionLabel,
            answer,
            serverIP
          );
          await setAnswersCorrect(seats, serverIP);

          // Remove item immediately from display and data
          setDisplayItems(prev => prev.filter(i => i !== answer));
          setAnswers(prev => prev.filter(a => a.answer !== answer));
        } catch (error) {
          console.error('Error updating answer:', error);
        }
      }
    },
    [quizState, serverIP, answers, setAnswers]
  );

  const handleSwipeRight = useCallback(
    (answer: string) => {
      // Remove item immediately without animation
      setDisplayItems(prev => prev.filter(i => i !== answer));
      setAnswers(prev => prev.filter(a => a.answer !== answer));
    },
    [setAnswers]
  );

  const showTip = () => {
    Alert.alert(
      t('defaultScreen.swipeGesturesTitle'),
      t('defaultScreen.swipeInstructions'),
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
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    section: {
      flex: 1,
      marginBottom: theme.spacing['2xl'],
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
      <QuizHeader
        tierLegend={quizState?.tierLegend}
        state={quizState?.state}
        questionLabel={quizState?.questionLabel}
        correctAnswer={quizState?.correctAnswer}
      />

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

          {displayItems.length > 0 ? (
            <FlatList
              data={displayItems}
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

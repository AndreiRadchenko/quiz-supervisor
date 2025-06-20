import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
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
  const { quizState, answers, setAnswers } = useWebSocketContext();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [displayItems, setDisplayItems] = useState<string[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const filteredAnswers = answers.filter(a => a.isCorrect === false);
      const uniqueIncorrectAnswers = Array.from(
        new Set(filteredAnswers.map(a => a.answer))
      );
      const visibleAnswers = uniqueIncorrectAnswers.filter(
        answer => !removingItems.has(answer)
      );
      setDisplayItems(visibleAnswers);
    }, 300);

    return () => clearTimeout(timeout);
  }, [answers, removingItems]);

  const handleSwipeLeft = useCallback(
    async (answer: string) => {
      if (quizState?.questionLabel) {
        // Mark item as being removed for animation
        setRemovingItems(prev => new Set([...prev, answer]));

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
        } catch (error) {
          // If API call fails, remove the removing state
          setRemovingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(answer);
            return newSet;
          });
          console.error('Error updating answer:', error);
        }
      }
    },
    [quizState, serverIP, answers]
  );

  const handleSwipeRight = useCallback((answer: string) => {
    setRemovingItems(prev => new Set([...prev, answer]));
  }, []);

  const showTip = () => {
    Alert.alert(
      t('defaultScreen.swipeGesturesTitle'),
      t('defaultScreen.swipeGesturesMessage'),
      [{ text: t('defaultScreen.gotIt') }]
    );
  };

  const AnimatedAnswerItem = ({
    item,
    onAnimationComplete,
  }: {
    item: string;
    onAnimationComplete: (item: string) => void;
  }) => {
    const [fadeAnim] = useState(new Animated.Value(1));
    const [scaleAnim] = useState(new Animated.Value(1));
    const isRemoving = removingItems.has(item);

    useEffect(() => {
      if (isRemoving) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Only update list after animation is complete
          onAnimationComplete(item);
        });
      }
    }, [isRemoving]);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <AnswerItem
          item={item}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </Animated.View>
    );
  };

  const renderAnswerItem = ({ item }: { item: string }) => (
    <AnimatedAnswerItem
      item={item}
      onAnimationComplete={item => {
        setTimeout(() => {
          setDisplayItems(prev => prev.filter(i => i !== item));
          setAnswers(prev => prev.filter(a => a.answer !== item));
          setRemovingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(item);
            return newSet;
          });
        }, 300);
      }}
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

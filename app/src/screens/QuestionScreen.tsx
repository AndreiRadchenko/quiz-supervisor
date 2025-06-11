import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { usePlayerState } from '../hooks/usePlayerState';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../theme';
import { useTiersData, getAppTier } from '../hooks/useTierState';
import { AppTierType, iQuizSate, PlayerDataType, QuestionTypeEnum, iAnswerMessage } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { getKeyboardProps } from '../utils/keyboard';

const { width: screenWidth } = Dimensions.get('window');

const QuestionScreen = () => {
  const { t, i18n } = useTranslation();
  const { seatNumber, serverIP, locale } = useAppContext();
  const { playerData, isLoading: isLoadingPlayer, error: playerError, refetchPlayer } = usePlayerState();
  const { quizState, setQuizState, status: wsStatus, sendMessage } = useWebSocketContext();
  const { theme } = useTheme();
  const { tiersData, isLoading: isLoadingTiers, error: tiersError } = useTiersData();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Question'>>();

  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>(''); // Track selected multiple choice option
  const [actionTaken, setActionTaken] = useState<'answered' | 'passed' | 'bought_out' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Create styles using theme
  const styles = StyleSheet.create({
    container: {
      ...theme.components.container,
    },
    scrollContentContainer: {
      flexGrow: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      ...theme.components.card,
      marginBottom: theme.spacing.lg,
    },
    headerText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    tierLegendText: {
      ...theme.components.text.heading,
      fontSize: theme.fontSize.xl,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    questionImage: {
      width: '100%',
      height: 300,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
    },
    actionButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      minWidth: 120,
    },
    passButton: {
      backgroundColor: theme.colors.destructive,
    },
    buyoutButton: {
      backgroundColor: theme.colors.secondary,
    },
    actionButtonText: {
      ...theme.components.text.body,
      color: theme.colors.background,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    disabledButton: {
      opacity: 0.5,
    },
    answerOptionsContainer: {
      marginBottom: theme.spacing.lg,
    },
    multipleChoiceContainer: {
      marginBottom: theme.spacing.lg,
    },
    optionButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedOptionButton: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accentForeground,
    },
    submittedOptionButton: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondaryForeground,
    },
    optionText: {
      ...theme.components.text.body,
      color: theme.colors.primaryForeground,
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
    },
    selectedOptionText: {
      ...theme.components.text.body,
      color: theme.colors.accentForeground,
      fontWeight: theme.fontWeight.bold,
    },
    submittedOptionText: {
      ...theme.components.text.body,
      color: theme.colors.secondaryForeground,
      fontWeight: theme.fontWeight.bold,
    },
    textInputContainer: {
      marginBottom: theme.spacing.lg,
    },
    textInput: {
      ...theme.components.card,
      color: theme.colors.cardForeground,
      fontSize: theme.fontSize.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.border,
      textAlign: 'center',
    },
    confirmButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'center',
      marginTop: theme.spacing.sm,
    },
    confirmButtonText: {
      ...theme.components.text.body,
      color: theme.colors.accentForeground,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
    },
    submitButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'center',
      marginTop: theme.spacing.sm,
    },
    submitButtonText: {
      ...theme.components.text.body,
      color: theme.colors.accentForeground,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
    },
    countdownContainer: {
      backgroundColor: theme.colors.destructive,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'center',
      marginBottom: theme.spacing.lg,
    },
    countdownText: {
      ...theme.components.text.body,
      color: theme.colors.destructiveForeground,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    statusContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    statusText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    errorText: {
      ...theme.components.text.error,
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    resultContainer: {
      ...theme.components.card,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    resultText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    answeredText: {
      color: theme.colors.accent,
    },
    passedText: {
      color: theme.colors.destructive,
    },
    boughtOutText: {
      color: theme.colors.secondary,
    },
  });

  // Refs to get current values in timer callback
  const currentAnswerRef = useRef<string>('');
  const selectedOptionRef = useRef<string>('');
  
  // Update refs when state changes
  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);
  
  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  // Ensure locale is properly applied when component mounts or locale changes
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  const currentAppTier: AppTierType | null = useMemo(() => {
    if (quizState && tiersData) {
      return getAppTier(tiersData, quizState);
    }
    return null;
  }, [quizState?.state, quizState?.tierNumber, !!tiersData]);

  // Force cache refresh by adding tier number as query parameter
  const localImageUri = useMemo(() => {
    const baseUri = FileSystem.documentDirectory + 'question.png';
    return currentAppTier?.tierNumber ? `${baseUri}?t=${currentAppTier.tierNumber}` : baseUri;
  }, [currentAppTier?.tierNumber]);

  // Effect to reset actionTaken when question changes (new tier or question)
  useEffect(() => {
    console.log('🔄 QuestionScreen reset effect triggered:', {
      tierNumber: quizState?.tierNumber,
      state: quizState?.state,
      previousActionTaken: actionTaken
    });
    
    // Only reset if we're not already in a clean state
    if (actionTaken !== null || currentAnswer !== '' || selectedOption !== '') {
      console.log('🔄 Resetting QuestionScreen state values');
      setActionTaken(null);
      setCurrentAnswer(''); // Clear previous answer
      setSelectedOption(''); // Clear selected option
    }
  }, [quizState?.tierNumber, quizState?.state]); // Also reset on state change

  // Listen for WebSocket messages
  useEffect(() => {
    if (quizState) {
      // Handle specific events
      if (quizState.state === 'UPDATE_PLAYER' || quizState.state === 'QUESTION_COMPLETE' || quizState.state === 'BUYOUT_COMPLETE') {
        refetchPlayer();
      }
      if (['BUYOUT_COMPLETE', 'QUESTION_COMPLETE', 'IDLE'].includes(quizState.state)) {
        setActionTaken(null); // Reset action taken if question/game ends
      }
    }
  }, [quizState?.state, refetchPlayer]);

  // Handle QUESTION_CLOSED auto-submission
  useEffect(() => {
    if (quizState?.state === 'QUESTION_CLOSED' && seatNumber && !actionTaken && currentAppTier) {
      console.log('🚨 QUESTION_CLOSED received, auto-submitting answer if no action taken');
      console.log('Auto-submission conditions:', {
        state: quizState.state,
        seatNumber: !!seatNumber,
        actionTaken,
        currentAppTier: !!currentAppTier,
        questionType: currentAppTier.questionType,
        currentAnswer: currentAnswerRef.current,
        selectedOption: selectedOptionRef.current
      });

      // Auto-submit based on question type and current state
      const autoSubmitMessage: iAnswerMessage = {
        seat: seatNumber,
        pass: false,
        boughtOut: false,
        auto: true, // This is an automatic submission
      };

      // Determine the answer based on question type and current input
      if (currentAppTier.questionType === 'MULTIPLE') {
        // For multiple choice: send selected option or empty string if none selected
        autoSubmitMessage.answer = selectedOptionRef.current || '';
        console.log('📤 Auto-submitting MULTIPLE choice answer:', autoSubmitMessage.answer);
      } else if (currentAppTier.questionType === 'TEXT' || currentAppTier.questionType === 'TEXT NUMERIC') {
        // For text questions: send current input value
        autoSubmitMessage.answer = currentAnswerRef.current.trim();
        console.log('📤 Auto-submitting TEXT answer:', autoSubmitMessage.answer);
      } else {
        // For other question types or buyout scenarios
        autoSubmitMessage.answer = '';
        console.log('📤 Auto-submitting empty answer for question type:', currentAppTier.questionType);
      }

      console.log('📤 Sending auto-submission message:', autoSubmitMessage);
      sendMessage(autoSubmitMessage);
      setActionTaken('answered');
    }
  }, [quizState?.state, seatNumber, actionTaken, currentAppTier?.questionType, sendMessage]);

  // Countdown timer logic
  // useEffect(() => {
  //   const currentTier = getAppTier(tiersData, quizState);
  //   console.log('🔄 Countdown effect triggered:', {
  //     enableCountdown: currentTier?.enableCountdown,
  //     quizState_state: quizState?.state,
  //     countdownDuration: quizState?.countdownDuration,
  //     currentTier: !!currentTier,
  //     seatNumber,
  //     actionTaken,
  //     currentAppTier: !!currentAppTier
  //   });
    
  //   if (currentTier?.enableCountdown && quizState?.state === 'QUESTION_OPEN') {
  //     const duration = quizState.countdownDuration;
  //     console.log('⏰ Starting countdown timer with duration:', duration);
      
  //     // Only start countdown if duration is valid (greater than 0)
  //     if (duration && duration > 0) {
  //       setCountdown(duration);
  //       console.log('✅ Countdown timer initialized with', duration, 'seconds');
  //       const timer = setInterval(() => {
  //         setCountdown(prevCountdown => {
  //           if (prevCountdown === null || prevCountdown <= 1) {
  //             clearInterval(timer);
  //             console.log('Timer expired, auto-submitting answer:', {
  //               seatNumber,
  //               actionTaken,
  //               selectedOption: selectedOptionRef.current,
  //               currentAnswer: currentAnswerRef.current.trim()
  //             });
              
  //             // Auto-submit the current answer when timer reaches zero
  //             if (quizState && seatNumber && !actionTaken) {
  //               const autoSubmitMessage: iAnswerMessage = {
  //                 seat: seatNumber,
  //                 auto: true,
  //               };
                
  //               // For multiple choice, use selected option; for text, use current answer
  //               const finalAnswer = currentAppTier?.questionType === 'MULTIPLE' ? selectedOptionRef.current : currentAnswerRef.current.trim();
  //               if (finalAnswer.length > 0) {
  //                 autoSubmitMessage.answer = finalAnswer;
  //                 console.log('Auto-submitting answer:', finalAnswer);
  //               } else {
  //                 console.log('No answer to auto-submit, sending empty auto message');
  //               }
                
  //               sendMessage(autoSubmitMessage);
  //               setActionTaken('answered');
  //             }
              
  //             return 0;
  //           }
  //           return prevCountdown - 1;
  //         });
  //       }, 1000);
  //       return () => clearInterval(timer);
  //     } else {
  //       console.log('❌ Invalid countdown duration, not starting timer:', duration);
  //       setCountdown(null);
  //     }
  //   } else {
  //     console.log('❌ Countdown conditions not met:', {
  //       enableCountdown: currentTier?.enableCountdown,
  //       state: quizState?.state,
  //       stateIsQuestionOpen: quizState?.state === 'QUESTION_OPEN'
  //     });
  //     setCountdown(null);
  //   }
  //   return () => setCountdown(null); // Clear countdown if conditions are not met
  // }, [quizState?.state, quizState?.countdownDuration, quizState?.tierNumber, !!tiersData, seatNumber, actionTaken, sendMessage, currentAppTier?.questionType]); // Removed currentAnswer and selectedOption to prevent timer restart on input changes

  // Navigate based on quizState and playerData
  // useEffect(() => {
  //   if (!playerData?.isActive) {
  //     navigation.navigate('Default');
  //     return;
  //   }
  //   if (quizState && !['QUESTION_PRE', 'IDLE'].includes(quizState.state)) {
  //     navigation.navigate('Prepare');
  //   } else if (quizState && !['QUESTION_OPEN', 'BUYOUT_OPEN'].includes(quizState.state)) {
  //     navigation.navigate('Default');
  //   }
  // }, [quizState?.state, playerData?.isActive, navigation]);

  const handleAnswerSubmit = useCallback((answer?: string, pass?: boolean, buyout?: boolean) => {
    console.log('📤 handleAnswerSubmit called:', { 
      answer, 
      pass, 
      buyout, 
      actionTaken, 
      seatNumber, 
      quizState: quizState?.state,
      answerDefined: answer !== undefined,
      isAnswerEmpty: answer === '',
      submitType: pass ? 'PASS' : buyout ? 'BUYOUT' : 'ANSWER'
    });
    
    // Verify this is a legitimate submission
    if (!seatNumber || !quizState || actionTaken) {
      console.log('❌ Cannot submit - missing requirements:', { 
        seatNumber: !!seatNumber, 
        quizState: !!quizState, 
        actionTaken 
      });
      return;
    }
    
    // Additional protection against accidental submissions with empty answers
    // This should only happen from user initiated actions
    if (answer === '' && !pass && !buyout) {
      console.log('❌ Prevented empty answer submission with no pass/buyout flag');
      return;
    }

    const message: iAnswerMessage = {
      seat: seatNumber,
      auto: false, // Manual submission
    };

    if (pass) {
      message.pass = true;
      setActionTaken('passed');
      console.log('📤 Sending PASS message:', message);
    } else if (buyout) {
      message.boughtOut = true;
      setActionTaken('bought_out');
      console.log('📤 Sending BUYOUT message:', message);
    } else if (answer !== undefined) {
      message.answer = answer.trim();
      setActionTaken('answered');
      console.log('📤 Sending ANSWER message:', message);
    } else {
      console.log('❌ No valid action specified');
      return; // No valid action
    }

    console.log('📤 Sending message via WebSocket:', message);
    sendMessage(message);
    
    // Only clear text input, keep selectedOption for visual feedback
    if (currentAppTier?.questionType !== 'MULTIPLE') {
      setCurrentAnswer(''); // Clear input after submission/action for text questions only
    }
    // Don't clear selectedOption to maintain visual feedback of what was selected
    // refetchPlayer(); // Refetch player data to update pass/buyout status
  }, [seatNumber, quizState, sendMessage]);

  const canUsePass = useMemo(() => {
    if (!playerData || !currentAppTier || actionTaken) return false;
    if (currentAppTier.tierNumber <= 5) return !playerData.usedPassOne && currentAppTier.passOneAllowed;
    return !playerData.usedPassTwo && currentAppTier.passTwoAllowed;
  }, [playerData?.usedPassOne, playerData?.usedPassTwo, currentAppTier?.tierNumber, currentAppTier?.passOneAllowed, currentAppTier?.passTwoAllowed, actionTaken]);

  const canUseBuyout = useMemo(() => {
    if (!playerData || actionTaken) return false;
    return quizState?.state === 'BUYOUT_OPEN' && !playerData.boughtOut;
  }, [quizState?.state, playerData?.boughtOut, actionTaken]);

  // Check if player has already used a pass for the current question's allowance
  const hasUsedApplicablePass = useMemo(() => {
    if (!playerData || !currentAppTier) return false;
    if (currentAppTier.tierNumber <= 5) return playerData.usedPassOne;
    return playerData.usedPassTwo;
  }, [playerData?.usedPassOne, playerData?.usedPassTwo, currentAppTier?.tierNumber]);

  const answerOptionsJSX = useMemo(() => {
    // Only render if questionType is MULTIPLE and we have the tier data
    if (!currentAppTier || currentAppTier.questionType !== 'MULTIPLE') return null;
    
    console.log('🎯 Rendering answer options with state:', {
      questionType: currentAppTier.questionType,
      answerOptions: currentAppTier.answerOptions,
      actionTaken,
      selectedOption
    });
    
    const options = currentAppTier.answerOptions.split(';');
    return (
      <View style={styles.multipleChoiceContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedOption === option && styles.selectedOptionButton,
              actionTaken === 'answered' && selectedOption === option && styles.submittedOptionButton
            ]}
            onPress={() => {
              // First log the action
              console.log('🎯 Option button pressed:', option);
              
              // To prevent race conditions, check if this is in direct response to user action 
              // not triggered by component initialization or state updates
              if (!actionTaken) {
                // Set selected option first to show visual feedback
                setSelectedOption(option);
                // Use setTimeout to ensure the visual state update happens before submission
                setTimeout(() => {
                  handleAnswerSubmit(option);
                }, 50); // Small delay to ensure visual feedback is shown
              }
            }}
            disabled={!!actionTaken}
          >
            <Text style={[
              styles.optionText,
              selectedOption === option && styles.selectedOptionText,
              actionTaken === 'answered' && selectedOption === option && styles.submittedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [currentAppTier?.questionType, currentAppTier?.answerOptions, actionTaken, selectedOption, handleAnswerSubmit]);

  const textInputJSX = useMemo(() => {
    console.log('🎯 Rendering text input for question type:', currentAppTier?.questionType);
    if (!currentAppTier || (currentAppTier.questionType !== 'TEXT' && currentAppTier.questionType !== 'TEXT NUMERIC')) return null;
    
    // Get the simplest keyboard props for this question type
    const keyboardProps = getKeyboardProps(currentAppTier.questionType, locale);
    
    return (
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={t('questionScreen.answerPlaceholder')}
          value={currentAnswer}
          onChangeText={setCurrentAnswer}
          {...keyboardProps} // Apply the simplest keyboard configuration
          clearButtonMode="while-editing" // Show clear button on iOS
          editable={!actionTaken}
          autoFocus={true} // Automatically open keyboard for text/numeric questions
        />
        <TouchableOpacity
          style={[styles.submitButton, (!!actionTaken || currentAnswer.trim() === '') && styles.disabledButton]}
          onPress={() => handleAnswerSubmit(currentAnswer)}
          disabled={!!actionTaken || currentAnswer.trim() === ''}
        >
          <Text style={styles.submitButtonText}>{t('questionScreen.submitAnswer')}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [currentAppTier?.questionType, currentAnswer, actionTaken, handleAnswerSubmit, t, locale]);

  if (isLoadingPlayer || isLoadingTiers || (wsStatus === 'connecting' && !quizState)) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (playerError || tiersError) {
    const combinedError: Error | null = playerError || tiersError;
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.errorText}>
          {playerError ? t('errors.playerDataError') : t('prepareScreen.errorLoadingTiers')}
        </Text>
        <Text style={styles.errorText}>{combinedError?.message || t('errors.unknownError')}</Text>
      </View>
    );
  }
  
  if (!playerData?.isActive) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{t('playerInactiveOutOfGame')}</Text>
      </View>
    );
  }
  
  // Display WebSocket connection status if there's an issue
  if (wsStatus === 'error') {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.errorText}>{t('errors.webSocketError')}</Text>
      </View>
    );
  }

  // if (!quizState || !['QUESTION_OPEN', 'BUYOUT_OPEN'].includes(quizState.state)) {
  //   return (
  //     <View style={styles.statusContainer}>
  //       <Text style={styles.statusText}>{t('questionScreen.noQuestionData')}</Text>
  //     </View>
  //   );
  // }
  
  // Now check if we have a valid tier data
  if (!currentAppTier) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{t('questionScreen.tierDataMissing')}</Text>
      </View>
    );
  }
  
  // At this point, currentAppTier is guaranteed to be non-null
  const imageUrl = `${serverIP}/images/questions/${currentAppTier.image}`;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          {`${t('seatNumber')}: ${seatNumber} | ${playerData.name} | ${t('lives')}: ${playerData.lives || 0}`}
        </Text>
      </View>

      <Text style={styles.tierLegendText}>{currentAppTier.legend}</Text>
      
      {currentAppTier.image && (
        <Image
          source={{ uri: localImageUri }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      )}
      
      {/* {quizState.questionText && <Text style={styles.questionText}>{quizState.questionText}</Text>} */}

      <View style={styles.actionButtonsContainer}>
        {canUsePass && !hasUsedApplicablePass && (
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton, !!actionTaken && styles.disabledButton]}
            onPress={() => handleAnswerSubmit(undefined, true)}
            disabled={!!actionTaken}
          >
            <Text style={styles.actionButtonText}>{t('questionScreen.pass')}</Text>
          </TouchableOpacity>
        )}
        {canUseBuyout && !playerData?.boughtOut && (
          <TouchableOpacity
            style={[styles.actionButton, styles.buyoutButton, !!actionTaken && styles.disabledButton]}
            onPress={() => handleAnswerSubmit(undefined, undefined, true)}
            disabled={!!actionTaken}
          >
            <Text style={styles.actionButtonText}>{t('questionScreen.buyout')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Use memoized JSX to prevent infinite re-renders */}
      {answerOptionsJSX}
      {textInputJSX}
      
      {quizState.enableCountdown && countdown !== null && countdown > 0 && (
          <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>{t('questionScreen.timeLeft', { seconds: countdown })}</Text> 
          </View>
      )}

      {/* Action taken status messages */}
      {actionTaken === 'answered' && countdown === 0 && (
        <Text style={styles.statusText}>{t('questionScreen.answerAutoSubmitted')}</Text>
      )}
      {actionTaken === 'answered' && countdown !== 0 && (
        <Text style={styles.statusText}>{t('questionScreen.answerSubmitted')}</Text>
      )}
      {actionTaken === 'passed' && (
        <Text style={styles.statusText}>{t('questionScreen.playerPassed')}</Text>
      )}
      {actionTaken === 'bought_out' && (
        <Text style={styles.statusText}>{t('questionScreen.playerBoughtOutState')}</Text>
      )}

    </ScrollView>
  );
};

export default QuestionScreen;

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { usePlayerState } from '../hooks/usePlayerState';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../theme';
import { useTiersData, getAppTier } from '../hooks/useTierState';
import { AppTierType, iQuizSate, iCheckMessage, PlayerDataType } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import * as FileSystem from 'expo-file-system';
import { ConnectionStatus } from '../components/ConnectionStatus';

const PrepareScreen = () => {
  const { t } = useTranslation();
  const { seatNumber, serverIP } = useAppContext();
  const { playerData, isLoading: isLoadingPlayer, error: playerError, refetchPlayer } = usePlayerState();
  const { theme } = useTheme();
  
  // Use both WebSocket and SSE contexts
  const { quizState: wsQuizState, status: wsStatus, sendMessage } = useWebSocketContext();
  
  const { tiersData, isLoading: isLoadingTiers, error: tiersError } = useTiersData();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Prepare'>>();

  // Create styles using theme
  const styles = StyleSheet.create({
    container: {
      ...theme.components.container,
      // display: 'flex',
      // flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      // gap: theme.spacing.md,
    },
    headerContainer: {
      ...theme.components.card,
      position: 'absolute',
      top: theme.spacing.xl,
      left: theme.spacing.md,
      right: theme.spacing.md,
      alignItems: 'center',
      backgroundColor: `${theme.colors.card}CC`, // Semi-transparent
    },
    headerText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.cardForeground,
    },
    contentContainer: {
      justifyContent: 'space-evenly',
      alignItems: 'center',
      width: '100%',
      gap: theme.spacing.lg,
      // backgroundColor: theme.colors.accent,
    },
    prepareText: {
      ...theme.components.text.heading,
      fontSize: theme.fontSize['2xl'],
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      color: theme.colors.primary,
    },
    questionLabelText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    imagePlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
    },
    questionImage: {
      width: '90%',
      aspectRatio: 16 / 9,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    statusContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
    },
    statusText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    errorText: {
      ...theme.components.text.error,
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    imageStatusContainer: {
      width: '90%',
      aspectRatio: 16 / 9,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.sm,
    },
    imageStatusText: {
      ...theme.components.text.body,
      marginTop: theme.spacing.sm,
      fontSize: theme.fontSize.base,
    },
    debugStateText: {
      ...theme.components.text.muted,
      marginTop: theme.spacing.sm,
    },
    warningText: {
      ...theme.components.text.body,
      fontSize: theme.fontSize.lg,
      color: theme.colors.destructive,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    errorDetailsText: {
      ...theme.components.text.body,
      marginTop: theme.spacing.xs,
      fontSize: theme.fontSize.base,
      color: theme.colors.destructive,
      textAlign: 'center',
    },
    connectionStatus: {
      position: 'absolute',
      bottom: theme.spacing.md,
      left: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: `${theme.colors.card}F0`, // Semi-transparent
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    connectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.spacing.xs,
    },
    connectionText: {
      ...theme.components.text.muted,
      fontSize: theme.fontSize.sm,
    },
    connectionError: {
      ...theme.components.text.error,
      fontSize: theme.fontSize.xs,
      marginTop: theme.spacing.xs,
    },
  });

  // Determine which quiz state to use (prioritize SSE, fallback to WebSocket)
  const quizState = useMemo(() => {
    // For now, only WebSocket provides quiz state since SSE only provides timer
    if (wsStatus === 'connected' && wsQuizState) {
      return wsQuizState;
    }
    return null;
  }, [wsStatus, wsQuizState]);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [checkMessageSent, setCheckMessageSent] = useState<boolean>(false);
  const downloadInProgressRef = useRef(false);

  const currentAppTier: AppTierType | null = getAppTier(tiersData, quizState);

  // Determine overall loading state
  const isLoading = useMemo(() => {
    return isLoadingPlayer || isLoadingTiers || (wsStatus === 'connecting' && !quizState);
    
  }, [isLoadingPlayer, isLoadingTiers, wsStatus, !!quizState]);

  // Handle image download (without sending check message)
  useEffect(() => {
    let isMounted = true;
    const downloadImage = async () => {
      if (!currentAppTier?.image || !serverIP || quizState?.state !== 'QUESTION_PRE') {
        setImageUri(null);
        setIsImageLoading(false);
        return;
      }

      // Prevent concurrent downloads
      if (downloadInProgressRef.current) {
        console.log('Download already in progress, skipping...');
        return;
      }

      downloadInProgressRef.current = true;

      setIsImageLoading(true);
      setImageError(null);
      setImageUri(null); // Reset previous image

      // const imageName = currentAppTier.image.split('/').pop();
      const imageName = 'question.png';
      if (!FileSystem.documentDirectory || !imageName) {
        setImageError(t('prepareScreen.errorImagePath'));
        setIsImageLoading(false);
        return;
      }
      const localUri = FileSystem.documentDirectory + imageName;
      const remoteUrl = `http://${serverIP}:9002/questions/${currentAppTier.image}`;

      try {
        // Check if file exists and delete it
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        console.log(`Checking if file exists at ${localUri}:`, fileInfo);
        if (fileInfo.exists) {
          try {
            await FileSystem.deleteAsync(localUri);
            console.log('Existing file deleted');
          } catch (deleteError) {
            // File might have been deleted by another process, continue
            console.log('File already deleted or deletion failed:', deleteError);
          }
        }
        const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
        
        if (!isMounted) return;

        if (downloadResult.status === 200) {
          setImageUri(downloadResult.uri);
          console.log(`Image downloaded successfully from ${remoteUrl} to ${downloadResult.uri}`);
        } else {
          setImageError(t('prepareScreen.errorImageDownload', { status: downloadResult.status }));
        }
      } catch (e: any) {
        if (isMounted) {
          console.error(`Error downloading image from ${remoteUrl}:`, e.message);
          setImageError(t('prepareScreen.errorImageDownloadGeneric', { message: e.message }));
        }
      } finally {
        if (isMounted) {
          setIsImageLoading(false);
        }
        downloadInProgressRef.current = false;
      }
    };

    downloadImage();

    return () => {
      isMounted = false;
      downloadInProgressRef.current = false;
    };
  }, [currentAppTier?.image, serverIP, quizState?.state, t]);

  // Send check message when all conditions are met (using ref to avoid dependency on sendMessage)
  const sendMessageRef = useRef(sendMessage);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    // Only send if all conditions are met and we haven't sent a message yet
    // Also ensure we're strictly in QUESTION_PRE state (not QUESTION_OPEN or any other state)
    if (
      wsStatus === 'connected' && 
      imageUri && 
      currentAppTier && 
      seatNumber && 
      !imageError && 
      !checkMessageSent &&
      quizState?.state === 'QUESTION_PRE'
    ) {
      const checkMessage: iCheckMessage = {
        seat: seatNumber,
        imageLoaded: true,
        tierNumber: quizState.tierNumber,
      };
      sendMessageRef.current(checkMessage);
      setCheckMessageSent(true);
    }
  }, [wsStatus, imageUri, currentAppTier?.tierNumber, seatNumber, imageError, checkMessageSent, quizState?.state]);

  if (isLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.statusText}>{t('prepareScreen.loadingNextQuestion')}</Text>
      </View>
    );
  }

  if (playerError) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.errorText}>{t('errors.playerDataError')}</Text>
        <Text style={styles.errorText}>{playerError.message || t('errors.unknownError')}</Text>
      </View>
    );
  }

  if (tiersError) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.errorText}>{t('prepareScreen.errorLoadingTiers')}</Text>
        <Text style={styles.errorText}>{tiersError.message || t('errors.unknownError')}</Text>
      </View>
    );
  }

  if (!playerData?.isActive) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{t('prepareScreen.playerInactiveOutOfGame')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {seatNumber !== null && playerData && (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>
            {`${t('seatNumber')}: ${seatNumber} | ${playerData.name}`}
          </Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.statusText}>{t('prepareScreen.loadingNextQuestion')}</Text>
        </View>
      )}

      {!isLoading && playerError && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{t('errors.playerDataError')}</Text>
          <Text style={styles.errorText}>{(playerError as Error).message || t('errors.unknownError')}</Text>
        </View>
      )}

      {!isLoading && tiersError && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{t('prepareScreen.errorLoadingTiers')}</Text>
          <Text style={styles.errorText}>{(tiersError as Error).message || t('errors.unknownError')}</Text>
        </View>
      )}

      {!isLoading && !tiersError && currentAppTier && playerData?.isActive && quizState?.state === 'QUESTION_PRE' && (
        <View style={styles.contentContainer}>
          <Text style={styles.prepareText}>
            {t('prepareScreen.readyForTier', { tierLegend: currentAppTier.legend })}
          </Text>
          
          <View style={{height: '35%'}}>
          {isImageLoading && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.imageStatusText}>{t('prepareScreen.imageLoading')}</Text>
            </View>
          ) }
          
          {imageError && (
            <View style={styles.statusContainer}>
              <Text style={styles.errorText}>{imageError}</Text>
            </View>
            )}
            {/* (!currentAppTier.image) */}
          {(!currentAppTier.image) && (
             <View style={styles.statusContainer}>
                <Text style={styles.errorText}>{t('prepareScreen.noImageForTier')}</Text>
            </View>
          )}
          </View>
        </View>
      )}

      {/* !isLoading && !tiersError && (!currentAppTier || quizState?.state !== 'QUESTION_PRE') */}
      {/* !isLoading && !tiersError && ( quizState?.state === 'IDLE') */}
      {/* {!isLoading && !tiersError && (!currentAppTier || quizState?.state !== 'QUESTION_PRE') && playerData?.isActive && (
         <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{t('prepareScreen.waitingForNextQuestion')}</Text>
          {quizState && <Text style={styles.debugStateText}>Current State: {quizState.state}</Text>}
        </View>
      )} */}

      <ConnectionStatus showTitle={false } />
    </View>
  );
};

export default PrepareScreen;

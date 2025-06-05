import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { usePlayerState } from '../hooks/usePlayerState';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTiersData, getAppTier } from '../hooks/useTierState';
import { AppTierType, iQuizSate, iCheckMessage, PlayerDataType } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import * as FileSystem from 'expo-file-system';

const PrepareScreen = () => {
  const { t } = useTranslation();
  const { seatNumber, serverIP } = useAppContext();
  const { playerData, isLoading: isLoadingPlayer, error: playerError, refetchPlayer } = usePlayerState();
  const { quizState, status: wsStatus, sendMessage } = useWebSocketContext();
  const { tiersData, isLoading: isLoadingTiers, error: tiersError } = useTiersData();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Prepare'>>();

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

  // Listen for WebSocket messages that require updates
  useEffect(() => {
    if (quizState && quizState.state === 'UPDATE_PLAYER') {
      refetchPlayer();
    }
  }, [quizState?.state]);

  // Navigate to QuestionScreen when server sends QUESTION_OPEN
  useEffect(() => {
    if (quizState?.state === 'QUESTION_OPEN') {
      navigation.navigate('Question');
    }
  }, [quizState?.state, navigation]);

  // Navigate to DefaultScreen if player is not active or game state is not PRE/OPEN/BUYOUT_OPEN
  useEffect(() => {
    if (playerData && !playerData.isActive) {
      navigation.navigate('Default');
      return;
    }
    
    if (quizState && !['QUESTION_PRE', 'QUESTION_OPEN', 'BUYOUT_OPEN'].includes(quizState.state)) {
      navigation.navigate('Default');
    }
  }, [playerData?.isActive, quizState?.state, navigation]);

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
        imageloaded: true,
        tierNumber: quizState.tierNumber,
      };
      sendMessageRef.current(checkMessage);
      setCheckMessageSent(true);
    }
  }, [wsStatus, imageUri, currentAppTier?.tierNumber, seatNumber, imageError, checkMessageSent, quizState?.state]);

  // // Reset check message flag only when a new question starts (new tier number)
  // useEffect(() => {
  //   setCheckMessageSent(false);
  // }, [currentAppTier?.tierNumber]); // Removed quizState?.state to prevent reset on QUESTION_PRE -> QUESTION_OPEN transition

  if (isLoading) {
    return (
      <View style={styles.statusContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.statusText}>{t('prepareScreen.loadingNextQuestion')}</Text>
      </View>
    );
  }

  if (playerError) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.errorText}>{t('errors.playerDataError')}</Text>
        <Text style={styles.errorText}>{playerError.message || t('errors.unknownError')}</Text> {/* Display specific error */}
      </View>
    );
  }

  if (tiersError) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.errorText}>{t('prepareScreen.errorLoadingTiers')}</Text>
        <Text style={styles.errorText}>{tiersError.message || t('errors.unknownError')}</Text> {/* Display specific error */}
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
          <ActivityIndicator size="large" color="#0000ff" />
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
          {/* <Text style={styles.questionLabelText}>{currentAppTier.label}</Text> */}
          
          {isImageLoading && (
            <View style={styles.imageStatusContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.imageStatusText}>{t('prepareScreen.imageLoading')}</Text>
            </View>
          )}
          {imageError && (
            <View style={styles.imageStatusContainer}>
              <Text style={styles.errorText}>{imageError}</Text>
            </View>
          )}
          {/* {imageUri && !isImageLoading && !imageError && (
            <Image source={{ uri: imageUri }} style={styles.questionImage} resizeMode="contain" />
          )} */}
          {(!imageUri && !isImageLoading && !imageError && currentAppTier.image) && (
            // Fallback if image is defined but not loaded/loading and no error (e.g. initial state)
            <View style={[styles.questionImage, styles.imagePlaceholder]}>
                <Text>{t('prepareScreen.imageWaiting')}</Text>
            </View>
          )}
          {(!currentAppTier.image) && (
            // If no image is associated with the tier
             <View style={[styles.questionImage, styles.imagePlaceholder]}>
                <Text>{t('prepareScreen.noImageForTier')}</Text>
            </View>
          )}
        </View>
      )}

      {!isLoading && !tiersError && (!currentAppTier || quizState?.state !== 'QUESTION_PRE') && playerData?.isActive && (
         <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{t('prepareScreen.waitingForNextQuestion')}</Text>
          {quizState && <Text style={styles.debugStateText}>Current State: {quizState.state}</Text>}
        </View>
      )}
      
      {/* Display WebSocket connection status if there's an issue */}
      {wsStatus === 'error' && (
        <Text style={styles.errorText}>
          {t('errors.webSocketError')}
        </Text>
      )}
      {wsStatus === 'disconnected' && serverIP && (
        <Text style={styles.warningText}>{t('defaultScreen.webSocketDisconnected')}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0', 
  },
  headerContainer: {
    position: 'absolute',
    top: 40, // Adjusted for tablets
    left: 20,
    right: 20,
    alignItems: 'center', // Center header text
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 5,
  },
  headerText: {
    fontSize: 20, // Larger for readability
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  prepareText: {
    fontSize: 36, // Prominent text
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#004085', // A calm blue
  },
  questionLabelText: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20, // Adjusted margin
    color: '#555',
  },
  imagePlaceholder: { // Styles for when image is a placeholder (e.g. loading, error, or no image)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  questionImage: { // Actual image style
    width: '90%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    marginBottom: 20,
  },
  // Added missing status/error styles
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  imageStatusContainer: {
    width: '90%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
  },
  imageStatusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  debugStateText: { // Added for debugging state issues
    marginTop: 10,
    fontSize: 12,
    color: 'grey',
  },
  warningText: {
    fontSize: 18,
    color: 'orange',
    textAlign: 'center',
    marginTop: 10,
  },
  errorDetailsText: {
    marginTop: 5,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  }
});

export default PrepareScreen;

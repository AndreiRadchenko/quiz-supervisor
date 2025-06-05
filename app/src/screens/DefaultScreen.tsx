import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { usePlayerState } from '../hooks/usePlayerState';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useWebSocketContext } from '../context/WebSocketContext';
import { iQuizSate, BroadcastState } from '../types';

const logo = require('../assets/images/logo.png');

const DefaultScreen = () => {
  const { t } = useTranslation();
  const { seatNumber, serverIP } = useAppContext();
  const { playerData, isLoading, error, refetchPlayer } = usePlayerState();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Default'>>();
  const { status, quizState, setQuizState, errorDetails } = useWebSocketContext(); // Removed lastMessage

  // Listen for WebSocket messages that might require updating player data
  useEffect(() => {
    if (quizState) {
      // Navigate based on the new state
      switch (quizState.state) {
        case 'UPDATE_PLAYER':
          refetchPlayer();
          break;
        case 'QUESTION_PRE':
          // Handle pre-question state
          if (playerData?.isActive) {
            navigation.navigate('Prepare');
          }
          break;
        case 'QUESTION_OPEN':
          // Handle question open state
          if (playerData?.isActive) {
            navigation.navigate('Question');
          }
          break;
        case 'IDLE':
        case 'QUESTION_CLOSED':
        case 'QUESTION_COMPLETE':
        case 'BUYOUT_COMPLETE':
          // Stay on DefaultScreen or navigate to it if not already there
          if (navigation.getState().routes[navigation.getState().index].name !== 'Default') {
            navigation.navigate('Default');
          }
          break;
        default:
          // Handle any other states or do nothing
          break;
      }
    }
  }, [quizState, refetchPlayer, navigation]);

  const handleLongPress = () => {
    navigation.navigate('Admin');
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} style={styles.container} activeOpacity={1}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      {isLoading && (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.statusText}>{t('defaultScreen.loadingPlayerData')}</Text>
        </View>
      )}
      {error && (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{t('defaultScreen.errorLoadingPlayerData')}</Text>
          {error.message && <Text style={styles.errorText}>{error.message}</Text>} {/* Display specific error message */}
        </View>
      )}
      {!isLoading && !error && playerData && (
        <View style={styles.playerInfoContainer}>
          <Text 
            style={[styles.playerName, !playerData.isActive && styles.inactivePlayerName]}
          >
            {playerData.name}
          </Text>
          {seatNumber !== null && (
            <Text style={styles.seatNumber}>{`${t('seatNumber')}: ${seatNumber}`}</Text>
          )}
        </View>
      )}
      {!isLoading && !error && !playerData && seatNumber !== null && (
         <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{t('defaultScreen.noPlayerData')}</Text>
        </View>
      )}
      {!isLoading && !seatNumber && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{t('defaultScreen.configureSeatAdmin')}</Text>
        </View>
      )}

      {/* Display game state specific messages */}
      {!isLoading && !error && playerData && playerData.isActive && quizState?.state === 'IDLE' && (
        <Text style={styles.infoText}>{t('defaultScreen.waitingForGame')}</Text>
      )}
      {!isLoading && !error && playerData && !playerData.isActive && (
        <Text style={styles.infoText}>{t('defaultScreen.playerInactive')}</Text>
      )}

      {/* Display WebSocket connection status if there's an issue */}
      {status === 'error' && (
        <Text style={styles.errorText}>
          {t('errors.webSocketError')}
          {errorDetails && typeof errorDetails === 'string' && (
            <Text style={styles.errorDetailsText}>{`: ${errorDetails}`}</Text>
          )}
        </Text>
      )}
      {status === 'disconnected' && serverIP && (
        <Text style={styles.warningText}>{t('defaultScreen.webSocketDisconnected')}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0', // Example background color
  },
  logo: {
    width: '80%',
    maxHeight: 150, 
    marginBottom: 40,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  },
  playerInfoContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playerName: {
    fontSize: 32, // Larger font for player name
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inactivePlayerName: {
    color: 'red',
  },
  seatNumber: {
    fontSize: 20,
    color: 'gray',
  },
  infoText: { // Added infoText style
    marginTop: 30,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
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
  },
});

export default DefaultScreen;

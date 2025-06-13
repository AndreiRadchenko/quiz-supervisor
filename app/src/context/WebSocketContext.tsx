import React, { createContext, useContext, ReactElement, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { iQuizSate, iCheckMessage, iAnswerMessage } from '../types';
import { WebSocketStatus } from '../hooks/useWebSocket';
import { queryClient } from '../store/queryClient';
import { useAppContext } from './AppContext';
import { fetchQuizState } from '../api';

interface WebSocketContextType {
  status: WebSocketStatus;
  quizState: iQuizSate | null;
  setQuizState: (state: iQuizSate | null) => void;
  errorDetails: string | null;
  sendMessage: (message: iCheckMessage | iAnswerMessage) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactElement }> = ({ children }) => {
  const { serverIP, seatNumber } = useAppContext();
  const webSocketState = useWebSocket();
  useEffect(() => {
    const initializeWebSocket = async () => {
      // Log the initial state for debugging
      console.log('WebSocketProvider initialized with state:', webSocketState);
      queryClient.refetchQueries({ queryKey: ['player', seatNumber] });
      queryClient.refetchQueries({ queryKey: ['tiers'] });
      const updatedState = await fetchQuizState(serverIP);
      webSocketState.setQuizState(updatedState);
    };

    initializeWebSocket();
    if (webSocketState.status === 'connected') {
      // WebSocket is connected, you can perform actions here
    }
  }, []);

  return (
    <WebSocketContext.Provider value={webSocketState}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

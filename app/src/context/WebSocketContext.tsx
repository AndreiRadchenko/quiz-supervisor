import React, { createContext, useContext, ReactElement } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { iQuizSate, iCheckMessage, iAnswerMessage } from '../types';
import { WebSocketStatus } from '../hooks/useWebSocket';

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
  const webSocketState = useWebSocket();

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

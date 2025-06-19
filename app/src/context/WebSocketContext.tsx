import React, {
  createContext,
  useContext,
  ReactElement,
  useEffect,
} from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { iQuizSate, iCheckMessage, iAnswerState } from '../types';
import { WebSocketStatus } from '../hooks/useWebSocket';
import { useAppContext } from './AppContext';
import { fetchQuizState } from '../api';

interface WebSocketContextType {
  answers: iAnswerState[];
  setAnswers: React.Dispatch<React.SetStateAction<iAnswerState[]>>;
  status: WebSocketStatus;
  quizState: iQuizSate | null;
  setQuizState: React.Dispatch<React.SetStateAction<iQuizSate | null>>;
  errorDetails: string | null;
  sendMessage: (message: iCheckMessage | iAnswerState) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: ReactElement }> = ({
  children,
}) => {
  const { serverIP } = useAppContext();
  const webSocketState = useWebSocket();
  useEffect(() => {
    const initializeWebSocket = async () => {
      // Log the initial state for debugging
      console.log('WebSocketProvider initialized with state:', webSocketState);
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
    throw new Error(
      'useWebSocketContext must be used within a WebSocketProvider'
    );
  }
  return context;
};

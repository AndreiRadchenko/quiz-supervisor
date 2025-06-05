import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useSSE } from '../hooks/useSSE';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppContext } from './AppContext';
import { iQuizSate, iCheckMessage, iAnswerMessage } from '../types';

interface HybridContextType {
  // Status information
  webSocketStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sseStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Quiz state (prioritize SSE, fallback to WebSocket)
  quizState: iQuizSate | null;
  
  // Error information
  webSocketError: string | null;
  sseError: string | null;
  
  // Actions (only WebSocket supports sending messages)
  sendMessage: (data: iCheckMessage | iAnswerMessage) => void;
  
  // Overall connection status
  isConnected: boolean;
}

const HybridContext = createContext<HybridContextType | undefined>(undefined);

interface HybridProviderProps {
  children: ReactNode;
  useSSE?: boolean;
  useWebSocket?: boolean;
}

export const HybridProvider: React.FC<HybridProviderProps> = ({ 
  children, 
  useSSE = true, 
  useWebSocket = true 
}) => {
  const { serverIP } = useAppContext();
  
  // SSE Connection (for receiving quiz state)
  const { 
    status: sseStatus, 
    quizState: sseQuizState, 
    error: sseError 
  } = useSSE({
    serverIP,
    enabled: useSSE,
  });

  // WebSocket Connection (for bidirectional communication)
  const { 
    status: webSocketStatus, 
    quizState: webSocketQuizState, 
    sendMessage,
    errorDetails: webSocketError
  } = useWebSocket();

  // Determine the most up-to-date quiz state
  const quizState = useMemo(() => {
    // Prioritize SSE if it's connected and has data
    if (useSSE && sseStatus === 'connected' && sseQuizState) {
      return sseQuizState;
    }
    
    // Fallback to WebSocket
    if (useWebSocket && webSocketStatus === 'connected' && webSocketQuizState) {
      return webSocketQuizState;
    }
    
    return null;
  }, [useSSE, sseStatus, sseQuizState, useWebSocket, webSocketStatus, webSocketQuizState]);

  // Determine overall connection status
  const isConnected = useMemo(() => {
    if (useSSE && useWebSocket) {
      // Both enabled: at least one should be connected
      return sseStatus === 'connected' || webSocketStatus === 'connected';
    } else if (useSSE) {
      // Only SSE enabled
      return sseStatus === 'connected';
    } else if (useWebSocket) {
      // Only WebSocket enabled
      return webSocketStatus === 'connected';
    }
    return false;
  }, [useSSE, useWebSocket, sseStatus, webSocketStatus]);

  return (
    <HybridContext.Provider value={{
      webSocketStatus,
      sseStatus,
      quizState,
      webSocketError,
      sseError,
      sendMessage,
      isConnected,
    }}>
      {children}
    </HybridContext.Provider>
  );
};

export const useHybridContext = (): HybridContextType => {
  const context = useContext(HybridContext);
  if (context === undefined) {
    throw new Error('useHybridContext must be used within a HybridProvider');
  }
  return context;
};

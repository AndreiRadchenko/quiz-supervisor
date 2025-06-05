import React, { createContext, useContext, ReactNode } from 'react';
import { useSSE } from '../hooks/useSSE';
import { useAppContext } from './AppContext';
import { TimerStatus } from '../types';

interface SSEContextType {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  timerState: TimerStatus | null;
  error: string | null;
}

const SSEContext = createContext<SSEContextType | undefined>(undefined);

interface SSEProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const SSEProvider: React.FC<SSEProviderProps> = ({ children, enabled = true }) => {
  const { serverIP } = useAppContext();
  
  const { status, timerState, error } = useSSE({
    serverIP,
    enabled,
  });

  return (
    <SSEContext.Provider value={{ status, timerState, error }}>
      {children}
    </SSEContext.Provider>
  );
};

export const useSSEContext = (): SSEContextType => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error('useSSEContext must be used within an SSEProvider');
  }
  return context;
};

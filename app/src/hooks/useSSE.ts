import { useState, useEffect, useRef, useCallback } from 'react';
import EventSource, { EventSourceListener, EventType } from 'react-native-sse';
import { iQuizSate, TimerStatus } from '../types';

// Define custom event types for EventSource
declare module 'react-native-sse' {
  interface EventSourceEventMap {
    'timer': MessageEvent;
    'open': Event;
    'error': Event;
  }
  
  // No need to redefine EventType as it's already defined in the module
}

interface UseSSEProps {
  serverIP: string | null;
  enabled?: boolean;
}

interface SSEState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  timerState: TimerStatus | null;
  error: string | null;
}

export const useSSE = ({ serverIP, enabled = true }: UseSSEProps): SSEState => {
  const [status, setStatus] = useState<SSEState['status']>('disconnected');
  const [timerState, setTimerState] = useState<TimerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!serverIP || !enabled) {
      setStatus('disconnected');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `http://${serverIP}:5000/events`; // Your SSE endpoint
    console.log('🔗 Connecting to SSE:', url);
    
    setStatus('connecting');
    setError(null);

    try {
      const eventSource = new EventSource(url, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      eventSource.addEventListener('open', () => {
        console.log('✅ SSE connection established');
        setStatus('connected');
        setError(null);
      });

      (eventSource as any).addEventListener('timer', (event: { data: string; }) => {
        try {
          console.log('📨 SSE message received:', event.data);
          const data = JSON.parse(event.data) as TimerStatus;
          setTimerState(data);
        } catch (parseError) {
          console.error('❌ Failed to parse SSE message:', parseError);
        }
      });

      // Handle custom event types if your server sends them
      // eventSource.addEventListener('quiz-state', (event) => {
      //   try {
      //     const data = JSON.parse(event.data) as iQuizSate;
      //     setQuizState(data);
      //   } catch (parseError) {
      //     console.error('❌ Failed to parse quiz-state event:', parseError);
      //   }
      // });

      eventSource.addEventListener('error', (event) => {
        console.error('❌ SSE error:', event);
        setStatus('error');
        setError('SSE connection error');
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting SSE reconnection...');
          connect();
        }, 3000);
      });

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('❌ Failed to create SSE connection:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown SSE error');
    }
  }, [serverIP, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStatus('disconnected');
    setTimerState(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (enabled && serverIP) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, enabled, serverIP]);

  return {
    status,
    timerState,
    error,
  };
};

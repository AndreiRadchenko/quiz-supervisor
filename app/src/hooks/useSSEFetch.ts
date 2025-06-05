import { useState, useEffect, useRef, useCallback } from 'react';
import { iQuizSate } from '../types';

interface UseSSEFetchProps {
  serverIP: string | null;
  enabled?: boolean;
}

interface SSEFetchState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  quizState: iQuizSate | null;
  error: string | null;
}

export const useSSEFetch = ({ serverIP, enabled = true }: UseSSEFetchProps): SSEFetchState => {
  const [status, setStatus] = useState<SSEFetchState['status']>('disconnected');
  const [quizState, setQuizState] = useState<iQuizSate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (!serverIP || !enabled) {
      setStatus('disconnected');
      return;
    }

    // Close existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const url = `http://${serverIP}:5000/events`;
    console.log('🔗 Connecting to SSE via fetch:', url);
    
    setStatus('connecting');
    setError(null);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setStatus('connected');
      console.log('✅ SSE fetch connection established');

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as iQuizSate;
              console.log('📨 SSE fetch message received:', data);
              setQuizState(data);
            } catch (parseError) {
              console.error('❌ Failed to parse SSE fetch message:', parseError);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛑 SSE fetch connection aborted');
        return;
      }

      console.error('❌ SSE fetch error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown SSE fetch error');
      
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting SSE fetch reconnection...');
        connect();
      }, 3000);
    }
  }, [serverIP, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setStatus('disconnected');
    setQuizState(null);
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
    quizState,
    error,
  };
};

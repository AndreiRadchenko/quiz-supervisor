import { useState, useEffect, useRef, useCallback } from 'react';
import { iQuizSate } from '../types';

interface UseSSECustomProps {
  serverIP: string | null;
  enabled?: boolean;
}

interface SSECustomState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  quizState: iQuizSate | null;
  error: string | null;
}

export const useSSECustom = ({ serverIP, enabled = true }: UseSSECustomProps): SSECustomState => {
  const [status, setStatus] = useState<SSECustomState['status']>('disconnected');
  const [quizState, setQuizState] = useState<iQuizSate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!serverIP || !enabled) {
      setStatus('disconnected');
      return;
    }

    // Close existing connection
    if (xhrRef.current) {
      xhrRef.current.abort();
    }

    const url = `http://${serverIP}:5000/events`;
    console.log('🔗 Connecting to SSE via XMLHttpRequest:', url);
    
    setStatus('connecting');
    setError(null);

    try {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      let lastIndex = 0;

      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
          setStatus('connected');
          console.log('✅ SSE XMLHttpRequest connection established');
        }

        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const responseText = xhr.responseText.substring(lastIndex);
          lastIndex = xhr.responseText.length;

          if (responseText) {
            const lines = responseText.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as iQuizSate;
                  console.log('📨 SSE XMLHttpRequest message received:', data);
                  setQuizState(data);
                } catch (parseError) {
                  console.error('❌ Failed to parse SSE XMLHttpRequest message:', parseError);
                }
              }
            }
          }
        }

        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200) {
          console.error('❌ SSE XMLHttpRequest error:', xhr.status, xhr.statusText);
          setStatus('error');
          setError(`HTTP ${xhr.status}: ${xhr.statusText}`);
          
          // Auto-reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting SSE XMLHttpRequest reconnection...');
            connect();
          }, 3000);
        }
      };

      xhr.onerror = () => {
        console.error('❌ SSE XMLHttpRequest network error');
        setStatus('error');
        setError('Network error');
        
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting SSE XMLHttpRequest reconnection...');
          connect();
        }, 3000);
      };

      xhr.send();
    } catch (err) {
      console.error('❌ Failed to create SSE XMLHttpRequest connection:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown SSE XMLHttpRequest error');
    }
  }, [serverIP, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
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

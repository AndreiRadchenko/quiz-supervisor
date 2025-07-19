import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { iQuizSate, iCheckMessage, iAnswerState, TierDataType } from '../types';
import { fetchQuizState, fetchTiersData } from '../api';
export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export const useWebSocket = () => {
  const { serverIP } = useAppContext();
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [quizState, setQuizState] = useState<iQuizSate | null>(null);
  const [answers, setAnswers] = useState<iAnswerState[]>([]);
  const [tiers, setTiers] = useState<TierDataType[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null); // Changed to string only
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Improved network error detection
  const connect = useCallback(() => {
    if (!serverIP) {
      setStatus('disconnected');
      setErrorDetails(null);
      return;
    }
    if (
      webSocketRef.current &&
      (webSocketRef.current.readyState === 1 || // WebSocket.OPEN
        webSocketRef.current.readyState === 0)
    ) {
      // WebSocket.CONNECTING
      return;
    }

    setStatus('connecting');
    setErrorDetails(null);

    const wsUrl = `ws://${serverIP}:5000/ws`;
    console.log('Connecting to WebSocket URL:', wsUrl);

    try {
      console.log('Creating new WebSocket connection');
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      // Set a timeout for connection attempts
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== 1) {
          // WebSocket.OPEN
          console.warn('WebSocket connection timeout');
          ws.close();
          setStatus('error');
          setErrorDetails('Connection timeout - server did not respond');
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection established');
        setStatus('connected');
        setErrorDetails(null);
        reconnectAttemptsRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = async event => {
        try {
          // Parse the message data to see what structure we're getting
          const messageReceived = await JSON.parse(event.data as string);
          console.warn('WebSocket message:', messageReceived);

          if (['TIMER', 'CHECK'].includes(messageReceived.event)) {
            return; // Ignore timer messages
          } else if (
            [
              'QUESTION_PRE',
              'QUESTION_OPEN',
              'BUYOUT_OPEN',
              'IDLE',
              'QUESTION_CLOSED',
              'QUESTION_COMPLETE',
              'BUYOUT_COMPLETE',
            ].includes(messageReceived.event)
          ) {
            // Handle the case where the message has a payload property (event, payload structure)
            if (
              messageReceived.payload &&
              typeof messageReceived.payload === 'object'
            ) {
              setQuizState(messageReceived.payload);

              // Handle specific messages for query invalidation
              switch (messageReceived.event) {
                case 'QUESTION_COMPLETE':
                case 'BUYOUT_COMPLETE':
                  setAnswers([]);
                  break;
                case 'QUESTION_PRE':
                  const tiersData = await fetchTiersData(serverIP);
                  setTiers(tiersData);
                  break;
              }
            }
          } else if (messageReceived.event === 'UPDATE_PLAYERS') {
            const updatedState = await fetchQuizState(serverIP);
            setQuizState(updatedState);
          } else if (messageReceived.event === 'ANSWER') {
            setAnswers(prevAnswers => {
              // Check if the answer already exists to avoid duplicates
              const existingAnswer = prevAnswers.find(
                answer => answer.seat === messageReceived.payload.answer.seat
              );
              if (existingAnswer) {
                console.warn(
                  `Duplicate answer received for seat ${messageReceived.payload.answer.seat}, ignoring.`
                );
                return prevAnswers; // Return existing state without modification
              }
              return [...prevAnswers, messageReceived.payload.answer];
            });
          } else {
            console.warn(
              'WebSocket message format not recognized:',
              messageReceived
            );
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      // Handle error event properly
      ws.onerror = error => {
        console.error('WebSocket error occurred:', error);
        setStatus('error');
        setErrorDetails('A WebSocket connection error occurred');
      };

      // Handle close event properly
      ws.onclose = event => {
        console.log(
          'WebSocket closed with code:',
          event.code,
          'reason:',
          event.reason
        );
        setStatus('disconnected');
        webSocketRef.current = null;

        // Safely access event properties
        const code = event.code || 0;
        const reason = event.reason || 'Unknown reason';

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );
          console.log(
            `Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${reconnectAttemptsRef.current + 1})`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error('Max WebSocket reconnect attempts reached.');
          setStatus('error');
          setErrorDetails(
            `Max reconnect attempts reached. Last event code: ${code}, reason: ${reason}`
          );
        }
      };
    } catch (e) {
      console.error('Error initializing WebSocket:', e);
      setStatus('error');
      setErrorDetails(e instanceof Error ? e.message : String(e));
    }
  }, [serverIP]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (webSocketRef.current) {
      webSocketRef.current.close(1000, 'User initiated disconnect');
      webSocketRef.current = null;
    }
    setStatus('disconnected');
    setErrorDetails(null);
    reconnectAttemptsRef.current = 0;
    // Note: We don't clear quizState here to prevent losing state on intentional disconnects
  }, []);

  // When parameters change (serverIP), connect/disconnect as needed
  useEffect(() => {
    if (serverIP) {
      connect();
    } else {
      disconnect();
      // Only clear state if we're fully disconnecting due to missing parameters
      setQuizState(null);
    }
    return () => {
      disconnect();
    };
  }, [serverIP, connect, disconnect]);

  const sendMessage = useCallback(
    (data: iCheckMessage | iAnswerState) => {
      console.log('sendMessage called with data:', data);
      console.log('webSocketRef.current:', webSocketRef.current);
      console.log('webSocket readyState:', webSocketRef.current?.readyState);
      console.log('WebSocket status:', status);

      if (webSocketRef.current && webSocketRef.current.readyState === 1) {
        // WebSocket.OPEN
        let message: { data: iCheckMessage | iAnswerState; event: string };
        try {
          // Type guard to determine message type
          if ('answer' in data || 'pass' in data || 'boughtOut' in data) {
            console.log('Sending answer message:', data);
            message = { data, event: 'answer' };
          } else {
            console.log('Sending check message:', data);
            message = { data, event: 'check' };
          }

          console.log('Sending WebSocket message:', message);
          webSocketRef.current.send(JSON.stringify(message));
        } catch (e) {
          console.error('Failed to send WebSocket message:', e);
        }
      } else {
        const readyState = webSocketRef.current?.readyState;
        const readyStateText =
          readyState === 0
            ? 'CONNECTING'
            : readyState === 1
              ? 'OPEN'
              : readyState === 2
                ? 'CLOSING'
                : readyState === 3
                  ? 'CLOSED'
                  : 'UNKNOWN';
        console.warn(
          `WebSocket is not ready. ReadyState: ${readyState} (${readyStateText}), Status: ${status}. Message not sent:`,
          data
        );
      }
    },
    [status]
  );

  return {
    status,
    quizState,
    setQuizState,
    answers,
    setAnswers,
    tiers,
    setTiers,
    errorDetails,
    sendMessage,
    connectWebSocket: connect,
    disconnectWebSocket: disconnect,
  };
};

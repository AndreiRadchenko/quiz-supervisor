import {
  AppContextType,
  iQuizSate,
  SeatDataType,
  TierDataType,
} from '../types';
import { useAppContext } from '../context/AppContext';

const getBaseUrl = (serverIP: string | null) => {
  if (!serverIP) {
    // console.error("Server IP is not set"); // Or handle more gracefully
    return null;
  }
  return `http://${serverIP}:5000`;
};

export const fetchQuizState = async (
  serverIP: string | null
): Promise<iQuizSate | null> => {
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/game/state`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz state: ${response.status}`);
    }
    return (await response.json()) as iQuizSate;
  } catch (error) {
    console.error('Error fetching quiz state:', error);
    throw error; // Re-throw to be caught by TanStack Query
  }
};

export const fetchPlayerData = async (
  seatNumber: number,
  serverIP: string | null
): Promise<SeatDataType | null> => {
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl || !seatNumber) return null;

  try {
    const response = await fetch(`${baseUrl}/seats/${seatNumber}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch player data: ${response.status}`);
    }
    return (await response.json()) as SeatDataType;
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error; // Re-throw to be caught by TanStack Query
  }
};

export const fetchTiersData = async (
  serverIP: string | null
): Promise<TierDataType[]> => {
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl) return [];

  try {
    const response = await fetch(`${baseUrl}/tiers`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tiers data: ${response.status}`);
    }
    return (await response.json()) as TierDataType[];
  } catch (error) {
    console.error('Error fetching tiers data:', error);
    throw error; // Re-throw to be caught by TanStack Query
  }
};

export const updateQuestionCorrectAnswer = async (
  questionLabel: string,
  newCorrectAnswer: string,
  serverIP: string | null
): Promise<void> => {
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl) {
    throw new Error('Server IP is not set');
  }

  if (!questionLabel.trim()) {
    throw new Error('Question label is required');
  }

  if (!newCorrectAnswer.trim()) {
    throw new Error('New correct answer is required');
  }

  try {
    const response = await fetch(
      `${baseUrl}/questions?label=${questionLabel}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correctAnswer: newCorrectAnswer,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update question: ${response.status}`);
    }

    // If the API returns data, you can return it here
    // return await response.json();
  } catch (error) {
    console.error('Error updating question correct answer:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

export const setAnswersCorrect = async (
  seats: number[],
  serverIP: string | null
): Promise<void> => {
  // Implement the logic to set answers as correct
  console.log('Sending correct answers for seats:', seats);
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl) {
    throw new Error('Server IP is not set');
  }

  if (!Array.isArray(seats) || seats.length === 0) {
    throw new Error('Invalid seats array');
  }

  try {
    const response = await fetch(`${baseUrl}/game/correct-answers`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ seats }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set answers as correct: ${response.status}`);
    }
  } catch (error) {
    console.error('Error setting answers as correct:', error);
    throw error; // Re-throw to be caught by the caller
  }
};

import { AppContextType, SeatDataType, TierDataType } from '../types';
import { useAppContext } from '../context/AppContext';

const getBaseUrl = (serverIP: string | null) => {
  if (!serverIP) {
    // console.error("Server IP is not set"); // Or handle more gracefully
    return null;
  }
  return `http://${serverIP}:5000`;
};

export const fetchPlayerData = async (seatNumber: number, serverIP: string | null): Promise<SeatDataType | null> => {
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl || !seatNumber) return null;

  try {
    const response = await fetch(`${baseUrl}/seats/${seatNumber}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch player data: ${response.status}`);
    }
    return await response.json() as SeatDataType;
  } catch (error) {
    console.error("Error fetching player data:", error);
    throw error; // Re-throw to be caught by TanStack Query
  }
};

export const fetchTiersData = async (serverIP: string | null): Promise<TierDataType[]> => {
  const baseUrl = getBaseUrl(serverIP);
  if (!baseUrl) return [];

  try {
    const response = await fetch(`${baseUrl}/tiers`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tiers data: ${response.status}`);
    }
    return await response.json() as TierDataType[];
  } catch (error) {
    console.error("Error fetching tiers data:", error);
    throw error; // Re-throw to be caught by TanStack Query
  }
};

// Example of a custom hook using these fetch functions with TanStack Query will be in a separate file
// For example, in src/hooks/usePlayerData.ts or src/hooks/useTierData.ts

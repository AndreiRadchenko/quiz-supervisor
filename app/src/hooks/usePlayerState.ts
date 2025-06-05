import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '../context/AppContext';
import { fetchPlayerData } from '../api';
import { PlayerDataType } from '../types';

export const usePlayerState = () => {
  const { seatNumber, serverIP } = useAppContext();

  const queryKey = ['player', seatNumber];

  const { data: seatData, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      if (seatNumber === null || !serverIP) {
        // Should not happen if enabled is set correctly, but as a safeguard
        return Promise.resolve(null);
      }
      return fetchPlayerData(seatNumber, serverIP);
    },
    enabled: seatNumber !== null && !!serverIP,
    // staleTime can be configured here or globally as done in queryClient.ts
  });

  // The API returns SeatDataType, which contains PlayerDataType
  const playerData: PlayerDataType | null | undefined = seatData?.player;

  return { playerData, isLoading, error, refetchPlayer: refetch };
};

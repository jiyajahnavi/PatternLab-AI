import { useEffect, useRef } from 'react';
import { useCodeBuddyStore } from '../store/useCodeBuddyStore';
import { supabase } from '../services/supabaseClient';

export const useCodeBuddySync = () => {
  const { room, syncRoomFromStorage, isHost } = useCodeBuddyStore();
  const lastBroadcastRef = useRef<string>('');

  useEffect(() => {
    if (!room || room.opponentType !== 'friend') return;

    const channelName = `patternlab_cb_${room.code}`;
    const storageKey = `patternlab_cb_room_${room.code}`;

    // 1. Primary local-first storage listener (instant cross-tab updates on same browser)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          syncRoomFromStorage(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. Supabase Realtime Broadcast Channel (instant cross-browser & cross-incognito sync!)
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        const { roomState } = payload;
        if (roomState && roomState.code === room.code) {
          const roomStr = JSON.stringify(roomState);
          if (roomStr !== JSON.stringify(room)) {
            syncRoomFromStorage(roomState);
            // Sync to local localStorage too
            localStorage.setItem(storageKey, roomStr);
          }
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        // If we are the Host and a Friend requested the room state, broadcast it!
        if (isHost) {
          channel.send({
            type: 'broadcast',
            event: 'state_update',
            payload: { roomState: room }
          });
        }
      })
      .subscribe();

    // 3. Broadcast our own local updates to the Supabase channel
    const currentRoomStr = JSON.stringify(room);
    if (currentRoomStr !== lastBroadcastRef.current) {
      lastBroadcastRef.current = currentRoomStr;
      channel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { roomState: room }
      });
    }

    // 4. Backup local storage interval poll (ensure resilience)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const parsedStr = JSON.stringify(parsed);
          if (parsedStr !== JSON.stringify(room)) {
            syncRoomFromStorage(parsed);
          }
        } catch {}
      }
    }, 1200);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [room, syncRoomFromStorage, isHost]);
};

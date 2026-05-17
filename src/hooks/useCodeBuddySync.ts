import { useEffect, useRef } from 'react';
import { useCodeBuddyStore } from '../store/useCodeBuddyStore';
import { supabase } from '../services/supabaseClient';

export const useCodeBuddySync = () => {
  const { room, syncRoomFromStorage, isHost } = useCodeBuddyStore();

  const roomRef = useRef(room);
  roomRef.current = room;

  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const channelRef = useRef<any>(null);
  const lastBroadcastRef = useRef<string>('');

  useEffect(() => {
    const roomCode = room?.code;
    const opponentType = room?.opponentType;
    if (!roomCode || opponentType !== 'friend') {
      channelRef.current = null;
      return;
    }

    const channelName = `patternlab_cb_${roomCode}`;
    const storageKey = `patternlab_cb_room_${roomCode}`;

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
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        const { roomState } = payload;
        if (roomState && roomState.code === roomCode) {
          const currentRoom = roomRef.current;
          if (currentRoom) {
            const roomStr = JSON.stringify(roomState);
            if (roomStr !== JSON.stringify(currentRoom)) {
              syncRoomFromStorage(roomState);
              // Sync to local localStorage too
              localStorage.setItem(storageKey, roomStr);
            }
          }
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        // If we are the Host and a Friend requested the room state, broadcast it!
        if (isHostRef.current && roomRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'state_update',
            payload: { roomState: roomRef.current }
          });
        }
      })
      .subscribe();

    // 4. Backup local storage interval poll (ensure resilience)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const parsedStr = JSON.stringify(parsed);
          const currentRoom = roomRef.current;
          if (currentRoom && parsedStr !== JSON.stringify(currentRoom)) {
            syncRoomFromStorage(parsed);
          }
        } catch {}
      }
    }, 1200);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [room?.code]); // Only recreate/re-subscribe when the room code changes!

  // 3. Broadcast local updates to the channel when room state changes
  useEffect(() => {
    if (!room || room.opponentType !== 'friend' || !channelRef.current) return;

    const currentRoomStr = JSON.stringify(room);
    if (currentRoomStr !== lastBroadcastRef.current) {
      lastBroadcastRef.current = currentRoomStr;
      channelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { roomState: room }
      });
    }
  }, [room]);
};

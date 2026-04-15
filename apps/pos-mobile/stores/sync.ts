import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@dukapos/shared';
// import api from '../api/client';

interface SyncStore {
  queue: any[];
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  enqueueOrder: (order: any) => void;
  flushQueue: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: true,
      
      setOnlineStatus: (status) => set({ isOnline: status }),
      
      enqueueOrder: (order) => {
        set((state) => ({ queue: [...state.queue, { clientUuid: generateId(), ...order }] }));
      },
      
      flushQueue: async () => {
        const { queue, isOnline } = get();
        if (!isOnline || queue.length === 0) return;
        
        try {
          // const res = await api.post('/orders/sync', { orders: queue });
          // const { processedIds } = res.data.data;
          const processedIds = queue.map(q => q.clientUuid); // Mocked for now

          set((state) => ({
            queue: state.queue.filter(q => !processedIds.includes(q.clientUuid))
          }));
          console.log('Mobile offline queue flushed to cloud');
        } catch (error) {
          console.error("Flush queue failed", error);
        }
      }
    }),
    { 
      name: 'dukapos-mobile-offlinex',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client'; // Assuming pos-desktop has an api client configured like web-admin
import { generateId } from '@dukapos/shared';
export const useSyncStore = create()(persist((set, get) => ({
    queue: [],
    isOnline: navigator.onLine,
    setOnlineStatus: (status) => set({ isOnline: status }),
    enqueueOrder: (order) => {
        set((state) => ({ queue: [...state.queue, { clientUuid: generateId(), ...order }] }));
    },
    flushQueue: async () => {
        const { queue, isOnline } = get();
        if (!isOnline || queue.length === 0)
            return;
        try {
            const res = await api.post('/orders/sync', { orders: queue });
            const { processedIds } = res.data.data;
            set((state) => ({
                queue: state.queue.filter(q => !processedIds.includes(q.clientUuid))
            }));
        }
        catch (error) {
            console.error("Flush queue failed", error);
        }
    }
}), { name: 'dukapos-offline-queue' }));
// Bind network listeners automatically (in a real app, this goes in an initializer)
window.addEventListener('online', () => {
    useSyncStore.getState().setOnlineStatus(true);
    useSyncStore.getState().flushQueue();
});
window.addEventListener('offline', () => {
    useSyncStore.getState().setOnlineStatus(false);
});
//# sourceMappingURL=sync.js.map
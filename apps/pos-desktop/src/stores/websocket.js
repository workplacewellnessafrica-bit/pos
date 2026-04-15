import { io } from 'socket.io-client';
import { useAuthStore } from './auth'; // Assumed to exist
import { useSyncStore } from './sync';
let socket = null;
export const initWebSocket = () => {
    if (socket)
        return;
    const token = useAuthStore.getState().accessToken;
    if (!token)
        return;
    socket = io('http://localhost:4000', {
        auth: { token },
    });
    socket.on('connect', () => {
        console.log('WS: Connected to Dukapos Event Bus');
        // Sync any queued offline orders automatically when WS reconnects perfectly
        useSyncStore.getState().setOnlineStatus(true);
        useSyncStore.getState().flushQueue();
    });
    socket.on('disconnect', () => {
        console.log('WS: Disconnected');
        useSyncStore.getState().setOnlineStatus(false);
    });
    socket.on('stock_alert', (data) => {
        // Dispatch to toast or local stock state overrides
        console.warn('Low Stock Alert from Cloud: ', data);
    });
    socket.on('sale_new', (data) => {
        // Another terminal completed a sale - maybe refresh dashboard metrics?
        console.log('Cross-terminal sale: ', data);
    });
};
export const closeWebSocket = () => {
    socket?.disconnect();
    socket = null;
};
//# sourceMappingURL=websocket.js.map
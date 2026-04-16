import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';
import type { StockAlertEvent, SaleNewEvent } from '@shoplink/shared';

const WS_URL = import.meta.env.VITE_WS_URL ?? '';

interface AlertHandlers {
  onStockAlert?: (ev: StockAlertEvent) => void;
  onSaleNew?: (ev: SaleNewEvent) => void;
  onInventoryUpdated?: (ev: { variantId: string }) => void;
}

export function useSocketAlerts(handlers: AlertHandlers) {
  const token = useAuthStore(s => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      path: '/ws',
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('stock:alert',       (ev: StockAlertEvent) => handlersRef.current.onStockAlert?.(ev));
    socket.on('sale:new',          (ev: SaleNewEvent)    => handlersRef.current.onSaleNew?.(ev));
    socket.on('inventory:updated', (ev: { variantId: string }) => handlersRef.current.onInventoryUpdated?.(ev));
    socket.on('session:kicked',    () => { useAuthStore.getState().logout(); window.location.href = '/login'; });

    return () => { socket.disconnect(); };
  }, [token]);
}

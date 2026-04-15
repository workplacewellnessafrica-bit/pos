interface SyncStore {
    queue: any[];
    isOnline: boolean;
    setOnlineStatus: (status: boolean) => void;
    enqueueOrder: (order: any) => void;
    flushQueue: () => Promise<void>;
}
export declare const useSyncStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<SyncStore>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<SyncStore, SyncStore>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: SyncStore) => void) => () => void;
        onFinishHydration: (fn: (state: SyncStore) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<SyncStore, SyncStore>>;
    };
}>;
export {};
//# sourceMappingURL=sync.d.ts.map
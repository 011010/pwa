/**
 * Offline Queue Hook
 *
 * Manages offline operations using IndexedDB via localforage.
 * Queues operations when offline and syncs them when connection is restored.
 */

import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { config } from '../config/environment';
import type { OfflineOperation, SyncResult } from '../types';
import { api } from '../services/api';

// Configure localforage
const offlineQueue = localforage.createInstance({
  name: 'itam-pwa',
  storeName: 'offline_queue',
  description: 'Offline operations queue',
});

/**
 * Generate unique ID for operations
 */
const generateOperationId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * useOfflineQueue Hook
 */
export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [queue, setQueue] = useState<OfflineOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  /**
   * Load queue from IndexedDB
   */
  const loadQueue = useCallback(async (): Promise<void> => {
    try {
      const operations: OfflineOperation[] = [];
      await offlineQueue.iterate<OfflineOperation, void>((value) => {
        operations.push(value);
      });
      setQueue(operations.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {
      console.error('[Offline Queue] Failed to load queue:', error);
    }
  }, []);

  /**
   * Add operation to queue
   */
  const queueOperation = useCallback(
    async (
      type: OfflineOperation['type'],
      assetId: number,
      data: any
    ): Promise<string> => {
      const operation: OfflineOperation = {
        id: generateOperationId(),
        type,
        assetId,
        data,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      try {
        await offlineQueue.setItem(operation.id, operation);
        await loadQueue();

        console.log('[Offline Queue] Operation queued:', operation);

        // Try to sync immediately if online
        if (isOnline) {
          syncQueue();
        }

        return operation.id;
      } catch (error) {
        console.error('[Offline Queue] Failed to queue operation:', error);
        throw error;
      }
    },
    [isOnline, loadQueue]
  );

  /**
   * Remove operation from queue
   */
  const removeOperation = useCallback(
    async (operationId: string): Promise<void> => {
      try {
        await offlineQueue.removeItem(operationId);
        await loadQueue();
        console.log('[Offline Queue] Operation removed:', operationId);
      } catch (error) {
        console.error('[Offline Queue] Failed to remove operation:', error);
        throw error;
      }
    },
    [loadQueue]
  );

  /**
   * Sync single operation
   */
  const syncOperation = async (operation: OfflineOperation): Promise<SyncResult> => {
    try {
      // Update operation status to syncing
      operation.status = 'syncing';
      await offlineQueue.setItem(operation.id, operation);

      let success = false;

      // Execute operation based on type
      switch (operation.type) {
        case 'update':
          await api.put(`/assets/${operation.assetId}`, operation.data);
          success = true;
          break;

        case 'signature':
          await api.post(`/uploads/signature`, {
            asset_id: operation.assetId,
            ...operation.data,
          });
          success = true;
          break;

        case 'photo':
          await api.upload('/uploads/photo', operation.data.file, {
            asset_id: operation.assetId,
          });
          success = true;
          break;

        default:
          console.warn('[Offline Queue] Unknown operation type:', operation.type);
      }

      if (success) {
        // Remove operation from queue on success
        await removeOperation(operation.id);
        return { success: true, operationId: operation.id };
      }

      return {
        success: false,
        operationId: operation.id,
        error: 'Operation failed',
      };
    } catch (error: any) {
      console.error('[Offline Queue] Failed to sync operation:', error);

      // Increment retry count
      operation.retries += 1;
      operation.status = 'failed';

      // Remove if max retries exceeded
      if (operation.retries >= config.maxRetries) {
        await removeOperation(operation.id);
        return {
          success: false,
          operationId: operation.id,
          error: `Max retries exceeded (${config.maxRetries})`,
        };
      }

      // Save updated operation
      operation.status = 'pending';
      await offlineQueue.setItem(operation.id, operation);

      return {
        success: false,
        operationId: operation.id,
        error: error.message || 'Sync failed',
      };
    }
  };

  /**
   * Sync all pending operations
   */
  const syncQueue = useCallback(async (): Promise<void> => {
    if (!isOnline || isSyncing) {
      console.log('[Offline Queue] Skipping sync - offline or already syncing');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      await loadQueue();
      const operations = queue.filter((op) => op.status === 'pending');

      if (operations.length === 0) {
        console.log('[Offline Queue] No pending operations to sync');
        setIsSyncing(false);
        return;
      }

      console.log(`[Offline Queue] Syncing ${operations.length} operations...`);

      const results: SyncResult[] = [];

      // Sync operations sequentially to maintain order
      for (const operation of operations) {
        const result = await syncOperation(operation);
        results.push(result);
      }

      // Check for failures
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        setSyncError(`${failed.length} operations failed to sync`);
        console.error('[Offline Queue] Some operations failed:', failed);
      } else {
        console.log('[Offline Queue] All operations synced successfully');
      }

      await loadQueue();
    } catch (error) {
      console.error('[Offline Queue] Sync error:', error);
      setSyncError('Failed to sync offline operations');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queue, loadQueue]);

  /**
   * Clear all operations from queue
   */
  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      await offlineQueue.clear();
      await loadQueue();
      console.log('[Offline Queue] Queue cleared');
    } catch (error) {
      console.error('[Offline Queue] Failed to clear queue:', error);
      throw error;
    }
  }, [loadQueue]);

  /**
   * Handle online/offline status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline Queue] Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Offline Queue] Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Auto-sync when coming online
   */
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      console.log('[Offline Queue] Auto-syncing on connection restore...');
      syncQueue();
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  /**
   * Load queue on mount
   */
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  /**
   * Periodic sync interval
   */
  useEffect(() => {
    if (!config.features.offlineMode) {
      return;
    }

    const intervalId = setInterval(() => {
      if (isOnline && queue.length > 0 && !isSyncing) {
        console.log('[Offline Queue] Periodic sync triggered');
        syncQueue();
      }
    }, config.syncInterval);

    return () => clearInterval(intervalId);
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  return {
    isOnline,
    queue,
    isSyncing,
    syncError,
    queueOperation,
    syncQueue,
    clearQueue,
    pendingCount: queue.filter((op) => op.status === 'pending').length,
  };
};

export default useOfflineQueue;

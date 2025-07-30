import React from 'react';
import { Button } from './ui/button';

interface SyncStatusProps {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  error: string | null;
  onForceSync: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isOnline,
  lastSync,
  pendingChanges,
  isSyncing,
  error,
  onForceSync
}) => {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Sync Status
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Last sync:</span>
          <span className="text-gray-900 dark:text-gray-100">
            {formatLastSync(lastSync)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Pending changes:</span>
          <span className={`font-medium ${pendingChanges > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            {pendingChanges}
          </span>
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={onForceSync}
            disabled={!isOnline || isSyncing}
            size="sm"
            className="w-full"
          >
            {isSyncing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </div>
            ) : (
              'Sync Now'
            )}
          </Button>
        </div>

        {!isOnline && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
            Changes will be synced when you're back online
          </div>
        )}
      </div>
    </div>
  );
}; 
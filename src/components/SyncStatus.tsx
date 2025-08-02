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
  isSyncing,
  error,
  onForceSync
}) => {
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (error) return 'text-red-500';
    if (isSyncing) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (error) return 'Sync Error';
    if (isSyncing) return 'Syncing...';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '🔴';
    if (error) return '⚠️';
    if (isSyncing) return '🔄';
    return '🟢';
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {error && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={error}>
          {error}
        </div>
      )}

      {isOnline && !isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onForceSync}
          className="text-xs px-2 py-1 h-auto"
        >
          Refresh
        </Button>
      )}

      {!isOnline && (
        <div className="text-xs text-gray-500">
          Changes will sync when online
        </div>
      )}
    </div>
  );
}; 
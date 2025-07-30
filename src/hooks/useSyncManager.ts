import { useState, useEffect, useCallback } from 'react';
import { JobApplication, JobApplicationCreate, JobApplicationUpdate } from '../types/jobApplication';
import { jobApplicationsApi } from '../services/api';
import { useLocalStorage } from './useLocalStorage';

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  isSyncing: boolean;
  error: string | null;
}

interface UseSyncManagerReturn {
  syncStatus: SyncStatus;
  syncWithBackend: () => Promise<void>;
  addApplicationWithSync: (application: JobApplicationCreate) => Promise<JobApplication | null>;
  updateApplicationWithSync: (id: number, updates: JobApplicationUpdate) => Promise<boolean>;
  deleteApplicationWithSync: (id: number) => Promise<boolean>;
  forceSync: () => Promise<void>;
}

const PENDING_CHANGES_KEY = 'pendingChanges';
const LAST_SYNC_KEY = 'lastSync';

export const useSyncManager = (): UseSyncManagerReturn => {
  const {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    syncWithBackend: syncLocalStorage
  } = useLocalStorage();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
    error: null
  });

  // Load sync status from localStorage
  useEffect(() => {
    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);
      const pendingChanges = localStorage.getItem(PENDING_CHANGES_KEY);
      
      setSyncStatus(prev => ({
        ...prev,
        lastSync: lastSync ? new Date(lastSync) : null,
        pendingChanges: pendingChanges ? parseInt(pendingChanges, 10) : 0
      }));
    } catch (err) {
      console.error('Error loading sync status:', err);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      syncWithBackend();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending changes count
  const updatePendingChanges = useCallback((change: number) => {
    const newCount = Math.max(0, syncStatus.pendingChanges + change);
    setSyncStatus(prev => ({ ...prev, pendingChanges: newCount }));
    localStorage.setItem(PENDING_CHANGES_KEY, newCount.toString());
  }, [syncStatus.pendingChanges]);

  // Update last sync time
  const updateLastSync = useCallback(() => {
    const now = new Date();
    setSyncStatus(prev => ({ ...prev, lastSync: now }));
    localStorage.setItem(LAST_SYNC_KEY, now.toISOString());
  }, []);

  // Main sync function
  const syncWithBackend = useCallback(async () => {
    if (!navigator.onLine || syncStatus.isSyncing) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Fetch latest data from backend
      const backendResponse = await jobApplicationsApi.getAll();
      const backendApplications = backendResponse.applications;
      
      // Merge with local data (backend takes precedence for conflicts)
      const mergedApplications = mergeApplications(applications, backendApplications);
      
      // Update local storage
      syncLocalStorage(mergedApplications);
      
      updateLastSync();
      updatePendingChanges(-syncStatus.pendingChanges); // Clear pending changes
      
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        error: null 
      }));
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false,
        error: 'Failed to sync with backend' 
      }));
    }
  }, [applications, syncLocalStorage, syncStatus.isSyncing, syncStatus.pendingChanges, updateLastSync, updatePendingChanges]);

  // Add application with sync
  const addApplicationWithSync = useCallback(async (applicationData: JobApplicationCreate): Promise<JobApplication | null> => {
    try {
      if (navigator.onLine) {
        // Try to save to backend first
        const newApplication = await jobApplicationsApi.create(applicationData);
        addApplication(newApplication);
        updateLastSync();
        return newApplication;
      } else {
        // Offline: save locally with temporary ID
        const tempApplication: JobApplication = {
          ...applicationData,
          id: Date.now(), // Temporary ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        addApplication(tempApplication);
        updatePendingChanges(1);
        return tempApplication;
      }
    } catch (err) {
      console.error('Failed to add application:', err);
      // Fallback to local storage only
      const tempApplication: JobApplication = {
        ...applicationData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      addApplication(tempApplication);
      updatePendingChanges(1);
      return tempApplication;
    }
  }, [addApplication, updateLastSync, updatePendingChanges]);

  // Update application with sync
  const updateApplicationWithSync = useCallback(async (id: number, updates: JobApplicationUpdate): Promise<boolean> => {
    try {
      if (navigator.onLine) {
        // Try to update backend first
        await jobApplicationsApi.update(id, updates);
        updateApplication(id, updates);
        updateLastSync();
        return true;
      } else {
        // Offline: update locally
        updateApplication(id, updates);
        updatePendingChanges(1);
        return true;
      }
    } catch (err) {
      console.error('Failed to update application:', err);
      // Fallback to local storage only
      updateApplication(id, updates);
      updatePendingChanges(1);
      return false;
    }
  }, [updateApplication, updateLastSync, updatePendingChanges]);

  // Delete application with sync
  const deleteApplicationWithSync = useCallback(async (id: number): Promise<boolean> => {
    try {
      if (navigator.onLine) {
        // Try to delete from backend first
        await jobApplicationsApi.delete(id);
        deleteApplication(id);
        updateLastSync();
        return true;
      } else {
        // Offline: delete locally
        deleteApplication(id);
        updatePendingChanges(1);
        return true;
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
      // Fallback to local storage only
      deleteApplication(id);
      updatePendingChanges(1);
      return false;
    }
  }, [deleteApplication, updateLastSync, updatePendingChanges]);

  // Force sync function
  const forceSync = useCallback(async () => {
    await syncWithBackend();
  }, [syncWithBackend]);

  return {
    syncStatus,
    syncWithBackend,
    addApplicationWithSync,
    updateApplicationWithSync,
    deleteApplicationWithSync,
    forceSync
  };
};

// Helper function to merge local and backend applications
function mergeApplications(local: JobApplication[], backend: JobApplication[]): JobApplication[] {
  const merged = new Map<number, JobApplication>();
  
  // Add all backend applications (they take precedence)
  backend.forEach(app => {
    if (app.id !== undefined) {
      merged.set(app.id, app);
    }
  });
  
  // Add local applications that don't exist in backend (pending changes)
  local.forEach(app => {
    if (app.id !== undefined && !merged.has(app.id)) {
      merged.set(app.id, app);
    }
  });
  
  return Array.from(merged.values()).sort((a, b) => {
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  });
} 
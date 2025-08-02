import { useState, useEffect, useCallback } from 'react';
import { JobApplication, JobApplicationCreate, JobApplicationUpdate } from '../types/jobApplication';
import { jobApplicationsApi } from '../services/api';

interface UseSyncManagerReturn {
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  isSyncing: boolean;
  addApplication: (application: JobApplicationCreate) => Promise<JobApplication>;
  updateApplication: (id: number, updates: JobApplicationUpdate) => Promise<JobApplication>;
  deleteApplication: (id: number) => Promise<void>;
  refreshApplications: () => Promise<void>;
}

export const useSyncManager = (): UseSyncManagerReturn => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load applications from API
  const refreshApplications = useCallback(async () => {
    if (!isOnline) {
      setError('No internet connection');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const response = await jobApplicationsApi.getAll();
      setApplications(response.applications || []);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
      setError('Failed to load applications from server');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, [isOnline]);

  // Load applications on mount and when coming online
  useEffect(() => {
    if (isOnline) {
      refreshApplications();
    } else {
      setIsLoading(false);
      setError('No internet connection');
    }
  }, [isOnline, refreshApplications]);

  // Add new application
  const addApplication = useCallback(async (applicationData: JobApplicationCreate): Promise<JobApplication> => {
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    setIsSyncing(true);
    setError(null);

    try {
      const newApplication = await jobApplicationsApi.create(applicationData);
      setApplications(prev => [newApplication, ...prev]);
      return newApplication;
    } catch (err: any) {
      console.error('Failed to add application:', err);
      setError('Failed to add application');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Update application
  const updateApplication = useCallback(async (id: number, updates: JobApplicationUpdate): Promise<JobApplication> => {
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    setIsSyncing(true);
    setError(null);

    try {
      const updatedApplication = await jobApplicationsApi.update(id, updates);
      setApplications(prev => 
        prev.map(app => app.id === id ? updatedApplication : app)
      );
      return updatedApplication;
    } catch (err: any) {
      console.error('Failed to update application:', err);
      setError('Failed to update application');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Delete application
  const deleteApplication = useCallback(async (id: number): Promise<void> => {
    if (!isOnline) {
      throw new Error('No internet connection');
    }

    setIsSyncing(true);
    setError(null);

    try {
      await jobApplicationsApi.delete(id);
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err: any) {
      console.error('Failed to delete application:', err);
      setError('Failed to delete application');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  return {
    applications,
    isLoading,
    error,
    isOnline,
    isSyncing,
    addApplication,
    updateApplication,
    deleteApplication,
    refreshApplications
  };
}; 
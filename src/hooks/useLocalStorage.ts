import { useState, useEffect, useCallback } from 'react';
import { JobApplication } from '../types/jobApplication';

const STORAGE_KEY = 'jobApplications';

interface UseLocalStorageReturn {
  applications: JobApplication[];
  addApplication: (application: JobApplication) => void;
  updateApplication: (id: number, updates: Partial<JobApplication>) => void;
  deleteApplication: (id: number) => void;
  clearAllApplications: () => void;
  syncWithBackend: (backendApplications: JobApplication[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const useLocalStorage = (): UseLocalStorageReturn => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load applications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log('Loading from localStorage:', stored);
      if (stored) {
        const parsedApplications = JSON.parse(stored);
        console.log('Parsed applications:', parsedApplications);
        setApplications(parsedApplications);
      }
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setError('Failed to load applications from local storage');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save applications to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      } catch (err) {
        console.error('Error saving to localStorage:', err);
        setError('Failed to save applications to local storage');
      }
    }
  }, [applications, isLoading]);

  const addApplication = useCallback((application: JobApplication) => {
    setApplications(prev => {
      const newApplications = [...prev, application];
      return newApplications;
    });
    setError(null);
  }, []);

  const updateApplication = useCallback((id: number, updates: Partial<JobApplication> | JobApplication) => {
    setApplications(prev => {
      const updatedApplications = prev.map(app => {
        if (app.id === id) {
          // If updates is a complete JobApplication object, use it directly
          if ('id' in updates && updates.id === id) {
            return updates as JobApplication;
          }
          // Otherwise, merge partial updates
          return { ...app, ...updates, updated_at: new Date().toISOString() };
        }
        return app;
      });
      return updatedApplications;
    });
    setError(null);
  }, []);

  const deleteApplication = useCallback((id: number) => {
    setApplications(prev => {
      const filteredApplications = prev.filter(app => app.id !== id);
      return filteredApplications;
    });
    setError(null);
  }, []);

  const clearAllApplications = useCallback(() => {
    setApplications([]);
    setError(null);
  }, []);

  const syncWithBackend = useCallback((backendApplications: JobApplication[]) => {
    console.log('Syncing applications to local storage:', backendApplications);
    setApplications(backendApplications);
    setError(null);
  }, []);

  return {
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    clearAllApplications,
    syncWithBackend,
    isLoading,
    error
  };
}; 
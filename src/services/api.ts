import axios from 'axios';
import { 
  JobApplication, 
  JobApplicationCreate, 
  JobApplicationUpdate,
  ScrapingRequest,
  ScrapingResponse,
  JobDescriptionEnhanceRequest,
  JobDescriptionEnhanceResponse
} from '../types/jobApplication';
import { supabase } from '../lib/supabase';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Create axios instance with interceptors for auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    config.headers.Authorization = `Bearer ${session.user.id}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.error('Unauthorized access - user needs to login');
    }
    return Promise.reject(error);
  }
);

// Job Applications API
export const jobApplicationsApi = {
  // Get all job applications
  getAll: async (): Promise<{ applications: JobApplication[] }> => {
    const response = await api.get('/job-applications');
    return response.data;
  },

  // Get job application by ID
  getById: async (id: number): Promise<JobApplication> => {
    const response = await api.get(`/job-applications/${id}`);
    return response.data;
  },

  // Create new job application
  create: async (application: JobApplicationCreate): Promise<JobApplication> => {
    const response = await api.post('/job-applications', application);
    return response.data;
  },

  // Update job application
  update: async (id: number, application: JobApplicationUpdate): Promise<JobApplication> => {
    const response = await api.put(`/job-applications/${id}`, application);
    return response.data;
  },

  // Delete job application
  delete: async (id: number): Promise<void> => {
    await api.delete(`/job-applications/${id}`);
  },
};

// Job Scraping API
export const jobScrapingApi = {
  scrapeJob: async (request: ScrapingRequest): Promise<ScrapingResponse> => {
    try {
      const response = await api.post('/job-applications/scrape-job', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle axios errors properly
        return {
          success: false,
          data: null,
          error: error.response?.data?.detail || error.message || 'Network error occurred',
        };
      }
      return {
        success: false,
        data: null,
        error: 'An unexpected error occurred',
      };
    }
  },

  enhanceJobDescription: async (request: JobDescriptionEnhanceRequest): Promise<JobDescriptionEnhanceResponse> => {
    try {
      const response = await api.post('/job-applications/enhance-job-description', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.detail || error.message || 'Network error occurred',
        };
      }
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  },
};

// Follow-ups API
export const followUpsApi = {
  // Get all follow-ups for a job application
  getByApplication: async (applicationId: number): Promise<any[]> => { // Changed from FollowUp[] to any[] as FollowUp is removed
    const response = await api.get(`/job-applications/${applicationId}/follow-ups`);
    return response.data;
  },

  // Create a new follow-up
  create: async (applicationId: number, data: any): Promise<any> => { // Changed from FollowUpCreate to any
    const response = await api.post(`/job-applications/${applicationId}/follow-ups`, data);
    return response.data;
  },

  // Update a follow-up
  update: async (followUpId: number, data: any): Promise<any> => { // Changed from FollowUpUpdate to any
    const response = await api.put(`/follow-ups/${followUpId}`, data);
    return response.data;
  },

  // Delete a follow-up
  delete: async (followUpId: number): Promise<void> => {
    await api.delete(`/follow-ups/${followUpId}`);
  },

  // Get a specific follow-up
  getById: async (followUpId: number): Promise<any> => { // Changed from FollowUp to any
    const response = await api.get(`/follow-ups/${followUpId}`);
    return response.data;
  },

  // Get all follow-ups with optional filtering
  getAll: async (params?: {
    status?: string;
    follow_up_type?: string;
    application_id?: number;
  }): Promise<any[]> => { // Changed from FollowUp[] to any[]
    const response = await api.get('/follow-ups', { params });
    return response.data;
  },
};

// Job application with follow-ups API
export const jobApplicationWithFollowUpsApi = {
  // Get a job application with all its follow-ups
  getById: async (applicationId: number): Promise<any> => { // Changed from JobApplicationWithFollowUps to any
    const response = await api.get(`/job-applications/${applicationId}/with-follow-ups`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api; 
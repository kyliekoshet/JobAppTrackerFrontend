import axios from 'axios';
import {
  JobApplication,
  JobApplicationCreate,
  JobApplicationUpdate,
  JobApplicationList,
  JobApplicationWithFollowUps,
  FollowUp,
  FollowUpCreate,
  FollowUpUpdate,
  ScrapingRequest,
  ScrapingResponse,
  SummaryStats
} from '../types/jobApplication';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Job Applications API
export const jobApplicationsApi = {
  // Get all job applications with pagination and filters
  getAll: async (params?: {
    page?: number;
    size?: number;
    status?: string;
    company?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<JobApplicationList> => {
    const response = await api.get('/job-applications', { params });
    return response.data;
  },

  // Get a single job application by ID
  getById: async (id: number): Promise<JobApplication> => {
    const response = await api.get(`/job-applications/${id}`);
    return response.data;
  },

  // Create a new job application
  create: async (data: JobApplicationCreate): Promise<JobApplication> => {
    const response = await api.post('/job-applications', data);
    return response.data;
  },

  // Update a job application
  update: async (id: number, data: JobApplicationUpdate): Promise<JobApplication> => {
    console.log('API update request:', { id, data });
    const response = await api.put(`/job-applications/${id}`, data);
    console.log('API update response:', response.data);
    return response.data;
  },

  // Delete a job application
  delete: async (id: number): Promise<void> => {
    await api.delete(`/job-applications/${id}`);
  },

  // Get summary statistics
  getStats: async (): Promise<SummaryStats> => {
    const response = await api.get('/job-applications/stats');
    return response.data;
  },
};

// Job Scraping API
export const jobScrapingApi = {
  // Scrape job details from URL
  scrapeJob: async (url: string): Promise<ScrapingResponse> => {
    try {
      const response = await api.post('/scrape-job', { url } as ScrapingRequest);
      return response.data;
    } catch (error) {
      // Handle network errors or server errors
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
  getByApplication: async (applicationId: number): Promise<FollowUp[]> => {
    const response = await api.get(`/job-applications/${applicationId}/follow-ups`);
    return response.data;
  },

  // Create a new follow-up
  create: async (applicationId: number, data: FollowUpCreate): Promise<FollowUp> => {
    const response = await api.post(`/job-applications/${applicationId}/follow-ups`, data);
    return response.data;
  },

  // Update a follow-up
  update: async (followUpId: number, data: FollowUpUpdate): Promise<FollowUp> => {
    const response = await api.put(`/follow-ups/${followUpId}`, data);
    return response.data;
  },

  // Delete a follow-up
  delete: async (followUpId: number): Promise<void> => {
    await api.delete(`/follow-ups/${followUpId}`);
  },

  // Get a specific follow-up
  getById: async (followUpId: number): Promise<FollowUp> => {
    const response = await api.get(`/follow-ups/${followUpId}`);
    return response.data;
  },

  // Get all follow-ups with optional filtering
  getAll: async (params?: {
    status?: string;
    follow_up_type?: string;
    application_id?: number;
  }): Promise<FollowUp[]> => {
    const response = await api.get('/follow-ups', { params });
    return response.data;
  },
};

// Job application with follow-ups API
export const jobApplicationWithFollowUpsApi = {
  // Get a job application with all its follow-ups
  getById: async (applicationId: number): Promise<JobApplicationWithFollowUps> => {
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
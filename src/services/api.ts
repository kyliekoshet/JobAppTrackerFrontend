import axios from 'axios';
import {
  JobApplication,
  JobApplicationCreate,
  JobApplicationUpdate,
  JobApplicationList,
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
    const response = await api.put(`/job-applications/${id}`, data);
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
    const response = await api.post('/scrape-job', { url } as ScrapingRequest);
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
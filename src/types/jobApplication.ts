export interface JobApplication {
  id?: number;
  job_title: string;
  company: string;
  job_description?: string;
  location?: string;
  salary?: string;
  job_url?: string;
  date_applied: string;
  date_job_posted?: string;
  application_status: string;
  interview_stage: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplicationCreate {
  job_title: string;
  company: string;
  job_description?: string;
  location?: string;
  salary?: string;
  job_url?: string;
  date_applied: string;
  date_job_posted?: string;
  application_status: string;
  interview_stage: string;
  notes?: string;
}

export interface JobApplicationUpdate {
  job_title?: string;
  company?: string;
  job_description?: string;
  location?: string;
  salary?: string;
  job_url?: string;
  date_applied?: string;
  date_job_posted?: string;
  application_status?: string;
  interview_stage?: string;
  notes?: string;
}

export interface ScrapedJobData {
  success: boolean;
  url: string;
  job_board: string;
  scraped_at: string;
  job_title: string | null;
  company: string | null;
  location: string | null;
  job_description: string | null;
  salary: string | null;
  error: string | null;
}

export interface ScrapingRequest {
  url: string;
}

export interface ScrapingResponse {
  success: boolean;
  data: ScrapedJobData;
  error: string | null;
}

export interface JobApplicationList {
  applications: JobApplication[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface SummaryStats {
  total_applications: number;
  status_breakdown: Record<string, number>;
  recent_applications: number;
  success_rate: number;
}

export const APPLICATION_STATUSES = [
  "Applied",
  "Interviewing", 
  "Offer",
  "Rejected",
  "Withdrawn",
  "Pending"
] as const;

export const INTERVIEW_STAGES = [
  "None",
  "Phone Screen",
  "Technical Interview", 
  "Behavioral Interview",
  "System Design",
  "Coding Challenge",
  "Onsite",
  "Final Round"
] as const; 
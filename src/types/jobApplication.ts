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
  // Referral information
  referred_by?: string;
  referral_relationship?: string;
  referral_date?: string;
  referral_notes?: string;
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
  // Referral information
  referred_by?: string;
  referral_relationship?: string;
  referral_date?: string;
  referral_notes?: string;
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
  // Referral information
  referred_by?: string;
  referral_relationship?: string;
  referral_date?: string;
  referral_notes?: string;
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
  data?: ScrapedJobData | null;
  error?: string | null;
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

// Follow-up types
export interface FollowUp {
  id?: number;
  job_application_id: number;
  follow_up_type: string;
  title: string;
  description?: string;
  date: string;
  status: string;
  outcome?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FollowUpCreate {
  follow_up_type: string;
  title: string;
  description?: string;
  date: string;
  status: string;
  outcome?: string;
  notes?: string;
}

export interface FollowUpUpdate {
  follow_up_type?: string;
  title?: string;
  description?: string;
  date?: string;
  status?: string;
  outcome?: string;
  notes?: string;
}

export interface JobApplicationWithFollowUps extends JobApplication {
  follow_ups: FollowUp[];
}

export const FOLLOW_UP_TYPES = [
  "Phone Call",
  "Email", 
  "Interview",
  "Follow-up",
  "Technical Interview",
  "Behavioral Interview", 
  "System Design",
  "Coding Challenge",
  "Onsite",
  "Final Round",
  "Reference Check",
  "Background Check",
  "Offer Discussion"
] as const;

export const FOLLOW_UP_STATUSES = [
  "Pending",
  "Completed", 
  "Cancelled",
  "Rescheduled"
] as const;

export const REFERRAL_RELATIONSHIPS = [
  "Former colleague",
  "Current colleague",
  "Friend",
  "Family member",
  "LinkedIn connection",
  "Alumni",
  "Mentor",
  "Recruiter",
  "Hiring manager",
  "Other"
] as const; 
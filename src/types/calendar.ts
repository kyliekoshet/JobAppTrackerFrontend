export interface Task {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  task_type: 'job_application' | 'interview_prep' | 'networking' | 'skill_building' | 'daily_goal' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string; // ISO date string
  due_time?: string; // HH:MM format
  estimated_duration?: number; // in minutes
  actual_duration?: number; // in minutes
  target_count?: number; // for daily goals
  completed_count: number;
  job_application_id?: number;
  calendar_event_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  task_type: 'job_application' | 'interview_prep' | 'networking' | 'skill_building' | 'daily_goal' | 'custom';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  due_time?: string;
  estimated_duration?: number;
  target_count?: number;
  job_application_id?: number;
  calendar_event_id?: number;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  task_type?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  due_time?: string;
  estimated_duration?: number;
  actual_duration?: number;
  target_count?: number;
  completed_count?: number;
  job_application_id?: number;
  calendar_event_id?: number;
  completed_at?: string;
}

export interface CalendarEvent {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  event_type: 'interview' | 'networking' | 'deadline' | 'follow_up' | 'task' | 'custom';
  start_datetime: string; // ISO datetime string
  end_datetime: string; // ISO datetime string
  location?: string;
  is_all_day: boolean;
  reminder_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  job_application_id?: number;
  follow_up_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventCreate {
  title: string;
  description?: string;
  event_type: 'interview' | 'networking' | 'deadline' | 'follow_up' | 'task' | 'custom';
  start_datetime: string;
  end_datetime: string;
  location?: string;
  is_all_day?: boolean;
  reminder_minutes?: number;
  job_application_id?: number;
  follow_up_id?: number;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string;
  event_type?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
  is_all_day?: boolean;
  reminder_minutes?: number;
  status?: string;
  job_application_id?: number;
  follow_up_id?: number;
}

export interface CalendarDayView {
  date: string; // ISO date string
  events: CalendarEvent[];
  tasks: Task[];
}

export interface CalendarWeekView {
  start_date: string;
  end_date: string;
  days: CalendarDayView[];
}

export interface CalendarMonthView {
  year: number;
  month: number;
  weeks: CalendarDayView[][];
}

export interface TaskSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  today_tasks: number;
  this_week_tasks: number;
}

export interface DailyGoalProgress {
  date: string;
  goal_type: string;
  target: number;
  completed: number;
  percentage: number;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarFilters {
  event_types: string[];
  task_types: string[];
  priorities: string[];
  statuses: string[];
} 
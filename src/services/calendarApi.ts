import axios from 'axios';
import { supabase } from '../lib/supabase';
import {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
  CalendarDayView,
  CalendarWeekView,
  CalendarMonthView,
  Task,
  TaskCreate,
  TaskUpdate,
  TaskSummary,
  DailyGoalProgress
} from '../types/calendar';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    config.headers.Authorization = `Bearer ${user.id}`;
  }
  return config;
});

// Calendar Events API
export const calendarEventsApi = {
  // Create a new calendar event
  create: async (event: CalendarEventCreate): Promise<CalendarEvent> => {
    const response = await api.post('/calendar/', event);
    return response.data;
  },

  // Get calendar events with optional filtering
  getAll: async (params?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
    status?: string;
  }): Promise<CalendarEvent[]> => {
    const response = await api.get('/calendar/', { params });
    return response.data;
  },

  // Get a specific calendar event
  getById: async (eventId: number): Promise<CalendarEvent> => {
    const response = await api.get(`/calendar/${eventId}`);
    return response.data;
  },

  // Update a calendar event
  update: async (eventId: number, eventUpdate: CalendarEventUpdate): Promise<CalendarEvent> => {
    const response = await api.put(`/calendar/${eventId}`, eventUpdate);
    return response.data;
  },

  // Delete a calendar event
  delete: async (eventId: number): Promise<void> => {
    await api.delete(`/calendar/${eventId}`);
  },

  // Get day view
  getDayView: async (date: string): Promise<CalendarDayView> => {
    const response = await api.get(`/calendar/view/day/${date}`);
    return response.data;
  },

  // Get week view
  getWeekView: async (startDate: string): Promise<CalendarWeekView> => {
    const response = await api.get(`/calendar/view/week/${startDate}`);
    return response.data;
  },

  // Get month view
  getMonthView: async (year: number, month: number): Promise<CalendarMonthView> => {
    const response = await api.get(`/calendar/view/month/${year}/${month}`);
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  // Create a new task
  create: async (task: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks/', task);
    return response.data;
  },

  // Get tasks with optional filtering
  getAll: async (params?: {
    task_type?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    overdue_only?: boolean;
    today_only?: boolean;
    this_week_only?: boolean;
  }): Promise<Task[]> => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  // Get a specific task
  getById: async (taskId: number): Promise<Task> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Update a task
  update: async (taskId: number, taskUpdate: TaskUpdate): Promise<Task> => {
    const response = await api.put(`/tasks/${taskId}`, taskUpdate);
    return response.data;
  },

  // Delete a task
  delete: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}`);
  },

  // Complete a task with optional metrics
  complete: async (taskId: number, params?: {
    completed_count?: number;
    actual_duration?: number;
  }): Promise<Task> => {
    const response = await api.post(`/tasks/${taskId}/complete`, null, { params });
    return response.data;
  },

  // Get task summary statistics
  getSummary: async (): Promise<TaskSummary> => {
    const response = await api.get('/tasks/summary/stats');
    return response.data;
  },

  // Get daily goal progress
  getDailyGoalProgress: async (params?: {
    start_date?: string;
    end_date?: string;
    goal_type?: string;
  }): Promise<DailyGoalProgress[]> => {
    const response = await api.get('/tasks/daily-goals/progress', { params });
    return response.data;
  },
};

// Utility functions for date formatting
export const dateUtils = {
  // Format date for API (YYYY-MM-DD)
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },

  // Format datetime for API (ISO string)
  formatDateTime: (date: Date): string => {
    return date.toISOString();
  },

  // Parse date from API
  parseDate: (dateString: string): Date => {
    return new Date(dateString);
  },

  // Get start of week (Monday)
  getStartOfWeek: (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  },

  // Get end of week (Sunday)
  getEndOfWeek: (date: Date): Date => {
    const startOfWeek = dateUtils.getStartOfWeek(date);
    return new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
  },

  // Get start of month
  getStartOfMonth: (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  // Get end of month
  getEndOfMonth: (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  },

  // Format time for display (HH:MM)
  formatTime: (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  },

  // Format date for display
  formatDisplayDate: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Format datetime for display
  formatDisplayDateTime: (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  },
}; 
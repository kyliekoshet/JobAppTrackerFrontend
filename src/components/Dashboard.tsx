import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { SummaryStats } from '../types/jobApplication';
import { Task, CalendarEvent, TaskSummary } from '../types/calendar';
import { tasksApi, calendarEventsApi } from '../services/calendarApi';
import { Plus, Briefcase, TrendingUp, Calendar, Target, Loader2, CheckCircle, Clock } from 'lucide-react';

interface DashboardProps {
  onAddNew: () => void;
  onViewAll: () => void;
  onAddTask?: () => void;
  onAddEvent?: () => void;
  onViewCalendar?: () => void;
  stats?: SummaryStats | null;
  isLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onAddNew,
  onViewAll,
  onAddTask,
  onAddEvent,
  onViewCalendar,
  stats: propStats,
  isLoading: propIsLoading = false
}) => {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calendar and Tasks state
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Use prop stats if provided, otherwise use local state
  const displayStats = propStats || stats;
  const displayLoading = propIsLoading || loading;

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, we'll use local state if no prop stats provided
      // This can be enhanced later with local storage fallback
      setStats(null);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = useCallback(async () => {
    setCalendarLoading(true);
    
    try {
      // Load task summary
      const taskSummaryData = await tasksApi.getSummary();
      setTaskSummary(taskSummaryData);

      // Load today's tasks (all tasks due today or overdue)
      const allTasks = await tasksApi.getAll();
      const todayDate = new Date().toISOString().split('T')[0];
      let todayTasks = allTasks
        .filter(task => {
          // Include tasks due today
          if (task.due_date === todayDate) return true;
          
          // Include overdue tasks
          if (task.due_date && task.due_date < todayDate) return true;
          
          // Include tasks without due date but created today
          if (!task.due_date && task.created_at.split('T')[0] === todayDate) return true;
          
          return false;
        })
        .sort((a, b) => {
          // First, sort by completion status (completed tasks go to bottom)
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          
          // Then sort by priority (urgent → high → medium → low)
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by due date (overdue first)
          if (a.due_date && b.due_date) {
            return a.due_date.localeCompare(b.due_date);
          }
          if (a.due_date && !b.due_date) return -1;
          if (!a.due_date && b.due_date) return 1;
          
          // Finally by creation date
          return a.created_at.localeCompare(b.created_at);
        });

      // Apply completed tasks filter
      if (!showCompletedTasks) {
        todayTasks = todayTasks.filter(task => task.status !== 'completed');
      }
      
      // Limit to 8 tasks
      todayTasks = todayTasks.slice(0, 8);
      
      setUpcomingTasks(todayTasks);

      // Load today's events
      const today = new Date().toISOString().split('T')[0];
      const todayView = await calendarEventsApi.getDayView(today);
      setTodayEvents(todayView.events.slice(0, 3)); // Show top 3 events for today

    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, [showCompletedTasks]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    if (!propStats) {
      // Only load stats if not provided via props
      loadStats();
    }
    // Always load calendar and task data
    loadCalendarData();
  }, [propStats, loadCalendarData]);

  // Reload tasks when showCompletedTasks changes
  useEffect(() => {
    loadCalendarData();
  }, [showCompletedTasks, loadCalendarData]);

  // Handle task completion toggle
  const handleTaskToggle = async (task: Task) => {
    try {
      const newStatus: 'pending' | 'completed' = task.status === 'completed' ? 'pending' : 'completed';
      const updatedTask: Task = {
        ...task,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
        completed_count: newStatus === 'completed' ? (task.target_count || 1) : 0
      };

      // Optimistically update the UI
      setUpcomingTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? updatedTask : t)
      );

      // Update task summary optimistically
      if (taskSummary) {
        setTaskSummary(prev => {
          if (!prev) return prev;
          const completedDiff = newStatus === 'completed' ? 1 : -1;
          const pendingDiff = newStatus === 'completed' ? -1 : 1;
          return {
            ...prev,
            completed_tasks: prev.completed_tasks + completedDiff,
            pending_tasks: prev.pending_tasks + pendingDiff
          };
        });
      }

      // API call
      const updateData = {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
        completed_count: newStatus === 'completed' ? (task.target_count || 1) : 0
      };
      
      await tasksApi.update(task.id, updateData);
      
      // Refresh data to ensure consistency
      const freshTaskSummary = await tasksApi.getSummary();
      setTaskSummary(freshTaskSummary);
      
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert optimistic update on error
      setUpcomingTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? task : t)
      );
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Applied': 'bg-blue-500',
      'Interviewing': 'bg-yellow-500',
      'Offer': 'bg-green-500',
      'Rejected': 'bg-red-500',
      'Withdrawn': 'bg-gray-500',
      'Pending': 'bg-purple-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  if (displayLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadStats} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Application Tracker</h1>
          <p className="text-gray-600 mt-2">Track your job search progress and applications</p>
        </div>
        <Button onClick={onAddNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Application
        </Button>
      </div>

      {/* Stats Cards */}
      {displayStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{displayStats.total_applications}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (30 days)</p>
                <p className="text-2xl font-bold text-gray-900">{displayStats.recent_applications}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayStats.success_rate > 0 ? `${(displayStats.success_rate * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(displayStats.status_breakdown['Applied'] || 0) + (displayStats.status_breakdown['Interviewing'] || 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Calendar and Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Plus className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <Button onClick={onAddNew} variant="outline" className="w-full flex items-center justify-center gap-2">
              <Briefcase className="w-4 h-4" />
              Add Job Application
            </Button>
            {onAddTask && (
              <Button onClick={onAddTask} variant="outline" className="w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Add Task
              </Button>
            )}
            {onAddEvent && (
              <Button onClick={onAddEvent} variant="outline" className="w-full flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-sm border h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          
          {/* Show Completed Tasks Toggle */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <input
              type="checkbox"
              id="showCompletedTasks"
              checked={showCompletedTasks}
              onChange={(e) => setShowCompletedTasks(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="showCompletedTasks" className="text-sm text-gray-700">
              Show completed tasks
            </label>
          </div>
          {calendarLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : upcomingTasks.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {upcomingTasks.map((task) => {
                const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0];
                const isCompleted = task.status === 'completed';
                return (
                  <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                    isCompleted ? 'bg-green-50 border border-green-200 opacity-75' : 'bg-gray-50'
                  }`}>
                    {/* Completion Checkbox */}
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTaskToggle(task);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="mt-1 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                    />
                    
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      isCompleted ? 'bg-green-500' :
                      task.priority === 'urgent' ? 'bg-red-500' : 
                      task.priority === 'high' ? 'bg-orange-500' :
                      task.priority === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCompleted ? 'line-through text-gray-600' : 'text-gray-900'
                      }`}>
                        {isCompleted && '✅ '}{task.title}
                      </p>
                      {task.due_date && (
                        <p className={`text-xs ${
                          isCompleted ? 'text-gray-500' :
                          isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'
                        }`}>
                          {!isCompleted && isOverdue ? '⚠️ Overdue: ' : 'Due: '}
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      isCompleted ? 'bg-green-100 text-green-700' :
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {isCompleted ? '✅ Done' : task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-sm text-center">
                {showCompletedTasks ? 'No tasks for today' : 'No pending tasks for today'}
              </p>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          {calendarLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    event.event_type === 'interview' ? 'bg-green-500' :
                    event.event_type === 'deadline' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.start_datetime).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    event.event_type === 'interview' ? 'bg-green-100 text-green-700' :
                    event.event_type === 'deadline' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {event.event_type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No events today</p>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      {displayStats && Object.keys(displayStats.status_breakdown).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(displayStats.status_breakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${getStatusColor(status)}`}></div>
                <p className="text-sm font-medium text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Tips */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Use the "Scrape Job" feature to automatically fill job details from URLs</li>
          <li>• Keep your application status updated to track your progress</li>
          <li>• Use Quick Actions to rapidly add new applications, tasks, and events</li>
          <li>• Create tasks for follow-ups and interview preparation</li>
          <li>• Schedule events for interviews and application deadlines</li>
          <li>• Check off tasks directly from the dashboard for quick progress updates</li>
          <li>• Use priority levels to focus on the most important tasks first</li>
        </ul>
      </div>
    </div>
  );
}; 
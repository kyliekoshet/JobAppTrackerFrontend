import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { CalendarView, CalendarMonthView, CalendarWeekView, CalendarDayView, Task, CalendarEvent, TaskSummary } from '../types/calendar';
import { calendarEventsApi, tasksApi, dateUtils } from '../services/calendarApi';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, AlertCircle, Target, Briefcase, List, Eye, EyeOff } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { EventForm } from './EventForm';

interface CalendarProps {}

export const Calendar: React.FC<CalendarProps> = () => {
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthView, setMonthView] = useState<CalendarMonthView | null>(null);
  const [weekView, setWeekView] = useState<CalendarWeekView | null>(null);
  const [dayView, setDayView] = useState<CalendarDayView | null>(null);
  const [taskSummary, setTaskSummary] = useState<TaskSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Task list state
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [showTaskList, setShowTaskList] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [taskSort, setTaskSort] = useState<'date' | 'priority' | 'status' | 'title'>('date');
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Form states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load calendar data based on current view
  const loadCalendarData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (currentView === 'month') {
        const data = await calendarEventsApi.getMonthView(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setMonthView(data);
      } else if (currentView === 'week') {
        const startOfWeek = dateUtils.getStartOfWeek(currentDate);
        const data = await calendarEventsApi.getWeekView(
          dateUtils.formatDate(startOfWeek)
        );
        setWeekView(data);
      } else if (currentView === 'day') {
        const data = await calendarEventsApi.getDayView(
          dateUtils.formatDate(currentDate)
        );
        setDayView(data);
      }
      
      // Load task summary and all tasks
      const [summary, tasks] = await Promise.all([
        tasksApi.getSummary(),
        tasksApi.getAll()
      ]);
      setTaskSummary(summary);
      setAllTasks(tasks);
    } catch (err) {
      setError('Failed to load calendar data');
      console.error('Calendar loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentView, currentDate]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (currentView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Form handlers
  const handleAddEvent = (date?: string) => {
    setSelectedDate(date || dateUtils.formatDate(currentDate));
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleAddTask = (date?: string) => {
    setSelectedDate(date || dateUtils.formatDate(currentDate));
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(null);
    setShowEventForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedDate(null);
    setShowTaskForm(true);
  };

  const handleQuickCompleteTask = async (task: Task) => {
    try {
      // Use the same optimistic update approach
      const updatedTask: Task = {
        ...task,
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_count: task.target_count || 1
      };

      // Update local state immediately
      setAllTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? updatedTask : t)
      );

      if (monthView) {
        setMonthView(prevMonth => {
          if (!prevMonth) return prevMonth;
          return {
            ...prevMonth,
            weeks: prevMonth.weeks.map(week =>
              week.map(day => ({
                ...day,
                tasks: day.tasks.map(t => t.id === task.id ? updatedTask : t)
              }))
            )
          };
        });
      }

      // API call
      const updateData = {
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
        completed_count: task.target_count || 1
      };
      
      await tasksApi.update(task.id, updateData);
      
      // Only refresh task summary
      const summary = await tasksApi.getSummary();
      setTaskSummary(summary);
      
    } catch (error) {
      console.error('Failed to complete task:', error);
      // Revert optimistic update on error
      setAllTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? task : t)
      );
    }
  };

  const handleEventSaved = (event: CalendarEvent) => {
    // Update calendar view with the saved event
    if (monthView) {
      setMonthView(prevMonth => {
        if (!prevMonth) return prevMonth;
        return {
          ...prevMonth,
          weeks: prevMonth.weeks.map(week =>
            week.map(day => ({
              ...day,
              events: day.events.some(e => e.id === event.id)
                ? day.events.map(e => e.id === event.id ? event : e)
                : [...day.events, event]
            }))
          )
        };
      });
    }
  };

  const handleTaskSaved = (task: Task) => {
    // Update local state with the saved task
    setAllTasks(prevTasks => {
      const existingIndex = prevTasks.findIndex(t => t.id === task.id);
      if (existingIndex >= 0) {
        // Update existing task
        return prevTasks.map(t => t.id === task.id ? task : t);
      } else {
        // Add new task
        return [...prevTasks, task];
      }
    });

    // Update calendar view if needed
    if (monthView) {
      setMonthView(prevMonth => {
        if (!prevMonth) return prevMonth;
        return {
          ...prevMonth,
          weeks: prevMonth.weeks.map(week =>
            week.map(day => ({
              ...day,
              tasks: day.tasks.some(t => t.id === task.id)
                ? day.tasks.map(t => t.id === task.id ? task : t)
                : [...day.tasks, task]
            }))
          )
        };
      });
    }

    // Only refresh task summary
    tasksApi.getSummary().then(summary => setTaskSummary(summary));
  };

  const handleTaskCompletionToggle = (updatedTask: Task) => {
    // Update local state with the updated task from the form
    setAllTasks(prevTasks => 
      prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );

    if (monthView) {
      setMonthView(prevMonth => {
        if (!prevMonth) return prevMonth;
        return {
          ...prevMonth,
          weeks: prevMonth.weeks.map(week =>
            week.map(day => ({
              ...day,
              tasks: day.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
            }))
          )
        };
      });
    }

    // Only refresh task summary
    tasksApi.getSummary().then(summary => setTaskSummary(summary));
  };

  // Quick toggle task completion from task list
  const handleQuickToggleTask = async (task: Task) => {
    try {
      // Optimistically update the UI first
      const newStatus: 'pending' | 'completed' = task.status === 'completed' ? 'pending' : 'completed';
      const updatedTask: Task = {
        ...task,
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
        completed_count: newStatus === 'completed' ? (task.target_count || 1) : 0
      };

      // Update local state immediately (optimistic update)
      setAllTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? updatedTask : t)
      );

      // Update the calendar data if the task appears there too
      if (monthView) {
        setMonthView(prevMonth => {
          if (!prevMonth) return prevMonth;
          return {
            ...prevMonth,
            weeks: prevMonth.weeks.map(week =>
              week.map(day => ({
                ...day,
                tasks: day.tasks.map(t => t.id === task.id ? updatedTask : t)
              }))
            )
          };
        });
      }

      // Then make the API call
      const updateData = {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
        completed_count: newStatus === 'completed' ? (task.target_count || 1) : 0
      };
      
      await tasksApi.update(task.id, updateData);
      
      // Only refresh task summary stats, not everything
      const summary = await tasksApi.getSummary();
      setTaskSummary(summary);
      
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert the optimistic update on error
      setAllTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? task : t)
      );
    }
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = allTasks;

    // Apply priority filter
    if (taskFilter !== 'all') {
      filteredTasks = allTasks.filter(task => task.priority === taskFilter);
    }

    // Hide completed tasks if showCompleted is false
    if (!showCompleted) {
      filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      switch (taskSort) {
        case 'date':
          const dateA = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
          const dateB = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
          return dateA.getTime() - dateB.getTime();
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filteredTasks;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low': return 'bg-gray-100 border-gray-300 text-gray-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'job_application': return <Briefcase className="w-4 h-4" />;
      case 'interview_prep': return <Target className="w-4 h-4" />;
      case 'networking': return <CheckCircle className="w-4 h-4" />;
      case 'skill_building': return <AlertCircle className="w-4 h-4" />;
      case 'daily_goal': return <Target className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const closeAllForms = () => {
    setShowTaskForm(false);
    setShowEventForm(false);
    setEditingTask(null);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  // Get current view title
  const getViewTitle = () => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (currentView === 'week') {
      const startOfWeek = dateUtils.getStartOfWeek(currentDate);
      const endOfWeek = dateUtils.getEndOfWeek(currentDate);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return dateUtils.formatDisplayDate(currentDate);
    }
  };

  // Event type colors
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'interview': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'networking': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'deadline': return 'text-red-600 bg-red-50 border-red-200';
      case 'follow_up': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Render task summary cards
  const renderTaskSummary = () => {
    if (!taskSummary) return null;

    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{taskSummary.today_tasks}</div>
          <div className="text-sm text-blue-700">Today's Tasks</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{taskSummary.completed_tasks}</div>
          <div className="text-sm text-green-700">Completed</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{taskSummary.pending_tasks}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{taskSummary.overdue_tasks}</div>
          <div className="text-sm text-red-700">Overdue</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{taskSummary.this_week_tasks}</div>
          <div className="text-sm text-purple-700">This Week</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{taskSummary.total_tasks}</div>
          <div className="text-sm text-gray-700">Total Tasks</div>
        </div>
      </div>
    );
  };

  // Render day cell for month view
  const renderDayCell = (dayView: CalendarDayView, isCurrentMonth: boolean = true) => {
    const date = new Date(dayView.date);
    const isToday = dateUtils.formatDate(new Date()) === dayView.date;
    // const hasEvents = dayView.events.length > 0;
    // const hasTasks = dayView.tasks.length > 0;
    
    return (
      <div 
        key={dayView.date}
        className={`min-h-[120px] p-2 border border-gray-200 ${
          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
        } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
      >
        <div className={`text-sm font-medium mb-2 ${
          isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
        }`}>
          {date.getDate()}
        </div>
        
        {/* Events */}
        {dayView.events.slice(0, 2).map((event) => (
          <div
            key={event.id}
            className={`text-xs p-1 mb-1 rounded cursor-pointer ${getEventTypeColor(event.event_type)}`}
            onClick={() => handleEditEvent(event)}
          >
            {event.title}
          </div>
        ))}
        
        {/* Tasks */}
        {dayView.tasks.slice(0, 2).map((task) => (
          <div
            key={task.id}
            className={`text-xs p-1 mb-1 rounded cursor-pointer flex items-center gap-1 ${getPriorityColor(task.priority)}`}
            onClick={() => handleEditTask(task)}
          >
            {getTaskTypeIcon(task.task_type)}
            <span className="truncate">{task.title}</span>
          </div>
        ))}
        
        {/* More indicator */}
        {(dayView.events.length + dayView.tasks.length) > 4 && (
          <div className="text-xs text-gray-500">
            +{(dayView.events.length + dayView.tasks.length) - 4} more
          </div>
        )}
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    if (!monthView) return null;

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        {monthView.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((dayView) => {
              const date = new Date(dayView.date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              return renderDayCell(dayView, isCurrentMonth);
            })}
          </div>
        ))}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    if (!weekView) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-7 gap-4 p-4">
          {weekView.days.map((dayView) => {
            const date = new Date(dayView.date);
            const isToday = dateUtils.formatDate(new Date()) === dayView.date;
            
            return (
              <div key={dayView.date} className="space-y-2">
                <div className={`text-center p-2 rounded ${
                  isToday ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'
                }`}>
                  <div className="text-sm">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-lg">{date.getDate()}</div>
                </div>
                
                <div className="space-y-1">
                  {dayView.events.map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-2 rounded cursor-pointer ${getEventTypeColor(event.event_type)}`}
                      onClick={() => handleEditEvent(event)}
                    >
                      <div className="font-medium">{event.title}</div>
                      {!event.is_all_day && (
                        <div>{new Date(event.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                      )}
                    </div>
                  ))}
                  
                  {dayView.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-2 rounded cursor-pointer flex items-center gap-1 ${getPriorityColor(task.priority)}`}
                      onClick={() => handleEditTask(task)}
                    >
                      {getTaskTypeIcon(task.task_type)}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    if (!dayView) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Events ({dayView.events.length})
            </h3>
            <div className="space-y-3">
              {dayView.events.length === 0 ? (
                <p className="text-gray-500 text-sm">No events scheduled for this day</p>
              ) : (
                dayView.events.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg cursor-pointer ${getEventTypeColor(event.event_type)}`}
                    onClick={() => handleEditEvent(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm mt-1">{event.description}</div>
                    )}
                    <div className="text-sm mt-2">
                      {event.is_all_day ? (
                        'All day'
                      ) : (
                        `${new Date(event.start_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(event.end_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                      )}
                    </div>
                    {event.location && (
                      <div className="text-sm mt-1">📍 {event.location}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Tasks ({dayView.tasks.length})
            </h3>
            <div className="space-y-3">
              {dayView.tasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks scheduled for this day</p>
              ) : (
                dayView.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      task.status === 'completed' 
                        ? 'bg-green-50 border-2 border-green-200 opacity-75' 
                        : getPriorityColor(task.priority)
                    }`}
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? (
                        <span className="text-green-600 text-lg">✅</span>
                      ) : (
                        getTaskTypeIcon(task.task_type)
                      )}
                      <span className={`font-medium ${
                        task.status === 'completed' ? 'line-through text-gray-600' : ''
                      }`}>
                        {task.title}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'completed' ? '✅ Completed' : 
                         task.status === 'in_progress' ? '🔄 In Progress' :
                         task.status === 'cancelled' ? '❌ Cancelled' :
                         '⏳ Pending'}
                      </span>
                    </div>
                    {task.description && (
                      <div className="text-sm mt-1">{task.description}</div>
                    )}
                    <div className="text-sm mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {task.due_time && (
                          <span>⏰ {task.due_time}</span>
                        )}
                        {task.estimated_duration && (
                          <span>⏱️ {task.estimated_duration}min</span>
                        )}
                        {task.target_count && (
                          <span>🎯 {task.completed_count}/{task.target_count}</span>
                        )}
                      </div>
                      {task.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickCompleteTask(task);
                          }}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title="Mark as completed"
                        >
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Summary */}
      {renderTaskSummary()}

      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Job Search Calendar</h1>
          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => handleAddEvent()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
          <Button onClick={() => handleAddTask()} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button 
            onClick={() => setShowTaskList(!showTaskList)} 
            size="sm" 
            variant={showTaskList ? "default" : "outline"}
          >
            <List className="w-4 h-4 mr-2" />
            {showTaskList ? 'Hide Tasks' : 'Show Tasks'}
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={navigatePrevious} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={navigateToday} variant="outline" size="sm">
            Today
          </Button>
          <Button onClick={navigateNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="text-lg font-semibold ml-4">
            {getViewTitle()}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
            <Button
              key={view}
              onClick={() => setCurrentView(view)}
              variant={currentView === view ? 'default' : 'ghost'}
              size="sm"
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Task List Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Calendar Content */}
        <div className={showTaskList ? "lg:col-span-2" : "lg:col-span-3"}>
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && renderWeekView()}
          {currentView === 'day' && renderDayView()}
        </div>

        {/* Task List */}
        {showTaskList && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Task List Header */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Tasks</h3>
                  </div>
                  <Button
                    onClick={() => setShowTaskList(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                </div>

                {/* Task Controls */}
                <div className="flex flex-col gap-3">
                  {/* Filter and Sort Row */}
                  <div className="flex gap-2">
                    <select
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value as any)}
                      className="text-sm border rounded px-2 py-1 flex-1"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">🔴 Urgent</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                    <select
                      value={taskSort}
                      onChange={(e) => setTaskSort(e.target.value as any)}
                      className="text-sm border rounded px-2 py-1 flex-1"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="priority">Sort by Priority</option>
                      <option value="status">Sort by Status</option>
                      <option value="title">Sort by Title</option>
                    </select>
                  </div>

                  {/* Show Completed Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showCompleted"
                      checked={showCompleted}
                      onChange={(e) => setShowCompleted(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label htmlFor="showCompleted" className="text-sm text-gray-700">
                      Show completed tasks
                    </label>
                  </div>
                </div>
              </div>

              {/* Task List Content */}
              <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getFilteredAndSortedTasks().length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">
                      {taskFilter === 'all' ? 'No tasks found' : `No ${taskFilter} priority tasks found`}
                    </p>
                  ) : (
                    getFilteredAndSortedTasks().map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          task.status === 'completed' 
                            ? 'bg-green-50 border-green-200 opacity-75' 
                            : getPriorityColor(task.priority)
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Completion Checkbox */}
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickToggleTask(task);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="mt-1 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                          />
                          
                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {task.status === 'completed' ? (
                                  <span className="text-green-600 text-sm">✅</span>
                                ) : (
                                  getTaskTypeIcon(task.task_type)
                                )}
                                <span className={`font-medium text-sm ${
                                  task.status === 'completed' ? 'line-through text-gray-600' : ''
                                }`}>
                                  {task.title}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-xs px-1"
                                title="Edit task"
                              >
                                ✏️
                              </button>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {task.due_date && (
                                <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                              )}
                              {task.due_time && (
                                <span>⏰ {task.due_time}</span>
                              )}
                              {task.target_count && (
                                <span>🎯 {task.completed_count}/{task.target_count}</span>
                              )}
                            </div>
                            
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                task.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {task.status === 'completed' ? '✅ Completed' : 
                                 task.status === 'in_progress' ? '🔄 In Progress' :
                                 task.status === 'cancelled' ? '❌ Cancelled' :
                                 '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show Task List Button (when hidden) */}
      {!showTaskList && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setShowTaskList(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
          >
            <Eye className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        isOpen={showTaskForm}
        onClose={closeAllForms}
        onSave={handleTaskSaved}
        onCompletionToggle={handleTaskCompletionToggle}
        initialDate={selectedDate || undefined}
      />

      {/* Event Form Modal */}
      <EventForm
        event={editingEvent}
        isOpen={showEventForm}
        onClose={closeAllForms}
        onSave={handleEventSaved}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
}; 
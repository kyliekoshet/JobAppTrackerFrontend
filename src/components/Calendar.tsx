import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { CalendarView, CalendarMonthView, CalendarWeekView, CalendarDayView, Task, CalendarEvent, TaskSummary } from '../types/calendar';
import { calendarEventsApi, tasksApi, dateUtils } from '../services/calendarApi';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, AlertCircle, Target, Briefcase } from 'lucide-react';
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
      
      // Load task summary
      const summary = await tasksApi.getSummary();
      setTaskSummary(summary);
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

  const handleEventSaved = (event: CalendarEvent) => {
    loadCalendarData(); // Refresh calendar data
  };

  const handleTaskSaved = (task: Task) => {
    loadCalendarData(); // Refresh calendar data
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

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  // Task type icons
  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'job_application': return <Briefcase className="w-4 h-4" />;
      case 'interview_prep': return <Target className="w-4 h-4" />;
      case 'daily_goal': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
                    className={`p-4 rounded-lg cursor-pointer ${getPriorityColor(task.priority)}`}
                    onClick={() => handleEditTask(task)}
                  >
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(task.task_type)}
                      <span className="font-medium">{task.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    {task.description && (
                      <div className="text-sm mt-1">{task.description}</div>
                    )}
                    <div className="text-sm mt-2 flex items-center gap-4">
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

      {/* Calendar Content */}
      <div>
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </div>

      {/* Task Form Modal */}
      <TaskForm
        task={editingTask}
        isOpen={showTaskForm}
        onClose={closeAllForms}
        onSave={handleTaskSaved}
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
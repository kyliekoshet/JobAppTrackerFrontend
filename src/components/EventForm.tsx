import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { CalendarEvent, CalendarEventCreate, CalendarEventUpdate } from '../types/calendar';
import { calendarEventsApi, dateUtils } from '../services/calendarApi';
import { X, Save, Calendar, MapPin, Clock, Users, Phone, AlertTriangle, AlertCircle } from 'lucide-react';

interface EventFormProps {
  event?: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  jobApplicationId?: number;
  initialDate?: string;
  initialTime?: string;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  jobApplicationId,
  initialDate,
  initialTime
}) => {
  const [formData, setFormData] = useState<CalendarEventCreate>({
    title: '',
    description: '',
    event_type: 'custom',
    start_datetime: '',
    end_datetime: '',
    location: '',
    is_all_day: false,
    reminder_minutes: 60,
    job_application_id: jobApplicationId
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when event prop changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        location: event.location || '',
        is_all_day: event.is_all_day,
        reminder_minutes: event.reminder_minutes,
        job_application_id: event.job_application_id
      });
    } else {
      const defaultDate = initialDate || dateUtils.formatDate(new Date());
      const defaultTime = initialTime || '09:00';
      const startDateTime = `${defaultDate}T${defaultTime}`;
      const endDateTime = `${defaultDate}T${getEndTime(defaultTime, 60)}`;
      
      setFormData({
        title: '',
        description: '',
        event_type: 'custom',
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        location: '',
        is_all_day: false,
        reminder_minutes: 60,
        job_application_id: jobApplicationId
      });
    }
    setError(null);
  }, [event, initialDate, initialTime, jobApplicationId]);

  // Helper function to calculate end time
  const getEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate start/end times
      if (new Date(formData.start_datetime) >= new Date(formData.end_datetime)) {
        setError('End time must be after start time');
        setIsLoading(false);
        return;
      }

      let savedEvent: CalendarEvent;
      
      if (event) {
        // Update existing event - clean up empty strings
        const updateData: CalendarEventUpdate = {
          title: formData.title,
          description: formData.description || undefined,
          event_type: formData.event_type,
          start_datetime: formData.start_datetime,
          end_datetime: formData.end_datetime,
          location: formData.location || undefined,
          is_all_day: formData.is_all_day,
          reminder_minutes: formData.reminder_minutes,
          job_application_id: formData.job_application_id || undefined,
          follow_up_id: formData.follow_up_id || undefined
        };
        savedEvent = await calendarEventsApi.update(event.id, updateData);
      } else {
        // Create new event - clean up empty strings
        const createData: CalendarEventCreate = {
          title: formData.title,
          description: formData.description || undefined,
          event_type: formData.event_type,
          start_datetime: formData.start_datetime,
          end_datetime: formData.end_datetime,
          location: formData.location || undefined,
          is_all_day: formData.is_all_day,
          reminder_minutes: formData.reminder_minutes,
          job_application_id: formData.job_application_id || undefined,
          follow_up_id: formData.follow_up_id || undefined
        };
        savedEvent = await calendarEventsApi.create(createData);
      }

      onSave(savedEvent);
      onClose();
    } catch (err) {
      setError(event ? 'Failed to update event' : 'Failed to create event');
      console.error('Event save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CalendarEventCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update end time when start time changes
  const handleStartTimeChange = (startDateTime: string) => {
    handleInputChange('start_datetime', startDateTime);
    
    // Auto-adjust end time to maintain duration
    if (!formData.is_all_day && formData.end_datetime) {
      const startDate = new Date(startDateTime);
      const currentEndDate = new Date(formData.end_datetime);
      const currentStartDate = new Date(formData.start_datetime);
      
      if (currentEndDate > currentStartDate) {
        const duration = currentEndDate.getTime() - currentStartDate.getTime();
        const newEndDate = new Date(startDate.getTime() + duration);
        handleInputChange('end_datetime', newEndDate.toISOString().slice(0, 16));
      }
    }
  };

  // Toggle all-day event
  const handleAllDayToggle = (isAllDay: boolean) => {
    handleInputChange('is_all_day', isAllDay);
    
    if (isAllDay) {
      const date = formData.start_datetime.split('T')[0];
      handleInputChange('start_datetime', `${date}T00:00`);
      handleInputChange('end_datetime', `${date}T23:59`);
    }
  };

  // Event type options with icons and descriptions
  const eventTypes = [
    { 
      value: 'interview', 
      label: 'Interview', 
      icon: <Users className="w-4 h-4" />, 
      description: 'Job interview or screening call',
      defaultDuration: 60,
      reminderMinutes: 120
    },
    { 
      value: 'networking', 
      label: 'Networking', 
      icon: <Users className="w-4 h-4" />, 
      description: 'Networking events, meetups, conferences',
      defaultDuration: 180,
      reminderMinutes: 60
    },
    { 
      value: 'deadline', 
      label: 'Deadline', 
      icon: <AlertTriangle className="w-4 h-4" />, 
      description: 'Application deadlines, follow-up deadlines',
      defaultDuration: 30,
      reminderMinutes: 1440 // 24 hours
    },
    { 
      value: 'follow_up', 
      label: 'Follow-up', 
      icon: <Phone className="w-4 h-4" />, 
      description: 'Follow-up calls or meetings',
      defaultDuration: 30,
      reminderMinutes: 60
    },
    { 
      value: 'custom', 
      label: 'Custom', 
      icon: <Calendar className="w-4 h-4" />, 
      description: 'Other job search related events',
      defaultDuration: 60,
      reminderMinutes: 60
    }
  ];

  const reminderOptions = [
    { value: 0, label: 'No reminder' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 2880, label: '2 days before' }
  ];

  // Pre-defined event templates based on type
  const getEventTemplate = (eventType: string) => {
    const eventTypeData = eventTypes.find(type => type.value === eventType);
    const templates = {
      interview: {
        title: 'Interview with [Company]',
        description: 'Interview for [Position] position\n\nPreparation notes:\n- Research company background\n- Review job requirements\n- Prepare questions to ask\n- Practice common interview questions',
        location: 'Video call / Office address'
      },
      networking: {
        title: '[Event Name] - Networking',
        description: 'Networking opportunity in [Industry/Location]\n\nGoals:\n- Meet 3-5 new contacts\n- Exchange business cards\n- Follow up within 24 hours',
        location: 'Event venue or virtual platform'
      },
      deadline: {
        title: 'Application Deadline - [Company]',
        description: 'Final deadline to submit application for [Position] at [Company]\n\nReminder to:\n- Review application materials\n- Submit before deadline\n- Send confirmation email',
        location: 'Online application portal'
      },
      follow_up: {
        title: 'Follow-up with [Contact/Company]',
        description: 'Follow-up regarding [Topic/Position]\n\nTalking points:\n- Thank for previous conversation\n- Provide requested information\n- Ask about next steps',
        location: 'Phone call / Email / In-person'
      },
      custom: {
        title: '',
        description: '',
        location: ''
      }
    };
    
    const template = templates[eventType as keyof typeof templates] || templates.custom;
    return {
      ...template,
      defaultDuration: eventTypeData?.defaultDuration || 60,
      reminderMinutes: eventTypeData?.reminderMinutes || 60
    };
  };

  const applyTemplate = () => {
    const template = getEventTemplate(formData.event_type);
    const startDate = new Date(formData.start_datetime);
    const endDate = new Date(startDate.getTime() + template.defaultDuration * 60000);
    
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      location: template.location,
      end_datetime: endDate.toISOString().slice(0, 16),
      reminder_minutes: template.reminderMinutes
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eventTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.event_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('event_type', type.value)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyTemplate}
              className="mt-2"
            >
              Use Template
            </Button>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add event details, agenda, or notes..."
              rows={4}
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="all_day"
              type="checkbox"
              checked={formData.is_all_day}
              onChange={(e) => handleAllDayToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="all_day" className="text-sm font-medium text-gray-700">
              All day event
            </label>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700 mb-2">
                Start {formData.is_all_day ? 'Date' : 'Date & Time'} *
              </label>
              <Input
                id="start_datetime"
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                value={formData.is_all_day ? formData.start_datetime.split('T')[0] : formData.start_datetime}
                onChange={(e) => handleStartTimeChange(
                  formData.is_all_day ? `${e.target.value}T00:00` : e.target.value
                )}
                required
              />
            </div>

            <div>
              <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700 mb-2">
                End {formData.is_all_day ? 'Date' : 'Date & Time'} *
              </label>
              <Input
                id="end_datetime"
                type={formData.is_all_day ? 'date' : 'datetime-local'}
                value={formData.is_all_day ? formData.end_datetime.split('T')[0] : formData.end_datetime}
                onChange={(e) => handleInputChange('end_datetime', 
                  formData.is_all_day ? `${e.target.value}T23:59` : e.target.value
                )}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Office address, video call link, or virtual platform"
            />
          </div>

          {/* Reminder */}
          <div>
            <label htmlFor="reminder" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Reminder
            </label>
                          <Select
                value={(formData.reminder_minutes || 60).toString()}
                onValueChange={(value) => handleInputChange('reminder_minutes', parseInt(value))}
              >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value.toString()}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { Task, TaskCreate, TaskUpdate } from '../types/calendar';
import { tasksApi, dateUtils } from '../services/calendarApi';
import { X, Save, Clock, Target, Briefcase, Users, BookOpen, Star, AlertCircle } from 'lucide-react';

interface TaskFormProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  jobApplicationId?: number;
  initialDate?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  jobApplicationId,
  initialDate
}) => {
  const [formData, setFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    task_type: 'custom',
    priority: 'medium',
    due_date: initialDate || dateUtils.formatDate(new Date()),
    due_time: '',
    estimated_duration: 30,
    target_count: undefined,
    job_application_id: jobApplicationId
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when task prop changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        priority: task.priority,
        due_date: task.due_date || dateUtils.formatDate(new Date()),
        due_time: task.due_time || '',
        estimated_duration: task.estimated_duration || 30,
        target_count: task.target_count,
        job_application_id: task.job_application_id
      });
    } else {
      setFormData({
        title: '',
        description: '',
        task_type: 'custom',
        priority: 'medium',
        due_date: initialDate || dateUtils.formatDate(new Date()),
        due_time: '',
        estimated_duration: 30,
        target_count: undefined,
        job_application_id: jobApplicationId
      });
    }
    setError(null);
  }, [task, initialDate, jobApplicationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let savedTask: Task;
      
      if (task) {
        // Update existing task - clean up empty strings
        const updateData: TaskUpdate = {
          title: formData.title,
          description: formData.description || undefined,
          task_type: formData.task_type,
          priority: formData.priority,
          due_date: formData.due_date || undefined,
          due_time: formData.due_time || undefined,
          estimated_duration: formData.estimated_duration || undefined,
          target_count: formData.task_type === 'daily_goal' ? formData.target_count : undefined,
          job_application_id: formData.job_application_id || undefined,
          calendar_event_id: formData.calendar_event_id || undefined
        };
        savedTask = await tasksApi.update(task.id, updateData);
      } else {
        // Create new task - clean up empty strings
        const createData: TaskCreate = {
          title: formData.title,
          description: formData.description || undefined,
          task_type: formData.task_type,
          priority: formData.priority,
          due_date: formData.due_date || undefined,
          due_time: formData.due_time || undefined,
          estimated_duration: formData.estimated_duration || undefined,
          target_count: formData.task_type === 'daily_goal' ? formData.target_count : undefined,
          job_application_id: formData.job_application_id || undefined,
          calendar_event_id: formData.calendar_event_id || undefined
        };
        savedTask = await tasksApi.create(createData);
      }

      onSave(savedTask);
      onClose();
    } catch (err) {
      setError(task ? 'Failed to update task' : 'Failed to create task');
      console.error('Task save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaskCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Task type options with icons and descriptions
  const taskTypes = [
    { value: 'job_application', label: 'Job Application', icon: <Briefcase className="w-4 h-4" />, description: 'Apply to a specific job' },
    { value: 'interview_prep', label: 'Interview Prep', icon: <Target className="w-4 h-4" />, description: 'Prepare for upcoming interviews' },
    { value: 'networking', label: 'Networking', icon: <Users className="w-4 h-4" />, description: 'Connect with professionals' },
    { value: 'skill_building', label: 'Skill Building', icon: <BookOpen className="w-4 h-4" />, description: 'Learn new skills or improve existing ones' },
    { value: 'daily_goal', label: 'Daily Goal', icon: <Star className="w-4 h-4" />, description: 'Set daily targets (e.g., apply to 5 jobs)' },
    { value: 'custom', label: 'Custom', icon: <Clock className="w-4 h-4" />, description: 'Other job search related tasks' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  // Pre-defined task templates based on type
  const getTaskTemplate = (taskType: string) => {
    const templates = {
      job_application: {
        title: 'Apply for [Position] at [Company]',
        description: 'Research company, customize resume and cover letter, submit application',
        estimated_duration: 60
      },
      interview_prep: {
        title: 'Prepare for [Company] interview',
        description: 'Research company, practice common questions, prepare questions to ask',
        estimated_duration: 120
      },
      networking: {
        title: 'Connect with professionals in [Industry]',
        description: 'Reach out on LinkedIn, attend networking events, follow up on connections',
        estimated_duration: 45
      },
      skill_building: {
        title: 'Learn [Skill/Technology]',
        description: 'Complete online course, practice exercises, build project',
        estimated_duration: 180
      },
      daily_goal: {
        title: 'Apply to [X] jobs today',
        description: 'Find and apply to job openings that match my criteria',
        estimated_duration: 240,
        target_count: 5
      },
      custom: {
        title: '',
        description: '',
        estimated_duration: 30
      }
    };
    return templates[taskType as keyof typeof templates] || templates.custom;
  };

  const applyTemplate = () => {
    const template = getTaskTemplate(formData.task_type);
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      estimated_duration: template.estimated_duration,
      target_count: 'target_count' in template ? template.target_count : prev.target_count
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
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

          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {taskTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.task_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('task_type', type.value)}
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
              Task Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
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
              placeholder="Describe what needs to be done..."
              rows={3}
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
              />
            </div>
          </div>

          {/* Due Time and Duration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="due_time" className="block text-sm font-medium text-gray-700 mb-2">
                Due Time (Optional)
              </label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => handleInputChange('due_time', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes)
              </label>
              <Input
                id="estimated_duration"
                type="number"
                min="5"
                step="5"
                value={formData.estimated_duration || ''}
                onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || undefined)}
                placeholder="30"
              />
            </div>
          </div>

          {/* Target Count for Daily Goals */}
          {formData.task_type === 'daily_goal' && (
            <div>
              <label htmlFor="target_count" className="block text-sm font-medium text-gray-700 mb-2">
                Target Count *
              </label>
              <Input
                id="target_count"
                type="number"
                min="1"
                value={formData.target_count || ''}
                onChange={(e) => handleInputChange('target_count', parseInt(e.target.value) || undefined)}
                placeholder="e.g., 5 for 'Apply to 5 jobs'"
                required={formData.task_type === 'daily_goal'}
              />
              <p className="text-sm text-gray-600 mt-1">
                How many times should this task be completed? (e.g., apply to 5 jobs, send 3 emails)
              </p>
            </div>
          )}

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
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 
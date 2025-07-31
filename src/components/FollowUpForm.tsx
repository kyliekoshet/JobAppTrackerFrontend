import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { FollowUp, FollowUpCreate, FollowUpUpdate, FOLLOW_UP_TYPES, FOLLOW_UP_STATUSES } from '../types/jobApplication';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface FollowUpFormProps {
  applicationId: number;
  followUp?: FollowUp;
  onSuccess: (followUp: FollowUp) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const FollowUpForm: React.FC<FollowUpFormProps> = ({
  applicationId,
  followUp,
  onSuccess,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<FollowUpCreate>({
    follow_up_type: followUp?.follow_up_type || 'Follow-up',
    title: followUp?.title || '',
    description: followUp?.description || '',
    date: followUp?.date ? new Date(followUp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: followUp?.status || 'Pending',
    outcome: followUp?.outcome || '',
    notes: followUp?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Add time to the date
      const dateWithTime = new Date(formData.date + 'T12:00:00').toISOString();
      
      const followUpData = {
        ...formData,
        date: dateWithTime
      };

      // Import the API function dynamically to avoid circular dependencies
      const { followUpsApi } = await import('../services/api');
      
      let result: FollowUp;
      if (isEditing && followUp?.id) {
        result = await followUpsApi.update(followUp.id, followUpData as FollowUpUpdate);
      } else {
        result = await followUpsApi.create(applicationId, followUpData);
      }

      onSuccess(result);
    } catch (err) {
      console.error('Failed to save follow-up:', err);
      setError('Failed to save follow-up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FollowUpCreate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Rescheduled':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Follow-up' : 'Add Follow-up'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Follow-up Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Select
              value={formData.follow_up_type}
              onValueChange={(value: string) => handleInputChange('follow_up_type', value)}
            >
              {FOLLOW_UP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <Select
                value={formData.status}
                onValueChange={(value: string) => handleInputChange('status', value)}
              >
                {FOLLOW_UP_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon(formData.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Phone interview with hiring manager"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of the follow-up..."
            rows={3}
          />
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Outcome
          </label>
          <Input
            type="text"
            value={formData.outcome}
            onChange={(e) => handleInputChange('outcome', e.target.value)}
            placeholder="e.g., Scheduled next round, Rejected, No response"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes or observations..."
            rows={4}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Follow-up' : 'Add Follow-up')}
          </Button>
        </div>
      </form>
    </div>
  );
}; 
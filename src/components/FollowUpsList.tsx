import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { FollowUp } from '../types/jobApplication';
import { followUpsApi } from '../services/api';
import { FollowUpForm } from './FollowUpForm';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface FollowUpsListProps {
  applicationId: number;
  onFollowUpChange?: () => void;
}

export const FollowUpsList: React.FC<FollowUpsListProps> = ({
  applicationId,
  onFollowUpChange
}) => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [expandedFollowUp, setExpandedFollowUp] = useState<number | null>(null);

  const loadFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await followUpsApi.getByApplication(applicationId);
      setFollowUps(data);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      setError('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  const loadFollowUpsCallback = useCallback(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  useEffect(() => {
    loadFollowUpsCallback();
  }, [loadFollowUpsCallback]);

  const handleAddFollowUp = () => {
    setEditingFollowUp(null);
    setShowForm(true);
  };

  const handleEditFollowUp = (followUp: FollowUp) => {
    setEditingFollowUp(followUp);
    setShowForm(true);
  };

  const handleDeleteFollowUp = async (followUpId: number) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) {
      return;
    }

    try {
      await followUpsApi.delete(followUpId);
      await loadFollowUps();
      onFollowUpChange?.();
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
      setError('Failed to delete follow-up');
    }
  };

  const handleFollowUpSuccess = async (followUp: FollowUp) => {
    setShowForm(false);
    setEditingFollowUp(null);
    await loadFollowUps();
    onFollowUpChange?.();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingFollowUp(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpanded = (followUpId: number) => {
    setExpandedFollowUp(expandedFollowUp === followUpId ? null : followUpId);
  };

  if (showForm) {
    return (
      <FollowUpForm
        applicationId={applicationId}
        followUp={editingFollowUp || undefined}
        onSuccess={handleFollowUpSuccess}
        onCancel={handleCancelForm}
        isEditing={!!editingFollowUp}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Follow-ups</h3>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
            {followUps.length}
          </span>
        </div>
        <Button onClick={handleAddFollowUp} size="sm" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Follow-up
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <Button 
            onClick={loadFollowUps} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Follow-ups List */}
      {!loading && followUps.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No follow-ups yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Track your interview rounds, phone calls, and other interactions
          </p>
          <Button onClick={handleAddFollowUp} variant="outline">
            Add Your First Follow-up
          </Button>
        </div>
      )}

      {!loading && followUps.length > 0 && (
        <div className="space-y-3">
          {followUps.map((followUp) => (
            <div
              key={followUp.id}
              className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Follow-up Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {followUp.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(followUp.status)}`}>
                        {followUp.status}
                      </span>
                      {getStatusIcon(followUp.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(followUp.date)}
                      </div>
                      <span className="text-gray-400">•</span>
                      <span>{followUp.follow_up_type}</span>
                    </div>

                    {followUp.outcome && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Outcome:</strong> {followUp.outcome}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(followUp.id!)}
                    >
                      {expandedFollowUp === followUp.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditFollowUp(followUp)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFollowUp(followUp.id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedFollowUp === followUp.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {followUp.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {followUp.description}
                        </p>
                      </div>
                    )}
                    
                    {followUp.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {followUp.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 
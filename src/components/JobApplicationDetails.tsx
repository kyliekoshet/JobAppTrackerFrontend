import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { JobApplication, JobApplicationWithFollowUps } from '../types/jobApplication';
import { jobApplicationWithFollowUpsApi } from '../services/api';
import { FollowUpsList } from './FollowUpsList';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Building, 
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Users
} from 'lucide-react';

interface JobApplicationDetailsProps {
  application: JobApplication;
  onBack: () => void;
  onEdit?: (application: JobApplication) => void;
}

export const JobApplicationDetails: React.FC<JobApplicationDetailsProps> = ({
  application,
  onBack,
  onEdit
}) => {
  const [applicationWithFollowUps, setApplicationWithFollowUps] = useState<JobApplicationWithFollowUps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApplicationDetails = async () => {
    if (!application.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await jobApplicationWithFollowUpsApi.getById(application.id);
      setApplicationWithFollowUps(data);
    } catch (err) {
      console.error('Failed to load application details:', err);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicationDetails();
  }, [application.id]);

  const getStatusColor = (status: string) => {
    const colors = {
      'Applied': 'bg-blue-100 text-blue-800',
      'Interviewing': 'bg-yellow-100 text-yellow-800',
      'Offer': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Withdrawn': 'bg-gray-100 text-gray-800',
      'Pending': 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Offer':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Rejected':
      case 'Withdrawn':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Interviewing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadApplicationDetails} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const app = applicationWithFollowUps || application;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
        </div>
        {onEdit && (
          <Button onClick={() => onEdit(app)} variant="outline">
            Edit Application
          </Button>
        )}
      </div>

      {/* Application Information */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {app.job_title}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <Building className="w-4 h-4" />
                <span className="font-medium">{app.company}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.application_status)}`}>
                {app.application_status}
              </span>
              {getStatusIcon(app.application_status)}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {app.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{app.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Applied: {formatDate(app.date_applied)}</span>
              </div>

              {app.date_job_posted && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Posted: {formatDate(app.date_job_posted)}</span>
                </div>
              )}

              {app.salary && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{app.salary}</span>
                </div>
              )}

                          {app.interview_stage && app.interview_stage !== 'None' && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Stage: {app.interview_stage}</span>
              </div>
            )}

            {/* Referral Information */}
            {app.referred_by && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Referral Information</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span><strong>Referred by:</strong> {app.referred_by}</span>
                  </div>
                  {app.referral_relationship && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span><strong>Relationship:</strong> {app.referral_relationship}</span>
                    </div>
                  )}
                  {app.referral_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span><strong>Referral date:</strong> {formatDate(app.referral_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {app.job_url && (
            <div>
              <Button
                variant="outline"
                onClick={() => window.open(app.job_url, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Job Posting
              </Button>
            </div>
          )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {app.job_description && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Job Description</h3>
                <div className="bg-gray-50 p-4 rounded-md max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {app.job_description}
                  </p>
                </div>
              </div>
            )}

            {app.referral_notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Referral Notes</h3>
                <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {app.referral_notes}
                  </p>
                </div>
              </div>
            )}

            {app.notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {app.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-ups Section */}
      {app.id && (
        <FollowUpsList
          applicationId={app.id}
          onFollowUpChange={loadApplicationDetails}
        />
      )}
    </div>
  );
}; 
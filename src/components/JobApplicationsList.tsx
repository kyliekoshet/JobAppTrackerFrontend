import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { jobApplicationsApi } from '../services/api';
import { JobApplication, APPLICATION_STATUSES } from '../types/jobApplication';
import { Loader2, Search, Edit, Trash2, ExternalLink, Calendar, MapPin, DollarSign } from 'lucide-react';

interface JobApplicationsListProps {
  onEdit?: (application: JobApplication) => void;
  onRefresh?: () => void;
}

export const JobApplicationsList: React.FC<JobApplicationsListProps> = ({
  onEdit,
  onRefresh
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    company: '',
    search: '',
  });
  const [sortBy, setSortBy] = useState('date_applied');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await jobApplicationsApi.getAll({
        page: currentPage,
        size: 10,
        status: filters.status || undefined,
        company: filters.company || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      
      setApplications(response.applications);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Failed to load job applications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortBy, sortOrder]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await jobApplicationsApi.delete(id);
      loadApplications();
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete application:', err);
      setError('Failed to delete application');
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && applications.length === 0) {
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
        <Button onClick={loadApplications} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <div>
            <Select
              value={filters.status}
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <option value="">All Statuses</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              placeholder="Filter by company..."
              value={filters.company}
              onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value: string) => setSortBy(value)}
            >
              <option value="date_applied">Date Applied</option>
              <option value="company">Company</option>
              <option value="job_title">Job Title</option>
              <option value="application_status">Status</option>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <p className="text-gray-500 text-lg">No job applications found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or add a new application</p>
          </div>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.job_title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.application_status)}`}>
                      {application.application_status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 font-medium mb-2">
                    {application.company}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {application.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {application.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Applied: {formatDate(application.date_applied)}
                    </div>
                    {application.salary && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {application.salary}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {application.job_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(application.job_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(application)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => application.id && handleDelete(application.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {application.job_description && (
                <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-200">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Job Description:</p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4 max-h-24 overflow-hidden">
                    {application.job_description}
                  </div>
                  {application.job_description.length > 200 && (
                    <button 
                      className="text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
                      onClick={() => {
                        // TODO: Add expand/collapse functionality
                        alert(application.job_description);
                      }}
                    >
                      Read more...
                    </button>
                  )}
                </div>
              )}
              
              {application.notes && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {application.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}; 
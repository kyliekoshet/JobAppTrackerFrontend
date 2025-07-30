import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { SyncStatus } from './SyncStatus';
import { SummaryStats } from '../types/jobApplication';
import { Plus, Briefcase, TrendingUp, Calendar, Target, Loader2 } from 'lucide-react';

interface DashboardProps {
  onAddNew: () => void;
  onViewAll: () => void;
  stats?: SummaryStats | null;
  isLoading?: boolean;
  syncStatus?: {
    isOnline: boolean;
    lastSync: Date | null;
    pendingChanges: number;
    isSyncing: boolean;
    error: string | null;
  };
  onForceSync?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onAddNew,
  onViewAll,
  stats: propStats,
  isLoading: propIsLoading = false,
  syncStatus,
  onForceSync
}) => {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use prop stats if provided, otherwise use local state
  const displayStats = propStats || stats;
  const displayLoading = propIsLoading || loading;

  useEffect(() => {
    if (!propStats) {
      // Only load stats if not provided via props
      loadStats();
    }
  }, [propStats]);

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

  if (loading) {
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_applications}</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (30 days)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent_applications}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.success_rate > 0 ? `${(stats.success_rate * 100).toFixed(1)}%` : '0%'}
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
                  {(stats.status_breakdown['Applied'] || 0) + (stats.status_breakdown['Interviewing'] || 0)}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && Object.keys(stats.status_breakdown).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.status_breakdown).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${getStatusColor(status)}`}></div>
                <p className="text-sm font-medium text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Status and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Status */}
        {syncStatus && onForceSync && (
          <div className="lg:col-span-1">
            <SyncStatus
              isOnline={syncStatus.isOnline}
              lastSync={syncStatus.lastSync}
              pendingChanges={syncStatus.pendingChanges}
              isSyncing={syncStatus.isSyncing}
              error={syncStatus.error}
              onForceSync={onForceSync}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button onClick={onAddNew} variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Application
            </Button>
            <Button onClick={onViewAll} variant="outline" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              View All Applications
            </Button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Use the "Scrape Job" feature to automatically fill job details from URLs</li>
          <li>• Keep your application status updated to track your progress</li>
          <li>• Add notes to remember important details about each application</li>
          <li>• Use filters to quickly find specific applications</li>
        </ul>
      </div>
    </div>
  );
}; 
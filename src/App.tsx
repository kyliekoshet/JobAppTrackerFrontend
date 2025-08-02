import React, { useState } from 'react';
import './index.css';
import { Dashboard } from './components/Dashboard';
import { JobApplicationForm } from './components/JobApplicationForm';
import { JobApplicationsList } from './components/JobApplicationsList';
import { JobApplicationDetails } from './components/JobApplicationDetails';
import { Calendar } from './components/Calendar';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { JobApplication } from './types/jobApplication';
import { Button } from './components/ui/button';
import { ArrowLeft, Home, Plus, List, Menu, LogOut, User, Calendar as CalendarIcon } from 'lucide-react';
import { useSyncManager } from './hooks/useSyncManager';

type View = 'dashboard' | 'add' | 'list' | 'edit' | 'details' | 'calendar';

// Authenticated App Component
const AuthenticatedApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Use cloud-only sync manager
  const {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication
  } = useSyncManager();

  const handleAddApplication = async (applicationData: any) => {
    try {
      const newApplication = await addApplication({
        ...applicationData,
        user_id: user?.id // Add user ID to the application
      });
      setCurrentView('dashboard');
      return newApplication;
    } catch (error) {
      console.error('Failed to add application:', error);
      throw error;
    }
  };

  const handleUpdateApplication = async (id: number, applicationData: any) => {
    try {
      await updateApplication(id, applicationData);
      setEditingApplication(null);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to update application:', error);
      throw error;
    }
  };

  const handleDeleteApplication = async (id: number): Promise<boolean> => {
    try {
      await deleteApplication(id);
      setCurrentView('dashboard');
      return true;
    } catch (error) {
      console.error('Failed to delete application:', error);
      throw error;
    }
  };

  const handleEditApplication = (application: JobApplication) => {
    setEditingApplication(application);
    setCurrentView('edit');
  };

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setCurrentView('details');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setEditingApplication(null);
    setSelectedApplication(null);
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'add': return 'Add New Application';
      case 'edit': return 'Edit Application';
      case 'list': return 'All Applications';
      case 'details': return 'Application Details';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {currentView !== 'dashboard' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`bg-white border-b ${mobileNavOpen ? 'block' : 'hidden'} md:block`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === 'add' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('add')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </Button>
            <Button
              variant={currentView === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('list')}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              All Applications
            </Button>
            <Button
              variant={currentView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('calendar')}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard
            onAddNew={() => setCurrentView('add')}
            onViewAll={() => setCurrentView('list')}
            isLoading={isLoading}
          />
        )}
        {currentView === 'add' && (
          <JobApplicationForm
            onSuccess={handleBackToDashboard}
            onCancel={handleBackToDashboard}
            onAddApplication={handleAddApplication}
          />
        )}
        {currentView === 'edit' && editingApplication && (
          <JobApplicationForm
            onSuccess={handleBackToDashboard}
            onCancel={handleBackToDashboard}
            onUpdateApplication={handleUpdateApplication}
            editingApplication={editingApplication}
          />
        )}
        {currentView === 'list' && (
          <JobApplicationsList
            applications={applications}
            onEdit={handleEditApplication}
            onViewDetails={handleViewDetails}
            onDeleteApplication={handleDeleteApplication}
            isLoading={isLoading}
          />
        )}
        {currentView === 'details' && selectedApplication && (
          <JobApplicationDetails
            application={selectedApplication}
            onEdit={() => handleEditApplication(selectedApplication)}
            onBack={handleBackToDashboard}
          />
        )}
        {currentView === 'calendar' && (
          <Calendar />
        )}
      </main>
    </div>
  );
};

// Main App Component with Authentication
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App Content Component that handles auth state
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
};

export default App; 
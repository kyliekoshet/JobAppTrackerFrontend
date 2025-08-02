import React, { useState, useEffect } from 'react';
import './index.css';
import { Dashboard } from './components/Dashboard';
import { JobApplicationForm } from './components/JobApplicationForm';
import { JobApplicationsList } from './components/JobApplicationsList';
import { JobApplicationDetails } from './components/JobApplicationDetails';
import { SyncStatus } from './components/SyncStatus';
import { JobApplication } from './types/jobApplication';
import { Button } from './components/ui/button';
import { ArrowLeft, Home, Plus, List, Menu } from 'lucide-react';
import { useSyncManager } from './hooks/useSyncManager';
import { useLocalStorage } from './hooks/useLocalStorage';

type View = 'dashboard' | 'add' | 'list' | 'edit' | 'details';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Get applications from local storage
  const { applications, isLoading } = useLocalStorage();

  // Initialize sync manager
  const {
    syncStatus,
    syncWithBackend,
    addApplicationWithSync,
    updateApplicationWithSync,
    deleteApplicationWithSync,
    forceSync
  } = useSyncManager();

  // Auto-sync on mount only
  useEffect(() => {
    // Initial sync to load data from backend
    const initialSync = async () => {
      try {
        await syncWithBackend();
      } catch (error) {
        console.error('Initial sync failed:', error);
      }
    };
    
    initialSync();
  }, []); // Remove syncWithBackend from dependencies

  const handleAddNew = () => {
    setCurrentView('add');
  };

  const handleViewAll = () => {
    setCurrentView('list');
  };

  const handleEdit = (application: JobApplication) => {
    setEditingApplication(application);
    setCurrentView('edit');
  };

  const handleViewDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setCurrentView('details');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setEditingApplication(null);
    setSelectedApplication(null);
  };

  const handleSuccess = () => {
    setCurrentView('dashboard');
    setEditingApplication(null);
    setSelectedApplication(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onAddNew={handleAddNew}
            onViewAll={handleViewAll}
            syncStatus={syncStatus}
            onForceSync={forceSync}
          />
        );
      case 'add':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={handleBack} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <JobApplicationForm
              onSuccess={handleSuccess}
              onCancel={handleBack}
              onAddApplication={addApplicationWithSync}
            />
          </div>
        );
      case 'list':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button onClick={handleBack} variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
              </div>
              <Button onClick={handleAddNew} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New
              </Button>
            </div>
            <JobApplicationsList
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onRefresh={() => setCurrentView('dashboard')}
              applications={applications}
              onDeleteApplication={deleteApplicationWithSync}
              isLoading={isLoading}
            />
          </div>
        );
      case 'edit':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button onClick={handleBack} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
            <JobApplicationForm
              onSuccess={handleSuccess}
              onCancel={handleBack}
              onAddApplication={addApplicationWithSync}
              onUpdateApplication={updateApplicationWithSync}
              editingApplication={editingApplication}
            />
          </div>
        );
      case 'details':
        return selectedApplication ? (
          <JobApplicationDetails
            application={selectedApplication}
            onBack={handleBack}
            onEdit={handleEdit}
          />
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-500">No application selected</p>
            <Button onClick={handleBack} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        );
      default:
        return <Dashboard onAddNew={handleAddNew} onViewAll={handleViewAll} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Button
                onClick={() => setCurrentView('dashboard')}
                variant="ghost"
                className="flex items-center gap-2 text-lg font-semibold text-gray-900"
              >
                <Home className="w-5 h-5" />
                Job Tracker
              </Button>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                onClick={() => setCurrentView('dashboard')}
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => setCurrentView('list')}
                variant={currentView === 'list' ? 'default' : 'ghost'}
                size="sm"
              >
                <List className="w-4 h-4 mr-2" />
                Applications
              </Button>
              <Button
                onClick={() => setCurrentView('add')}
                variant={currentView === 'add' ? 'default' : 'ghost'}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Nav Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white border-t shadow-lg absolute w-full left-0 top-16 z-40 animate-fade-in">
            <div className="flex flex-col gap-2 p-4">
              <Button
                onClick={() => { setCurrentView('dashboard'); setMobileNavOpen(false); }}
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="lg"
                className="justify-start"
              >
                <Home className="w-5 h-5 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => { setCurrentView('list'); setMobileNavOpen(false); }}
                variant={currentView === 'list' ? 'default' : 'ghost'}
                size="lg"
                className="justify-start"
              >
                <List className="w-5 h-5 mr-2" />
                Applications
              </Button>
              <Button
                onClick={() => { setCurrentView('add'); setMobileNavOpen(false); }}
                variant={currentView === 'add' ? 'default' : 'ghost'}
                size="lg"
                className="justify-start"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New
              </Button>
            </div>
          </div>
        )}
      </nav>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App; 
import React, { useState } from 'react';
import './index.css';
import { Dashboard } from './components/Dashboard';
import { JobApplicationForm } from './components/JobApplicationForm';
import { JobApplicationsList } from './components/JobApplicationsList';
import { JobApplication } from './types/jobApplication';
import { Button } from './components/ui/button';
import { ArrowLeft, Home, Plus, List } from 'lucide-react';

type View = 'dashboard' | 'add' | 'list' | 'edit';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

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

  const handleBack = () => {
    setCurrentView('dashboard');
    setEditingApplication(null);
  };

  const handleSuccess = () => {
    setCurrentView('dashboard');
    setEditingApplication(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onAddNew={handleAddNew}
            onViewAll={handleViewAll}
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
              onRefresh={() => setCurrentView('dashboard')}
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
            />
          </div>
        );
      default:
        return <Dashboard onAddNew={handleAddNew} onViewAll={handleViewAll} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
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
            
            <div className="flex items-center gap-2">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App; 
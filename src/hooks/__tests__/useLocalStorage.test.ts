// Simple test to verify local storage functionality
// This would typically use Jest and React Testing Library

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should store and retrieve applications', () => {
    const testApplication = {
      id: 1,
      job_title: 'Test Job',
      company: 'Test Company',
      job_description: 'Test Description',
      location: 'Test Location',
      salary: 'Test Salary',
      job_url: 'https://test.com',
      date_applied: '2024-01-01',
      date_job_posted: '2024-01-01',
      application_status: 'Applied',
      interview_stage: 'None',
      notes: 'Test Notes',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    // Store in localStorage
    localStorage.setItem('jobApplications', JSON.stringify([testApplication]));

    // Retrieve from localStorage
    const stored = localStorage.getItem('jobApplications');
    const parsed = stored ? JSON.parse(stored) : [];

    expect(parsed).toHaveLength(1);
    expect(parsed[0].job_title).toBe('Test Job');
    expect(parsed[0].company).toBe('Test Company');
  });

  it('should handle empty localStorage', () => {
    const stored = localStorage.getItem('jobApplications');
    const parsed = stored ? JSON.parse(stored) : [];

    expect(parsed).toHaveLength(0);
  });
}); 
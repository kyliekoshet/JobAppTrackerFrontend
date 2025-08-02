import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { jobScrapingApi } from '../services/api';
import { ScrapedJobData, APPLICATION_STATUSES, INTERVIEW_STAGES, REFERRAL_RELATIONSHIPS, JobApplicationCreate, JobApplication, JobApplicationUpdate, JobDescriptionEnhanceResponse } from '../types/jobApplication';
import { Loader2, ExternalLink, CheckCircle, XCircle, Sparkles } from 'lucide-react';

// Form validation schema
const jobApplicationSchema = z.object({
  job_title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  job_description: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  job_url: z.string().optional(),
  date_applied: z.string().min(1, 'Date applied is required'),
  date_job_posted: z.string().optional(),
  application_status: z.string().min(1, 'Application status is required'),
  interview_stage: z.string().min(1, 'Interview stage is required'),
  notes: z.string().optional(),
  // Referral information
  referred_by: z.string().optional(),
  referral_relationship: z.string().optional(),
  referral_date: z.string().optional(),
  referral_notes: z.string().optional(),
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onAddApplication?: (application: JobApplicationCreate) => Promise<any>;
  onUpdateApplication?: (id: number, application: JobApplicationUpdate) => Promise<any>;
  editingApplication?: JobApplication | null;
}

export const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  onSuccess,
  onCancel,
  onAddApplication,
  onUpdateApplication,
  editingApplication
}) => {
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<{
    success: boolean;
    message: string;
    data?: ScrapedJobData;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<{
    success: boolean;
    message: string;
    data?: JobDescriptionEnhanceResponse;
  } | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      job_title: editingApplication?.job_title || '',
      company: editingApplication?.company || '',
      job_description: editingApplication?.job_description || '',
      location: editingApplication?.location || '',
      salary: editingApplication?.salary || '',
      job_url: editingApplication?.job_url || '',
      date_applied: editingApplication?.date_applied ? new Date(editingApplication.date_applied).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      date_job_posted: editingApplication?.date_job_posted ? new Date(editingApplication.date_job_posted).toISOString().split('T')[0] : '',
      application_status: editingApplication?.application_status || 'Applied',
      interview_stage: editingApplication?.interview_stage || 'None',
      notes: editingApplication?.notes || '',
      referred_by: editingApplication?.referred_by || '',
      referral_relationship: editingApplication?.referral_relationship || '',
      referral_date: editingApplication?.referral_date ? new Date(editingApplication.referral_date).toISOString().split('T')[0] : '',
      referral_notes: editingApplication?.referral_notes || '',
    },
  });

  const watchedUrl = watch('job_url');

  // Handle job URL scraping
  const handleScrapeJob = async (url: string) => {
    if (!url) {
      setScrapingResult({
        success: false,
        message: 'Please enter a job URL first',
      });
      return;
    }

    setIsScraping(true);
    setScrapingResult(null);

    try {
      const response = await jobScrapingApi.scrapeJob(url);
      
      if (response.success && response.data && response.data.success) {
        const scrapedData = response.data;
        
        // Populate form with scraped data
        if (scrapedData.job_title) setValue('job_title', scrapedData.job_title);
        if (scrapedData.company) setValue('company', scrapedData.company);
        if (scrapedData.location) setValue('location', scrapedData.location);
        if (scrapedData.job_description) setValue('job_description', scrapedData.job_description);
        if (scrapedData.salary) setValue('salary', scrapedData.salary);

        setScrapingResult({
          success: true,
          message: 'Job details scraped successfully!',
          data: scrapedData,
        });
      } else {
        // Better error handling
        const errorMessage = response.data?.error || response.error || 'Failed to scrape job details. Please fill in manually.';
        setScrapingResult({
          success: false,
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      setScrapingResult({
        success: false,
        message: 'Failed to scrape job details. Please fill in manually.',
      });
    } finally {
      setIsScraping(false);
    }
  };

  // Handle job description enhancement
  const handleEnhanceJobDescription = async () => {
    const currentDescription = watch('job_description');
    const currentTitle = watch('job_title');
    const currentCompany = watch('company');

    if (!currentDescription || currentDescription.trim().length < 50) {
      setEnhancementResult({
        success: false,
        message: 'Please enter a job description (at least 50 characters) before enhancing.',
      });
      return;
    }

    setIsEnhancing(true);
    setEnhancementResult(null);

    try {
      const response = await jobScrapingApi.enhanceJobDescription({
        job_description: currentDescription,
        job_title: currentTitle || undefined,
        company: currentCompany || undefined,
      });

      if (response.success) {
        // Update form fields with enhanced data
        if (response.enhanced_description) {
          setValue('job_description', response.enhanced_description);
        }

        setEnhancementResult({
          success: true,
          message: 'Job description enhanced successfully!',
          data: response,
        });
      } else {
        setEnhancementResult({
          success: false,
          message: response.error || 'Failed to enhance job description. Please try again.',
        });
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      setEnhancementResult({
        success: false,
        message: 'Failed to enhance job description. Please try again.',
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: JobApplicationFormData) => {
    setIsSubmitting(true);
    
    try {
      if (editingApplication && onUpdateApplication) {
        // Update existing application - convert dates for update
        const updateData: JobApplicationUpdate = {
          job_title: data.job_title,
          company: data.company,
          job_description: data.job_description,
          location: data.location,
          salary: data.salary,
          job_url: data.job_url,
          date_applied: data.date_applied ? new Date(data.date_applied).toISOString() : undefined,
          date_job_posted: data.date_job_posted ? new Date(data.date_job_posted).toISOString() : undefined,
          application_status: data.application_status,
          interview_stage: data.interview_stage,
          notes: data.notes,
          referred_by: data.referred_by,
          referral_relationship: data.referral_relationship,
          referral_date: data.referral_date ? new Date(data.referral_date).toISOString() : undefined,
          referral_notes: data.referral_notes,
        };
        
        console.log('Sending update data:', updateData);
        await onUpdateApplication(editingApplication.id!, updateData);
      } else if (onAddApplication) {
        // Create new application - ensure required fields are present
        const createData: JobApplicationCreate = {
          job_title: data.job_title,
          company: data.company,
          job_description: data.job_description,
          location: data.location,
          salary: data.salary,
          job_url: data.job_url,
          date_applied: new Date(data.date_applied).toISOString(),
          date_job_posted: data.date_job_posted ? new Date(data.date_job_posted).toISOString() : undefined,
          application_status: data.application_status,
          interview_stage: data.interview_stage,
          notes: data.notes,
          referred_by: data.referred_by,
          referral_relationship: data.referral_relationship,
          referral_date: data.referral_date ? new Date(data.referral_date).toISOString() : undefined,
          referral_notes: data.referral_notes,
        };
        await onAddApplication(createData);
      }
      reset();
      setScrapingResult(null);
      onSuccess?.();
    } catch (error) {
      console.error('Submission error:', error);
      setScrapingResult({
        success: false,
        message: 'Failed to save job application. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {editingApplication ? 'Edit Job Application' : 'Add New Job Application'}
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Job URL and Scraping Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Posting URL (Optional)
            </label>
            <div className="flex gap-2">
              <Controller
                name="job_url"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="https://example.com/job-posting"
                    className="flex-1"
                  />
                )}
              />
              <Button
                type="button"
                onClick={() => handleScrapeJob(watchedUrl || '')}
                disabled={isScraping || !watchedUrl}
                variant="outline"
                className="whitespace-nowrap"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Scrape Job
                  </>
                )}
              </Button>
            </div>
            {errors.job_url && (
              <p className="text-sm text-red-600 mt-1">{errors.job_url.message?.toString()}</p>
            )}
          </div>

          {/* Scraping Result Feedback */}
          {scrapingResult && (
            <div className={`p-4 rounded-md border ${
              scrapingResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                {scrapingResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <p className={`text-sm ${
                  scrapingResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scrapingResult.message}
                </p>
              </div>
              {scrapingResult.success && scrapingResult.data && (
                <div className="mt-3 p-3 bg-green-100 rounded">
                  <p className="text-sm text-green-700">
                    <strong>Extracted:</strong> {scrapingResult.data.job_title} at {scrapingResult.data.company}
                    {scrapingResult.data.location && ` in ${scrapingResult.data.location}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Entry Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <Controller
              name="job_title"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Software Engineer" />
              )}
            />
            {errors.job_title && (
              <p className="text-sm text-red-600 mt-1">{errors.job_title.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Tech Corp" />
              )}
            />
            {errors.company && (
              <p className="text-sm text-red-600 mt-1">{errors.company.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="San Francisco, CA" />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary
            </label>
            <Controller
              name="salary"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="$80,000 - $120,000" />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Applied *
            </label>
            <Controller
              name="date_applied"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" />
              )}
            />
            {errors.date_applied && (
              <p className="text-sm text-red-600 mt-1">{errors.date_applied.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Job Posted
            </label>
            <Controller
              name="date_job_posted"
              control={control}
              render={({ field }) => (
                <Input {...field} type="date" />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Status *
            </label>
            <Controller
              name="application_status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                  <option value="">Select status</option>
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.application_status && (
              <p className="text-sm text-red-600 mt-1">{errors.application_status.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Stage *
            </label>
            <Controller
              name="interview_stage"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value: string) => field.onChange(value)} value={field.value}>
                  <option value="">Select stage</option>
                  {INTERVIEW_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.interview_stage && (
              <p className="text-sm text-red-600 mt-1">{errors.interview_stage.message?.toString()}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description
          </label>
          <Controller
            name="job_description"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Textarea
                  {...field}
                  placeholder="Enter job description or use AI scraping to auto-fill..."
                  rows={6}
                  className="min-h-[120px]"
                />
                {field.value && (
                  <div className="bg-gray-50 p-3 rounded-md border">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {field.value}
                    </div>
                  </div>
                )}
                
                {/* Enhance Job Description Button */}
                {field.value && field.value.trim().length >= 50 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEnhanceJobDescription}
                      disabled={isEnhancing}
                      className="flex items-center gap-2"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                    </Button>
                    <span className="text-xs text-gray-500">
                      Organize and extract key information
                    </span>
                  </div>
                )}

                {/* Enhancement Result */}
                {enhancementResult && (
                  <div className={`p-3 rounded-md border ${
                    enhancementResult.success 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {enhancementResult.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{enhancementResult.message}</span>
                    </div>
                    
                    {enhancementResult.success && enhancementResult.data && (
                      <div className="space-y-2 text-xs">
                        {enhancementResult.data.key_requirements && (
                          <div>
                            <span className="font-medium">Key Requirements:</span>
                            <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                              {enhancementResult.data.key_requirements}
                            </div>
                          </div>
                        )}
                        {enhancementResult.data.key_responsibilities && (
                          <div>
                            <span className="font-medium">Key Responsibilities:</span>
                            <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                              {enhancementResult.data.key_responsibilities}
                            </div>
                          </div>
                        )}
                        {enhancementResult.data.benefits && (
                          <div>
                            <span className="font-medium">Benefits:</span>
                            <div className="text-gray-600 mt-1 whitespace-pre-wrap">
                              {enhancementResult.data.benefits}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          />
        </div>

        {/* Referral Information Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Referral Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referred By
              </label>
              <Controller
                name="referred_by"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="John Doe" />
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <Controller
                name="referral_relationship"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(value: string) => field.onChange(value)} value={field.value || ''}>
                    <option value="">Select relationship</option>
                    {REFERRAL_RELATIONSHIPS.map((relationship) => (
                      <option key={relationship} value={relationship}>
                        {relationship}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Date
              </label>
              <Controller
                name="referral_date"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="date" />
                )}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Notes
            </label>
            <Controller
              name="referral_notes"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Additional notes about the referral..."
                  rows={3}
                />
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Add any additional notes..."
                rows={3}
              />
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              editingApplication ? 'Update Application' : 'Save Application'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}; 
// src/app/(roles)/jobSeeker/find-jobs/[id]/schema.ts
import { z } from 'zod';
import type { CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';

// Public details for a company profile - used by JobSeekerJobPreviewData
export interface PublicCompanyProfileData {
  companyName: string;
  companyLogoUrl: string | null;
  companyWebsite: string | null;
  aboutCompany: string | null;
  yearOfEstablishment: number | null;
  teamSize: number | null;
  linkedinUrl?: string | null;
  address?: string | null;
}

// This interface is for the data structure of a single job when viewed by a job seeker
export interface JobSeekerJobPreviewData extends PublicCompanyProfileData {
  id: number;
  jobTitle: string;
  industry: string | null;
  industryType: string | null;
  jobType: string | null;
  jobLocation: string | null;
  numberOfVacancies: number | null;
  qualification: string | null;
  minimumExperience: number | null;
  maximumExperience: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  skillsRequired: string[];
  additionalData: string | null;
  jobDescription: string;
  customQuestions?: CustomQuestion[];
  status: 'draft' | 'active' | 'closed';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  employer_user_id: number;
  isSaved?: boolean;
  isApplied?: boolean;
  jobSeekerProfileResumeUrl?: string | null; // Resume URL from the seeker's main profile
}

export interface JobDetailActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  jobData?: JobSeekerJobPreviewData | null;
}

// Schema for custom question answers submitted by the job seeker
export const customAnswerSchema = z.object({
  questionText: z.string(),
  answer: z.string().min(1, { message: "An answer is required for this question." }),
});
export type CustomAnswer = z.infer<typeof customAnswerSchema>;


// Schema for the application form data (collected in the 2nd step of ApplyFlowDialogs)
export const applyJobFormSchema = z.object({
  jobId: z.number(),
  jobSeekerUserId: z.number(),
  employerUserId: z.number(),
  currentWorkingLocation: z.string().min(1, "Current working location is required."),
  expectedSalary: z.string().min(1, "Expected salary is required."),
  noticePeriod: z.coerce.number().int().min(0, "Notice period is required (0 for immediate)."),
  customQuestionAnswers: z.array(customAnswerSchema).optional().nullable(),
  // resumeUrl is not directly submitted by this form; it's fetched server-side from the profile.
});

export type ApplyJobFormData = z.infer<typeof applyJobFormSchema>;

export interface ApplyActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  applicationId?: number;
  validationErrors?: z.ZodIssue[];
}

// Type for simplified job data for "Similar Jobs" and "Other Jobs by Company"
export interface SuggestedJobData {
  id: number;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string | null;
}

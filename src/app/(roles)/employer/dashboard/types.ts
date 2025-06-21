// src/app/(roles)/employer/dashboard/types.ts

export const VALID_JOB_STATUSES = ['draft', 'active', 'closed'] as const;
export type JobStatus = typeof VALID_JOB_STATUSES[number];

export const APPLICATION_STATUS_OPTIONS = ['submitted', 'viewed', 'shortlisted', 'interviewing', 'rejected', 'hired', 'declined'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUS_OPTIONS[number];


export interface JobListingTableData {
  id: number;
  jobTitle: string;
  jobLocation: string | null;
  status: JobStatus;
  createdAt: string; // Full ISO timestamp string
  companyName: string;
}

export interface JobWithApplicationCount {
  id: number;
  jobTitle: string;
  status: JobStatus;
  createdAt: string;
  totalApplications: number;
}

export interface ApplicantData {
  applicationId: number;
  jobSeekerUserId: number;
  jobSeekerName: string | null;
  jobSeekerEmail: string;
  applicationDate: string; // ISO string
  applicationStatus: ApplicationStatus;
  resumeUrl?: string | null; 
  jobTitleApplyingFor?: string; // Title of the job they applied for
  customQuestionAnswers?: Array<{ questionText: string; answer: string }>;
  employer_remarks?: string | null; 
  
  // General profile info (from job_seeker_profiles)
  profilePictureUrl?: string | null;
  phoneNumber?: string | null;
  location?: string | null; 
  // professionalSummary removed
  portfolioUrl?: string | null;
  // linkedinProfileUrl removed
  githubProfileUrl?: string | null;
  skills?: string[]; 
  gender?: string | null; // Added gender field to ApplicantData

  // Application-specific info (from job_applications table)
  currentWorkingLocation: string;
  expectedSalary: string;
  noticePeriod: number;
  jobId?: number; // Included for context on applicant page
}

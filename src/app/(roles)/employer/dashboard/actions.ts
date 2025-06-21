// src/app/(roles)/employer/dashboard/actions.ts
'use server';

import { z } from 'zod';
import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import type { JobPreviewData, CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';
import { type JobWithApplicationCount, type ApplicantData, type JobStatus, type ApplicationStatus, VALID_JOB_STATUSES } from './types';


// Type for the job listing in the table (summary view)
export interface JobListingTableData {
  id: number;
  jobTitle: string;
  jobLocation: string | null;
  status: JobStatus;
  createdAt: string; // Full ISO timestamp string
  companyName: string;
}

// Type for the detailed job view, aliasing JobPreviewData for clarity
export type FullJobDashboardData = JobPreviewData;


export interface ApplicationTrackingActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  jobsWithCounts?: JobWithApplicationCount[];
  applicants?: ApplicantData[];
  applicant?: ApplicantData; // Added for getApplicantDetailsById
}

export interface UpdateApplicationStatusResponse {
    success?: boolean;
    message?: string;
    error?: string;
}


export interface DashboardActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  data?: JobListingTableData[];
  jobData?: FullJobDashboardData;
  validationErrors?: z.ZodIssue[];
}


export async function getJobsByStatus(employerUserId: number, status: JobStatus | 'all' = 'all', searchTerm?: string): Promise<DashboardActionResponse> {
  console.log(`[getJobsByStatus] Fetching jobs for employerId: ${employerUserId}, status: ${status}, searchTerm: ${searchTerm}`);
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  try {
    let query = `SELECT id, jobTitle, companyName, jobLocation, status, createdAt FROM jobs WHERE employer_user_id = ?`;
    const params: (string | number)[] = [employerUserId];

    if (status !== 'all') {
      if (!VALID_JOB_STATUSES.includes(status)) {
        console.warn(`[getJobsByStatus] Invalid job status filter: ${status}`);
        return { success: false, error: `Invalid job status filter: ${status}` };
      }
      query += ` AND status = ?`;
      params.push(status);
    }

    // Search term is currently handled client-side for this action's use in job-management section
    // If backend search is needed here for other uses, it can be re-enabled.
    // if (searchTerm) {
    //   query += ` AND (jobTitle LIKE ? OR companyName LIKE ?)`;
    //   params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    // }

    query += ` ORDER BY updatedAt DESC`;
    console.log(`[getJobsByStatus] SQL: ${query}, Params: ${JSON.stringify(params)}`);

    const stmt = dbClient.prepare(query);
    const jobs = stmt.all(...params) as any[];
    console.log(`[getJobsByStatus] Found ${jobs.length} jobs.`);

    const formattedJobs: JobListingTableData[] = jobs.map(job => ({
      id: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      jobLocation: job.jobLocation,
      status: job.status as JobStatus,
      createdAt: job.createdAt,
    }));

    return { success: true, data: formattedJobs };
  } catch (e: any) {
    console.error('[getJobsByStatus] Error fetching jobs by status:', e);
    return { error: `Failed to fetch jobs. DB Error: ${e.message}` };
  }
}

export async function updateJobStatusAction(jobId: number, employerUserId: number, newStatus: JobStatus): Promise<DashboardActionResponse> {
  console.log(`[UpdateJobStatusAction] Attempt: JobID=${jobId}, EmployerID=${employerUserId}, NewStatus='${newStatus}'`);

  if (!employerUserId || typeof employerUserId !== 'number') {
    console.error('[UpdateJobStatusAction] Auth Error: User not authenticated or employerUserId invalid.');
    return { success: false, error: 'User not authenticated.' };
  }
  if (!jobId || typeof jobId !== 'number') {
    console.error('[UpdateJobStatusAction] Input Error: Job ID is required and must be a number.');
    return { success: false, error: 'Job ID is required.' };
  }

  if (!VALID_JOB_STATUSES.includes(newStatus)) {
    console.error(`[UpdateJobStatusAction] Input Error: Invalid job status '${newStatus}'. Valid: ${VALID_JOB_STATUSES.join(', ')}`);
    return { success: false, error: `Invalid job status: ${newStatus}. Must be one of ${VALID_JOB_STATUSES.join(', ')}.` };
  }

  const dbClient = db as Database;
  try {
    console.log(`[UpdateJobStatusAction] Verifying ownership for job ID: ${jobId}, employer ID: ${employerUserId}`);
    const jobCheckStmt = dbClient.prepare('SELECT employer_user_id, status FROM jobs WHERE id = ?');
    const jobCheckResult = jobCheckStmt.get(jobId) as { employer_user_id: number, status: JobStatus } | undefined;

    if (!jobCheckResult) {
      console.warn(`[UpdateJobStatusAction] Failed: Job ID ${jobId} not found.`);
      return { success: false, error: 'Job not found.' };
    }
    if (jobCheckResult.employer_user_id !== employerUserId) {
      console.warn(`[UpdateJobStatusAction] Auth Failed: Job ID ${jobId} does not belong to employer ID ${employerUserId}. (Owner: ${jobCheckResult.employer_user_id})`);
      return { success: false, error: 'You do not have permission to modify this job.' };
    }

    if (jobCheckResult.status === newStatus) {
      console.log(`[UpdateJobStatusAction] No change: Job ID ${jobId} is already in status '${newStatus}'.`);
      return { success: true, message: `Job is already ${newStatus}.` };
    }

    console.log(`[UpdateJobStatusAction] Updating job ID: ${jobId} to status: '${newStatus}' in DB.`);
    const stmt = dbClient.prepare(
      'UPDATE jobs SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND employer_user_id = ?'
    );
    const info = stmt.run(newStatus, jobId, employerUserId);

    if (info.changes > 0) {
      console.log(`[UpdateJobStatusAction] Success: Job ID ${jobId} updated to status: '${newStatus}'. Changes: ${info.changes}`);
      return { success: true, message: `Job status successfully updated to ${newStatus}.` };
    } else {
      // This case should be rare if the above checks pass, but it's a safeguard.
      console.warn(`[UpdateJobStatusAction] No DB changes made for job ID: ${jobId} (user ${employerUserId}) when updating to status: '${newStatus}'. This indicates an unexpected issue.`);
      return { success: false, error: 'No changes made to job status. Please try again or contact support if this persists.' };
    }
  } catch (e: any) {
    console.error(`[UpdateJobStatusAction] DB Error for job ID: ${jobId} (user ${employerUserId}) when updating to ${newStatus}:`, e);
     if (e.message && e.message.toLowerCase().includes('check constraint failed')) {
      console.error(`[UpdateJobStatusAction] CHECK constraint failed. Attempted status: '${newStatus}'. DB expected: ${VALID_JOB_STATUSES.join('/')}. DB error: ${e.message}`);
      return { success: false, error: `Database schema error: '${newStatus}' is not a valid status for the database. Please contact support.` };
    }
    return { success: false, error: `An unexpected database error occurred: ${(e as Error).message}` };
  }
}


export async function deleteJobAction(jobId: number, employerUserId: number): Promise<DashboardActionResponse> {
  console.log(`[DeleteJobAction] Attempt: JobID=${jobId}, EmployerID=${employerUserId}`);
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  try {
    const jobOwnerStmt = dbClient.prepare('SELECT employer_user_id FROM jobs WHERE id = ?');
    const job = jobOwnerStmt.get(jobId) as { employer_user_id: number } | undefined;

    if (!job) {
      return { success: false, error: 'Job not found.' };
    }
    if (job.employer_user_id !== employerUserId) {
      return { success: false, error: 'You do not have permission to delete this job.' };
    }

    dbClient.exec('BEGIN');
    console.log(`[DeleteJobAction] Transaction started for deleting job ID: ${jobId}`);

    const deleteApplicationsStmt = dbClient.prepare('DELETE FROM job_applications WHERE job_id = ?');
    const appDeleteInfo = deleteApplicationsStmt.run(jobId);
    console.log(`[DeleteJobAction] Deleted ${appDeleteInfo.changes} applications for job ID: ${jobId}`);

    const deleteSavedJobsStmt = dbClient.prepare('DELETE FROM saved_jobs WHERE job_id = ?');
    const savedJobsDeleteInfo = deleteSavedJobsStmt.run(jobId);
    console.log(`[DeleteJobAction] Deleted ${savedJobsDeleteInfo.changes} saved job entries for job ID: ${jobId}`);

    const stmt = dbClient.prepare('DELETE FROM jobs WHERE id = ? AND employer_user_id = ?');
    const info = stmt.run(jobId, employerUserId);

    if (info.changes > 0) {
      dbClient.exec('COMMIT');
      console.log(`[DeleteJobAction] Transaction committed. Job ID: ${jobId} and associated data deleted successfully.`);
      return { success: true, message: 'Job and associated data deleted successfully.' };
    } else {
      dbClient.exec('ROLLBACK');
      console.warn(`[DeleteJobAction] Transaction rolled back. Failed to delete job ID: ${jobId}. It might have been already deleted.`);
      return { success: false, error: 'Failed to delete job. It might have been already deleted or an issue occurred.' };
    }
  } catch (e: any) {
    if (dbClient.inTransaction) dbClient.exec('ROLLBACK');
    console.error(`[DeleteJobAction] Error deleting job ID ${jobId} for user ${employerUserId}:`, e);
    return { success: false, error: `An unexpected error occurred while deleting the job: ${(e as Error).message}` };
  }
}


export async function getJobForDashboardById(jobId: number, employerUserId: number): Promise<DashboardActionResponse> {
  console.log(`[getJobForDashboardById] Fetching job ID: ${jobId} for employer ID: ${employerUserId}`);
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  try {
    const stmt = dbClient.prepare('SELECT * FROM jobs WHERE id = ? AND employer_user_id = ?');
    const job = stmt.get(jobId, employerUserId) as any;

    if (job) {
      const jobData: FullJobDashboardData = {
        id: job.id,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        industry: job.industry,
        industryType: job.industryType,
        jobType: job.jobType,
        jobLocation: job.jobLocation,
        numberOfVacancies: job.numberOfVacancies,
        qualification: job.qualification,
        minimumExperience: job.minimumExperience,
        maximumExperience: job.maximumExperience,
        minimumSalary: job.minimumSalary,
        maximumSalary: job.maximumSalary,
        skillsRequired: job.skillsRequired ? JSON.parse(job.skillsRequired) : [],
        additionalData: job.additionalData || null,
        jobDescription: job.jobDescription,
        customQuestions: job.customQuestions ? JSON.parse(job.customQuestions) : [],
        status: job.status as JobStatus,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        employer_user_id: job.employer_user_id,
      };
      console.log(`[getJobForDashboardById] Successfully fetched job ID: ${jobId}`);
      return { success: true, jobData: jobData };
    } else {
      console.warn(`[getJobForDashboardById] Job not found or unauthorized for job ID: ${jobId}, employer ID: ${employerUserId}`);
      return { success: false, error: 'Job not found or unauthorized.' };
    }
  } catch (e: any) {
    console.error(`[getJobForDashboardById] Error fetching job ID ${jobId} for dashboard:`, e);
    return { success: false, error: `Failed to fetch job details. DB Error: ${e.message}` };
  }
}

export async function getJobsWithApplicationCountsAction(employerUserId: number): Promise<ApplicationTrackingActionResponse> {
  console.log(`[getJobsWithAppCounts] Fetching jobs with application counts for employer ID: ${employerUserId}`);
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  try {
    const stmt = dbClient.prepare(`
      SELECT
        j.id,
        j.jobTitle,
        j.status,
        j.createdAt,
        COUNT(ja.id) as totalApplications
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      WHERE j.employer_user_id = ?
      GROUP BY j.id, j.jobTitle, j.status, j.createdAt
      ORDER BY j.updatedAt DESC
    `);
    const jobs = stmt.all(employerUserId) as JobWithApplicationCount[];
    console.log(`[getJobsWithAppCounts] Found ${jobs.length} jobs for employer ID: ${employerUserId}`);
    return { success: true, jobsWithCounts: jobs };
  } catch (e: any) {
    console.error(`[getJobsWithAppCounts] Error fetching jobs with application counts for employer ID ${employerUserId}:`, e);
    return { success: false, error: `Failed to fetch job application counts: ${(e as Error).message}` };
  }
}

export async function getApplicationsForJobAction(jobId: number, employerUserId: number): Promise<ApplicationTrackingActionResponse> {
  console.log(`[getApplicationsForJobAction] Fetching applications for job ID: ${jobId}, employer ID: ${employerUserId}`);
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  try {
    const jobOwnerStmt = dbClient.prepare('SELECT j.jobTitle FROM jobs j WHERE j.id = ? AND j.employer_user_id = ?');
    const jobDetails = jobOwnerStmt.get(jobId, employerUserId) as { jobTitle: string } | undefined;

    if (!jobDetails) {
      console.warn(`[getApplicationsForJobAction] Job ID ${jobId} not found or does not belong to employer ID ${employerUserId}.`);
      return { success: false, error: 'Job not found or you do not have permission to view its applications.' };
    }

    const stmt = dbClient.prepare(`
      SELECT
        ja.id as applicationId,
        ja.job_seeker_user_id as jobSeekerUserId,
        COALESCE(jsp.fullName, u.email) as jobSeekerName,
        u.email as jobSeekerEmail,
        ja.applicationDate,
        ja.status as applicationStatus,
        ja.resumeUrl,
        ja.customQuestionAnswers,
        ja.employer_remarks,
        jsp.profilePictureUrl,
        jsp.phoneNumber,
        jsp.gender,
        jsp.currentCity as location,
        jsp.portfolioUrl,
        jsp.githubProfileUrl,
        jsp.skills,
        jsp.professionalSummary,
        jsp.currentDesignation,
        jsp.currentIndustry,
        jsp.currentIndustryType,
        jsp.totalExperience,
        jsp.presentSalary,
        ja.currentWorkingLocation,
        ja.expectedSalary,
        ja.noticePeriod
      FROM job_applications ja
      JOIN users u ON ja.job_seeker_user_id = u.id
      LEFT JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
      WHERE ja.job_id = ?
      ORDER BY ja.applicationDate DESC
    `);
    const applicationsRaw = stmt.all(jobId) as any[];
    console.log(`[getApplicationsForJobAction] Found ${applicationsRaw.length} applications for job ID: ${jobId}`);

    const applicants: ApplicantData[] = applicationsRaw.map(app => {
      let parsedAnswers: Array<{ questionText: string; answer: string }> = [];
      if (app.customQuestionAnswers) {
        try { parsedAnswers = JSON.parse(app.customQuestionAnswers); }
        catch (parseError) { console.error(`[getApplicationsForJobAction] Error parsing customQuestionAnswers for app ${app.applicationId}:`, parseError); }
      }
      let parsedSkills: string[] = [];
      if (app.skills) {
        try { parsedSkills = JSON.parse(app.skills); }
        catch (parseError) { console.error(`[getApplicationsForJobAction] Error parsing skills for user ${app.jobSeekerUserId}:`, parseError); }
      }
      return {
        applicationId: app.applicationId,
        jobSeekerUserId: app.jobSeekerUserId,
        jobSeekerName: app.jobSeekerName,
        jobSeekerEmail: app.jobSeekerEmail,
        applicationDate: app.applicationDate,
        applicationStatus: app.applicationStatus as ApplicationStatus,
        resumeUrl: app.resumeUrl,
        jobId: jobId,
        jobTitleApplyingFor: jobDetails.jobTitle,
        customQuestionAnswers: parsedAnswers,
        employer_remarks: app.employer_remarks,
        profilePictureUrl: app.profilePictureUrl,
        phoneNumber: app.phoneNumber,
        gender: app.gender,
        location: app.location,
        portfolioUrl: app.portfolioUrl,
        githubProfileUrl: app.githubProfileUrl,
        skills: parsedSkills,
        professionalSummary: app.professionalSummary,
        currentDesignation: app.currentDesignation,
        currentIndustry: app.currentIndustry,
        currentIndustryType: app.currentIndustryType,
        totalExperience: app.totalExperience !== null ? Number(app.totalExperience) : null,
        presentSalary: app.presentSalary,
        currentWorkingLocation: app.currentWorkingLocation,
        expectedSalary: app.expectedSalary,
        noticePeriod: app.noticePeriod,
      };
    });
    return { success: true, applicants };
  } catch (e: any) {
    console.error(`[getApplicationsForJobAction] Error fetching applications for job ID ${jobId}:`, e);
    return { success: false, error: `Failed to fetch applications for this job: ${(e as Error).message}` };
  }
}

export async function updateApplicationStatusAction(
  applicationId: number,
  newStatus: ApplicationStatus,
  employerUserId: number,
  remarks?: string | null
): Promise<UpdateApplicationStatusResponse> {
  console.log(`[UpdateAppStatusAction] Attempt: AppID=${applicationId}, Status=${newStatus}, EmployerID=${employerUserId}, Remarks=${remarks}`);

  if (!employerUserId || typeof employerUserId !== 'number') {
    console.error('[UpdateAppStatusAction] Error: User not authenticated or employer ID invalid.');
    return { success: false, error: 'User not authenticated or employer ID invalid.' };
  }
  if (!applicationId || typeof applicationId !== 'number') {
    console.error('[UpdateAppStatusAction] Error: Application ID is invalid.');
    return { success: false, error: 'Application ID is invalid.' };
  }

  const validApplicationStatuses = ['submitted', 'viewed', 'shortlisted', 'interviewing', 'rejected', 'hired', 'declined'];
  if (!newStatus || !validApplicationStatuses.includes(newStatus.toLowerCase() as ApplicationStatus)) {
    console.error(`[UpdateAppStatusAction] Error: Invalid application status provided: ${newStatus}`);
    return { success: false, error: 'Invalid application status provided.' };
  }
  
  if (!remarks || remarks.trim() === '') {
    console.error('[UpdateAppStatusAction] Error: Employer remarks are mandatory.');
    return { success: false, error: 'Employer remarks are mandatory when updating status.' };
  }


  const dbClient = db as Database;
  try {
    console.log(`[UpdateAppStatusAction] Verifying ownership for appID ${applicationId}, employerID ${employerUserId}`);
    const ownershipCheckStmt = dbClient.prepare(`
      SELECT j.id as jobId
      FROM job_applications ja
      INNER JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ? AND j.employer_user_id = ?
    `);
    const ownershipResult = ownershipCheckStmt.get(applicationId, employerUserId) as { jobId: number } | undefined;

    if (!ownershipResult) {
      console.warn(`[UpdateAppStatusAction] Ownership check FAILED for appID ${applicationId}, employerID ${employerUserId}.`);
      return { success: false, error: 'Application not found or you do not have permission to update it.' };
    }
    console.log(`[UpdateAppStatusAction] Ownership CONFIRMED for appID ${applicationId}. JobID: ${ownershipResult.jobId}`);

    console.log(`[UpdateAppStatusAction] Attempting to update status & remarks for appID ${applicationId} to ${newStatus}`);
    const updateStmt = dbClient.prepare(
      'UPDATE job_applications SET status = ?, employer_remarks = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    );
    const info = updateStmt.run(newStatus, remarks, applicationId);

    if (info.changes > 0) {
      console.log(`[UpdateAppStatusAction] Successfully updated appID ${applicationId} to ${newStatus}. Rows affected: ${info.changes}`);
      return { success: true, message: `Application status updated to ${newStatus}.` };
    } else {
      console.warn(`[UpdateAppStatusAction] No rows affected for appID ${applicationId}. Status might already be ${newStatus} or an issue occurred.`);
      const currentStatusStmt = dbClient.prepare('SELECT status, employer_remarks FROM job_applications WHERE id = ?');
      const currentStatusResult = currentStatusStmt.get(applicationId) as { status: ApplicationStatus, employer_remarks: string | null } | undefined;
      if (currentStatusResult && currentStatusResult.status === newStatus && (currentStatusResult.employer_remarks === (remarks || null) || (currentStatusResult.employer_remarks === null && (!remarks || remarks.trim() ===''))) ) {
        return { success: true, message: 'Application status and remarks are already set to these values.' };
      }
      return { success: false, error: 'Failed to update application status. The application might not have been found or no change was needed.' };
    }
  } catch (e: any) {
    console.error(`[UpdateAppStatusAction] DB error for appID ${applicationId}:`, e);
    if (e.message && e.message.toLowerCase().includes('check constraint failed')) {
      console.error(`[UpdateAppStatusAction] CHECK constraint failed for app status. Attempted status: '${newStatus}'. DB error: ${e.message}`);
      return { success: false, error: `Database schema error: '${newStatus}' is not a valid status for the application. Please contact support.` };
    }
    return { success: false, error: `An unexpected database error occurred: ${(e as Error).message}` };
  }
}

export async function getApplicantDetailsById(applicationId: number, employerUserId: number): Promise<ApplicationTrackingActionResponse> {
  console.log(`[getApplicantDetailsById] Fetching details for application ID: ${applicationId}, employer ID: ${employerUserId}`);
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!applicationId || isNaN(applicationId)) {
    return { success: false, error: 'Invalid application ID.' };
  }

  const dbClient = db as Database;
  try {
    const stmt = dbClient.prepare(`
      SELECT
        ja.id as applicationId,
        ja.job_seeker_user_id as jobSeekerUserId,
        COALESCE(jsp.fullName, u.email) as jobSeekerName,
        u.email as jobSeekerEmail,
        ja.applicationDate,
        ja.status as applicationStatus,
        ja.resumeUrl,
        ja.customQuestionAnswers,
        ja.employer_remarks,
        j.jobTitle as jobTitleApplyingFor,
        j.id as jobId,
        jsp.profilePictureUrl,
        jsp.phoneNumber,
        jsp.gender,
        jsp.currentCity as location,
        jsp.portfolioUrl,
        jsp.githubProfileUrl,
        jsp.skills,
        jsp.professionalSummary,
        jsp.currentDesignation,
        jsp.currentIndustry,
        jsp.currentIndustryType,
        jsp.totalExperience,
        jsp.presentSalary,
        ja.currentWorkingLocation,
        ja.expectedSalary,
        ja.noticePeriod
      FROM job_applications ja
      JOIN users u ON ja.job_seeker_user_id = u.id
      JOIN jobs j ON ja.job_id = j.id
      LEFT JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
      WHERE ja.id = ? AND j.employer_user_id = ?
    `);
    const appRaw = stmt.get(applicationId, employerUserId) as any;

    if (!appRaw) {
      console.warn(`[getApplicantDetailsById] Application ID ${applicationId} not found or does not belong to employer ID ${employerUserId}.`);
      return { success: false, error: 'Applicant not found or you do not have permission to view this application.' };
    }

    let parsedAnswers: Array<{ questionText: string; answer: string }> = [];
    if (appRaw.customQuestionAnswers) {
      try { parsedAnswers = JSON.parse(appRaw.customQuestionAnswers); }
      catch (parseError) { console.error(`[getApplicantDetailsById] Error parsing customQuestionAnswers for app ${appRaw.applicationId}:`, parseError); }
    }
    let parsedSkills: string[] = [];
    if (appRaw.skills) {
      try { parsedSkills = JSON.parse(appRaw.skills); }
      catch (parseError) { console.error(`[getApplicantDetailsById] Error parsing skills for user ${appRaw.jobSeekerUserId}:`, parseError); }
    }

    const applicant: ApplicantData = {
      applicationId: appRaw.applicationId,
      jobSeekerUserId: appRaw.jobSeekerUserId,
      jobSeekerName: appRaw.jobSeekerName,
      jobSeekerEmail: appRaw.jobSeekerEmail,
      applicationDate: appRaw.applicationDate,
      applicationStatus: appRaw.applicationStatus as ApplicationStatus,
      resumeUrl: appRaw.resumeUrl,
      jobTitleApplyingFor: appRaw.jobTitleApplyingFor,
      jobId: appRaw.jobId,
      customQuestionAnswers: parsedAnswers,
      employer_remarks: appRaw.employer_remarks,
      profilePictureUrl: appRaw.profilePictureUrl,
      phoneNumber: appRaw.phoneNumber,
      gender: appRaw.gender,
      location: appRaw.location,
      portfolioUrl: appRaw.portfolioUrl,
      githubProfileUrl: appRaw.githubProfileUrl,
      skills: parsedSkills,
      professionalSummary: appRaw.professionalSummary,
      currentDesignation: appRaw.currentDesignation,
      currentIndustry: appRaw.currentIndustry,
      currentIndustryType: appRaw.currentIndustryType,
      totalExperience: appRaw.totalExperience !== null ? Number(appRaw.totalExperience) : null,
      presentSalary: appRaw.presentSalary,
      currentWorkingLocation: appRaw.currentWorkingLocation,
      expectedSalary: appRaw.expectedSalary,
      noticePeriod: appRaw.noticePeriod,
    };
    console.log(`[getApplicantDetailsById] Applicant details fetched successfully for app ID: ${applicationId}`);
    return { success: true, applicant: applicant };

  } catch (e: any) {
    console.error(`[getApplicantDetailsById] Error fetching applicant details for app ID ${applicationId}:`, e);
    return { success: false, error: `Failed to fetch applicant details: ${(e as Error).message}` };
  }
}
    

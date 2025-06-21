// src/app/(roles)/jobSeeker/find-jobs/[id]/actions.ts
'use server';

import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import {
  type JobSeekerJobPreviewData,
  type JobDetailActionResponse,
  type ApplyJobFormData,
  type ApplyActionResponse,
  applyJobFormSchema, // Ensure this schema expects the new fields
  type SuggestedJobData,
} from './schema';

export async function getJobDetailsById(jobId: number, jobSeekerUserId?: number | null): Promise<JobDetailActionResponse> {
  const dbClient = db as Database;
  console.log(`[getJobDetailsById] Attempting to fetch job ID: ${jobId}, for jobSeekerUserId: ${jobSeekerUserId}`);

  if (isNaN(jobId) || jobId <= 0) {
    console.error(`[getJobDetailsById] Invalid jobId provided: ${jobId}`);
    return { success: false, error: 'Invalid Job ID.' };
  }

  try {
    let query = `
      SELECT
        j.id, j.jobTitle, j.industry, j.industryType, j.jobType, j.jobLocation,
        j.numberOfVacancies, j.qualification, j.minimumExperience, j.maximumExperience,
        j.minimumSalary, j.maximumSalary, j.skillsRequired, j.additionalData,
        j.jobDescription, j.customQuestions, j.status, j.createdAt, j.updatedAt,
        j.employer_user_id,
        COALESCE(ep.companyName, j.companyName, 'Company Information Not Available') as companyName,
        ep.companyLogoUrl, ep.companyWebsite, ep.aboutCompany,
        ep.yearOfEstablishment, ep.teamSize, ep.linkedinUrl, ep.address
    `;
    const paramsForDb: (string | number | null)[] = [];

    let jobSeekerProfileResumeUrl: string | null = null;

    if (jobSeekerUserId && typeof jobSeekerUserId === 'number' && jobSeekerUserId > 0) {
      query += `,
        (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.job_id = j.id AND sj.job_seeker_user_id = ?) as is_saved_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.job_seeker_user_id = ?) as is_applied_count
      `;
      paramsForDb.push(jobSeekerUserId);
      paramsForDb.push(jobSeekerUserId);

      console.log(`[getJobDetailsById] Fetching profile resume for jobSeekerUserId ${jobSeekerUserId}`);
      const profileStmt = dbClient.prepare('SELECT resumeUrl FROM job_seeker_profiles WHERE user_id = ?');
      const profile = profileStmt.get(jobSeekerUserId) as { resumeUrl?: string | null } | undefined;
      if (profile && profile.resumeUrl) {
        jobSeekerProfileResumeUrl = profile.resumeUrl;
        console.log(`[getJobDetailsById] Fetched resume URL for jobSeekerUserId ${jobSeekerUserId}: ${jobSeekerProfileResumeUrl}`);
      } else {
        console.log(`[getJobDetailsById] No resume URL found for jobSeekerUserId ${jobSeekerUserId}`);
      }
    } else {
      query += `, 0 as is_saved_count, 0 as is_applied_count `;
    }

    query += `
      FROM jobs j
      LEFT JOIN employer_profiles ep ON j.employer_user_id = ep.user_id
      WHERE j.id = ? AND j.status = 'active'
    `;
    paramsForDb.push(jobId);

    console.log("[getJobDetailsById] Executing SQL:", query);
    console.log("[getJobDetailsById] Query Parameters:", JSON.stringify(paramsForDb));

    const jobRow = dbClient.prepare(query).get(...paramsForDb) as any;
    console.log("[getJobDetailsById] Raw job from DB:", JSON.stringify(jobRow, null, 2));


    if (!jobRow) {
      console.warn(`[getJobDetailsById] No job found or job not active for ID: ${jobId}`);
      return { success: false, error: 'Job not found or no longer available.' };
    }

    const jobData: JobSeekerJobPreviewData = {
      id: jobRow.id,
      jobTitle: jobRow.jobTitle,
      industry: jobRow.industry || null,
      industryType: jobRow.industryType || null,
      jobType: jobRow.jobType || null,
      jobLocation: jobRow.jobLocation || null,
      numberOfVacancies: jobRow.numberOfVacancies !== null && jobRow.numberOfVacancies !== undefined ? Number(jobRow.numberOfVacancies) : null,
      qualification: jobRow.qualification || null,
      minimumExperience: jobRow.minimumExperience !== null && jobRow.minimumExperience !== undefined ? Number(jobRow.minimumExperience) : null,
      maximumExperience: jobRow.maximumExperience !== null && jobRow.maximumExperience !== undefined ? Number(jobRow.maximumExperience) : null,
      minimumSalary: jobRow.minimumSalary !== null && jobRow.minimumSalary !== undefined ? Number(jobRow.minimumSalary) : null,
      maximumSalary: jobRow.maximumSalary !== null && jobRow.maximumSalary !== undefined ? Number(jobRow.maximumSalary) : null,
      skillsRequired: jobRow.skillsRequired ? JSON.parse(jobRow.skillsRequired) : [],
      additionalData: jobRow.additionalData || null,
      jobDescription: jobRow.jobDescription || '',
      customQuestions: jobRow.customQuestions ? JSON.parse(jobRow.customQuestions) : [],
      status: jobRow.status as 'draft' | 'active' | 'closed',
      createdAt: jobRow.createdAt,
      updatedAt: jobRow.updatedAt,
      employer_user_id: jobRow.employer_user_id,
      companyName: jobRow.companyName,
      companyLogoUrl: jobRow.companyLogoUrl || null,
      companyWebsite: jobRow.companyWebsite || null,
      aboutCompany: jobRow.aboutCompany || null,
      yearOfEstablishment: jobRow.yearOfEstablishment !== null && jobRow.yearOfEstablishment !== undefined ? Number(jobRow.yearOfEstablishment) : null,
      teamSize: jobRow.teamSize !== null && jobRow.teamSize !== undefined ? Number(jobRow.teamSize) : null,
      linkedinUrl: jobRow.linkedinUrl || null,
      address: jobRow.address || null,
      isSaved: jobRow.is_saved_count > 0,
      isApplied: jobRow.is_applied_count > 0,
      jobSeekerProfileResumeUrl: jobSeekerProfileResumeUrl,
    };
    console.log(`[getJobDetailsById] Mapped jobData for ID: ${jobData.id}, Status: ${jobData.status}, isApplied: ${jobData.isApplied}, isSaved: ${jobData.isSaved}`);
    return { success: true, jobData: jobData };

  } catch (e: any) {
    console.error(`[getJobDetailsById] Error fetching job with ID ${jobId}:`, e);
    return { success: false, error: `Failed to fetch job details. Database error: ${(e as Error).message}` };
  }
}

export async function submitApplicationAction(data: ApplyJobFormData): Promise<ApplyActionResponse> {
  console.log('[Server Action submitApplicationAction] Data received for application:', JSON.stringify(data, null, 2));
  const validation = applyJobFormSchema.safeParse(data);
  if (!validation.success) {
    console.error("[Server Action submitApplicationAction] Zod validation failed:", JSON.stringify(validation.error.issues, null, 2));
    return { error: "Invalid application data. Please ensure all required fields are filled.", validationErrors: validation.error.errors };
  }

  const dbClient = db as Database;
  const {
    jobId,
    jobSeekerUserId,
    employerUserId,
    currentWorkingLocation,
    expectedSalary,
    noticePeriod,
    customQuestionAnswers,
  } = validation.data;

  console.log(`[Server Action submitApplicationAction] Attempting to submit application for job ID: ${jobId} by user ID: ${jobSeekerUserId}`);

  if (!jobSeekerUserId || !jobId || !employerUserId) {
      console.error("[Server Action submitApplicationAction] Missing critical IDs:", {jobId, jobSeekerUserId, employerUserId});
      return { success: false, error: "Critical information missing for application submission." };
  }

  try {
    dbClient.exec('BEGIN');
    console.log(`[Server Action submitApplicationAction] Transaction started for job ID: ${jobId}, user ID: ${jobSeekerUserId}`);

    const jobCheckStmt = dbClient.prepare("SELECT status FROM jobs WHERE id = ?");
    const jobStatusResult = jobCheckStmt.get(jobId) as { status: string } | undefined;

    if (!jobStatusResult) {
      dbClient.exec('ROLLBACK');
      console.warn(`[Server Action submitApplicationAction] Job ID: ${jobId} not found. Transaction rolled back.`);
      return { error: "Job not found. Cannot submit application." };
    }
    if (jobStatusResult.status !== 'active') {
      dbClient.exec('ROLLBACK');
      console.warn(`[Server Action submitApplicationAction] Job ID: ${jobId} is not active (status: ${jobStatusResult.status}). Transaction rolled back.`);
      return { error: "This job is no longer active and cannot accept applications." };
    }

    const existingApplicationStmt = dbClient.prepare(
      'SELECT id FROM job_applications WHERE job_id = ? AND job_seeker_user_id = ?'
    );
    const existingApplication = existingApplicationStmt.get(jobId, jobSeekerUserId);
    if (existingApplication) {
      dbClient.exec('ROLLBACK');
      console.warn(`[Server Action submitApplicationAction] User ${jobSeekerUserId} already applied for job ${jobId}. Transaction rolled back.`);
      return { error: 'You have already applied for this job.' };
    }

    let profileResumeUrl: string | null = null;
    const profileStmt = dbClient.prepare('SELECT resumeUrl FROM job_seeker_profiles WHERE user_id = ?');
    const profile = profileStmt.get(jobSeekerUserId) as { resumeUrl?: string | null } | undefined;
    if (profile && profile.resumeUrl) {
      profileResumeUrl = profile.resumeUrl;
    }
    console.log(`[Server Action submitApplicationAction] Profile resume URL for user ${jobSeekerUserId}: ${profileResumeUrl}`);

    const customAnswersString = customQuestionAnswers && customQuestionAnswers.length > 0
      ? JSON.stringify(customQuestionAnswers)
      : null;

    const paramsForDb = {
      jobId,
      jobSeekerUserId,
      employerUserId,
      resumeUrl: profileResumeUrl, // Use resume from the main profile
      currentWorkingLocation,
      expectedSalary,
      noticePeriod,
      customQuestionAnswers: customAnswersString,
    };
    console.log('[Server Action submitApplicationAction] Data for INSERT:', JSON.stringify(paramsForDb, null, 2));

    const insertAppStmt = dbClient.prepare(`
      INSERT INTO job_applications (
        job_id, job_seeker_user_id, employer_user_id,
        resumeUrl, currentWorkingLocation, expectedSalary, noticePeriod, customQuestionAnswers,
        applicationDate, status, updatedAt
      ) VALUES (
        @jobId, @jobSeekerUserId, @employerUserId,
        @resumeUrl, @currentWorkingLocation, @expectedSalary, @noticePeriod, @customQuestionAnswers,
        CURRENT_TIMESTAMP, 'submitted', CURRENT_TIMESTAMP
      )
    `);

    const info = insertAppStmt.run(paramsForDb);
    const newApplicationId = Number(info.lastInsertRowid);
    console.log(`[Server Action submitApplicationAction] Application submitted successfully. App ID: ${newApplicationId}`);

    const unsaveStmt = dbClient.prepare('DELETE FROM saved_jobs WHERE job_id = ? AND job_seeker_user_id = ?');
    const unsaveInfo = unsaveStmt.run(jobId, jobSeekerUserId);
    if (unsaveInfo.changes > 0) {
        console.log(`[Server Action submitApplicationAction] Job ID: ${jobId} automatically unsaved for user ID: ${jobSeekerUserId} after application.`);
    }

    dbClient.exec('COMMIT');
    console.log(`[Server Action submitApplicationAction] Transaction committed for job ID: ${jobId}, user ID: ${jobSeekerUserId}`);

    return { success: true, message: 'Application submitted successfully!', applicationId: newApplicationId };
  } catch (e: any) {
    if (dbClient.inTransaction) {
      dbClient.exec('ROLLBACK');
      console.error(`[Server Action submitApplicationAction] Transaction rolled back due to error for job ID: ${jobId}, user ID: ${jobSeekerUserId}`, e);
    } else {
      console.error('[Server Action submitApplicationAction] Error submitting application (outside transaction):', e);
    }
     // Provide the specific SQLite error if available
    const dbErrorMessage = e.message ? `Database error: ${e.message}` : 'An unexpected error occurred.';
    return { success: false, error: `An unexpected error occurred: ${dbErrorMessage}` };
  }
}


export async function getSimilarJobs(currentJobDetails: JobSeekerJobPreviewData): Promise<{ success: boolean, jobs?: SuggestedJobData[], error?: string }> {
  console.log("[getSimilarJobs] Fetching similar jobs for job ID:", currentJobDetails.id, "Industry:", currentJobDetails.industry, "Type:", currentJobDetails.industryType);
  const dbClient = db as Database;
  try {
    const params: (string | number)[] = [];
    const whereClauses: string[] = ["j.status = 'active'", "j.id != ?"];
    params.push(currentJobDetails.id);

    const similarityConditions: string[] = [];
    if (currentJobDetails.industry) {
      similarityConditions.push("j.industry = ?");
      params.push(currentJobDetails.industry);
    }
    if (currentJobDetails.industryType && currentJobDetails.industryType.toLowerCase() !== 'other') {
      similarityConditions.push("j.industryType = ?");
      params.push(currentJobDetails.industryType);
    }

    if (similarityConditions.length > 0) {
      whereClauses.push(`(${similarityConditions.join(' OR ')})`);
    } else {
      console.log("[getSimilarJobs] Not enough specific criteria from current job to find similar ones based on industry/type. Fetching recent active jobs.");
    }

    let orderByClause = "ORDER BY ";
    const scoreCases: string[] = [];
     if (currentJobDetails.industry) {
      scoreCases.push("CASE WHEN j.industry = ? THEN 3 ELSE 0 END");
      params.push(currentJobDetails.industry);
    }
    if (currentJobDetails.industryType && currentJobDetails.industryType.toLowerCase() !== 'other') {
      scoreCases.push("CASE WHEN j.industryType = ? THEN 2 ELSE 0 END");
      params.push(currentJobDetails.industryType);
    }

    if (scoreCases.length > 0) {
      orderByClause += scoreCases.join(' + ') + " DESC, j.createdAt DESC";
    } else {
      orderByClause += "j.createdAt DESC";
    }

    const query = `
      SELECT
        j.id,
        j.jobTitle,
        j.jobLocation as location,
        COALESCE(ep.companyName, j.companyName, 'Company Unavailable') as companyName,
        ep.companyLogoUrl
      FROM jobs j
      LEFT JOIN employer_profiles ep ON j.employer_user_id = ep.user_id
      WHERE ${whereClauses.join(' AND ')}
      ${orderByClause}
      LIMIT 10
    `;

    console.log("[getSimilarJobs] SQL Query:", query);
    console.log("[getSimilarJobs] SQL Params:", JSON.stringify(params));

    const jobsRaw = dbClient.prepare(query).all(...params) as any[];
    const jobs: SuggestedJobData[] = jobsRaw.map(job => ({
      id: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl || null,
      location: job.location || null,
    }));
    console.log("[getSimilarJobs] Found jobs:", jobs.length);
    return { success: true, jobs };
  } catch (e: any) {
    console.error("[getSimilarJobs] Error fetching similar jobs:", e);
    return { success: false, error: (e as Error).message, jobs: [] };
  }
}

export async function getOtherJobsByCompany(employerUserId: number, currentJobId: number): Promise<{ success: boolean, jobs?: SuggestedJobData[], error?: string }> {
  console.log("[getOtherJobsByCompany] Fetching other jobs for employer ID:", employerUserId, "excluding job ID:", currentJobId);
  const dbClient = db as Database;
  try {
    const query = `
      SELECT
        j.id,
        j.jobTitle,
        j.jobLocation as location,
        COALESCE(ep.companyName, j.companyName, 'Company Unavailable') as companyName,
        ep.companyLogoUrl
      FROM jobs j
      LEFT JOIN employer_profiles ep ON j.employer_user_id = ep.user_id
      WHERE j.employer_user_id = ? AND j.id != ? AND j.status = 'active'
      ORDER BY j.createdAt DESC
      LIMIT 5
    `;
    const jobsRaw = dbClient.prepare(query).all(employerUserId, currentJobId) as any[];
    const jobs: SuggestedJobData[] = jobsRaw.map(job => ({
      id: job.id,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl || null,
      location: job.location || null,
    }));
    console.log("[getOtherJobsByCompany] Found jobs:", jobs.length);
    return { success: true, jobs };
  } catch (e: any) {
    console.error("[getOtherJobsByCompany] Error fetching other jobs by company:", e);
    return { success: false, error: `Database error: ${(e as Error).message}`, jobs: [] };
  }
}

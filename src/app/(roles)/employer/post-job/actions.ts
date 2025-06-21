
// src/app/(roles)/employer/post-job/actions.ts
'use server';

import { z } from 'zod';
import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import { JobFormDataSchema, type JobFormData, type JobPreviewData } from './job-schema';

export interface JobActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  jobId?: number;
  validationErrors?: z.ZodIssue[];
  jobData?: JobPreviewData;
}

// Helper to get employer's company name
async function getEmployerCompanyName(employerUserId: number): Promise<string | null> {
  const dbClient = db as Database;
  try {
    const stmt = dbClient.prepare('SELECT companyName FROM employer_profiles WHERE user_id = ?');
    const profile = stmt.get(employerUserId) as { companyName: string } | undefined;
    return profile?.companyName || null;
  } catch (e) {
    console.error("[getEmployerCompanyName] Error fetching company name:", e);
    return null;
  }
}


export async function saveJobAction(
  employerUserId: number,
  data: JobFormData,
  jobIdToUpdate?: number 
): Promise<JobActionResponse> {
  if (!employerUserId) {
    return { error: "User not authenticated or user ID not provided." };
  }
  
  const validation = JobFormDataSchema.safeParse(data);
  if (!validation.success) {
    console.warn("[saveJobAction] Zod validation failed. Raw Zod issues:", JSON.stringify(validation.error.issues, null, 2));
    return { error: "Invalid job data.", validationErrors: validation.error.issues };
  }

  const dbClient = db as Database;
  const {
    jobTitle,
    industry, // This is the free-text industry
    industryType, // This is the category from dropdown
    otherIndustryType, // This is the custom value if industryType is 'other'
    jobType,
    jobLocation,
    numberOfVacancies,
    qualification,
    minimumExperience,
    maximumExperience,
    minimumSalary,
    maximumSalary,
    skillsRequired,
    additionalData,
    jobDescription,
    customQuestions,
    status, 
  } = validation.data;

  const fetchedCompanyName = await getEmployerCompanyName(employerUserId);
  if (!fetchedCompanyName) {
    return { error: "Company name not found in your profile. Please complete your company profile first." };
  }
  const finalCompanyName = fetchedCompanyName;

  // Determine the value for the industryType column in the database
  let finalIndustryTypeForDB = industryType;
  if (industryType === 'Other' && otherIndustryType && otherIndustryType.trim() !== '') {
    finalIndustryTypeForDB = otherIndustryType.trim();
  } else if (industryType === 'Other' && (!otherIndustryType || otherIndustryType.trim() === '')) {
    // This case should be caught by Zod validation, but as a safeguard:
    return { error: "Please specify industry type when 'Other' is selected."};
  }

  const skillsJson = JSON.stringify(skillsRequired || []);
  const customQuestionsJson = JSON.stringify(customQuestions || []);
  
  const finalStatus = status === 'active' ? 'active' : 'draft'; // Default to draft if not 'active'
  console.log(`[saveJobAction] Determined finalStatus for DB: ${finalStatus} for job: ${jobTitle}`);

  try {
    let resultJobId = jobIdToUpdate;
    const params = {
      employer_user_id: employerUserId,
      jobTitle,
      companyName: finalCompanyName,
      industry, // Free-text industry
      industryType: finalIndustryTypeForDB, // Categorized or custom "other" industry type
      jobType,
      jobLocation,
      numberOfVacancies,
      qualification,
      minimumExperience,
      maximumExperience,
      minimumSalary,
      maximumSalary,
      skillsRequired: skillsJson,
      additionalData: additionalData || null,
      jobDescription,
      customQuestions: customQuestionsJson,
      status: finalStatus,
    };

    if (jobIdToUpdate) {
       console.log(`[saveJobAction] Updating job ID: ${jobIdToUpdate} with status: ${finalStatus}`);
      const stmt = dbClient.prepare(`
        UPDATE jobs SET
          jobTitle = @jobTitle,
          companyName = @companyName,
          industry = @industry,
          industryType = @industryType,
          jobType = @jobType,
          jobLocation = @jobLocation,
          numberOfVacancies = @numberOfVacancies,
          qualification = @qualification,
          minimumExperience = @minimumExperience,
          maximumExperience = @maximumExperience,
          minimumSalary = @minimumSalary,
          maximumSalary = @maximumSalary,
          skillsRequired = @skillsRequired,
          additionalData = @additionalData,
          jobDescription = @jobDescription,
          customQuestions = @customQuestions,
          status = @status,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = @id AND employer_user_id = @employer_user_id
      `);
      const info = stmt.run({ ...params, id: jobIdToUpdate });
      if (info.changes === 0) {
        return { error: "Failed to update job. It might not exist or you don't have permission." };
      }
    } else {
      console.log(`[saveJobAction] Inserting new job with status: ${finalStatus}`);
      const stmt = dbClient.prepare(`
        INSERT INTO jobs (
          employer_user_id, jobTitle, companyName, industry, industryType, jobType, jobLocation,
          numberOfVacancies, qualification, minimumExperience, maximumExperience, minimumSalary, maximumSalary,
          skillsRequired, additionalData, jobDescription, customQuestions, status
        ) VALUES (
          @employer_user_id, @jobTitle, @companyName, @industry, @industryType, @jobType, @jobLocation,
          @numberOfVacancies, @qualification, @minimumExperience, @maximumExperience, @minimumSalary, @maximumSalary,
          @skillsRequired, @additionalData, @jobDescription, @customQuestions, @status
        )
      `);
      const info = stmt.run(params);
      resultJobId = Number(info.lastInsertRowid);
    }
    
    const createdOrUpdatedJob = await getJobById(resultJobId!, employerUserId); 
    if (!createdOrUpdatedJob.jobData) {
        return { error: "Job was saved, but failed to retrieve confirmation details." };
    }

    return {
      success: true,
      message: `Job ${jobIdToUpdate ? 'updated' : 'saved'} as ${finalStatus} successfully.`,
      jobId: resultJobId,
      jobData: createdOrUpdatedJob.jobData,
    };
  } catch (e: any) {
    console.error('[saveJobAction] Error saving job:', e);
    if (e.message && (e.message.toLowerCase().includes('check constraint failed') || e.message.toLowerCase().includes('constraint_failed'))) {
      return { error: `Database constraint error. Ensure status '${finalStatus}' is valid ('draft', 'active', 'closed'). Error: ${e.message}` };
    }
    return { error: e.message || 'An unexpected error occurred while saving the job.' };
  }
}

export async function getJobById(jobId: number, employerUserId?: number): Promise<JobActionResponse> {
  const dbClient = db as Database;
  console.log(`[getJobById] Fetching job ID: ${jobId} for employer ID: ${employerUserId}`);
  try {
    let query = 'SELECT * FROM jobs WHERE id = ?';
    const paramsForDb: (number | string)[] = [jobId];

    if (employerUserId) {
      query += ' AND employer_user_id = ?';
      paramsForDb.push(employerUserId);
    }

    const stmt = dbClient.prepare(query);
    const job = stmt.get(...paramsForDb) as any;

    if (!job) {
      console.warn(`[getJobById] Job not found for ID: ${jobId}, employer ID: ${employerUserId}`);
      return { error: 'Job not found or you do not have permission to view it.' };
    }
    
    // Ensure all fields for JobPreviewData are correctly mapped
    const jobData: JobPreviewData = {
      id: job.id, 
      jobTitle: job.jobTitle,
      companyName: job.companyName, // This is stored directly in jobs table
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
      additionalData: job.additionalData,
      jobDescription: job.jobDescription,
      customQuestions: job.customQuestions ? JSON.parse(job.customQuestions) : [],
      status: job.status as 'draft' | 'active' | 'closed',
      createdAt: job.createdAt, 
      updatedAt: job.updatedAt,
      employer_user_id: job.employer_user_id,
      // companyLogoUrl is not part of the 'jobs' table directly,
      // it would need to be fetched from employer_profiles if needed for JobPreviewData specifically
      // If JobPreviewData needs it, this action or its caller needs to handle fetching it.
      // For now, assuming JobPreviewData on post-job might not show logo, or companyName is enough.
    };
    console.log(`[getJobById] Successfully fetched job ID: ${jobId}`);
    return { success: true, jobData };

  } catch (e: any) {
    console.error(`[getJobById] Error fetching job with ID ${jobId}:`, e);
    return { error: 'Failed to fetch job details.' };
  }
}


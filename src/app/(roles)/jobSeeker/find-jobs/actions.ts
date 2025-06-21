// src/app/(roles)/jobSeeker/find-jobs/actions.ts
'use server';

import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import type { JobListingData, PublicCompanyProfileData, SaveJobActionResponse } from './schema'; // Ensure types are correctly defined/imported

const ALL_INDUSTRIES_FILTER_VALUE = "_all_industries_filter_";
const ALL_JOB_TYPES_FILTER_VALUE = "_all_job_types_filter_";

export async function getPostedJobsAction(
  searchTerm?: string,
  locationTerm?: string,
  industryTerm?: string,
  jobTypeTerm?: string,
  jobSeekerUserId?: number | null
): Promise<{ success: boolean, data?: JobListingData[] | null, error?: string }> {
  const dbClient = db as Database;
  console.log('[getPostedJobsAction] Called with filters:', { searchTerm, locationTerm, industryTerm, jobTypeTerm, jobSeekerUserId });

  try {
    let baseQuery = `
      SELECT
        j.id, j.jobTitle, j.jobLocation, j.createdAt,
        j.industry, j.industryType, j.jobType, j.qualification,
        j.minimumExperience, j.maximumExperience,
        j.minimumSalary, j.maximumSalary, j.skillsRequired,
        j.employer_user_id,
        COALESCE(ep.companyName, j.companyName) as companyName,
        ep.companyLogoUrl, ep.companyWebsite, ep.aboutCompany,
        ep.yearOfEstablishment, ep.teamSize, ep.linkedinUrl, ep.address
    `;
    const paramsForDb: (string | number | null)[] = [];
    let whereClauses: string[] = ["j.status = 'active'"];

    if (jobSeekerUserId && typeof jobSeekerUserId === 'number' && jobSeekerUserId > 0) {
      baseQuery += `,
        (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.job_id = j.id AND sj.job_seeker_user_id = ?) as is_saved_count,
        (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.job_seeker_user_id = ?) as is_applied_count
      `;
      paramsForDb.push(jobSeekerUserId);
      paramsForDb.push(jobSeekerUserId);
    } else {
      baseQuery += `, 0 as is_saved_count, 0 as is_applied_count `;
    }

    baseQuery += `
      FROM jobs j
      LEFT JOIN employer_profiles ep ON j.employer_user_id = ep.user_id
    `;

    if (searchTerm && searchTerm.trim() !== "") {
      whereClauses.push(`(j.jobTitle LIKE ? OR COALESCE(ep.companyName, j.companyName) LIKE ? OR j.skillsRequired LIKE ?)`);
      const searchTermLike = `%${searchTerm}%`;
      paramsForDb.push(searchTermLike, searchTermLike, searchTermLike);
    }
    if (locationTerm && locationTerm.trim() !== "") {
      whereClauses.push(`j.jobLocation LIKE ?`);
      paramsForDb.push(`%${locationTerm}%`);
    }
    if (industryTerm && industryTerm.trim() !== "" && industryTerm !== ALL_INDUSTRIES_FILTER_VALUE) {
      whereClauses.push(`(j.industry LIKE ? OR j.industryType LIKE ?)`);
      const industryTermLike = `%${industryTerm}%`;
      paramsForDb.push(industryTermLike, industryTermLike);
    }
    if (jobTypeTerm && jobTypeTerm.trim() !== "" && jobTypeTerm !== ALL_JOB_TYPES_FILTER_VALUE) {
      whereClauses.push(`j.jobType LIKE ?`);
      paramsForDb.push(`%${jobTypeTerm}%`);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    let orderByClause = "";
    const personalizationParams: (string | number)[] = [];
    const noUserFiltersApplied =
      (!searchTerm || searchTerm.trim() === "") &&
      (!locationTerm || locationTerm.trim() === "") &&
      (!industryTerm || industryTerm.trim() === "" || industryTerm === ALL_INDUSTRIES_FILTER_VALUE) &&
      (!jobTypeTerm || jobTypeTerm.trim() === "" || jobTypeTerm === ALL_JOB_TYPES_FILTER_VALUE);

    if (jobSeekerUserId && typeof jobSeekerUserId === 'number' && jobSeekerUserId > 0 && noUserFiltersApplied) {
      console.log(`[getPostedJobsAction] No user filters applied. Attempting personalized sort for user ID: ${jobSeekerUserId}`);
      const profileStmt = dbClient.prepare(`
        SELECT skills, preferredLocations, currentIndustry, currentIndustryType, currentDesignation, currentDepartment
        FROM job_seeker_profiles
        WHERE user_id = ?
      `);
      const userProfile = profileStmt.get(jobSeekerUserId) as {
        skills?: string | null;
        preferredLocations?: string | null;
        currentIndustry?: string | null;
        currentIndustryType?: string | null;
        currentDesignation?: string | null;
        currentDepartment?: string | null;
      } | undefined;

      console.log(`[getPostedJobsAction] Fetched user profile for personalization:`, JSON.stringify(userProfile, null, 2));

      if (userProfile) {
        const personalizationScores: string[] = [];
        if (userProfile.currentDesignation) {
          personalizationScores.push(`(CASE WHEN j.jobTitle LIKE ? OR j.jobDescription LIKE ? THEN 40 ELSE 0 END)`);
          personalizationParams.push(`%${userProfile.currentDesignation}%`, `%${userProfile.currentDesignation}%`);
        }
        if (userProfile.currentDepartment) {
          personalizationScores.push(`(CASE WHEN j.jobDescription LIKE ? THEN 30 ELSE 0 END)`);
          personalizationParams.push(`%${userProfile.currentDepartment}%`);
        }
        if (userProfile.currentIndustry) {
          personalizationScores.push(`(CASE WHEN j.industry LIKE ? THEN 20 ELSE 0 END)`);
          personalizationParams.push(`%${userProfile.currentIndustry}%`);
        }
        if (userProfile.currentIndustryType && userProfile.currentIndustryType.toLowerCase() !== 'other') {
          personalizationScores.push(`(CASE WHEN j.industryType LIKE ? THEN 20 ELSE 0 END)`);
          personalizationParams.push(`%${userProfile.currentIndustryType}%`);
        }

        let preferredLocations: string[] = [];
        if (userProfile.preferredLocations) {
          try { preferredLocations = JSON.parse(userProfile.preferredLocations); } catch (e) { console.error("[getPostedJobsAction] Error parsing preferredLocations JSON:", e); }
        }
        if (Array.isArray(preferredLocations) && preferredLocations.length > 0) {
          const locationPlaceholders = preferredLocations.map(() => '?').join(',');
          if (locationPlaceholders) {
            personalizationScores.push(`(CASE WHEN j.jobLocation IN (${locationPlaceholders}) THEN 15 ELSE 0 END)`);
            personalizationParams.push(...preferredLocations);
          }
        }

        let skills: string[] = [];
        if (userProfile.skills) {
          try { skills = JSON.parse(userProfile.skills); } catch (e) { console.error("[getPostedJobsAction] Error parsing skills JSON:", e); }
        }
        if (Array.isArray(skills) && skills.length > 0) {
          skills.slice(0, 5).forEach(skill => { // Limit skill matching for performance
            personalizationScores.push(`(CASE WHEN j.skillsRequired LIKE ? THEN 5 ELSE 0 END)`); // Lower weight for skills
            personalizationParams.push(`%${skill}%`);
          });
        }
        
        if (personalizationScores.length > 0) {
          orderByClause = ` ORDER BY (${personalizationScores.join(' + ')}) DESC, j.createdAt DESC`;
          console.log(`[getPostedJobsAction] Applying personalized ORDER BY. Scores components: ${personalizationScores.length}, Params for OrderBy: ${personalizationParams.length}`);
        } else {
           orderByClause = " ORDER BY j.createdAt DESC";
        }
      } else {
        orderByClause = " ORDER BY j.createdAt DESC";
      }
    } else {
      orderByClause = " ORDER BY j.createdAt DESC";
    }

    const finalQuery = baseQuery + orderByClause;
    const finalParams = [...paramsForDb, ...personalizationParams];

    console.log('[getPostedJobsAction] Final SQL Query:', finalQuery);
    console.log('[getPostedJobsAction] Final Query Parameters:', JSON.stringify(finalParams));

    const stmt = dbClient.prepare(finalQuery);
    const jobsRaw = stmt.all(...finalParams) as any[];
    console.log(`[getPostedJobsAction] Raw jobs fetched from DB: ${jobsRaw.length}`);

    const formattedJobs: JobListingData[] = jobsRaw.map(job => ({
      id: job.id,
      jobTitle: job.jobTitle,
      jobLocation: job.jobLocation || null,
      createdAt: job.createdAt,
      industry: job.industry || null,
      industryType: job.industryType || null,
      jobType: job.jobType || null,
      qualification: job.qualification || null,
      minimumExperience: job.minimumExperience !== null && job.minimumExperience !== undefined ? Number(job.minimumExperience) : null,
      maximumExperience: job.maximumExperience !== null && job.maximumExperience !== undefined ? Number(job.maximumExperience) : null,
      minimumSalary: job.minimumSalary !== null && job.minimumSalary !== undefined ? Number(job.minimumSalary) : null,
      maximumSalary: job.maximumSalary !== null && job.maximumSalary !== undefined ? Number(job.maximumSalary) : null,
      skillsRequired: job.skillsRequired ? JSON.parse(job.skillsRequired) : [],
      employer_user_id: job.employer_user_id,
      companyName: job.companyName || 'Company Information Unavailable',
      companyLogoUrl: job.companyLogoUrl || null,
      companyWebsite: job.companyWebsite || null,
      aboutCompany: job.aboutCompany || null,
      yearOfEstablishment: job.yearOfEstablishment !== null && job.yearOfEstablishment !== undefined ? Number(job.yearOfEstablishment) : null,
      teamSize: job.teamSize !== null && job.teamSize !== undefined ? Number(job.teamSize) : null,
      linkedinUrl: job.linkedinUrl || null,
      address: job.address || null,
      isSaved: job.is_saved_count > 0,
      isApplied: job.is_applied_count > 0,
    }));
    
    console.log(`[getPostedJobsAction] Returning ${formattedJobs.length} formatted jobs.`);
    return { success: true, data: formattedJobs };

  } catch (e: any) {
    console.error('[getPostedJobsAction] Error fetching posted jobs:', e);
    return { success: false, error: `Failed to fetch job listings. Database error: ${(e as Error).message}`, data: null };
  }
}

export async function saveJobAction(jobId: number, jobSeekerUserId: number, isSaving: boolean): Promise<SaveJobActionResponse> {
  if (!jobSeekerUserId) {
    console.warn("[saveJobAction] User not authenticated.");
    return { success: false, error: 'User not authenticated.', isSaved: !isSaving };
  }
  if (!jobId || typeof jobId !== 'number') {
    console.warn("[saveJobAction] Invalid Job ID provided:", jobId);
    return { success: false, error: 'Job ID not provided.', isSaved: !isSaving };
  }

  const dbClient = db as Database;
  try {
    if (isSaving) {
      console.log(`[saveJobAction] Attempting to SAVE job ID: ${jobId} for user ID: ${jobSeekerUserId}`);
      const jobCheckStmt = dbClient.prepare("SELECT id FROM jobs WHERE id = ? AND status = 'active'");
      const activeJob = jobCheckStmt.get(jobId);
      if (!activeJob) {
        console.warn(`[saveJobAction] Job ID: ${jobId} not found or not active. Cannot save.`);
        return { success: false, error: "Cannot save this job. It may no longer be available.", isSaved: false };
      }

      const checkStmt = dbClient.prepare('SELECT id FROM saved_jobs WHERE job_seeker_user_id = ? AND job_id = ?');
      const existing = checkStmt.get(jobSeekerUserId, jobId);
      if (existing) {
        console.log(`[saveJobAction] Job ID: ${jobId} already saved by user ID: ${jobSeekerUserId}`);
        return { success: true, message: 'Job is already saved.', isSaved: true };
      }
      const stmt = dbClient.prepare('INSERT INTO saved_jobs (job_seeker_user_id, job_id) VALUES (?, ?)');
      stmt.run(jobSeekerUserId, jobId); // savedDate will use default CURRENT_TIMESTAMP
      console.log(`[saveJobAction] Successfully SAVED job ID: ${jobId} for user ID: ${jobSeekerUserId}`);
      return { success: true, message: 'Job saved successfully!', isSaved: true };
    } else { 
      console.log(`[saveJobAction] Attempting to UNSAVE job ID: ${jobId} for user ID: ${jobSeekerUserId}`);
      const stmt = dbClient.prepare('DELETE FROM saved_jobs WHERE job_seeker_user_id = ? AND job_id = ?');
      const info = stmt.run(jobSeekerUserId, jobId);
      if (info.changes > 0) {
        console.log(`[saveJobAction] Successfully UNSAVED job ID: ${jobId} for user ID: ${jobSeekerUserId}`);
        return { success: true, message: 'Job unsaved successfully!', isSaved: false };
      } else {
        console.log(`[saveJobAction] Job ID: ${jobId} was not saved or already unsaved by user ID: ${jobSeekerUserId}`);
        return { success: true, message: 'Job was not in your saved list.', isSaved: false };
      }
    }
  } catch (e: any) {
    console.error(`[saveJobAction] Error ${isSaving ? 'saving' : 'unsaving'} job for user ${jobSeekerUserId}, job ${jobId}:`, e);
    const action = isSaving ? 'save' : 'unsave';
    return { success: false, error: `Failed to ${action} job. Database error: ${(e as Error).message}`, isSaved: !isSaving };
  }
}

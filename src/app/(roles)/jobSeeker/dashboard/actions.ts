// src/app/(roles)/jobSeeker/dashboard/actions.ts
'use server';

import { z } from 'zod';
import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import {
    validateJobSeekerProfileData, // Use the validator from the schema file
    type JobSeekerProfileFormData,
    type EducationDetail,
    type ExperienceDetail,
    initialJobSeekerProfileValues,
    urlOrDataUriSchema,
} from './profile-schema';
import { parseISO, isValid as isValidDate, format } from 'date-fns';
import type { ApplicationStatus } from '@/app/(roles)/employer/dashboard/types';

export interface AppliedJobData {
  applicationId: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  jobLocation: string | null;
  applicationDate: string;
  applicationStatus: ApplicationStatus;
  employer_remarks?: string | null;
  customQuestionAnswers?: Array<{ questionText: string; answer: string }>;
}

export interface SavedJobData {
  id: number; 
  jobId: number;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string | null;
  jobLocation: string | null;
  savedDate: string;
  status?: 'active' | 'closed' | 'draft';
  isApplied?: boolean;
}

interface ActionResponseMultipleApplications {
  success?: boolean;
  message?: string;
  error?: string;
  data?: AppliedJobData[];
}

interface ActionResponseMultipleSavedJobs {
  success?: boolean;
  message?: string;
  error?: string;
  data?: SavedJobData[];
}

export interface WithdrawActionResponse {
    success?: boolean;
    message?: string;
    error?: string;
}


export async function getAppliedJobs(jobSeekerUserId: number): Promise<ActionResponseMultipleApplications> {
  if (!jobSeekerUserId) {
    return { success: false, error: "User not authenticated." };
  }
  const dbClient = db as Database;
  console.log(`[getAppliedJobs] Fetching applied jobs for user ID: ${jobSeekerUserId}`);

  try {
    const sqlQuery =
      'SELECT ' +
      '  ja.id as applicationId, ' +
      '  j.id as jobId, ' +
      '  j.jobTitle, ' +
      '  COALESCE(ep.companyName, j.companyName, \'N/A\') as companyName, ' +
      '  j.jobLocation, ' +
      '  ja.applicationDate, ' +
      '  ja.status as applicationStatus, ' +
      '  ja.customQuestionAnswers, ' +
      '  ja.employer_remarks ' +
      'FROM job_applications ja ' +
      'JOIN jobs j ON ja.job_id = j.id ' +
      'LEFT JOIN employer_profiles ep ON j.employer_user_id = ep.user_id ' +
      'WHERE ja.job_seeker_user_id = ? ' +
      'ORDER BY ja.applicationDate DESC';

    const stmt = dbClient.prepare(sqlQuery);
    const applications = stmt.all(jobSeekerUserId) as any[];

    const formattedApplications: AppliedJobData[] = applications.map(app => {
      let parsedAnswers: Array<{ questionText: string; answer: string }> = [];
      if (app.customQuestionAnswers) {
        try {
          parsedAnswers = JSON.parse(app.customQuestionAnswers);
        } catch (e) {
          console.error(`[getAppliedJobs] Error parsing customQuestionAnswers for application ID ${app.applicationId}:`, e);
        }
      }
      return {
        applicationId: app.applicationId,
        jobId: app.jobId,
        jobTitle: app.jobTitle || 'Job Title Unavailable',
        companyName: app.companyName || 'Company Name Unavailable',
        jobLocation: app.jobLocation || 'Location Not Specified',
        applicationDate: app.applicationDate || new Date().toISOString(),
        applicationStatus: (app.applicationStatus as ApplicationStatus) || 'submitted',
        employer_remarks: app.employer_remarks || null,
        customQuestionAnswers: parsedAnswers,
      };
    });
    console.log(`[getAppliedJobs] Found ${formattedApplications.length} applied jobs for user ID: ${jobSeekerUserId}`);
    return { success: true, data: formattedApplications };
  } catch (e: any) {
    console.error(`[getAppliedJobs] Error fetching applied jobs for user ID ${jobSeekerUserId}:`, e);
    return { success: false, error: `Failed to fetch applied jobs. Database error: ${(e as Error).message}` };
  }
}

export async function withdrawApplicationAction(applicationId: number, jobSeekerUserId: number): Promise<WithdrawActionResponse> {
    if (!jobSeekerUserId) {
        return { success: false, error: "User not authenticated." };
    }
    if (!applicationId) {
        return { success: false, error: "Application ID not provided." };
    }
    const dbClient = db as Database;
    console.log(`[withdrawApplicationAction] Attempting to withdraw application ID ${applicationId} for user ${jobSeekerUserId}`);
    try {
        const checkStmt = dbClient.prepare('SELECT id FROM job_applications WHERE id = ? AND job_seeker_user_id = ?');
        const appExists = checkStmt.get(applicationId, jobSeekerUserId);

        if (!appExists) {
            console.warn(`[withdrawApplicationAction] Application ID ${applicationId} not found for user ${jobSeekerUserId} or user does not own it.`);
            return { success: false, error: "Application not found or you do not have permission to withdraw it." };
        }

        const stmt = dbClient.prepare(
            'DELETE FROM job_applications WHERE id = ? AND job_seeker_user_id = ?'
        );
        const info = stmt.run(applicationId, jobSeekerUserId);

        if (info.changes > 0) {
            console.log(`[withdrawApplicationAction] Application ID ${applicationId} withdrawn successfully.`);
            return { success: true, message: "Application withdrawn successfully." };
        } else {
            console.warn(`[withdrawApplicationAction] Failed to withdraw application ID ${applicationId}. Not found or permission issue (though already checked).`);
            return { success: false, error: "Failed to withdraw application. It might have been already withdrawn or an issue occurred." };
        }
    } catch (e: any) {
        console.error(`[withdrawApplicationAction] Error withdrawing application ID ${applicationId} for user ${jobSeekerUserId}:`, e);
        return { success: false, error: `An unexpected error occurred: ${(e as Error).message}` };
    }
}

export async function getSavedJobs(jobSeekerUserId: number): Promise<ActionResponseMultipleSavedJobs> {
  if (!jobSeekerUserId) {
    return { success: false, error: "User not authenticated." };
  }
  const dbClient = db as Database;
  console.log(`[getSavedJobs] Fetching saved jobs for user ID: ${jobSeekerUserId}`);

  try {
    const sqlQuery =
      'SELECT ' +
      '  sj.job_id as jobId, ' +
      '  j.jobTitle, ' +
      '  j.status, ' + 
      '  COALESCE(ep.companyName, j.companyName, \'Company Unavailable\') as companyName, ' +
      '  ep.companyLogoUrl, ' +
      '  j.jobLocation, ' +
      '  sj.savedDate, ' +
      '  (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.job_seeker_user_id = ?) as isAppliedCount ' +
      'FROM saved_jobs sj ' +
      'JOIN jobs j ON sj.job_id = j.id ' +
      'LEFT JOIN employer_profiles ep ON j.employer_user_id = ep.user_id ' +
      'WHERE sj.job_seeker_user_id = ? ' +
      'ORDER BY sj.savedDate DESC';

    const stmt = dbClient.prepare(sqlQuery);
    const savedJobsRaw = stmt.all(jobSeekerUserId, jobSeekerUserId) as any[];

    const formattedSavedJobs: SavedJobData[] = savedJobsRaw.map(job => {
      return {
        id: job.jobId,
        jobId: job.jobId,
        jobTitle: job.jobTitle || 'Job Title Unavailable',
        companyName: job.companyName || 'Company Unavailable',
        companyLogoUrl: job.companyLogoUrl || null,
        jobLocation: job.jobLocation || 'Location Not Specified',
        status: job.status as 'active' | 'closed' | 'draft' || 'active',
        savedDate: job.savedDate || new Date().toISOString(),
        isApplied: job.isAppliedCount > 0,
      };
    });
    console.log(`[getSavedJobs] Found ${formattedSavedJobs.length} saved jobs for user ID: ${jobSeekerUserId}`);
    return { success: true, data: formattedSavedJobs };
  } catch (e: any)
    {
    console.error(`[getSavedJobs] Error fetching saved jobs for user ID ${jobSeekerUserId}. DB Error:`, (e as Error).message, e);
    return { success: false, error: `Failed to fetch saved jobs. Database error: ${(e as Error).message}` };
  }
}

export interface ProfileActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  validationErrors?: z.ZodIssue[];
  data?: JobSeekerProfileFormData | null;
  newResumeUrl?: string | null; 
}

export async function getJobSeekerProfile(userId: number): Promise<ProfileActionResponse> {
  if (!userId) {
    console.warn("[getJobSeekerProfile] User ID not provided.");
    return { success: false, error: 'User ID not provided.' };
  }
  const dbClient = db as Database;
  console.log(`[getJobSeekerProfile] Fetching profile for user ID: ${userId}`);

  try {
    const userStmt = dbClient.prepare('SELECT email FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { email: string } | undefined;

    if (!user) {
      console.warn(`[getJobSeekerProfile] User not found in users table for ID: ${userId}`);
      return { success: false, error: 'User not found.' };
    }
    console.log(`[getJobSeekerProfile] User email found: ${user.email}`);

    const mainProfileStmt = dbClient.prepare('SELECT * FROM job_seeker_profiles WHERE user_id = ?');
    const mainProfile = mainProfileStmt.get(userId) as any;

    let educationalDetails: EducationDetail[] = [];
    let experienceDetails: ExperienceDetail[] = [];

    if (mainProfile) {
      console.log(`[getJobSeekerProfile] Main profile found for user ID: ${userId}. Profile ID: ${mainProfile.id}. Fetching related details.`);
      const eduStmt = dbClient.prepare('SELECT * FROM education_details WHERE job_seeker_profile_id = ? ORDER BY yearOfCompletion DESC, id DESC');
      educationalDetails = (eduStmt.all(mainProfile.id) as any[]).map(edu => ({
        ...edu,
        id: String(edu.id), // Ensure ID is string for client-side form state
        yearOfCompletion: Number(edu.yearOfCompletion),
        percentageMarks: edu.percentageMarks !== null && edu.percentageMarks !== undefined ? Number(edu.percentageMarks) : null,
      }));

      const expStmt = dbClient.prepare('SELECT * FROM experience_details WHERE job_seeker_profile_id = ? ORDER BY isPresent DESC, endDate DESC, startDate DESC, id DESC');
      experienceDetails = (expStmt.all(mainProfile.id) as any[]).map(exp => ({
        ...exp,
        id: String(exp.id), // Ensure ID is string
        isPresent: Boolean(exp.isPresent),
        aboutCompany: exp.aboutCompany || null,
      }));
      console.log(`[getJobSeekerProfile] Fetched ${educationalDetails.length} education entries and ${experienceDetails.length} experience entries for profile ID ${mainProfile.id}.`);
    } else {
      console.log(`[getJobSeekerProfile] No job_seeker_profiles record found for user ID: ${userId}. Will return initial structure with email.`);
    }

    const initialData = mainProfile || {};
    // Ensure all fields from initialJobSeekerProfileValues are present, falling back to defaults if profile doesn't have them.
    const parsedProfile: JobSeekerProfileFormData = {
      ...initialJobSeekerProfileValues, // Start with full structure
      ...initialData, // Override with fetched data
      id: mainProfile?.id || undefined,
      email: user.email,
      dateOfBirth: initialData.dateOfBirth && isValidDate(parseISO(initialData.dateOfBirth)) ? format(parseISO(initialData.dateOfBirth), 'yyyy-MM-dd') : null,
      skills: initialData.skills ? JSON.parse(initialData.skills) : [],
      preferredLocations: initialData.preferredLocations ? JSON.parse(initialData.preferredLocations) : [],
      educationalDetails: educationalDetails, // Already mapped
      experienceDetails: experienceDetails,   // Already mapped
      // professionalSummary and linkedinProfileUrl are removed
    };
    console.log(`[getJobSeekerProfile] Profile for user ${userId} processed successfully.`);
    return {
        success: true,
        data: parsedProfile,
        message: mainProfile ? undefined : 'No profile found. You can create one now.'
    };

  } catch (e: any) {
    console.error(`[getJobSeekerProfile] Error fetching job seeker profile for user ID ${userId}:`, e);
    return { success: false, error: `Failed to fetch job seeker profile. DB Error: ${(e as Error).message}` };
  }
}

export async function saveJobSeekerProfile(userId: number, data: JobSeekerProfileFormData): Promise<ProfileActionResponse> {
  if (!userId) {
    return { success: false, error: 'User ID not provided.' };
  }
  console.log(`[saveJobSeekerProfile] Attempting to save profile for user ID: ${userId}.`);

  const validation = validateJobSeekerProfileData(data); // Use the wrapper function from profile-schema
  if (!validation.success) {
    console.warn(`[saveJobSeekerProfile] Validation failed for user ID ${userId}:`, JSON.stringify(validation.error.flatten()));
    return { success: false, error: "Invalid profile data.", validationErrors: validation.error.errors };
  }

  const validatedData = validation.data;
  const dbClient = db as Database;

  try {
    dbClient.exec('BEGIN');
    console.log(`[saveJobSeekerProfile] Transaction started for user ID: ${userId}`);

    const mainProfileData = {
      user_id: userId,
      fullName: validatedData.fullName || null,
      phoneNumber: validatedData.phoneNumber || null,
      profilePictureUrl: validatedData.profilePictureUrl || null,
      resumeUrl: validatedData.resumeUrl || null,
      gender: validatedData.gender || null,
      maritalStatus: validatedData.maritalStatus || null,
      dateOfBirth: validatedData.dateOfBirth && isValidDate(parseISO(validatedData.dateOfBirth)) ? format(parseISO(validatedData.dateOfBirth), 'yyyy-MM-dd') : null,
      currentAddress: validatedData.currentAddress || null,
      currentCity: validatedData.currentCity || null,
      currentPinCode: validatedData.currentPinCode || null,
      correspondenceAddress: validatedData.correspondenceAddress || null,
      correspondenceCity: validatedData.correspondenceCity || null,
      correspondencePinCode: validatedData.correspondencePinCode || null,
      currentDesignation: validatedData.currentDesignation || null,
      currentDepartment: validatedData.currentDepartment || null,
      currentIndustry: validatedData.currentIndustry || null,
      currentIndustryType: (validatedData.currentIndustryType === 'Other' && validatedData.otherCurrentIndustryType) ? validatedData.otherCurrentIndustryType : (validatedData.currentIndustryType || null),
      otherCurrentIndustryType: validatedData.otherCurrentIndustryType || null,
      preferredLocations: JSON.stringify(validatedData.preferredLocations || []),
      totalExperience: validatedData.totalExperience === undefined || validatedData.totalExperience === null ? null : Number(validatedData.totalExperience),
      presentSalary: validatedData.presentSalary || null,
      skills: JSON.stringify(validatedData.skills || []),
      portfolioUrl: validatedData.portfolioUrl || null,
      githubProfileUrl: validatedData.githubProfileUrl || null,
      otherSocialLinks: validatedData.otherSocialLinks || null,
      // professionalSummary and linkedinProfileUrl removed from here
    };

    const existingProfileStmt = dbClient.prepare('SELECT id FROM job_seeker_profiles WHERE user_id = ?');
    let profileRow = existingProfileStmt.get(userId) as { id: number } | undefined;
    let jobSeekerProfileId: number;

    if (profileRow) {
      jobSeekerProfileId = profileRow.id;
      console.log(`[saveJobSeekerProfile] Updating existing job_seeker_profiles record ID: ${jobSeekerProfileId} for user_id: ${userId}`);
      const updateMainProfileStmt = dbClient.prepare(
        `UPDATE job_seeker_profiles SET
          fullName = @fullName, phoneNumber = @phoneNumber, profilePictureUrl = @profilePictureUrl, resumeUrl = @resumeUrl,
          gender = @gender, maritalStatus = @maritalStatus, dateOfBirth = @dateOfBirth,
          currentAddress = @currentAddress, currentCity = @currentCity, currentPinCode = @currentPinCode,
          correspondenceAddress = @correspondenceAddress, correspondenceCity = @correspondenceCity, correspondencePinCode = @correspondencePinCode,
          currentDesignation = @currentDesignation, currentDepartment = @currentDepartment,
          currentIndustry = @currentIndustry, currentIndustryType = @currentIndustryType, otherCurrentIndustryType = @otherCurrentIndustryType,
          preferredLocations = @preferredLocations, totalExperience = @totalExperience, presentSalary = @presentSalary,
          skills = @skills, portfolioUrl = @portfolioUrl, githubProfileUrl = @githubProfileUrl, otherSocialLinks = @otherSocialLinks,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = @id`
      );
      updateMainProfileStmt.run({ ...mainProfileData, id: jobSeekerProfileId });
    } else {
      console.log(`[saveJobSeekerProfile] Inserting new job_seeker_profiles record for user_id: ${userId}`);
      const insertMainProfileStmt = dbClient.prepare(
        `INSERT INTO job_seeker_profiles (
          user_id, fullName, phoneNumber, profilePictureUrl, resumeUrl, gender, maritalStatus, dateOfBirth,
          currentAddress, currentCity, currentPinCode, correspondenceAddress, correspondenceCity, correspondencePinCode,
          currentDesignation, currentDepartment, currentIndustry, currentIndustryType, otherCurrentIndustryType,
          preferredLocations, totalExperience, presentSalary, skills, portfolioUrl, githubProfileUrl, otherSocialLinks,
          createdAt, updatedAt
        ) VALUES (
          @user_id, @fullName, @phoneNumber, @profilePictureUrl, @resumeUrl, @gender, @maritalStatus, @dateOfBirth,
          @currentAddress, @currentCity, @currentPinCode, @correspondenceAddress, @correspondenceCity, @correspondencePinCode,
          @currentDesignation, @currentDepartment, @currentIndustry, @currentIndustryType, @otherCurrentIndustryType,
          @preferredLocations, @totalExperience, @presentSalary, @skills, @portfolioUrl, @githubProfileUrl, @otherSocialLinks,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`
      );
      const info = insertMainProfileStmt.run(mainProfileData);
      jobSeekerProfileId = Number(info.lastInsertRowid);
      console.log(`[saveJobSeekerProfile] New job_seeker_profiles record created with ID: ${jobSeekerProfileId} for user_id: ${userId}`);
    }

    console.log(`[saveJobSeekerProfile] Deleting old education_details for profile ID: ${jobSeekerProfileId}`);
    const deleteEduStmt = dbClient.prepare('DELETE FROM education_details WHERE job_seeker_profile_id = ?');
    deleteEduStmt.run(jobSeekerProfileId);

    const insertEduStmt = dbClient.prepare(
      `INSERT INTO education_details (job_seeker_profile_id, qualification, stream, institution, yearOfCompletion, percentageMarks)
       VALUES (@job_seeker_profile_id, @qualification, @stream, @institution, @yearOfCompletion, @percentageMarks)`
    );
    (validatedData.educationalDetails || []).forEach(edu => {
      insertEduStmt.run({
        job_seeker_profile_id: jobSeekerProfileId,
        qualification: edu.qualification,
        stream: edu.stream,
        institution: edu.institution,
        yearOfCompletion: Number(edu.yearOfCompletion),
        percentageMarks: edu.percentageMarks === undefined || edu.percentageMarks === null ? null : Number(edu.percentageMarks)
      });
    });
    console.log(`[saveJobSeekerProfile] Inserted ${validatedData.educationalDetails?.length || 0} new education_details for profile ID: ${jobSeekerProfileId}`);

    console.log(`[saveJobSeekerProfile] Deleting old experience_details for profile ID: ${jobSeekerProfileId}`);
    const deleteExpStmt = dbClient.prepare('DELETE FROM experience_details WHERE job_seeker_profile_id = ?');
    deleteExpStmt.run(jobSeekerProfileId);

    const insertExpStmt = dbClient.prepare(
      `INSERT INTO experience_details (job_seeker_profile_id, companyName, designation, aboutCompany, startDate, endDate, isPresent, responsibilities)
       VALUES (@job_seeker_profile_id, @companyName, @designation, @aboutCompany, @startDate, @endDate, @isPresent, @responsibilities)`
    );
    (validatedData.experienceDetails || []).forEach(exp => {
      insertExpStmt.run({
        job_seeker_profile_id: jobSeekerProfileId,
        companyName: exp.companyName,
        designation: exp.designation,
        aboutCompany: exp.aboutCompany || null,
        startDate: exp.startDate, // Stored as MM-YYYY string
        endDate: exp.isPresent ? null : (exp.endDate || null), // Stored as MM-YYYY string or null
        isPresent: exp.isPresent ? 1 : 0,
        responsibilities: exp.responsibilities || null
      });
    });
    console.log(`[saveJobSeekerProfile] Inserted ${validatedData.experienceDetails?.length || 0} new experience_details for profile ID: ${jobSeekerProfileId}`);

    dbClient.exec('COMMIT');
    console.log(`[saveJobSeekerProfile] Transaction committed successfully for user ID: ${userId}`);
    return { success: true, message: 'Profile saved successfully.' };
  } catch (e: any) {
    if (dbClient.inTransaction) {
      dbClient.exec('ROLLBACK');
      console.error(`[saveJobSeekerProfile] Transaction rolled back due to error for user ID ${userId}:`, e);
    } else {
      console.error(`[saveJobSeekerProfile] Error saving job seeker profile for user ID ${userId} (outside transaction or before it started):`, e);
    }
    return { success: false, error: `Failed to save profile. DB Error: ${(e as Error).message}` };
  }
}

export async function updateProfileResumeAction(userId: number, newResumeDataUri: string | null): Promise<ProfileActionResponse> {
    if (!userId) {
      return { success: false, error: "User not authenticated." };
    }
    console.log(`[updateProfileResumeAction] Updating resume for user ID: ${userId}`);

    if (newResumeDataUri) {
        const validation = urlOrDataUriSchema.safeParse(newResumeDataUri);
        if (!validation.success ) {
            console.warn(`[updateProfileResumeAction] Invalid resume format for user ID: ${userId}. Validation error:`, validation.error.flatten());
            return { success: false, error: "Invalid resume file format or URL. Only PDF Data URIs (max 500KB) or valid URLs are allowed." };
        }
    }
    
    const dbClient = db as Database;
    try {
        let profileStmt = dbClient.prepare('SELECT id FROM job_seeker_profiles WHERE user_id = ?');
        let profile = profileStmt.get(userId) as { id: number } | undefined;

        if (!profile) {
            console.log(`[updateProfileResumeAction] No profile found for user ID: ${userId}. Creating basic profile.`);
            const createProfileStmt = dbClient.prepare(
                'INSERT INTO job_seeker_profiles (user_id, resumeUrl, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
            );
            createProfileStmt.run(userId, newResumeDataUri);
            console.log(`[updateProfileResumeAction] Basic profile created and resume updated for user ID: ${userId}`);
            return { success: true, message: "Profile resume updated (new profile created).", newResumeUrl: newResumeDataUri };
        } else {
            const stmt = dbClient.prepare(
                'UPDATE job_seeker_profiles SET resumeUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE user_id = ?'
            );
            const info = stmt.run(newResumeDataUri, userId);

            if (info.changes > 0) {
                console.log(`[updateProfileResumeAction] Resume updated successfully for user ID: ${userId}`);
                return { success: true, message: "Profile resume updated.", newResumeUrl: newResumeDataUri };
            } else {
                console.warn(`[updateProfileResumeAction] No rows affected when updating resume for user ID: ${userId}. Resume URL might be the same or profile not found (though checked).`);
                return { success: true, message: "Resume is already up to date or no change was made.", newResumeUrl: newResumeDataUri };
            }
        }
    } catch (e: any) {
        console.error(`[updateProfileResumeAction] DB Error updating resume for user ID ${userId}:`, e);
        return { success: false, error: `An unexpected database error occurred: ${(e as Error).message}` };
    }
}

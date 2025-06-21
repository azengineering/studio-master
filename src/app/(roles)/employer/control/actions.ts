
// src/app/(roles)/employer/control/actions.ts
'use server';

import { z } from 'zod';
import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import { employerProfileSchema, type EmployerProfileFormData } from './profile-schema';
import type { DateRange } from 'react-day-picker';
import { subDays, formatISO, parseISO, format, eachDayOfInterval, compareAsc, startOfDay, endOfDay } from 'date-fns';
import type { ApplicationStatus, JobStatus } from '../../dashboard/types'; // Import ApplicationStatus & JobStatus

export interface ProfileActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  validationErrors?: z.ZodIssue[];
  data?: EmployerProfileFormData | null;
}


export async function getEmployerProfile(userId: number): Promise<ProfileActionResponse> {
  if (!userId) {
    return { success: false, error: 'User ID not provided. Please log in to manage your profile.' };
  }
  const dbClient = db as Database;
  try {
    const stmt = dbClient.prepare('SELECT * FROM employer_profiles WHERE user_id = ?');
    const profile = stmt.get(userId) as any; 

    if (profile) {
      // Ensure numeric fields from DB are correctly typed, and nulls are handled
      const parsedProfile: EmployerProfileFormData = {
        ...profile,
        id: profile.id, 
        companyLogoUrl: profile.companyLogoUrl || '',
        teamSize: profile.teamSize !== null && profile.teamSize !== undefined ? Number(profile.teamSize) : null,
        yearOfEstablishment: profile.yearOfEstablishment !== null && profile.yearOfEstablishment !== undefined ? Number(profile.yearOfEstablishment) : null,
        linkedinUrl: profile.linkedinUrl || '',
        xUrl: profile.xUrl || '',
        // Ensure all other optional string fields default to '' if null from DB
        address: profile.address || '',
        contactNumber: profile.contactNumber || '',
        companyWebsite: profile.companyWebsite || '',
        aboutCompany: profile.aboutCompany || '',
      };
      return { success: true, data: parsedProfile };
    }
    // If no profile for this user (e.g., if signup process was interrupted or profile creation failed), 
    // return structure indicating no profile. The frontend can then prompt for creation.
    // This case should be less common if signup correctly creates a default profile.
    return { success: true, data: null, message: 'No profile found for this user. You can create or complete one now.' };
  } catch (e: any) {
    console.error('Error fetching employer profile:', e);
    return { error: 'Failed to fetch employer profile.' };
  }
}

export async function saveEmployerProfile(userId: number, data: EmployerProfileFormData): Promise<ProfileActionResponse> {
  if (!userId) {
    return { success: false, error: 'User ID not provided. Cannot save profile.' };
  }

  const validation = employerProfileSchema.safeParse(data);
  if (!validation.success) {
    return { error: "Invalid profile data.", validationErrors: validation.error.errors };
  }

  const {
    companyLogoUrl,
    companyName,
    address,
    officialEmail,
    contactNumber,
    companyWebsite,
    teamSize,
    yearOfEstablishment,
    aboutCompany,
    linkedinUrl,
    xUrl,
  } = validation.data;

  const dbClient = db as Database;

  try {
    // Profile is always associated with user_id.
    // Signup creates a default profile, so this should mostly be an UPDATE.
    // Using INSERT OR REPLACE (UPSERT) simplifies logic if a profile row might not exist.
    // Alternatively, check existence then INSERT/UPDATE.
    // For robust handling, let's ensure profile exists with user_id before updating.
    
    const existingProfileStmt = dbClient.prepare('SELECT id FROM employer_profiles WHERE user_id = ?');
    const existingProfile = existingProfileStmt.get(userId) as { id: number } | undefined;

    if (existingProfile) {
      // Update existing profile
      const stmt = dbClient.prepare(`
        UPDATE employer_profiles SET
          companyLogoUrl = @companyLogoUrl,
          companyName = @companyName,
          address = @address,
          officialEmail = @officialEmail,
          contactNumber = @contactNumber,
          companyWebsite = @companyWebsite,
          teamSize = @teamSize,
          yearOfEstablishment = @yearOfEstablishment,
          aboutCompany = @aboutCompany,
          linkedinUrl = @linkedinUrl,
          xUrl = @xUrl,
          updatedAt = CURRENT_TIMESTAMP
        WHERE user_id = @user_id
      `);
      
      stmt.run({
        user_id: userId,
        companyLogoUrl: companyLogoUrl || null,
        companyName,
        address: address || null,
        officialEmail, // Assuming this is validated and required
        contactNumber: contactNumber || null,
        companyWebsite: companyWebsite || null,
        teamSize: (teamSize === undefined || teamSize === null || teamSize === 0) ? null : teamSize,
        yearOfEstablishment: (yearOfEstablishment === undefined || yearOfEstablishment === null || yearOfEstablishment === 0) ? null : yearOfEstablishment,
        aboutCompany: aboutCompany || null,
        linkedinUrl: linkedinUrl || null,
        xUrl: xUrl || null,
      });
      return { success: true, message: 'Company profile updated successfully.' };
    } else {
      // This case should be rare if signup correctly creates a profile.
      // If it occurs, it means there's no profile record for this user_id.
      // We could insert one, but it indicates a potential issue in the signup flow.
      console.warn(`Attempted to save profile for user ID ${userId}, but no existing profile found. This might indicate an issue with the signup process.`);
      // For now, let's attempt an insert if no profile exists.
      const stmt = dbClient.prepare(`
        INSERT INTO employer_profiles (
          user_id, companyLogoUrl, companyName, address, officialEmail, contactNumber, 
          companyWebsite, teamSize, yearOfEstablishment, aboutCompany, linkedinUrl, xUrl,
          createdAt, updatedAt
        ) VALUES (
          @user_id, @companyLogoUrl, @companyName, @address, @officialEmail, @contactNumber,
          @companyWebsite, @teamSize, @yearOfEstablishment, @aboutCompany, @linkedinUrl, @xUrl,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `);
      stmt.run({
        user_id: userId,
        companyLogoUrl: companyLogoUrl || null,
        companyName,
        address: address || null,
        officialEmail,
        contactNumber: contactNumber || null,
        companyWebsite: companyWebsite || null,
        teamSize: (teamSize === undefined || teamSize === null || teamSize === 0) ? null : teamSize,
        yearOfEstablishment: (yearOfEstablishment === undefined || yearOfEstablishment === null || yearOfEstablishment === 0) ? null : yearOfEstablishment,
        aboutCompany: aboutCompany || null,
        linkedinUrl: linkedinUrl || null,
        xUrl: xUrl || null,
      });
      return { success: true, message: 'Company profile created successfully.' };
    }
  } catch (e: any) {
    console.error('Error saving employer profile:', e);
    if ((e as any).code === 'SQLITE_CONSTRAINT_UNIQUE' && (e as any).message.includes('employer_profiles.officialEmail')) {
        return { error: 'This email address is already in use by another company profile.' };
    }
     if ((e as any).code === 'SQLITE_CONSTRAINT_UNIQUE' && (e as any).message.includes('employer_profiles.user_id')) {
        // This error suggests trying to INSERT a profile for a user_id that already has one,
        // or an UPDATE failed due to some other constraint violation.
        return { error: 'A profile for this user ID already exists or another constraint was violated. Update failed.' };
    }
    return { error: (e as Error).message || 'An unexpected error occurred while saving the profile.' };
  }
}


// --- Analytics Data ---
export interface EmployerAnalyticsKeyMetrics {
  totalActiveJobs: number;
  totalJobsEverPosted: number; // New
  totalApplicationsEverReceived: number; // New
  applicationsInPeriod?: number;
}

export interface ApplicationTrendDataPoint {
  date: string; // e.g., 'MMM d'
  count: number;
}

export interface ApplicationFunnelDataPoint {
  stage: string;
  count: number;
  fill?: string; // Optional fill color for chart
}

export interface TopPerformingJobDataPoint {
  id: number;
  title: string;
  applications: number;
  hired: number;
  status: JobStatus;
}


export async function getEmployerAnalyticsKeyMetrics(
  employerUserId: number,
  dateRange?: DateRange
): Promise<{ success: boolean; data?: EmployerAnalyticsKeyMetrics; error?: string }> {
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  try {
    const activeJobsStmt = dbClient.prepare(
      "SELECT COUNT(*) as count FROM jobs WHERE employer_user_id = ? AND status = 'active'"
    );
    const activeJobsResult = activeJobsStmt.get(employerUserId) as { count: number };
    const totalActiveJobs = activeJobsResult.count;

    const totalJobsEverPostedStmt = dbClient.prepare(
      "SELECT COUNT(*) as count FROM jobs WHERE employer_user_id = ?"
    );
    const totalJobsEverPostedResult = totalJobsEverPostedStmt.get(employerUserId) as { count: number };
    const totalJobsEverPosted = totalJobsEverPostedResult.count;
    
    const totalApplicationsEverReceivedStmt = dbClient.prepare(`
      SELECT COUNT(ja.id) as count
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE j.employer_user_id = ?
    `);
    const totalApplicationsEverReceivedResult = totalApplicationsEverReceivedStmt.get(employerUserId) as { count: number };
    const totalApplicationsEverReceived = totalApplicationsEverReceivedResult.count;


    let applicationsInPeriod: number | undefined;

    if (dateRange?.from && dateRange?.to) {
      const fromISO = formatISO(startOfDay(dateRange.from));
      const toISO = formatISO(endOfDay(dateRange.to));
      
      const applicationsInPeriodStmt = dbClient.prepare(`
        SELECT COUNT(ja.id) as count
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE j.employer_user_id = ? AND ja.applicationDate >= ? AND ja.applicationDate <= ?
      `);
      const applicationsResult = applicationsInPeriodStmt.get(employerUserId, fromISO, toISO) as { count: number };
      applicationsInPeriod = applicationsResult.count;
    }

    return {
      success: true,
      data: {
        totalActiveJobs,
        totalJobsEverPosted,
        totalApplicationsEverReceived,
        applicationsInPeriod,
      },
    };
  } catch (e: any) {
    console.error('[getEmployerAnalyticsKeyMetrics] Error fetching analytics data:', e);
    return { success: false, error: `Failed to fetch analytics data. DB Error: ${e.message}` };
  }
}


export async function getEmployerApplicationsTrend(
  employerUserId: number,
  dateRange?: DateRange
): Promise<{ success: boolean; data?: ApplicationTrendDataPoint[]; error?: string }> {
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;

  let fromDate: Date;
  let toDate: Date;

  if (dateRange?.from && dateRange?.to) {
    fromDate = startOfDay(dateRange.from);
    toDate = endOfDay(dateRange.to);
  } else {
    // Default to last 30 days if no range is provided
    toDate = endOfDay(new Date());
    fromDate = startOfDay(subDays(toDate, 29));
  }
  
  // Ensure 'from' is not after 'to'
  if (compareAsc(fromDate, toDate) > 0) {
    return { success: false, error: "Invalid date range: 'from' date cannot be after 'to' date." };
  }

  const fromISO = formatISO(fromDate);
  const toISO = formatISO(toDate);

  try {
    const stmt = dbClient.prepare(`
      SELECT
        STRFTIME('%Y-%m-%d', ja.applicationDate) as app_date_full,
        COUNT(ja.id) as count
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE j.employer_user_id = ?
        AND ja.applicationDate >= ?
        AND ja.applicationDate <= ?
      GROUP BY app_date_full
      ORDER BY app_date_full ASC
    `);
    const results = stmt.all(employerUserId, fromISO, toISO) as { app_date_full: string; count: number }[];

    // Create a map of all dates in the range, initialized to 0 applications
    const allDatesInRange = eachDayOfInterval({ start: fromDate, end: toDate });
    const trendDataMap = new Map<string, number>();
    allDatesInRange.forEach(date => {
      trendDataMap.set(format(date, 'yyyy-MM-dd'), 0);
    });

    // Populate the map with actual counts from the database
    results.forEach(row => {
      trendDataMap.set(row.app_date_full, row.count);
    });
    
    // Convert map to array and format date for chart
    const formattedTrendData: ApplicationTrendDataPoint[] = [];
    trendDataMap.forEach((count, dateStr) => {
      formattedTrendData.push({
        date: format(parseISO(dateStr), 'MMM d'), // Format for display
        count: count,
      });
    });
    
    return { success: true, data: formattedTrendData };
  } catch (e: any) {
    console.error('[getEmployerApplicationsTrend] Error fetching applications trend:', e);
    return { success: false, error: `Failed to fetch applications trend. DB Error: ${e.message}` };
  }
}


export async function getEmployerApplicationFunnel(
  employerUserId: number,
  dateRange?: DateRange
): Promise<{ success: boolean; data?: ApplicationFunnelDataPoint[]; error?: string }> {
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;

  let fromDate: Date;
  let toDate: Date;

  if (dateRange?.from && dateRange?.to) {
    fromDate = startOfDay(dateRange.from);
    toDate = endOfDay(dateRange.to);
  } else {
    toDate = endOfDay(new Date());
    fromDate = startOfDay(subDays(toDate, 29)); // Default to last 30 days
  }

  const fromISO = formatISO(fromDate);
  const toISO = formatISO(toDate);

  try {
    const funnelStages: Array<{ name: string; statuses: ApplicationStatus[] }> = [
      { name: 'Applied', statuses: ['submitted', 'viewed', 'shortlisted', 'interviewing', 'hired', 'rejected', 'declined'] }, // All applications in period
      { name: 'Reviewed', statuses: ['viewed', 'shortlisted', 'interviewing', 'hired'] },
      { name: 'Shortlisted', statuses: ['shortlisted', 'interviewing', 'hired'] },
      { name: 'Interviewing', statuses: ['interviewing', 'hired'] },
      { name: 'Hired', statuses: ['hired'] },
    ];

    const funnelData: ApplicationFunnelDataPoint[] = [];

    for (const stage of funnelStages) {
      let count = 0;
      if (stage.name === 'Applied') {
        const stmt = dbClient.prepare(`
          SELECT COUNT(ja.id) as count
          FROM job_applications ja
          JOIN jobs j ON ja.job_id = j.id
          WHERE j.employer_user_id = ? AND ja.applicationDate >= ? AND ja.applicationDate <= ?
        `);
        const result = stmt.get(employerUserId, fromISO, toISO) as { count: number };
        count = result.count;
      } else {
        const placeholders = stage.statuses.map(() => '?').join(',');
        const stmt = dbClient.prepare(`
          SELECT COUNT(DISTINCT ja.id) as count 
          FROM job_applications ja
          JOIN jobs j ON ja.job_id = j.id
          WHERE j.employer_user_id = ? 
            AND ja.applicationDate >= ? 
            AND ja.applicationDate <= ?
            AND ja.status IN (${placeholders})
        `);
        const result = stmt.get(employerUserId, fromISO, toISO, ...stage.statuses) as { count: number };
        count = result.count;
      }
      funnelData.push({ stage: stage.name, count });
    }
    console.log(`[getEmployerApplicationFunnel] Funnel data for user ${employerUserId}:`, JSON.stringify(funnelData));
    return { success: true, data: funnelData };

  } catch (e: any) {
    console.error('[getEmployerApplicationFunnel] Error fetching application funnel:', e);
    return { success: false, error: `Failed to fetch application funnel. DB Error: ${e.message}` };
  }
}

export async function getTopPerformingJobsAnalytics(
  employerUserId: number,
  dateRange?: DateRange
): Promise<{ success: boolean; data?: TopPerformingJobDataPoint[]; error?: string }> {
  if (!employerUserId) {
    return { success: false, error: 'User not authenticated.' };
  }
  const dbClient = db as Database;
  
  let fromISO: string | null = null;
  let toISO: string | null = null;

  if (dateRange?.from && dateRange?.to) {
    fromISO = formatISO(startOfDay(dateRange.from));
    toISO = formatISO(endOfDay(dateRange.to));
  }

  try {
    // Base query to get jobs and their status
    let query = `
      SELECT
        j.id,
        j.jobTitle as title,
        j.status
    `;
    
    // Subquery for total applications
    query += `
      , ( SELECT COUNT(ja.id)
          FROM job_applications ja
          WHERE ja.job_id = j.id
          ${fromISO && toISO ? 'AND ja.applicationDate >= ? AND ja.applicationDate <= ?' : ''}
        ) as applications
    `;
    
    // Subquery for hired applications
    query += `
      , ( SELECT COUNT(jah.id)
          FROM job_applications jah
          WHERE jah.job_id = j.id AND jah.status = 'hired'
          ${fromISO && toISO ? 'AND jah.applicationDate >= ? AND jah.applicationDate <= ?' : ''}
        ) as hired
    `;
    
    query += `
      FROM jobs j
      WHERE j.employer_user_id = ?
      ORDER BY applications DESC, hired DESC, j.createdAt DESC
      LIMIT 10
    `;
    
    const params: (string | number)[] = [];
    if (fromISO && toISO) {
      params.push(fromISO, toISO); // For total applications subquery
      params.push(fromISO, toISO); // For hired applications subquery
    }
    params.push(employerUserId);

    const topJobs = dbClient.prepare(query).all(...params) as TopPerformingJobDataPoint[];
    
    return { success: true, data: topJobs };

  } catch (e: any) {
    console.error('[getTopPerformingJobsAnalytics] Error fetching top performing jobs:', e);
    return { success: false, error: `Failed to fetch top jobs data. DB Error: ${e.message}` };
  }
}
    

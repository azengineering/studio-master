
// src/app/(admin)/admin-panel/actions.ts
'use server';

import db from '@/lib/db';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';

interface AdminDashboardStats {
  totalUsers: number;
  totalEmployers: number;
  totalJobSeekers: number;
  activeJobPostings: number;
  totalApplicationsReceived: number;
  totalSavedJobs: number;
  usersRegisteredInPeriod?: number;
  jobsPostedInPeriod?: number;
  applicationsReceivedInPeriod?: number;
  savedJobsInPeriod?: number;
}

const DateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
}).optional();

export async function getAdminDashboardStats(dateRange?: { from?: Date, to?: Date }): Promise<AdminDashboardStats> {
  const dbClient = db as Database;
  try {
    const totalUsersStmt = dbClient.prepare('SELECT COUNT(*) as count FROM users');
    const totalEmployersStmt = dbClient.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'");
    const totalJobSeekersStmt = dbClient.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'jobSeeker'");
    const activeJobPostingsStmt = dbClient.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'posted'");
    const totalApplicationsStmt = dbClient.prepare('SELECT COUNT(*) as count FROM job_applications');
    const totalSavedJobsStmt = dbClient.prepare('SELECT COUNT(*) as count FROM saved_jobs');

    const totalUsers = (totalUsersStmt.get() as { count: number }).count;
    const totalEmployers = (totalEmployersStmt.get() as { count: number }).count;
    const totalJobSeekers = (totalJobSeekersStmt.get() as { count: number }).count;
    const activeJobPostings = (activeJobPostingsStmt.get() as { count: number }).count;
    const totalApplicationsReceived = (totalApplicationsStmt.get() as { count: number }).count;
    const totalSavedJobs = (totalSavedJobsStmt.get() as { count: number }).count;

    let usersRegisteredInPeriod: number | undefined;
    let jobsPostedInPeriod: number | undefined;
    let applicationsReceivedInPeriod: number | undefined;
    let savedJobsInPeriod: number | undefined;

    if (dateRange?.from && dateRange?.to) {
      const usersRegisteredStmt = dbClient.prepare('SELECT COUNT(*) as count FROM users WHERE createdAt >= ? AND createdAt <= ?');
      usersRegisteredInPeriod = (usersRegisteredStmt.get(dateRange.from.toISOString(), dateRange.to.toISOString()) as { count: number }).count;

      const jobsPostedStmt = dbClient.prepare('SELECT COUNT(*) as count FROM jobs WHERE createdAt >= ? AND createdAt <= ?');
      jobsPostedInPeriod = (jobsPostedStmt.get(dateRange.from.toISOString(), dateRange.to.toISOString()) as { count: number }).count;

      const applicationsReceivedStmt = dbClient.prepare('SELECT COUNT(*) as count FROM job_applications WHERE applicationDate >= ? AND applicationDate <= ?');
      applicationsReceivedInPeriod = (applicationsReceivedStmt.get(dateRange.from.toISOString(), dateRange.to.toISOString()) as { count: number }).count;
      
      const savedJobsStmt = dbClient.prepare('SELECT COUNT(*) as count FROM saved_jobs WHERE savedDate >= ? AND savedDate <= ?');
      savedJobsInPeriod = (savedJobsStmt.get(dateRange.from.toISOString(), dateRange.to.toISOString()) as { count: number }).count;
    }

    return {
      totalUsers,
      totalEmployers,
      totalJobSeekers,
      activeJobPostings,
      totalApplicationsReceived,
      totalSavedJobs,
      usersRegisteredInPeriod,
      jobsPostedInPeriod,
      applicationsReceivedInPeriod,
      savedJobsInPeriod,
    };
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    throw new Error("Failed to load dashboard statistics.");
  }
}

// --- Employer Data ---
interface EmployerJobSummary {
  id: number;
  jobTitle: string;
  status: string;
  createdAt: string;
}
export interface EmployerAdminView {
  userId: number;
  email: string;
  companyName: string | null;
  officialEmail: string | null;
  jobs: EmployerJobSummary[];
  profileId: number | null;
  userCreatedAt: string;
}

export type EmployerSearchType = 'email' | 'userId' | 'companyName';

export async function searchEmployersAdminView(
  searchType: EmployerSearchType,
  searchTerm: string
): Promise<EmployerAdminView[]> {
  const dbClient = db as Database;
  console.log(`[AdminActions] Searching employers: type=${searchType}, term=${searchTerm}`);
  if (!searchTerm || !searchTerm.trim()) {
    console.log('[AdminActions] Search term is empty, returning no results.');
    return [];
  }

  let query = `
    SELECT
      u.id as userId,
      u.email,
      u.createdAt as userCreatedAt,
      ep.id as profileId,
      ep.companyName,
      ep.officialEmail
    FROM users u
    LEFT JOIN employer_profiles ep ON u.id = ep.user_id
    WHERE u.role = 'employer'
  `;
  const params: (string | number)[] = [];

  switch (searchType) {
    case 'email':
      query += ` AND u.email LIKE ?`;
      params.push(`%${searchTerm}%`);
      break;
    case 'userId':
      const numericUserId = parseInt(searchTerm, 10);
      if (isNaN(numericUserId)) {
        console.log('[AdminActions] Invalid User ID format for search.');
        return [];
      }
      query += ` AND u.id = ?`;
      params.push(numericUserId);
      break;
    case 'companyName':
      query += ` AND ep.companyName LIKE ?`;
      params.push(`%${searchTerm}%`);
      break;
    default:
      console.log('[AdminActions] Invalid search type.');
      return [];
  }
  query += ` ORDER BY u.createdAt DESC`;

  try {
    const employersRaw = dbClient.prepare(query).all(...params) as any[];
    console.log(`[AdminActions] Found ${employersRaw.length} raw employer records matching search.`);

    const result: EmployerAdminView[] = [];
    for (const emp of employersRaw) {
      let jobs: EmployerJobSummary[] = [];
      try {
        jobs = dbClient.prepare(`
          SELECT id, jobTitle, status, createdAt
          FROM jobs
          WHERE employer_user_id = ?
          ORDER BY createdAt DESC
          LIMIT 10
        `).all(emp.userId) as EmployerJobSummary[];
      } catch (jobError) {
        console.error(`[AdminActions] Error fetching jobs for employer userId=${emp.userId}:`, jobError);
      }
      result.push({ ...emp, jobs });
    }
    console.log('[AdminActions] Successfully processed search results for employers.');
    return result;
  } catch (error) {
    console.error("[AdminActions] Error searching employers for admin view:", error);
    throw new Error("Failed to search employer data.");
  }
}

// --- JobSeeker Data ---
interface JobSeekerApplicationSummary {
  applicationId: number;
  jobTitle: string;
  companyName: string;
  applicationDate: string;
  applicationStatus: string;
}

interface JobSeekerSavedJobSummary {
  jobId: number;
  jobTitle: string;
  companyName: string;
  savedDate: string;
}

export interface JobSeekerAdminView {
  userId: number;
  email: string;
  fullName: string | null;
  profileId: number | null;
  userCreatedAt: string;
  applications: JobSeekerApplicationSummary[];
  savedJobs: JobSeekerSavedJobSummary[];
  phoneNumber?: string | null; // Added for searchability
}

export type JobSeekerSearchType = 'email' | 'userId' | 'fullName' | 'phoneNumber';

export async function searchJobSeekersAdminView(
  searchType: JobSeekerSearchType,
  searchTerm: string
): Promise<JobSeekerAdminView[]> {
  const dbClient = db as Database;
  console.log(`[AdminActions] Searching job seekers: type=${searchType}, term=${searchTerm}`);
   if (!searchTerm || !searchTerm.trim()) {
    console.log('[AdminActions] Search term is empty, returning no results.');
    return [];
  }

  let query = `
    SELECT
      u.id as userId,
      u.email,
      u.createdAt as userCreatedAt,
      jsp.id as profileId,
      jsp.fullName,
      jsp.phoneNumber 
    FROM users u
    LEFT JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
    WHERE u.role = 'jobSeeker'
  `;
  const params: (string | number)[] = [];

  switch (searchType) {
    case 'email':
      query += ` AND u.email LIKE ?`;
      params.push(`%${searchTerm}%`);
      break;
    case 'userId':
      const numericUserId = parseInt(searchTerm, 10);
      if (isNaN(numericUserId)) {
         console.log('[AdminActions] Invalid User ID format for search.');
        return [];
      }
      query += ` AND u.id = ?`;
      params.push(numericUserId);
      break;
    case 'fullName':
      query += ` AND jsp.fullName LIKE ?`;
      params.push(`%${searchTerm}%`);
      break;
    case 'phoneNumber':
      query += ` AND jsp.phoneNumber LIKE ?`;
      params.push(`%${searchTerm}%`);
      break;
    default:
       console.log('[AdminActions] Invalid search type.');
      return [];
  }
  query += ` ORDER BY u.createdAt DESC`;

  try {
    const jobSeekersRaw = dbClient.prepare(query).all(...params) as any[];
    console.log(`[AdminActions] Found ${jobSeekersRaw.length} raw job seeker records matching search.`);

    const result = [];
    for (const js of jobSeekersRaw) {
      const applications = dbClient.prepare(`
        SELECT
          ja.id as applicationId,
          j.jobTitle,
          COALESCE(j.companyName, 'N/A') as companyName,
          ja.applicationDate,
          ja.status as applicationStatus
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.job_seeker_user_id = ?
        ORDER BY ja.applicationDate DESC
        LIMIT 5
      `).all(js.userId) as JobSeekerApplicationSummary[];

      const savedJobs = dbClient.prepare(`
        SELECT
          sj.job_id as jobId,
          j.jobTitle,
          COALESCE(j.companyName, 'N/A') as companyName,
          sj.savedDate
        FROM saved_jobs sj
        JOIN jobs j ON sj.job_id = j.id
        WHERE sj.job_seeker_user_id = ?
        ORDER BY sj.savedDate DESC
        LIMIT 5
      `).all(js.userId) as JobSeekerSavedJobSummary[];
      result.push({ ...js, applications, savedJobs });
    }
    console.log('[AdminActions] Successfully processed search results for job seekers.');
    return result;
  } catch (error) {
    console.error("Error searching job seekers for admin view:", error);
    throw new Error("Failed to search job seeker data.");
  }
}

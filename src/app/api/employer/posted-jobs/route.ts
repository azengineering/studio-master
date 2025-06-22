
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employerUserId = searchParams.get('employerUserId');

    if (!employerUserId) {
      return NextResponse.json({ error: 'Employer user ID is required' }, { status: 400 });
    }

    const jobs = db.prepare(`
      SELECT 
        id,
        jobTitle as title,
        jobDescription as description,
        skillsRequired,
        jobLocation,
        minimumExperience,
        maximumExperience,
        minimumSalary,
        maximumSalary,
        qualification,
        industry,
        companyName,
        createdAt
      FROM jobs
      WHERE employer_user_id = ? AND status IN ('active', 'draft')
      ORDER BY createdAt DESC
      LIMIT 20
    `).all(employerUserId);

    const formattedJobs = jobs.map((job: any) => ({
      id: `job${job.id}`,
      title: job.title,
      description: job.description,
      filters: {
        keywords: job.skillsRequired ? job.skillsRequired.split(',').map((s: string) => s.trim()).slice(0, 5) : [],
        skills: job.skillsRequired ? job.skillsRequired.split(',').map((s: string) => s.trim()) : [],
        designation: job.title,
        minExperience: job.minimumExperience?.toString() || '',
        maxExperience: job.maximumExperience?.toString() || '',
        locations: job.jobLocation ? job.jobLocation.split(',').map((l: string) => l.trim()) : [],
        minSalaryLPA: job.minimumSalary?.toString() || '',
        maxSalaryLPA: job.maximumSalary?.toString() || '',
        qualifications: job.qualification ? job.qualification.split(',').map((q: string) => q.trim()) : [],
        industry: job.industry || '',
        companyName: job.companyName || ''
      }
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error('Error fetching posted jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch posted jobs' }, { status: 500 });
  }
}

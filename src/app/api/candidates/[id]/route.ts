
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;

    // Get basic candidate info
    const candidate = db.prepare(`
      SELECT 
        u.id,
        jsp.fullName as name,
        jsp.currentDesignation as designation,
        jsp.totalExperience as experience,
        jsp.currentCity as location,
        jsp.skills,
        jsp.currentIndustry as industry,
        jsp.presentSalary as salaryLPA,
        jsp.gender,
        jsp.dateOfBirth as dob,
        jsp.profilePictureUrl,
        u.email,
        jsp.phoneNumber as phone,
        jsp.linkedinProfileUrl,
        jsp.currentDepartment as department,
        jsp.currentAddress,
        jsp.correspondenceAddress,
        jsp.maritalStatus,
        jsp.professionalSummary,
        jsp.resumeUrl,
        jsp.preferredLocations,
        jsp.currentIndustryType as industryType
      FROM users u
      JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
      WHERE u.id = ? AND u.role = 'jobSeeker'
    `).get(candidateId);

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Get education details
    const education = db.prepare(`
      SELECT qualification as degree, institution, yearOfCompletion as year
      FROM education_details ed
      JOIN job_seeker_profiles jsp ON ed.job_seeker_profile_id = jsp.id
      WHERE jsp.user_id = ?
      ORDER BY yearOfCompletion DESC
    `).all(candidateId);

    // Get work experience
    const workExperience = db.prepare(`
      SELECT 
        designation as title,
        companyName as company,
        startDate,
        CASE WHEN isPresent = 1 THEN 'Present' ELSE endDate END as endDate,
        responsibilities
      FROM experience_details ed
      JOIN job_seeker_profiles jsp ON ed.job_seeker_profile_id = jsp.id
      WHERE jsp.user_id = ?
      ORDER BY startDate DESC
    `).all(candidateId);

    // Transform work experience
    const transformedWorkExperience = workExperience.map((exp: any) => ({
      title: exp.title,
      company: exp.company,
      startDate: exp.startDate,
      endDate: exp.endDate,
      responsibilities: exp.responsibilities ? exp.responsibilities.split('\n').filter(Boolean) : []
    }));

    // Calculate age
    let age = 30;
    if (candidate.dob) {
      const birthDate = new Date(candidate.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Parse salary
    let salaryLPA = 0;
    if (candidate.salaryLPA) {
      const salaryMatch = candidate.salaryLPA.match(/[\d.]+/);
      if (salaryMatch) {
        salaryLPA = parseFloat(salaryMatch[0]);
      }
    }

    // Parse skills
    let skills: string[] = [];
    if (candidate.skills) {
      const skillsStr = candidate.skills.toString();
      // Remove brackets and quotes, then split
      const cleanStr = skillsStr.replace(/[\[\]"']/g, '').trim();
      skills = cleanStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Parse preferred locations
    let preferredLocations: string[] = [];
    if (candidate.preferredLocations) {
      const locStr = candidate.preferredLocations.toString();
      // Remove brackets and quotes, then split
      const cleanStr = locStr.replace(/[\[\]"']/g, '').trim();
      preferredLocations = cleanStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Get qualifications from education
    const qualifications = education.map((ed: any) => ed.degree);

    const transformedCandidate = {
      id: candidate.id.toString(),
      name: candidate.name || 'Unknown',
      designation: candidate.designation || 'Not specified',
      experience: candidate.experience || 0,
      location: candidate.location || 'Not specified',
      skills,
      industry: candidate.industry || 'Not specified',
      industryType: candidate.industryType || 'Not specified',
      qualifications,
      salaryLPA,
      gender: candidate.gender || 'Not specified',
      age,
      profileImageUrl: candidate.profilePictureUrl || `https://placehold.co/100x100/cccccc/444444?text=${(candidate.name || 'U').charAt(0)}`,
      email: candidate.email,
      phone: candidate.phone || '',
      linkedinProfileUrl: candidate.linkedinProfileUrl || '',
      company: transformedWorkExperience.length > 0 ? transformedWorkExperience[0].company : 'Not specified',
      department: candidate.department || 'Not specified',
      preferredLocations,
      professionalSummary: candidate.professionalSummary,
      workExperience: transformedWorkExperience,
      education,
      awards: [], // Could be added to schema later
      certifications: [], // Could be added to schema later
      resumePdfUrl: candidate.resumeUrl || '',
      dob: candidate.dob || '1990-01-01',
      maritalStatus: candidate.maritalStatus || 'Not specified',
      currentAddress: candidate.currentAddress || 'Not specified',
      correspondenceAddress: candidate.correspondenceAddress || 'Not specified'
    };

    return NextResponse.json(transformedCandidate);

  } catch (error) {
    console.error('Error fetching candidate details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate details' },
      { status: 500 }
    );
  }
}

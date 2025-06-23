import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface CandidateFilters {
  keywords?: string[];
  excludedKeywords?: string[];
  skills?: string[];
  locations?: string[];
  includeRelocatingCandidates?: boolean;
  designationInput?: string;
  includedCompanies?: string[];
  excludedCompanies?: string[];
  minExperience?: string;
  maxExperience?: string;
  minSalary?: string;
  maxSalary?: string;
  qualifications?: string[];
  selectedGender?: string;
  minAge?: string;
  maxAge?: string;
  industryInput?: string;
  selectedIndustryType?: string;
  page?: number;
  limit?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: CandidateFilters = {
      keywords: searchParams.get('keywords') ? JSON.parse(searchParams.get('keywords')!) : [],
      excludedKeywords: searchParams.get('excludedKeywords') ? JSON.parse(searchParams.get('excludedKeywords')!) : [],
      skills: searchParams.get('skills') ? JSON.parse(searchParams.get('skills')!) : [],
      locations: searchParams.get('locations') ? JSON.parse(searchParams.get('locations')!) : [],
      includeRelocatingCandidates: searchParams.get('includeRelocatingCandidates') === 'true',
      designationInput: searchParams.get('designationInput') || '',
      includedCompanies: searchParams.get('includedCompanies') ? JSON.parse(searchParams.get('includedCompanies')!) : [],
      excludedCompanies: searchParams.get('excludedCompanies') ? JSON.parse(searchParams.get('excludedCompanies')!) : [],
      minExperience: searchParams.get('minExperience') || '',
      maxExperience: searchParams.get('maxExperience') || '',
      minSalary: searchParams.get('minSalary') || '',
      maxSalary: searchParams.get('maxSalary') || '',
      qualifications: searchParams.get('qualifications') ? JSON.parse(searchParams.get('qualifications')!) : [],
      selectedGender: searchParams.get('selectedGender') || 'All',
      minAge: searchParams.get('minAge') || '',
      maxAge: searchParams.get('maxAge') || '',
      industryInput: searchParams.get('industryInput') || '',
      selectedIndustryType: searchParams.get('selectedIndustryType') || 'All Industry Types',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '25')
    };

    // Build the query
    let query = `
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
      WHERE u.role = 'jobSeeker'
      AND jsp.fullName IS NOT NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters.keywords && filters.keywords.length > 0) {
      const keywordConditions: string[] = [];
      filters.keywords.forEach(keyword => {
        keywordConditions.push(`(jsp.fullName LIKE ? OR jsp.currentDesignation LIKE ? OR jsp.skills LIKE ?)`);
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      });
      query += ` AND (${keywordConditions.join(' OR ')})`;
    }

    if (filters.excludedKeywords && filters.excludedKeywords.length > 0) {
      filters.excludedKeywords.forEach(keyword => {
        query += ` AND (jsp.fullName NOT LIKE ? AND jsp.currentDesignation NOT LIKE ? AND jsp.skills NOT LIKE ? AND jsp.currentIndustry NOT LIKE ? AND jsp.currentIndustryType NOT LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      });
    }

    if (filters.designationInput) {
      query += ` AND jsp.currentDesignation LIKE ?`;
      params.push(`%${filters.designationInput}%`);
    }

    if (filters.skills && filters.skills.length > 0) {
      filters.skills.forEach(skill => {
        query += ` AND jsp.skills LIKE ?`;
        params.push(`%${skill}%`);
      });
    }

    if (filters.locations && filters.locations.length > 0) {
      const locationConditions: string[] = [];
      filters.locations.forEach(location => {
        locationConditions.push(`jsp.currentCity LIKE ?`);
        params.push(`%${location}%`);
      });

      if (filters.includeRelocatingCandidates) {
        const preferredLocationConditions: string[] = [];
        filters.locations.forEach(location => {
          preferredLocationConditions.push(`jsp.preferredLocations LIKE ?`);
          params.push(`%${location}%`);
        });
        query += ` AND ((${locationConditions.join(' OR ')}) OR (${preferredLocationConditions.join(' OR ')}))`;
      } else {
        query += ` AND (${locationConditions.join(' OR ')})`;
      }
    }

    if (filters.minExperience) {
      query += ` AND jsp.totalExperience >= ?`;
      params.push(parseFloat(filters.minExperience));
    }

    if (filters.maxExperience) {
      query += ` AND jsp.totalExperience <= ?`;
      params.push(parseFloat(filters.maxExperience));
    }

    if (filters.selectedGender && filters.selectedGender !== 'All') {
      query += ` AND jsp.gender = ?`;
      params.push(filters.selectedGender);
    }

    if (filters.industryInput) {
      query += ` AND jsp.currentIndustry LIKE ?`;
      params.push(`%${filters.industryInput}%`);
    }

    if (filters.selectedIndustryType && filters.selectedIndustryType !== 'All Industry Types') {
      query += ` AND jsp.currentIndustryType = ?`;
      params.push(filters.selectedIndustryType);
    }

    // Get total count with the same parameters
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_candidates`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const totalCount = countResult.total;

    // Add pagination
    query += ` ORDER BY jsp.updatedAt DESC LIMIT ? OFFSET ?`;
    const offset = (filters.page! - 1) * filters.limit!;
    params.push(filters.limit!, offset);

    // Execute query
    const candidates = db.prepare(query).all(...params);

    // Get work experience for company names
    const candidateIds = candidates.map((c: any) => c.id);
    let workExperienceMap: { [key: string]: any } = {};
    
    if (candidateIds.length > 0) {
      const placeholders = candidateIds.map(() => '?').join(',');
      const workExpQuery = `
        SELECT 
          jsp.user_id,
          ed.companyName,
          ed.isPresent,
          ed.startDate
        FROM experience_details ed
        JOIN job_seeker_profiles jsp ON ed.job_seeker_profile_id = jsp.id
        WHERE jsp.user_id IN (${placeholders})
        ORDER BY jsp.user_id, ed.startDate DESC
      `;
      
      const workExperiences = db.prepare(workExpQuery).all(...candidateIds);
      
      // Group by user_id and get current company (isPresent = 1 or most recent)
      workExperiences.forEach((exp: any) => {
        if (!workExperienceMap[exp.user_id]) {
          workExperienceMap[exp.user_id] = exp.companyName;
        } else if (exp.isPresent === 1) {
          // If this is current job, prioritize it
          workExperienceMap[exp.user_id] = exp.companyName;
        }
      });
    }

    // Transform data to match frontend interface
    const transformedCandidates = candidates.map((candidate: any) => {
      // Calculate age from date of birth
      let age = 30; // default
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
        const cleanStr = skillsStr.replace(/[\[\]"']/g, '').trim();
        skills = cleanStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      // Parse preferred locations  
      let preferredLocations: string[] = [];
      if (candidate.preferredLocations) {
        const locStr = candidate.preferredLocations.toString();
        const cleanStr = locStr.replace(/[\[\]"']/g, '').trim();
        preferredLocations = cleanStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      // Get qualifications from education (we'll need to fetch this separately)
      const qualifications = ['B.Tech']; // Default for now

      // Get company name from work experience or fallback
      const currentCompany = workExperienceMap[candidate.id] || 'Current Company';

      return {
        id: candidate.id.toString(),
        name: candidate.name || 'Unknown',
        designation: candidate.designation || 'Not specified',
        experience: candidate.experience || 0,
        location: candidate.location || 'Not specified',
        skills,
        industry: candidate.industry || 'Not specified',
        industryType: candidate.industryType || 'All Industry Types',
        qualifications,
        salaryLPA,
        gender: candidate.gender || 'Not specified',
        age,
        profileImageUrl: candidate.profilePictureUrl || `https://placehold.co/100x100/cccccc/444444?text=${(candidate.name || 'U').charAt(0)}`,
        email: candidate.email,
        phone: candidate.phone || '',
        linkedinProfileUrl: candidate.linkedinProfileUrl || '',
        company: currentCompany,
        department: candidate.department || 'Not specified',
        preferredLocations,
        professionalSummary: candidate.professionalSummary,
        workExperience: [], // Would need separate query
        education: [], // Would need separate query
        awards: [],
        certifications: [],
        resumePdfUrl: candidate.resumeUrl || '',
        dob: candidate.dob || '1990-01-01',
        maritalStatus: candidate.maritalStatus || 'Not specified',
        currentAddress: candidate.currentAddress || 'Not specified',
        correspondenceAddress: candidate.correspondenceAddress || 'Not specified'
      };
    });

    return NextResponse.json({
      candidates: transformedCandidates,
      totalCount,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(totalCount / filters.limit!)
    });

  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
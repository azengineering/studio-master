
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
      const keywordConditions = filters.keywords.map(() => {
        return `(jsp.fullName LIKE $${paramIndex++} OR jsp.currentDesignation LIKE $${paramIndex++} OR jsp.skills LIKE $${paramIndex++})`;
      });
      query += ` AND (${keywordConditions.join(' OR ')})`;
      filters.keywords.forEach(keyword => {
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      });
    }

    if (filters.excludedKeywords && filters.excludedKeywords.length > 0) {
      const excludeConditions = filters.excludedKeywords.map(() => {
        return `(jsp.fullName NOT LIKE $${paramIndex++} AND jsp.currentDesignation NOT LIKE $${paramIndex++} AND jsp.skills NOT LIKE $${paramIndex++})`;
      });
      query += ` AND ${excludeConditions.join(' AND ')}`;
      filters.excludedKeywords.forEach(keyword => {
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      });
    }

    if (filters.designationInput) {
      query += ` AND jsp.currentDesignation LIKE $${paramIndex++}`;
      params.push(`%${filters.designationInput}%`);
    }

    if (filters.skills && filters.skills.length > 0) {
      const skillConditions = filters.skills.map(() => `jsp.skills LIKE $${paramIndex++}`);
      query += ` AND (${skillConditions.join(' AND ')})`;
      filters.skills.forEach(skill => {
        params.push(`%${skill}%`);
      });
    }

    if (filters.locations && filters.locations.length > 0) {
      const locationConditions = filters.locations.map(() => `jsp.currentCity LIKE $${paramIndex++}`);
      if (filters.includeRelocatingCandidates) {
        const preferredLocationConditions = filters.locations.map(() => `jsp.preferredLocations LIKE $${paramIndex++}`);
        query += ` AND ((${locationConditions.join(' OR ')}) OR (${preferredLocationConditions.join(' OR ')}))`;
        filters.locations.forEach(location => {
          params.push(`%${location}%`);
        });
        filters.locations.forEach(location => {
          params.push(`%${location}%`);
        });
      } else {
        query += ` AND (${locationConditions.join(' OR ')})`;
        filters.locations.forEach(location => {
          params.push(`%${location}%`);
        });
      }
    }

    if (filters.minExperience) {
      query += ` AND jsp.totalExperience >= $${paramIndex++}`;
      params.push(parseFloat(filters.minExperience));
    }

    if (filters.maxExperience) {
      query += ` AND jsp.totalExperience <= $${paramIndex++}`;
      params.push(parseFloat(filters.maxExperience));
    }

    if (filters.selectedGender && filters.selectedGender !== 'All') {
      query += ` AND jsp.gender = $${paramIndex++}`;
      params.push(filters.selectedGender);
    }

    if (filters.industryInput) {
      query += ` AND jsp.currentIndustry LIKE $${paramIndex++}`;
      params.push(`%${filters.industryInput}%`);
    }

    if (filters.selectedIndustryType && filters.selectedIndustryType !== 'All Industry Types') {
      query += ` AND jsp.currentIndustryType = $${paramIndex++}`;
      params.push(filters.selectedIndustryType);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_candidates`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const totalCount = countResult.total;

    // Add pagination
    const offset = (filters.page! - 1) * filters.limit!;
    query += ` ORDER BY jsp.updatedAt DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(filters.limit!, offset);

    // Execute query
    const candidates = db.prepare(query).all(...params);

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
      const skills = candidate.skills ? candidate.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

      // Parse preferred locations
      const preferredLocations = candidate.preferredLocations ? 
        candidate.preferredLocations.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

      // Get qualifications from education (we'll need to fetch this separately)
      const qualifications = ['B.Tech']; // Default for now

      return {
        id: candidate.id.toString(),
        name: candidate.name || 'Unknown',
        designation: candidate.designation || 'Not specified',
        experience: candidate.experience || 0,
        location: candidate.location || 'Not specified',
        skills,
        industry: candidate.industry || 'Not specified',
        qualifications,
        salaryLPA,
        gender: candidate.gender || 'Not specified',
        age,
        profileImageUrl: candidate.profilePictureUrl || `https://placehold.co/100x100/cccccc/444444?text=${(candidate.name || 'U').charAt(0)}`,
        email: candidate.email,
        phone: candidate.phone || '',
        linkedinProfileUrl: candidate.linkedinProfileUrl || '',
        company: 'Current Company', // This would need to be derived from experience
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

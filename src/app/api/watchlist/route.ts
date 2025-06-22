
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Create the watchlist table if it doesn't exist
function ensureWatchlistTable() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS candidate_watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_user_id INTEGER NOT NULL,
        candidate_user_id INTEGER NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (employer_user_id, candidate_user_id)
      )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_watchlist_employer_id ON candidate_watchlist (employer_user_id)`);
  } catch (error) {
    console.error('Error creating watchlist table:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureWatchlistTable();
    
    const { searchParams } = new URL(request.url);
    const employerUserId = searchParams.get('employerUserId');

    if (!employerUserId) {
      return NextResponse.json({ error: 'Employer user ID is required' }, { status: 400 });
    }

    const watchlistCandidates = db.prepare(`
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
        jsp.currentIndustryType as industryType,
        cw.added_at as addedAt
      FROM candidate_watchlist cw
      JOIN users u ON cw.candidate_user_id = u.id
      JOIN job_seeker_profiles jsp ON u.id = jsp.user_id
      WHERE cw.employer_user_id = ?
      ORDER BY cw.added_at DESC
    `).all(employerUserId);

    const formattedCandidates = watchlistCandidates.map((candidate: any) => ({
      id: candidate.id.toString(),
      name: candidate.name || 'Unknown',
      designation: candidate.designation || 'Not specified',
      experience: candidate.experience || 0,
      location: candidate.location || 'Not specified',
      skills: candidate.skills ? candidate.skills.split(',').map((s: string) => s.trim()) : [],
      industry: candidate.industry || 'Not specified',
      salaryLPA: parseFloat(candidate.salaryLPA) || 0,
      gender: candidate.gender || 'Not specified',
      age: candidate.dob ? new Date().getFullYear() - new Date(candidate.dob).getFullYear() : 0,
      profileImageUrl: candidate.profilePictureUrl || `https://placehold.co/96x96/cccccc/444444?text=${candidate.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}`,
      email: candidate.email || '',
      phone: candidate.phone || '',
      linkedinProfileUrl: candidate.linkedinProfileUrl || '',
      company: 'Current Company',
      department: candidate.department || 'Not specified',
      preferredLocations: candidate.preferredLocations ? candidate.preferredLocations.split(',').map((l: string) => l.trim()) : [],
      professionalSummary: candidate.professionalSummary || '',
      workExperience: [],
      education: [],
      awards: [],
      certifications: [],
      resumePdfUrl: candidate.resumeUrl || '',
      dob: candidate.dob || '1990-01-01',
      maritalStatus: candidate.maritalStatus || 'Not specified',
      currentAddress: candidate.currentAddress || 'Not specified',
      correspondenceAddress: candidate.correspondenceAddress || 'Not specified',
      qualifications: ['Bachelor\'s Degree']
    }));

    return NextResponse.json({ candidates: formattedCandidates });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureWatchlistTable();
    
    const { employerUserId, candidateId } = await request.json();

    if (!employerUserId || !candidateId) {
      return NextResponse.json({ error: 'Employer user ID and candidate ID are required' }, { status: 400 });
    }

    try {
      db.prepare(`
        INSERT INTO candidate_watchlist (employer_user_id, candidate_user_id)
        VALUES (?, ?)
      `).run(employerUserId, candidateId);

      return NextResponse.json({ success: true, message: 'Candidate added to watchlist' });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json({ error: 'Candidate already in watchlist' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json({ error: 'Failed to add candidate to watchlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employerUserId = searchParams.get('employerUserId');
    const candidateId = searchParams.get('candidateId');

    if (!employerUserId || !candidateId) {
      return NextResponse.json({ error: 'Employer user ID and candidate ID are required' }, { status: 400 });
    }

    db.prepare(`
      DELETE FROM candidate_watchlist
      WHERE employer_user_id = ? AND candidate_user_id = ?
    `).run(employerUserId, candidateId);

    return NextResponse.json({ success: true, message: 'Candidate removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ error: 'Failed to remove candidate from watchlist' }, { status: 500 });
  }
}

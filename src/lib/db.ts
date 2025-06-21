
// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), '.next', 'database');
const dbPath = path.join(dbDir, 'jobsai.db');
let actualDbPath = dbPath;

// Function to ensure directory exists or fallback
function ensureDbDirectory() {
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log("INFO: Database directory created:", dbDir);
    } catch (error) {
      console.error("ERROR: Failed to create primary database directory:", dbDir, error);
      const tempDbDir = path.join(process.cwd(), 'tmp_database'); // Fallback directory
      if (!fs.existsSync(tempDbDir)) {
        try {
          fs.mkdirSync(tempDbDir, { recursive: true });
          console.log("INFO: Fallback database directory created:", tempDbDir);
        } catch (fallbackError) {
          console.error("ERROR: Failed to create fallback database directory:", tempDbDir, fallbackError);
        }
      }
      actualDbPath = path.join(tempDbDir, 'jobsai.db');
      console.warn(`WARNING: Using fallback database directory: ${actualDbPath}`);
    }
  } else {
    // console.log("INFO: Primary database directory already exists:", dbDir);
  }
}

ensureDbDirectory();

console.log("INFO: Attempting to connect to SQLite database at:", actualDbPath);

let dbInstance: Database.Database;

try {
    dbInstance = new Database(actualDbPath, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
    console.log("INFO: Successfully connected to SQLite database at:", actualDbPath);
} catch (error) {
    console.error(`ERROR: Failed to open database at ${actualDbPath}:`, error);
    console.warn('WARNING: Falling back to in-memory SQLite database.');
    dbInstance = new Database(':memory:', { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
    actualDbPath = ':memory:';
    console.log("INFO: Using in-memory SQLite database.");
}


function tableExists(db: Database.Database, tableName: string): boolean {
  try {
    const stmt = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?;`);
    const result = stmt.get(tableName);
    return !!result;
  } catch (e) {
    console.error(`DEBUG: Error checking if table ${tableName} exists:`, e);
    return false;
  }
}

function columnExists(db: Database.Database, tableName: string, columnName: string): boolean {
  try {
    const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
    const columnsInfo = stmt.all() as { name: string }[];
    return columnsInfo.some(col => col.name.toLowerCase() === columnName.toLowerCase());
  } catch (e) {
    console.error(`DEBUG: Error checking if column ${columnName} exists in ${tableName}:`, e);
    return false;
  }
}

function getTableSQL(db: Database.Database, tableName: string): string | null {
  try {
    const stmt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?;");
    const result = stmt.get(tableName) as { sql: string } | undefined;
    return result ? result.sql : null;
  } catch (e) {
    console.error(`DEBUG: Error getting SQL for table ${tableName}:`, e);
    return null;
  }
}

function checkConstraintExists(createTableSQL: string | null, constraintFragment: string): boolean {
    if (!createTableSQL) return false;
    // Normalize by removing extra spaces and converting to lowercase for a more robust check
    const normalizedSql = createTableSQL.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedConstraint = constraintFragment.toLowerCase().replace(/\s+/g, ' ').trim();
    return normalizedSql.includes(normalizedConstraint);
}


function initializeDb(db: Database.Database) {
  db.pragma('foreign_keys = ON');
  console.log("INFO: Foreign keys PRAGMA set to ON.");

  // --- USERS TABLE ---
  const usersTableName = 'users';
  const usersEssentialCols = ['id', 'email', 'password', 'role', 'isAdmin']; // Removed createdAt, updatedAt from essential check
  const createUsersTableSQL = `
  CREATE TABLE IF NOT EXISTS ${usersTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jobSeeker', 'employer')),
      isAdmin BOOLEAN DEFAULT 0 NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );`;

  if (!tableExists(db, usersTableName)) {
      console.log(`DEBUG: Table '${usersTableName}' does not exist. Creating...`);
      db.exec(createUsersTableSQL);
      console.log(`DEBUG: Table '${usersTableName}' created.`);
  } else {
      console.log(`DEBUG: Table '${usersTableName}' exists. Checking schema...`);
      let recreateUsersTable = false;
      for (const col of usersEssentialCols) {
          if (!columnExists(db, usersTableName, col)) {
              console.warn(`CRITICAL_DEBUG: Essential column '${col}' MISSING in '${usersTableName}'. Table will be DROPPED and RECREATED.`);
              recreateUsersTable = true;
              break;
          }
      }
      const usersTableSQL = getTableSQL(db, usersTableName);
      if (!checkConstraintExists(usersTableSQL, "check(role in ('jobseeker', 'employer'))")) {
          console.warn(`CRITICAL_DEBUG: '${usersTableName}' table 'role' CHECK constraint MISMATCH or MISSING. Table will be DROPPED and RECREATED.`);
          recreateUsersTable = true;
      }
      if (!columnExists(db, usersTableName, 'isAdmin') || !checkConstraintExists(usersTableSQL, "isadmin boolean default 0 not null")) {
        console.warn(`CRITICAL_DEBUG: Column 'isAdmin' in '${usersTableName}' is missing or has incorrect constraints. Table will be DROPPED and RECREATED.`);
        recreateUsersTable = true;
      }

      if (recreateUsersTable) {
          console.error(`CRITICAL_ACTION_PENDING: Dropping all known dependent tables before recreating '${usersTableName}'.`);
          db.exec(`DROP TABLE IF EXISTS education_details;`);
          db.exec(`DROP TABLE IF EXISTS experience_details;`);
          db.exec(`DROP TABLE IF EXISTS job_applications;`);
          db.exec(`DROP TABLE IF EXISTS saved_jobs;`);
          db.exec(`DROP TABLE IF EXISTS jobs;`);
          db.exec(`DROP TABLE IF EXISTS employer_profiles;`);
          db.exec(`DROP TABLE IF EXISTS job_seeker_profiles;`);
          db.exec(`DROP TABLE IF EXISTS ${usersTableName};`);
          console.warn(`CRITICAL_ACTION_EXECUTED: Table '${usersTableName}' and its dependents dropped.`);
          db.exec(createUsersTableSQL);
          console.log(`INFO: Successfully RECREATED '${usersTableName}' table with up-to-date schema.`);
      } else {
          console.log(`DEBUG: '${usersTableName}' table schema appears up-to-date.`);
      }
  }


  // --- EMPLOYER PROFILES TABLE ---
  const employerProfilesTableName = 'employer_profiles';
  const employerProfilesEssentialCols = ['id', 'user_id', 'companyName', 'officialEmail', 'companyLogoUrl', 'address', 'contactNumber', 'companyWebsite', 'teamSize', 'yearOfEstablishment', 'aboutCompany', 'linkedinUrl', 'xUrl'];
  const createEmployerProfilesTableSQL = `
  CREATE TABLE IF NOT EXISTS ${employerProfilesTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      companyLogoUrl TEXT,
      companyName TEXT NOT NULL,
      address TEXT,
      officialEmail TEXT UNIQUE NOT NULL,
      contactNumber TEXT,
      companyWebsite TEXT,
      teamSize INTEGER,
      yearOfEstablishment INTEGER,
      aboutCompany TEXT,
      linkedinUrl TEXT,
      xUrl TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`;

  if (!tableExists(db, employerProfilesTableName)) {
      console.log(`DEBUG: Table '${employerProfilesTableName}' does not exist. Creating...`);
      db.exec(createEmployerProfilesTableSQL);
      console.log(`DEBUG: Table '${employerProfilesTableName}' created.`);
  } else {
      console.log(`DEBUG: Table '${employerProfilesTableName}' exists. Checking schema...`);
      let recreateTable = false;
      for (const col of employerProfilesEssentialCols) {
          if (!columnExists(db, employerProfilesTableName, col)) {
              console.warn(`CRITICAL_DEBUG: Essential column '${col}' MISSING in '${employerProfilesTableName}'. Table will be DROPPED and RECREATED.`);
              recreateTable = true;
              break;
          }
      }
      if (recreateTable) {
          console.error(`CRITICAL_ACTION_PENDING: Dropping '${employerProfilesTableName}' before recreating.`);
          db.exec(`DROP TABLE IF EXISTS jobs;`); 
          db.exec(`DROP TABLE IF EXISTS ${employerProfilesTableName};`);
          console.warn(`CRITICAL_ACTION_EXECUTED: Table '${employerProfilesTableName}' dropped.`);
          db.exec(createEmployerProfilesTableSQL);
          console.log(`INFO: Successfully RECREATED '${employerProfilesTableName}' table.`);
      } else {
          console.log(`DEBUG: '${employerProfilesTableName}' table schema appears up-to-date.`);
      }
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON ${employerProfilesTableName} (user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_employer_profiles_officialEmail ON ${employerProfilesTableName} (officialEmail);`);


  // --- JOB SEEKER PROFILES TABLE ---
  const jobSeekerProfilesTableName = 'job_seeker_profiles';
  const jobSeekerProfileEssentialCols = [
      'id', 'user_id', 'fullName', 'phoneNumber', 'profilePictureUrl', 'resumeUrl', 'gender', 'maritalStatus', 'dateOfBirth',
      'currentAddress', 'currentCity', 'currentPinCode', 'correspondenceAddress', 'correspondenceCity', 'correspondencePinCode',
      'professionalSummary', 'currentDesignation', 'currentDepartment', 'currentIndustry', 'currentIndustryType', 'otherCurrentIndustryType',
      'preferredLocations', 'totalExperience', 'presentSalary', 'skills', 'portfolioUrl', 'githubProfileUrl', 'linkedinProfileUrl', 'otherSocialLinks'
  ];
  const createJobSeekerProfilesTableSQL = `
  CREATE TABLE IF NOT EXISTS ${jobSeekerProfilesTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      fullName TEXT,
      phoneNumber TEXT,
      profilePictureUrl TEXT,
      resumeUrl TEXT,
      gender TEXT,
      maritalStatus TEXT,
      dateOfBirth TEXT,
      currentAddress TEXT,
      currentCity TEXT,
      currentPinCode TEXT,
      correspondenceAddress TEXT,
      correspondenceCity TEXT,
      correspondencePinCode TEXT,
      professionalSummary TEXT,
      currentDesignation TEXT,
      currentDepartment TEXT,
      currentIndustry TEXT,
      currentIndustryType TEXT,
      otherCurrentIndustryType TEXT,
      preferredLocations TEXT, 
      totalExperience REAL,
      presentSalary TEXT,
      skills TEXT, 
      portfolioUrl TEXT,
      githubProfileUrl TEXT,
      linkedinProfileUrl TEXT,
      otherSocialLinks TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`;

  let recreateJobSeekerProfileTable = false;
  if (!tableExists(db, jobSeekerProfilesTableName)) {
      console.log(`DEBUG: Table '${jobSeekerProfilesTableName}' does not exist. Creating...`);
      recreateJobSeekerProfileTable = true;
  } else {
      console.log(`DEBUG: Table '${jobSeekerProfilesTableName}' exists. Checking schema...`);
      for (const col of jobSeekerProfileEssentialCols) {
          if (!columnExists(db, jobSeekerProfilesTableName, col)) {
              console.warn(`CRITICAL_DEBUG: Essential column '${col}' MISSING in '${jobSeekerProfilesTableName}'. Table and its dependents ('education_details', 'experience_details') will be DROPPED and RECREATED.`);
              recreateJobSeekerProfileTable = true;
              break;
          }
      }
  }

  if (recreateJobSeekerProfileTable) {
      console.error(`CRITICAL_ACTION_PENDING: Dropping dependent tables 'education_details' and 'experience_details' before recreating '${jobSeekerProfilesTableName}'.`);
      db.exec(`DROP TABLE IF EXISTS education_details;`);
      db.exec(`DROP TABLE IF EXISTS experience_details;`);
      console.warn(`CRITICAL_ACTION_EXECUTED: Dependent tables for '${jobSeekerProfilesTableName}' dropped.`);
      db.exec(`DROP TABLE IF EXISTS ${jobSeekerProfilesTableName};`); 
      db.exec(createJobSeekerProfilesTableSQL);
      console.log(`INFO: Successfully RECREATED '${jobSeekerProfilesTableName}' table.`);
  } else {
      console.log(`DEBUG: '${jobSeekerProfilesTableName}' table schema appears up-to-date.`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON ${jobSeekerProfilesTableName} (user_id);`);


  // --- EDUCATION DETAILS TABLE ---
  const educationDetailsTableName = 'education_details';
  const educationDetailsEssentialCols = ['id', 'job_seeker_profile_id', 'qualification', 'stream', 'institution', 'yearOfCompletion', 'percentageMarks'];
  const createEducationDetailsTableSQL = `
  CREATE TABLE IF NOT EXISTS ${educationDetailsTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_seeker_profile_id INTEGER NOT NULL,
      qualification TEXT NOT NULL,
      stream TEXT NOT NULL,
      institution TEXT NOT NULL,
      yearOfCompletion INTEGER NOT NULL,
      percentageMarks REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_seeker_profile_id) REFERENCES ${jobSeekerProfilesTableName}(id) ON DELETE CASCADE
  );`;

  if (!tableExists(db, educationDetailsTableName)) {
      console.log(`DEBUG: Table '${educationDetailsTableName}' does not exist. Creating...`);
      db.exec(createEducationDetailsTableSQL);
      console.log(`DEBUG: Table '${educationDetailsTableName}' created.`);
  } else {
      console.log(`DEBUG: Table '${educationDetailsTableName}' exists. Checking schema...`);
      let recreateTable = false;
      for (const col of educationDetailsEssentialCols) {
          if (!columnExists(db, educationDetailsTableName, col)) {
              console.warn(`CRITICAL_DEBUG: Essential column '${col}' MISSING in '${educationDetailsTableName}'. Table will be DROPPED and RECREATED.`);
              recreateTable = true;
              break;
          }
      }
      if (recreateTable) {
          console.error(`CRITICAL_ACTION_PENDING: Dropping '${educationDetailsTableName}' before recreating.`);
          db.exec(`DROP TABLE IF EXISTS ${educationDetailsTableName};`);
           console.warn(`CRITICAL_ACTION_EXECUTED: Table '${educationDetailsTableName}' dropped.`);
          db.exec(createEducationDetailsTableSQL);
          console.log(`INFO: Successfully RECREATED '${educationDetailsTableName}' table.`);
      } else {
          console.log(`DEBUG: '${educationDetailsTableName}' table schema appears up-to-date.`);
      }
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_education_details_profile_id ON ${educationDetailsTableName} (job_seeker_profile_id);`);


  // --- EXPERIENCE DETAILS TABLE ---
  const experienceDetailsTableName = 'experience_details';
  const experienceDetailsEssentialCols = ['id', 'job_seeker_profile_id', 'companyName', 'designation', 'aboutCompany', 'startDate', 'endDate', 'isPresent', 'responsibilities'];
  const createExperienceDetailsTableSQL = `
  CREATE TABLE IF NOT EXISTS ${experienceDetailsTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_seeker_profile_id INTEGER NOT NULL,
      companyName TEXT NOT NULL,
      designation TEXT NOT NULL,
      aboutCompany TEXT,
      startDate TEXT NOT NULL, 
      endDate TEXT, 
      isPresent INTEGER DEFAULT 0 NOT NULL CHECK(isPresent IN (0, 1)),
      responsibilities TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_seeker_profile_id) REFERENCES ${jobSeekerProfilesTableName}(id) ON DELETE CASCADE
  );`;

  if (!tableExists(db, experienceDetailsTableName)) {
      console.log(`DEBUG: Table '${experienceDetailsTableName}' does not exist. Creating...`);
      db.exec(createExperienceDetailsTableSQL);
      console.log(`DEBUG: Table '${experienceDetailsTableName}' created.`);
  } else {
      console.log(`DEBUG: Table '${experienceDetailsTableName}' exists. Checking schema...`);
      let recreateTable = false;
      for (const col of experienceDetailsEssentialCols) {
          if (!columnExists(db, experienceDetailsTableName, col)) {
              console.warn(`CRITICAL_DEBUG: Essential column '${col}' MISSING in '${experienceDetailsTableName}'. Table will be DROPPED and RECREATED.`);
              recreateTable = true;
              break;
          }
      }
      const expTableSQL = getTableSQL(db, experienceDetailsTableName);
      if (!checkConstraintExists(expTableSQL, "ispresent integer default 0 not null check(ispresent in (0, 1))")) {
          console.warn(`CRITICAL_DEBUG: '${experienceDetailsTableName}' table 'isPresent' column constraint MISMATCH or MISSING. Table will be DROPPED and RECREATED.`);
          recreateTable = true;
      }
      if (recreateTable) {
          console.error(`CRITICAL_ACTION_PENDING: Dropping '${experienceDetailsTableName}' before recreating.`);
          db.exec(`DROP TABLE IF EXISTS ${experienceDetailsTableName};`);
          console.warn(`CRITICAL_ACTION_EXECUTED: Table '${experienceDetailsTableName}' dropped.`);
          db.exec(createExperienceDetailsTableSQL);
          console.log(`INFO: Successfully RECREATED '${experienceDetailsTableName}' table.`);
      } else {
          console.log(`DEBUG: '${experienceDetailsTableName}' table schema appears up-to-date.`);
      }
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_experience_details_profile_id ON ${experienceDetailsTableName} (job_seeker_profile_id);`);


  // --- JOBS TABLE ---
  const jobsTableName = 'jobs';
  const jobsStatusConstraint = "status in ('draft', 'active', 'closed')";
  const jobsEssentialColumns = ['id', 'employer_user_id', 'jobTitle', 'companyName', 'industry', 'industryType', 'jobType', 'jobLocation', 'skillsRequired', 'jobDescription', 'status', 'qualification', 'numberOfVacancies']; // Removed updatedAt from essential check
  const createJobsTableSQL = `
  CREATE TABLE IF NOT EXISTS ${jobsTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_user_id INTEGER NOT NULL,
      jobTitle TEXT NOT NULL,
      companyName TEXT NOT NULL,
      industry TEXT NOT NULL,
      industryType TEXT NOT NULL,
      jobType TEXT NOT NULL,
      jobLocation TEXT NOT NULL,
      numberOfVacancies INTEGER NOT NULL DEFAULT 1,
      qualification TEXT NOT NULL,
      minimumExperience REAL NOT NULL DEFAULT 0,
      maximumExperience REAL NOT NULL DEFAULT 0,
      minimumSalary INTEGER NOT NULL DEFAULT 0,
      maximumSalary INTEGER NOT NULL DEFAULT 0,
      skillsRequired TEXT NOT NULL, 
      additionalData TEXT,
      jobDescription TEXT NOT NULL,
      customQuestions TEXT, 
      status TEXT DEFAULT 'draft' CHECK(${jobsStatusConstraint}) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employer_user_id) REFERENCES users(id) ON DELETE CASCADE
  );`;

  let recreateJobsTable = false;
  if (!tableExists(db, jobsTableName)) {
    recreateJobsTable = true;
    console.log(`DEBUG: Table '${jobsTableName}' does not exist. Will be created.`);
  } else {
    console.log(`DEBUG: Table '${jobsTableName}' exists. Checking schema...`);
    for (const colName of jobsEssentialColumns) {
        if (!columnExists(db, jobsTableName, colName)) {
            console.warn(`CRITICAL_DEBUG: Essential column '${colName}' is MISSING in '${jobsTableName}'. Table and dependents ('job_applications', 'saved_jobs') will be DROPPED and RECREATED.`);
            recreateJobsTable = true;
            break;
        }
    }
    if (!recreateJobsTable) {
        const currentTableSQL = getTableSQL(db, jobsTableName);
        if (!checkConstraintExists(currentTableSQL, jobsStatusConstraint)) {
            console.warn(`CRITICAL_DEBUG: '${jobsTableName}' table 'status' CHECK constraint MISMATCH or MISSING. Expected: "${jobsStatusConstraint}". Table and dependents will be DROPPED and RECREATED.`);
            recreateJobsTable = true;
        }
    }
  }

  if (recreateJobsTable) {
      console.error(`CRITICAL_ACTION_PENDING: Dropping dependent tables 'job_applications' and 'saved_jobs' before recreating '${jobsTableName}'.`);
      db.exec(`DROP TABLE IF EXISTS job_applications;`);
      db.exec(`DROP TABLE IF EXISTS saved_jobs;`);
      console.warn(`CRITICAL_ACTION_EXECUTED: Dependent tables 'job_applications' and 'saved_jobs' dropped.`);
      db.exec(`DROP TABLE IF EXISTS ${jobsTableName};`);
      console.warn(`CRITICAL_ACTION_EXECUTED: Table '${jobsTableName}' dropped.`);
      db.exec(createJobsTableSQL);
      console.log(`INFO: Successfully RECREATED '${jobsTableName}' table with up-to-date schema.`);
  } else {
    console.log(`DEBUG: '${jobsTableName}' table schema appears up-to-date.`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_employer_user_id ON ${jobsTableName} (employer_user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON ${jobsTableName} (status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_jobs_createdAt ON ${jobsTableName} (createdAt);`);


  // --- JOB APPLICATIONS TABLE ---
  const jobApplicationsTableName = 'job_applications';
  const appStatusConstraint = "status in ('submitted', 'viewed', 'shortlisted', 'interviewing', 'rejected', 'hired', 'declined')";
  const appEssentialColumns = ['id', 'job_id', 'job_seeker_user_id', 'employer_user_id', 'applicationDate', 'status', 'employer_remarks', 'resumeUrl', 'currentWorkingLocation', 'expectedSalary', 'noticePeriod', 'customQuestionAnswers']; // Removed updatedAt
  const createJobApplicationsTableSQL = `
  CREATE TABLE IF NOT EXISTS ${jobApplicationsTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      job_seeker_user_id INTEGER NOT NULL,
      employer_user_id INTEGER NOT NULL,
      applicationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(${appStatusConstraint}),
      resumeUrl TEXT, 
      customQuestionAnswers TEXT, 
      employer_remarks TEXT,
      currentWorkingLocation TEXT NOT NULL,
      expectedSalary TEXT NOT NULL,
      noticePeriod INTEGER NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (job_seeker_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_user_id) REFERENCES users(id) ON DELETE CASCADE
  );`;

  let recreateJobApplicationsTable = false;
  if (!tableExists(db, jobApplicationsTableName)) {
    recreateJobApplicationsTable = true;
    console.log(`DEBUG: Table '${jobApplicationsTableName}' does not exist. Will be created.`);
  } else {
    console.log(`DEBUG: Table '${jobApplicationsTableName}' exists. Checking schema...`);
    for (const colName of appEssentialColumns) {
      if (!columnExists(db, jobApplicationsTableName, colName)) {
        console.warn(`CRITICAL_DEBUG: Essential column '${colName}' is MISSING in '${jobApplicationsTableName}'. Table will be DROPPED and RECREATED.`);
        recreateJobApplicationsTable = true;
        break;
      }
    }
    if (!recreateJobApplicationsTable) {
      const currentTableSQL = getTableSQL(db, jobApplicationsTableName);
      if (!checkConstraintExists(currentTableSQL, appStatusConstraint)) {
        console.warn(`CRITICAL_DEBUG: '${jobApplicationsTableName}' table 'status' CHECK constraint MISMATCH or MISSING. Expected: "${appStatusConstraint}". Table will be DROPPED and RECREATED.`);
        recreateJobApplicationsTable = true;
      }
    }
  }

  if (recreateJobApplicationsTable) {
      console.error(`CRITICAL_ACTION_PENDING: Dropping and recreating '${jobApplicationsTableName}' table.`);
      db.exec(`DROP TABLE IF EXISTS ${jobApplicationsTableName};`);
      console.warn(`CRITICAL_ACTION_EXECUTED: Table '${jobApplicationsTableName}' dropped.`);
      db.exec(createJobApplicationsTableSQL);
      console.log(`INFO: Successfully RECREATED '${jobApplicationsTableName}' table.`);
  } else {
    console.log(`DEBUG: '${jobApplicationsTableName}' table schema appears up-to-date.`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON ${jobApplicationsTableName} (job_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_job_applications_job_seeker_id ON ${jobApplicationsTableName} (job_seeker_user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_job_applications_employer_id ON ${jobApplicationsTableName} (employer_user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_job_applications_status ON ${jobApplicationsTableName} (status);`);


  // --- SAVED JOBS TABLE ---
  const savedJobsTableName = 'saved_jobs';
  const savedJobsEssentialCols = ['id', 'job_seeker_user_id', 'job_id', 'savedDate'];
  const createSavedJobsTableSQL = `
  CREATE TABLE IF NOT EXISTS ${savedJobsTableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_seeker_user_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      savedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_seeker_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      UNIQUE (job_seeker_user_id, job_id)
  );`;

  let recreateSavedJobsTable = false;
  if (!tableExists(db, savedJobsTableName)) {
    recreateSavedJobsTable = true;
    console.log(`DEBUG: Table '${savedJobsTableName}' does not exist. Will be created.`);
  } else {
    console.log(`DEBUG: Table '${savedJobsTableName}' exists. Checking schema...`);
    for (const col of savedJobsEssentialCols) {
      if (!columnExists(db, savedJobsTableName, col)) {
        console.warn(`CRITICAL_DEBUG: Essential column '${col}' MISSING in '${savedJobsTableName}'. Table will be DROPPED and RECREATED.`);
        recreateSavedJobsTable = true;
        break;
      }
    }
  }
  if (recreateSavedJobsTable) {
      console.error(`CRITICAL_ACTION_PENDING: Dropping and recreating '${savedJobsTableName}' table.`);
      db.exec(`DROP TABLE IF EXISTS ${savedJobsTableName};`);
      console.warn(`CRITICAL_ACTION_EXECUTED: Table '${savedJobsTableName}' dropped.`);
      db.exec(createSavedJobsTableSQL);
      console.log(`INFO: Successfully RECREATED '${savedJobsTableName}' table.`);
  } else {
      console.log(`DEBUG: '${savedJobsTableName}' table schema appears up-to-date.`);
  }
  db.exec(`CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_seeker_id ON ${savedJobsTableName} (job_seeker_user_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON ${savedJobsTableName} (job_id);`);
  
  console.log('INFO: Database schema checked/initialized successfully.');
}


if (process.env.NODE_ENV !== 'production' || !global.dbInitialized) {
  try {
    console.log("INFO: Calling initializeDb()...");
    initializeDb(dbInstance);
    if (process.env.NODE_ENV !== 'production') {
      global.dbInitialized = true;
    }
  } catch (error)
    {
    console.error('CRITICAL_ERROR: Failed to initialize database schema during startup:', error);
  }
}

process.on('exit', () => {
  if (dbInstance && dbInstance.open) {
    dbInstance.close((err) => {
      if (err) {
        console.error('ERROR: Failed to close the database connection:', err.message);
      } else {
        console.log("INFO: Database connection closed successfully.");
      }
    });
  }
});

export default dbInstance;
    
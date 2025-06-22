// src/app/(auth)/actions.ts
'use server';

import { z } from 'zod';
import db from '@/lib/db'; 
import type { Database } from 'better-sqlite3'; 
import bcrypt from 'bcryptjs';

// Zod schema for sign-up server-side validation (internal use)
const signUpFormSchemaInternal = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(['jobSeeker', 'employer'], { required_error: "Please select a role." }),
});
export type SignUpFormData = z.infer<typeof signUpFormSchemaInternal>;

// Zod schema for login server-side validation (internal use)
const loginFormSchemaInternal = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  role: z.enum(['jobSeeker', 'employer'], { required_error: "Please select a role." }),
});
export type LoginFormData = z.infer<typeof loginFormSchemaInternal>;


export interface AuthActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  userId?: number; 
  role?: 'jobSeeker' | 'employer';
  email?: string; 
  companyLogoUrl?: string | null;
  companyName?: string | null; // Added for QR login response
  validationErrors?: z.ZodIssue[];
}


export async function signUpAction(data: SignUpFormData): Promise<AuthActionResponse> {
  const validation = signUpFormSchemaInternal.safeParse(data);
  if (!validation.success) {
    return { error: "Invalid form data.", validationErrors: validation.error.errors };
  }

  const { email, password, role } = validation.data;
  const dbClient = db as Database;

  try {
    // Check if user already exists
    const existingUserStmt = dbClient.prepare('SELECT id FROM users WHERE email = ?');
    const existingUser = existingUserStmt.get(email);
    if (existingUser) {
      return { error: 'An account with this email already exists.' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertUserStmt = dbClient.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    );
    const info = insertUserStmt.run(email, hashedPassword, role);
    
    const userId = Number(info.lastInsertRowid);

    // If employer, create a default employer profile
    if (role === 'employer') {
      try {
        const insertProfileStmt = dbClient.prepare(
          'INSERT INTO employer_profiles (user_id, companyName, officialEmail, createdAt, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
        );
        // Use a placeholder company name initially and the user's email as officialEmail
        insertProfileStmt.run(userId, `Company for ${email}`, email); 
        console.log(`Created default employer profile for new user ID: ${userId}`);
      } catch (profileError: any) {
        if (profileError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          if (profileError.message.includes('employer_profiles.officialEmail')) {
            console.error(`Error creating default employer profile for user ID ${userId}: The email ${email} already exists in another employer profile. User account created, but profile needs manual setup.`);
            const deleteUserStmt = dbClient.prepare('DELETE FROM users WHERE id = ?');
            deleteUserStmt.run(userId); 
            return { 
              error: `An employer profile with the email '${email}' already exists. Please use a different email or contact support.`,
            };
          } else if (profileError.message.includes('employer_profiles.user_id')) {
            console.error(`Error creating default employer profile for user ID ${userId}: A profile for this user ID already exists. This is unexpected.`);
             const deleteUserStmt = dbClient.prepare('DELETE FROM users WHERE id = ?');
             deleteUserStmt.run(userId);
             return { error: 'An unexpected error occurred setting up your employer profile (duplicate user ID). Please contact support.' };
          }
        }
        console.error(`Error creating default employer profile for user ID ${userId}:`, profileError);
        const deleteUserStmt = dbClient.prepare('DELETE FROM users WHERE id = ?');
        deleteUserStmt.run(userId);
        return { error: `There was an issue setting up your employer profile. Please contact support.` };
      }
    }

    return { 
      success: true, 
      message: 'Account created successfully. Please log in.',
      userId: userId,
      role: role 
    };
  } catch (e: any) {
    console.error('Sign up error:', e);
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE' && e.message.includes('users.email')) {
         return { error: 'An account with this email already exists.' };
    }
    return { error: e.message || 'An unexpected error occurred during sign up.' };
  }
}

export async function loginAction(data: LoginFormData): Promise<AuthActionResponse> {
  const validation = loginFormSchemaInternal.safeParse(data);
  if (!validation.success) {
    return { error: "Invalid form data.", validationErrors: validation.error.errors };
  }

  const { email, password, role } = validation.data;
  const dbClient = db as Database;

  try {
    const userStmt = dbClient.prepare('SELECT id, email, password, role FROM users WHERE email = ?');
    const user = userStmt.get(email) as any;

    if (!user) {
      return { error: 'Invalid email or password.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { error: 'Invalid email or password.' };
    }

    if (user.role !== role) {
      return { error: `You are trying to log in as ${role}, but this account is registered as a ${user.role}.`};
    }
    
    let companyLogoUrl: string | null = null;
    let companyName: string | null = null;
    if (user.role === 'employer') {
        const profileStmt = dbClient.prepare('SELECT companyLogoUrl, companyName FROM employer_profiles WHERE user_id = ?');
        const profile = profileStmt.get(user.id) as { companyLogoUrl: string | null, companyName: string | null } | undefined;
        if (profile) {
            companyLogoUrl = profile.companyLogoUrl;
            companyName = profile.companyName;
        }
    }

    // Set authentication status in localStorage (client-side will handle this)
    return { 
      success: true, 
      message: 'Logged in successfully.',
      userId: user.id, 
      role: user.role as 'jobSeeker' | 'employer',
      email: user.email, 
      companyLogoUrl: companyLogoUrl,
      companyName: companyName,
    };
  } catch (e: any) {
    console.error('Login error:', e);
    return { error: e.message || 'An unexpected error occurred during login.' };
  }
}

export async function logoutAction(): Promise<AuthActionResponse> {
  console.log('Logout action initiated on server.');
  return { success: true, message: 'Logged out successfully.' };
}

// New action for QR Code Login - Renamed and enhanced
export async function getEmployerDetailsForQR(userId: number): Promise<{ email: string, companyLogoUrl: string | null, companyName: string | null } | null> {
  if (!userId || typeof userId !== 'number') {
    console.error("[getEmployerDetailsForQR] Invalid userId provided:", userId);
    return null;
  }
  const dbClient = db as Database;
  try {
    const userStmt = dbClient.prepare(`
      SELECT u.email, ep.companyLogoUrl, ep.companyName
      FROM users u
      LEFT JOIN employer_profiles ep ON u.id = ep.user_id
      WHERE u.id = ? AND u.role = 'employer'
    `);
    const result = userStmt.get(userId) as { email: string, companyLogoUrl: string | null, companyName: string | null } | undefined;

    if (result && result.email) {
      return { email: result.email, companyLogoUrl: result.companyLogoUrl, companyName: result.companyName };
    }
    console.warn(`[getEmployerDetailsForQR] No employer found with ID: ${userId}`);
    return null;
  } catch (e: any) {
    console.error(`[getEmployerDetailsForQR] Error fetching employer details for ID ${userId}:`, e);
    return null;
  }
}

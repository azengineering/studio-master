
// src/app/(roles)/jobSeeker/dashboard/profile-schema.ts
import { z } from 'zod';
import { parseISO, isValid as isValidDate, format } from 'date-fns';

export const QUALIFICATION_OPTIONS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Other"] as const;
export const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;
export const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed", "Prefer not to say"] as const;
export const CURRENT_INDUSTRY_TYPE_OPTIONS = ["Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Marketing", "Sales", "Customer Service", "Human Resources", "Design", "Construction", "Hospitality", "Logistics", "Other"] as const;
export const AVAILABILITY_OPTIONS = ["Immediate", "Within 15 days", "Within 30 days", "More than 30 days", "Not actively looking"] as const;
export const JOB_TYPE_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Remote"] as const;


export const urlOrDataUriSchema = z.string()
  .optional()
  .nullable()
  .refine((val) => {
    if (!val || val.trim() === '') return true;
    if (val.startsWith('data:application/pdf;base64,')) {
        const base64Data = val.substring(val.indexOf(',') + 1);
        const decodedLength = (base64Data.length * 3) / 4 - (base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0);
        if (decodedLength > (500 * 1024)) { // 500KB limit
            return false;
        }
        return true;
    }
    if (val.startsWith('http://') || val.startsWith('https://')) {
      try { new URL(val); return true; } catch { /* fall through */ }
    }
    // Allow www.example.com type inputs (they will be normalized in the form/save action)
    if (!val.startsWith('http://') && !val.startsWith('https://') && val.includes('.')) {
      try {
        // Attempt to create a URL to see if it's a plausible domain-like string
        new URL(`https://${val}`);
        return true;
      } catch (e) {
        return false; // Not a valid URL structure even with https prepended
      }
    }
    return false;
  }, {
    message: "Invalid URL. Please ensure it starts with http(s):// or www., or is a valid Data URI for uploads (max 500KB for PDFs).",
  });

export const educationDetailSchema = z.object({
  id: z.string().optional(), // Client-side ID from useFieldArray
  qualification: z.string().min(1, "Qualification is required."),
  stream: z.string().min(1, "Stream/Major is required.").max(100, "Stream/Major is too long."),
  institution: z.string().min(1, "Institution name is required.").max(150, "Institution name is too long."),
  yearOfCompletion: z.coerce
    .number({ invalid_type_error: "Year must be a number." })
    .int("Year must be an integer.")
    .min(1950, "Year seems too old.")
    .max(new Date().getFullYear() + 2, "Year cannot be too far in the future."), // Adjusted max year
  percentageMarks: z.coerce
    .number({ invalid_type_error: "Marks must be a number."})
    .min(0, "Marks cannot be negative.")
    .max(100, "Marks cannot exceed 100.")
    .optional()
    .nullable(),
});
export type EducationDetail = z.infer<typeof educationDetailSchema>;

export const experienceDetailSchema = z.object({
  id: z.string().optional(), // Client-side ID from useFieldArray
  companyName: z.string().min(1, "Company name is required.").max(100, "Company name is too long."),
  designation: z.string().min(1, "Designation is required.").max(100, "Designation is too long."),
  aboutCompany: z.string().max(500, "About company details cannot exceed 500 characters.").optional().nullable(),
  startDate: z.string()
    .min(7, "Start date required (MM-YYYY).")
    .max(7, "Start date format MM-YYYY.")
    .regex(/^(0[1-9]|1[0-2])-\d{4}$/, "Start date format MM-YYYY (e.g., 03-2020)."),
  endDate: z.string()
    .max(7, "End date format MM-YYYY.")
    .regex(/^(0[1-9]|1[0-2])-\d{4}$/, "End date format MM-YYYY (e.g., 03-2022).")
    .optional().nullable(),
  isPresent: z.boolean().default(false),
  responsibilities: z.string().max(1000, "Responsibilities cannot exceed 1000 characters.").optional().nullable(),
});
export type ExperienceDetail = z.infer<typeof experienceDetailSchema>;


export const jobSeekerProfileSchema = z.object({
  id: z.number().optional(), // This would be the ID from job_seeker_profiles table
  // Personal Details (Step 1)
  fullName: z.string().min(1, "Full name is required.").max(100, "Full name cannot exceed 100 characters.").optional().nullable(),
  email: z.string().email("Invalid email format.").optional().nullable(), // For display only
  phoneNumber: z.string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const phoneRegex = /^[+\d()-\s]{7,20}$/;
      return phoneRegex.test(val);
    }, {
      message: "Please enter a valid contact number (7-20 digits, can include +, -, (), spaces).",
    }),
  profilePictureUrl: z.string()
    .optional()
    .nullable()
    .refine((val) => !val || val.startsWith('data:image/') || val.startsWith('http') || val.startsWith('https://'), {
      message: "Invalid image data or URL.",
    }),
  resumeUrl: urlOrDataUriSchema,
  gender: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable()
    .refine(val => {
        if (!val) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
        const date = parseISO(val);
        if (!isValidDate(date)) return false;
        return true;
      }, { message: "Invalid date format. Please use YYYY-MM-DD."}),
  currentAddress: z.string().max(255, "Address is too long.").optional().nullable(),
  currentCity: z.string().max(100, "City name is too long.").optional().nullable(),
  currentPinCode: z.string().optional().nullable().refine(val => !val || /^\d{6}$/.test(val), { message: "Invalid Pin Code (6 digits)." }),
  correspondenceAddress: z.string().max(255, "Address is too long.").optional().nullable(),
  correspondenceCity: z.string().max(100, "City name is too long.").optional().nullable(),
  correspondencePinCode: z.string().optional().nullable().refine(val => !val || /^\d{6}$/.test(val), { message: "Invalid Pin Code (6 digits)." }),
  educationalDetails: z.array(educationDetailSchema).max(5, "Maximum 5 education entries allowed.").optional(),

  // Professional Details (Step 2)
  currentDesignation: z.string().max(100, "Designation too long.").optional().nullable(),
  currentDepartment: z.string().max(100, "Department too long.").optional().nullable(),
  currentIndustry: z.string().max(100, "Industry name too long.").optional().nullable(),
  currentIndustryType: z.string().optional().nullable(),
  otherCurrentIndustryType: z.string().max(100, "Other industry type too long.").optional().nullable(),
  preferredLocations: z.array(z.string().min(1, "Location cannot be empty.").max(100, "Location is too long."))
    .max(10, "Maximum 10 preferred locations allowed.")
    .optional(),
  totalExperience: z.coerce.number({invalid_type_error: "Total experience must be a number."}).nonnegative("Total experience cannot be negative.").optional().nullable(),
  presentSalary: z.string().max(50, "Present salary field too long.").optional().nullable(),
  skills: z.array(z.string().min(1, "Skill cannot be empty.").max(50, "Skill is too long."))
    .max(50, "Maximum 50 skills allowed.")
    .optional(),
  experienceDetails: z.array(experienceDetailSchema).max(10, "Maximum 10 experience entries allowed.").optional(),
  
  // Online Presence - Simplified to use urlOrDataUriSchema directly
  portfolioUrl: urlOrDataUriSchema,
  githubProfileUrl: urlOrDataUriSchema,
  otherSocialLinks: z.string().max(255, "Social links field too long.").optional().nullable(),
}).refine(data => {
  if (data.currentIndustryType === 'Other' && (!data.otherCurrentIndustryType || data.otherCurrentIndustryType.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please specify your industry type when 'Other' is selected.",
  path: ['otherCurrentIndustryType'],
}).refine(data => {
    if (data.experienceDetails) {
        for (const exp of data.experienceDetails) {
            if (!exp.isPresent && exp.startDate && exp.endDate) {
                const [startMonthStr, startYearStr] = exp.startDate.split('-');
                const [endMonthStr, endYearStr] = exp.endDate.split('-');
                const startYear = parseInt(startYearStr, 10);
                const startMonth = parseInt(startMonthStr, 10);
                const endYear = parseInt(endYearStr, 10);
                const endMonth = parseInt(endMonthStr, 10);

                if (endYear < startYear) return false;
                if (endYear === startYear && endMonth < startMonth) return false;
            }
        }
    }
    return true;
}, {
    message: "End date must be after start date for past experiences.",
    path: ["experienceDetails"], 
});

export type JobSeekerProfileFormData = z.infer<typeof jobSeekerProfileSchema>;

export const initialJobSeekerProfileValues: Omit<JobSeekerProfileFormData, 'linkedinProfileUrl' | 'professionalSummary'> & { linkedinProfileUrl?: string | null; professionalSummary?: string | null} = {
    fullName: null,
    email: null, 
    phoneNumber: null,
    profilePictureUrl: null,
    resumeUrl: null,
    gender: null,
    maritalStatus: null,
    dateOfBirth: null,
    currentAddress: null,
    currentCity: null,
    currentPinCode: null,
    correspondenceAddress: null,
    correspondenceCity: null,
    correspondencePinCode: null,
    educationalDetails: [],
    currentDesignation: null,
    currentDepartment: null,
    currentIndustry: null,
    currentIndustryType: null,
    otherCurrentIndustryType: null,
    preferredLocations: [],
    totalExperience: null,
    presentSalary: null,
    skills: [],
    experienceDetails: [],
    portfolioUrl: null,
    githubProfileUrl: null,
    otherSocialLinks: null,
};

export function validateJobSeekerProfileData(data: any) {
    return jobSeekerProfileSchema.safeParse(data);
}

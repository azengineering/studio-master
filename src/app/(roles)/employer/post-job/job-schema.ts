
// src/app/(roles)/employer/post-job/job-schema.ts
import { z } from 'zod';
import { VALID_JOB_STATUSES } from '@/app/(roles)/employer/dashboard/types';

export const customQuestionSchema = z.object({
  id: z.string().optional(),
  questionText: z.string().min(1, "Question text cannot be empty.").max(255, "Question text is too long."),
  answerType: z.enum(['text', 'yes_no'], { required_error: "Please select an answer type." }),
});
export type CustomQuestion = z.infer<typeof customQuestionSchema>;

export const jobFormBaseSchema = z.object({
  id: z.number().optional(),
  jobTitle: z.string().min(1, "Job title is required.").max(100, "Job title is too long."),
  industry: z.string().min(1, "Industry is required.").max(100, "Industry cannot exceed 100 characters."),
  industryType: z.string().min(1, "Industry Type is required."),
  otherIndustryType: z.string().optional().nullable(),
  jobType: z.string().min(1, "Job type is required."),
  jobLocation: z.string().min(1, "Job location is required.").max(100, "Job location cannot exceed 100 characters."),
  numberOfVacancies: z.coerce.number().int().min(1, "Number of vacancies must be at least 1.").default(1),
  qualification: z.string().min(1, "Qualification is required.").max(100, "Qualification cannot exceed 100 characters."),
  minimumExperience: z.coerce.number().nonnegative("Minimum experience cannot be negative.").default(0),
  maximumExperience: z.coerce.number().nonnegative("Maximum experience cannot be negative.").default(0),
  minimumSalary: z.coerce.number().int().min(0, "Minimum salary cannot be negative.").default(0),
  maximumSalary: z.coerce.number().int().min(0, "Maximum salary cannot be negative.").default(0),
  skillsRequired: z.array(z.string().min(1).max(50)).min(1, "At least one skill is required.").max(20, "Maximum 20 skills allowed."),
  additionalData: z.string().max(2000, {message: "Additional data cannot exceed 2000 characters."}).optional().nullable(),
  jobDescription: z.string().min(1, "Job description is required."),
  status: z.enum(VALID_JOB_STATUSES).default('draft').optional(),
  customQuestions: z.array(customQuestionSchema).max(10, "Maximum 10 custom questions allowed.").optional(),
});


export const JobFormDataSchema = jobFormBaseSchema.refine(data => {
  if (data.minimumExperience !== null && data.maximumExperience !== null && data.minimumExperience !== undefined && data.maximumExperience !== undefined) {
    return data.maximumExperience >= data.minimumExperience;
  }
  return true;
}, {
  message: "Maximum experience cannot be less than minimum experience.",
  path: ["maximumExperience"],
})
.refine(data => {
  if (data.minimumSalary !== null && data.maximumSalary !== null && data.minimumSalary !== undefined && data.maximumSalary !== undefined) {
    return data.maximumSalary >= data.minimumSalary;
  }
  return true;
}, {
  message: "Maximum salary cannot be less than minimum salary.",
  path: ["maximumSalary"],
})
.refine(data => {
  if (data.industryType === 'Other' && (!data.otherIndustryType || data.otherIndustryType.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please specify the industry type when 'Other' is selected.",
  path: ['otherIndustryType'],
});

export type JobFormData = z.infer<typeof JobFormDataSchema>;

// Extend the base schema for preview data
export const JobPreviewDataSchema = jobFormBaseSchema.extend({
   companyName: z.string().min(1, "Company name is required."),
   companyLogoUrl: z.string().url().optional().nullable(),
   createdAt: z.string().optional(),
   updatedAt: z.string().optional(),
   employer_user_id: z.number().optional(),
});

export type JobPreviewData = z.infer<typeof JobPreviewDataSchema>;

export const initialFormValues: JobFormData = {
    jobTitle: '',
    industry: '',
    industryType: '',
    otherIndustryType: null,
    jobType: '',
    jobLocation: '',
    numberOfVacancies: 1,
    qualification: '',
    minimumExperience: 0,
    maximumExperience: 0,
    minimumSalary: 0,
    maximumSalary: 0,
    skillsRequired: [],
    additionalData: null,
    jobDescription: '',
    customQuestions: [],
    status: 'draft',
};

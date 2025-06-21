// src/app/(roles)/employer/control/profile-schema.ts
import { z } from 'zod';

const urlWithWwwTransform = z.string()
  .optional()
  .nullable() // Allow null in addition to empty string or undefined
  .transform((val) => {
    if (val && val.trim() !== '') {
      if (val.startsWith('www.') && !val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      if (!val.startsWith('http://') && !val.startsWith('https://') && val.includes('.')) {
        // If it looks like a domain but has no scheme, prepend https://
        // This is a basic heuristic. More complex validation might be needed for all edge cases.
        try {
          // Test if it's a valid hostname, if so, prepend protocol
          const urlAttempt = new URL(`https://${val}`);
          if (urlAttempt.hostname === val) { // Basic check if it became a valid hostname
            return `https://${val}`;
          }
        } catch (e) {
          // Not a valid hostname on its own, let it pass to refine
        }
      }
    }
    return val;
  })
  .refine((val) => {
    if (!val || val.trim() === '') return true; // Allow empty string or null
    try {
      new URL(val); // Attempt to parse as URL
      return true;
    } catch (e) {
      return false;
    }
  }, {
    message: "Please enter a valid URL (e.g., https://example.com or www.example.com).",
  });


export const employerProfileSchema = z.object({
  id: z.number().optional(), 
  companyLogoUrl: z.string()
    .optional()
    .nullable() // Allow null
    .refine((val) => !val || val.startsWith('data:image/') || val.startsWith('http') || val.startsWith('https://'), { 
      message: "Invalid image data or URL. Please upload a valid image file or provide a URL starting with http(s):// or data:image/.",
    }),
  companyName: z.string().min(1, { message: "Company name is required." }).max(100, { message: "Company name cannot exceed 100 characters." }),
  address: z.string().max(255, { message: "Address cannot exceed 255 characters." }).optional().nullable(),
  officialEmail: z.string().email({ message: "Please enter a valid email address." }).min(1, { message: "Official email is required." }),
  contactNumber: z.string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true; // Allow empty string or null
      const phoneRegex = /^[+\d()-\s]{7,20}$/;
      return phoneRegex.test(val);
    }, {
      message: "Please enter a valid contact number (7-20 digits, can include +, -, (), spaces).",
    }),
  companyWebsite: urlWithWwwTransform,
  teamSize: z.coerce.number().int().min(1, { message: "Team size must be at least 1." }).optional().nullable().transform(val => val === 0 ? null : val),
  yearOfEstablishment: z.coerce.number()
    .int("Year must be an integer.")
    .min(1800, "Year seems too old.")
    .max(new Date().getFullYear(), "Year cannot be in the future.")
    .optional()
    .nullable().transform(val => val === 0 ? null : val),
  aboutCompany: z.string().max(1200, { message: "About company cannot exceed 1200 characters (approx. 200 words)." }).optional().nullable(),
  linkedinUrl: urlWithWwwTransform.optional().nullable().describe("LinkedIn company profile URL"),
  xUrl: urlWithWwwTransform.optional().nullable().describe("X (formerly Twitter) company profile URL"),
});

export type EmployerProfileFormData = z.infer<typeof employerProfileSchema>;

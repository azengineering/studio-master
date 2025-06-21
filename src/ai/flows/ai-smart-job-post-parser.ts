
'use server';
/**
 * @fileOverview An AI agent to parse unstructured job details and populate form fields, handles rate limiting.
 *
 * - smartJobPostParser - A function that parses raw job text into structured data.
 * - SmartJobPostParserInput - The input type for the smartJobPostParser function.
 * - SmartJobPostParserOutput - The return type for the smartJobPostParser function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SmartJobPostParserInputSchema = z.object({
  rawJobDetails: z.string().describe("The unstructured raw text of the job posting provided by the user."),
});
export type SmartJobPostParserInput = z.infer<typeof SmartJobPostParserInputSchema>;

// Output schema now matches JobFormData from post-job/job-schema.ts, EXCLUDING customQuestions and companyName
const SmartJobPostParserOutputSchema = z.object({
  jobTitle: z.string().optional().describe("Extracted job title (e.g., 'Software Engineer')."),
  // companyName is not extracted by AI, it comes from employer's profile
  industry: z.string().optional().nullable().describe("The industry the job belongs to (e.g., 'Technology', 'Healthcare')."),
  jobType: z.string().optional().nullable().describe("Type of employment (e.g., 'Full-time', 'Part-time', 'Contract')."),
  jobLocation: z.string().optional().nullable().describe("The location of the job (e.g., 'New York, NY', 'Remote')."),
  minimumExperience: z.number().nonnegative().optional().nullable().describe("Minimum years of experience required, as a number."),
  maximumExperience: z.number().nonnegative().optional().nullable().describe("Maximum years of experience preferred, as a number."),
  minimumSalary: z.number().int().min(0).optional().nullable().describe("Minimum annual salary, as an integer."),
  maximumSalary: z.number().int().min(0).optional().nullable().describe("Maximum annual salary, as an integer."),
  numberOfVacancies: z.number().int().min(1).optional().nullable().describe("Number of open positions for this job."),
  qualification: z.string().optional().nullable().describe("Minimum or preferred educational qualification (e.g., 'Bachelor's Degree in CS')."),
  skillsRequired: z.array(z.string()).optional().describe("An array of key skills required for the job (e.g., ['JavaScript', 'React', 'Node.js'])."),
  jobDescription: z.string().optional().describe("The main body of the job description, responsibilities, and any other text not fitting other fields. Should contain remaining text after other fields are populated. Use basic HTML like <p> and <ul><li> if structure is apparent."),
});
export type SmartJobPostParserOutput = z.infer<typeof SmartJobPostParserOutputSchema>;

export async function smartJobPostParser(input: SmartJobPostParserInput): Promise<SmartJobPostParserOutput> {
  return smartJobPostParserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartJobPostParserPrompt',
  maxTokens: 2048, 
  input: {schema: SmartJobPostParserInputSchema},
  output: {schema: SmartJobPostParserOutputSchema},
  prompt: `You are an AI assistant specialized in parsing unstructured job posting text. Your primary goal is to extract specific pieces of information into the structured fields defined in the output schema. Use the descriptions of each field in the output schema as your guide for extraction.

Key Instructions:
- Focus ONLY on extracting information explicitly present in the "Raw Job Details" provided. Do NOT infer or create information that isn't there.
- The 'companyName' field is NOT part of your output schema; do not attempt to extract it. It is handled separately.
- If a field's information is not found, omit it or use the appropriate null/empty default as per the schema description for that field (e.g., null for optional numbers, empty array for skillsRequired, empty string for jobDescription if all text mapped elsewhere).
- The 'skillsRequired' field should be an array of strings. Extract distinct skills.

Key Instructions for \`jobDescription\` field:
- The \`jobDescription\` field is crucial. It should capture the **primary content** of the job posting, such as detailed responsibilities, day-to-day tasks, core qualifications, and requirements not covered by specific fields like 'qualification' or 'skillsRequired'.
- Think of it as the main narrative part of the job ad.
- Extract all text related to what the candidate will *do*, what is *expected* of them, and the main *qualifications* and *experience* details for the role that are not covered by other structured fields.
- **After** you have populated all other specific fields (like jobTitle, location, salary, skills, etc.), **ALL remaining text** from the original \`rawJobDetails\` MUST be placed into this \`jobDescription\` field.
- This includes any introductory paragraphs about the role or company, benefits descriptions, application instructions, equal opportunity statements, or any other contextual information that does not cleanly fit other defined fields.
- Ensure no part of the original \`rawJobDetails\` is lost. If a piece of text does not fit any other structured field, it belongs in \`jobDescription\`.
- Format the \`jobDescription\` with basic HTML (e.g., \`<p>\` tags for paragraphs, \`<ul><li>\` for bullet points) if the structure is apparent in the input text. Avoid markdown.

- General: For any optional field where information is not present, ensure the output field is either omitted (if allowed by schema and no other default like null/empty array/string is specified), set to null (for numbers), an empty string (for an empty jobDescription), or an empty array (for skillsRequired). Do not invent information.
- Sanitize Content: For all string fields in your output, try to remove or replace any characters from the input text that are likely to be unsupported or cause rendering issues. Focus on producing clean, readable text. Do not include markdown or any other formatting characters other than basic HTML in the 'jobDescription' field.

Raw Job Details:
{{{rawJobDetails}}}
`,
});
  

const smartJobPostParserFlow = ai.defineFlow({
    name: 'smartJobPostParserFlow',
    inputSchema: SmartJobPostParserInputSchema,
    outputSchema: SmartJobPostParserOutputSchema,
  }, async (input): Promise<SmartJobPostParserOutput> => {
    
    const { rawJobDetails } = input;
    
    if (!rawJobDetails || rawJobDetails.trim() === '') {
      console.warn('SmartJobPostParser: rawJobDetails is empty or whitespace. Returning default output structure.');
      return {
        jobTitle: undefined,
        // companyName: undefined, // Not returned by AI
        industry: undefined,
        jobType: undefined,
        jobLocation: undefined,
        minimumExperience: null,
        maximumExperience: null,
        minimumSalary: null,
        maximumSalary: null,
        numberOfVacancies: null,
        qualification: null,
        skillsRequired: [],
        jobDescription: '',
      };
    }    
    
    const {output} = await prompt(input);

    if (!output) {
        console.warn("SmartJobPostParser: AI failed to return a valid result. Check AI model configuration or API status.");
        return {
            jobTitle: undefined,
            industry: undefined,
            jobType: undefined,
            jobLocation: undefined,
            minimumExperience: null,
            maximumExperience: null,
            minimumSalary: null,
            maximumSalary: null,
            numberOfVacancies: null,
            qualification: null,
            skillsRequired: [],
            jobDescription: '',
        };
    }

    return {
        jobTitle: output.jobTitle,
        // companyName: output.companyName, // Not part of AI output
        industry: output.industry,
        jobType: output.jobType,
        jobLocation: output.jobLocation,
        minimumExperience: (output.minimumExperience === undefined || output.minimumExperience === null) ? null : Number(output.minimumExperience),
        maximumExperience: (output.maximumExperience === undefined || output.maximumExperience === null) ? null : Number(output.maximumExperience),
        minimumSalary: (output.minimumSalary === undefined || output.minimumSalary === null) ? null : Number(output.minimumSalary),
        maximumSalary: (output.maximumSalary === undefined || output.maximumSalary === null) ? null : Number(output.maximumSalary),
        numberOfVacancies: (output.numberOfVacancies === undefined || output.numberOfVacancies === null) ? null : Number(output.numberOfVacancies),
        qualification: output.qualification,
        skillsRequired: output?.skillsRequired || [],
        jobDescription: output?.jobDescription || '',
    };
  }
);


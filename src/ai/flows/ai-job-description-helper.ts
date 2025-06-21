'use server';
/**
 * @fileOverview An AI agent to help generate job descriptions.
 *
 * - generateJobDescription - A function that generates a job description based on input.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateJobDescriptionInputSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required.").describe("The title of the job."),
  companyName: z.string().optional().describe("The name of the company (optional)."),
  industry: z.string().optional().describe("The industry of the job (optional)."),
  jobType: z.string().optional().describe("The type of employment (e.g., Full-time, Part-time) (optional)."),
  skillsRequired: z.array(z.string()).optional().describe("List of key skills for the job (optional)."),
  existingJobDescription: z.string().optional().describe("The current job description content, if any, to be modified (optional). The AI will refine this if provided."),
  customInstructions: z.string().min(1, "Instructions are required.").describe("Detailed instructions for the AI on what to generate or how to modify the job description. e.g., 'Create a job description emphasizing remote work' or 'Add a section about company benefits to the existing description.'"),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe("The generated job description in HTML format."),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

export async function generateJobDescription(input: GenerateJobDescriptionInput): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are an expert HR content writer specializing in crafting and refining compelling job descriptions.
Your primary task is to follow the user's instructions provided in "{{{customInstructions}}}".

Contextual Information for the Job:
Job Title: {{{jobTitle}}}
{{#if companyName}}Company Name: {{{companyName}}}{{/if}}
{{#if industry}}Industry: {{{industry}}}{{/if}}
{{#if jobType}}Job Type: {{{jobType}}}{{/if}}
{{#if skillsRequired}}Key Skills to consider: {{#each skillsRequired}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{/if}}

{{#if existingJobDescription}}
The user might want to modify the following existing job description. Use their \`customInstructions\` to guide your modifications.
Existing Job Description:
{{{existingJobDescription}}}
{{else}}
The user likely wants a new job description created from scratch, based on their \`customInstructions\` and the contextual information.
{{/if}}

Based on the user's instructions and the provided context (and existing description if available), generate or modify the job description.
The output MUST be in HTML format, using paragraphs (<p>), bullet points (<ul><li>), and bold text (<strong>) where appropriate for readability.

If creating a new job description (or if instructions imply a full rewrite), aim for a structure that typically includes:
1.  A brief, engaging introduction to the role (and company, if name provided).
2.  A section for Key Responsibilities (use bullet points).
3.  A section for Required Skills and Qualifications (use bullet points).
4.  A brief section about the company culture or what it's like to work there, if inferable from instructions or context.
5.  A call to action (e.g., "Apply now to join our team!").

Ensure the tone is professional, inclusive, and attractive to potential candidates. Focus on clarity and conciseness. Aim for a description that is informative but not overly lengthy.
The entire output must be a single HTML string for the 'jobDescription' field.
`,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input) => {
    // Validate essential input (already handled by Zod schema on input object)
    if (!input.jobTitle || !input.customInstructions) {
      throw new Error("Job title and custom instructions are essential for generating a job description.");
    }
    
    const {output} = await prompt(input);
    
    if (!output || !output.jobDescription) {
        throw new Error("AI failed to generate a job description.");
    }
    return output;
  }
);

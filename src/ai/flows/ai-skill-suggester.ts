'use server';
/**
 * @fileOverview An AI agent to suggest relevant skills based on job details.
 *
 * - suggestSkillsForJob - A function that suggests skills.
 * - SuggestSkillsInput - The input type for the suggestSkillsForJob function.
 * - SuggestSkillsOutput - The return type for the suggestSkillsForJob function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define schemas internally, do not export them
const SuggestSkillsInputSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required to suggest skills."),
  industry: z.string().optional().describe("The industry of the job (e.g., Technology, Healthcare)."),
  industryType: z.string().optional().describe("The specific type/category of the industry (e.g., SaaS, E-commerce, FinTech)."),
  jobDescription: z.string().optional().describe("The detailed job description. Providing this helps generate more relevant skills."),
  minimumExperience: z.number().optional().nullable().describe("Minimum years of experience required (optional)."),
});
export type SuggestSkillsInput = z.infer<typeof SuggestSkillsInputSchema>;

const SuggestSkillsOutputSchema = z.object({
  suggestedSkills: z.array(z.string()).max(20, "Up to 20 skills can be suggested.").describe("An array of suggested skills relevant to the job details provided."),
});
export type SuggestSkillsOutput = z.infer<typeof SuggestSkillsOutputSchema>;

export async function suggestSkillsForJob(input: SuggestSkillsInput): Promise<SuggestSkillsOutput> {
  return suggestSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSkillsPrompt',
  input: {schema: SuggestSkillsInputSchema}, // Use internal schema
  output: {schema: SuggestSkillsOutputSchema}, // Use internal schema
  prompt: `You are an expert HR assistant and technical recruiter specializing in identifying key skills for job roles.
Based on the following job details, please suggest a concise list of up to 20 relevant skills.
Prioritize skills that are commonly sought after for this type of role and industry.
Consider both technical (hard skills) and soft skills if appropriate from the context.
Return only the list of skill names in the 'suggestedSkills' array.

Job Details:
Job Title: {{{jobTitle}}}
{{#if industry}}Industry: {{{industry}}}{{/if}}
{{#if industryType}}Industry Type/Category: {{{industryType}}}{{/if}}
{{#if jobDescription}}
Job Description Snippet:
"{{{jobDescription}}}"
{{else}}
(No detailed job description provided, base suggestions primarily on title, industry, and experience level.)
{{/if}}
{{#if minimumExperience}}Minimum Experience: {{{minimumExperience}}} years{{/if}}

Focus on extracting or inferring specific, actionable skills. For example, instead of "programming", suggest "Python" or "JavaScript" if context allows.
Avoid very generic terms unless they are highly relevant and distinct.
`,
});

const suggestSkillsFlow = ai.defineFlow(
  {
    name: 'suggestSkillsFlow',
    inputSchema: SuggestSkillsInputSchema, // Use internal schema
    outputSchema: SuggestSkillsOutputSchema, // Use internal schema
  },
  async (input) => {
    if (!input.jobTitle) {
      throw new Error("Job title is essential for suggesting skills.");
    }
    const {output} = await prompt(input);
    return { suggestedSkills: output?.suggestedSkills || [] };
  }
);

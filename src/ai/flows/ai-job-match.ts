'use server';

/**
 * @fileOverview An AI-powered job matching flow that provides relevant job recommendations to job seekers.
 *
 * - relevantJobRecommendations - A function that takes a job seeker's profile and job descriptions as input and returns relevant job recommendations.
 * - RelevantJobRecommendationsInput - The input type for the relevantJobRecommendations function.
 * - RelevantJobRecommendationsOutput - The return type for the relevantJobRecommendations function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RelevantJobRecommendationsInputSchema = z.object({
  jobSeekerProfile: z
    .string()
    .describe('A detailed profile of the job seeker, including skills, experience, and preferences.'),
  jobDescriptions: z
    .array(z.string())
    .describe('An array of job descriptions to be analyzed for relevance.'),
});
export type RelevantJobRecommendationsInput = z.infer<
  typeof RelevantJobRecommendationsInputSchema
>;

const RelevantJobRecommendationsOutputSchema = z.object({
  recommendedJobs: z
    .array(z.string())
    .describe('An array of job descriptions ranked by relevance to the job seeker profile.'),
});
export type RelevantJobRecommendationsOutput = z.infer<
  typeof RelevantJobRecommendationsOutputSchema
>;

export async function relevantJobRecommendations(
  input: RelevantJobRecommendationsInput
): Promise<RelevantJobRecommendationsOutput> {
  return relevantJobRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'relevantJobRecommendationsPrompt',
  input: {
    schema: z.object({
      jobSeekerProfile: z
        .string()
        .describe(
          'A detailed profile of the job seeker, including skills, experience, and preferences.'
        ),
      jobDescriptions: z
        .array(z.string())
        .describe('An array of job descriptions to be analyzed for relevance.'),
    }),
  },
  output: {
    schema: z.object({
      recommendedJobs: z
        .array(z.string())
        .describe(
          'An array of job descriptions ranked by relevance to the job seeker profile.'
        ),
    }),
  },
  prompt: `You are an AI-powered job matching expert. Analyze the job seeker's profile and the provided job descriptions to identify the most relevant job opportunities.

Job Seeker Profile: {{{jobSeekerProfile}}}

Job Descriptions:
{{#each jobDescriptions}}- {{{this}}}
{{/each}}

Based on the job seeker's profile and the job descriptions, provide a ranked list of job descriptions, ordered by relevance. Only return the job descriptions, not any other explanation.
`,
});

const relevantJobRecommendationsFlow = ai.defineFlow<
  typeof RelevantJobRecommendationsInputSchema,
  typeof RelevantJobRecommendationsOutputSchema
>(
  {
    name: 'relevantJobRecommendationsFlow',
    inputSchema: RelevantJobRecommendationsInputSchema,
    outputSchema: RelevantJobRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

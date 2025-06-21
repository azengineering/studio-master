
'use server';
/**
 * @fileOverview An AI agent to generate company profile details from a website URL.
 *
 * - generateCompanyProfileFromWebsite - A function that extracts company profile information.
 * - GenerateCompanyProfileFromWebsiteInput - The input type.
 * - GenerateCompanyProfileFromWebsiteOutput - The return type.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateCompanyProfileFromWebsiteInputSchema = z.object({
  companyWebsite: z.string().url().describe('The URL of the company website. The AI will base its response on common patterns and information typically found on such sites, not by live browsing.'),
});
export type GenerateCompanyProfileFromWebsiteInput = z.infer<typeof GenerateCompanyProfileFromWebsiteInputSchema>;

const GenerateCompanyProfileFromWebsiteOutputSchema = z.object({
  companyName: z.string().optional().describe("The official or commonly known name of the company. Extract this as accurately as possible, often found in the site header, footer, or 'About Us' page."),
  address: z.string().optional().describe("The full physical company address (street, city, state, zip code, and country if available). Look for 'Contact Us', 'Locations', or footer sections for this data."),
  officialEmail: z.string().optional().describe("The main contact email address (e.g., info@, contact@, support@). This should be a general company email, not a personal one. Often found on 'Contact Us' or in the footer."),
  contactNumber: z.string().optional().describe("The primary contact phone number, including country code if typically present. Look for this in contact sections or footers."),
  companyWebsite: z.string().optional().nullable().describe("The main website URL of the company. Extract the canonical URL if multiple variations seem present (e.g., prefer https over http, non-www over www if both appear equivalent)."),
  teamSize: z.number().int().optional().nullable().describe("The approximate number of employees or team size as an integer (e.g., 50, 200, 1000). Infer from 'About Us', 'Careers' (e.g., 'Join our team of X people'), or company description if available. If a range is mentioned (e.g., 50-100), try to pick a representative number or the lower end. Return null if not found."),
  yearOfEstablishment: z.number().int().optional().nullable().describe("The year the company was established or founded, as a four-digit integer (e.g., 1998, 2010). Look for phrases like 'Founded in YYYY' or 'Established YYYY' in 'About Us' or company history sections. Return null if not found."),
  aboutCompany: z.string().optional().describe("A comprehensive summary (150-250 words) of the company's mission, vision, core services/products, target audience, and what it primarily does. Synthesize information from typical 'About Us', 'Our Mission', 'Services', or homepage introductory sections. Focus on factual statements and key value propositions. Avoid overly vague or marketing-heavy sentences if possible; prioritize substance."),
  linkedinUrl: z.string().optional().nullable().describe("The company's official LinkedIn profile URL. Look for LinkedIn icons or links in the footer, 'Contact Us', or 'About Us' sections. Return null if not found."),
  xUrl: z.string().optional().nullable().describe("The company's official X (formerly Twitter) profile URL. Look for X or Twitter icons/links in the footer, 'Contact Us', or 'About Us' sections. Return null if not found."),
});
export type GenerateCompanyProfileFromWebsiteOutput = z.infer<typeof GenerateCompanyProfileFromWebsiteOutputSchema>;

export async function generateCompanyProfileFromWebsite(input: GenerateCompanyProfileFromWebsiteInput): Promise<GenerateCompanyProfileFromWebsiteOutput> {
  return generateCompanyProfileFromWebsiteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCompanyProfileFromWebsitePrompt',
  input: {schema: GenerateCompanyProfileFromWebsiteInputSchema},
  output: {schema: GenerateCompanyProfileFromWebsiteOutputSchema},
  prompt: `You are an expert AI assistant tasked with extracting structured company information based on a provided website URL.
You will NOT browse the live URL: {{{companyWebsite}}}.
Instead, you must simulate a deep analysis of the typical information architecture and content found across various standard pages of a company website (such as Homepage, About Us, Contact Us, Services/Products, Careers, Blog, Footer, etc.).
Your goal is to populate the fields in the output schema by inferring details as if you had read these common sections.

Consider the following when generating the information for each field:
- companyName: What is the most prominent name used? Is there a legal name vs. a brand name? Typically found in site headers, footers, or "About Us".
- address: Where would the main corporate office or contact address typically be listed? (e.g., 'Contact Us', 'Locations' page, footer). Be as complete as possible (street, city, state, zip, country).
- officialEmail: What general email addresses (info@, support@, contact@, press@) are commonly found? Avoid personal-looking emails. Usually in "Contact Us" or footers.
- contactNumber: Where is the primary phone number usually displayed? Include country code if common.
- companyWebsite: What is the primary, canonical website URL? This might be similar to the input URL, but ensure it's well-formed.
- teamSize: How might a company indicate its size? (e.g., statements like "We are a team of 500 passionate professionals" on an 'About Us' or 'Careers' page, or descriptions implying scale like 'global presence'). If a range is given (e.g., "100-200 employees"), pick a representative number or the lower end. If no direct mention, can it be inferred from the company's description of its reach or market presence? Return null if no reasonable inference can be made.
- yearOfEstablishment: Look for phrases like "Founded in YYYY," "Established in YYYY," "Serving customers since YYYY," or copyright notices in the footer that might indicate an early year. Typically found in 'About Us' or company history sections. Return null if not found.
- aboutCompany: Synthesize a rich description. What is its mission? What are its core products/services? Who is its target audience? What problems does it solve? What makes it unique? Imagine extracting this from introductory paragraphs on the Homepage, dedicated 'About Us' or 'Our Story' pages, service descriptions, and the overall company narrative presented. Aim for a concise yet informative summary of 150-250 words.
- linkedinUrl: Where are social media links, especially LinkedIn, usually placed? (Footer, contact page, newsroom, 'About Us'). Extract the full, direct URL to the company's LinkedIn page. Return null if not found.
- xUrl: Similarly, where would an X (Twitter) link typically be found? Extract the full, direct URL. Return null if not found.

Prioritize factual-sounding information that one would typically find on a well-structured company website. If a piece of information is not commonly found or cannot be reasonably inferred even from a thorough (simulated) multi-page analysis, leave the field blank or return null as appropriate based on the field's schema description. Do NOT invent information.
Be precise and stick to the information types described for each field.
`,
});

const generateCompanyProfileFromWebsiteFlow = ai.defineFlow(
  {
    name: 'generateCompanyProfileFromWebsiteFlow',
    inputSchema: GenerateCompanyProfileFromWebsiteInputSchema,
    outputSchema: GenerateCompanyProfileFromWebsiteOutputSchema,
  },
  async (input): Promise<GenerateCompanyProfileFromWebsiteOutput> => {
    const {output} = await prompt(input);

    // Ensure numeric fields are correctly typed or null
    const teamSize = output?.teamSize;
    const yearOfEstablishment = output?.yearOfEstablishment;

    return {
        companyName: output?.companyName,
        address: output?.address,
        officialEmail: output?.officialEmail,
        contactNumber: output?.contactNumber,
        companyWebsite: output?.companyWebsite || null,
        teamSize: (teamSize === undefined || teamSize === null || isNaN(Number(teamSize))) ? null : Number(teamSize),
        yearOfEstablishment: (yearOfEstablishment === undefined || yearOfEstablishment === null || isNaN(Number(yearOfEstablishment)) || Number(yearOfEstablishment) === 0) ? null : Number(yearOfEstablishment),
        aboutCompany: output?.aboutCompany,
        linkedinUrl: output?.linkedinUrl || null,
        xUrl: output?.xUrl || null,
    };
  }
);

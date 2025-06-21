'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { relevantJobRecommendations } from '@/ai/flows/ai-job-match';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert component
import { Separator } from '@/components/ui/separator';

export default function JobSeekerToolsPage() {
  const [profileInput, setProfileInput] = useState('');
  const [jobDescriptionsInput, setJobDescriptionsInput] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    const trimmedProfile = profileInput.trim();
    const trimmedJobs = jobDescriptionsInput.trim();

    if (!trimmedProfile || !trimmedJobs) {
      toast({
        title: 'Input Required',
        description: 'Please provide your profile details and at least one job description.',
        variant: 'destructive',
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    setRecommendations([]); // Clear previous recommendations

    try {
      const descriptionsArray = trimmedJobs.split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 5); // Basic filter for very short lines

      if (descriptionsArray.length === 0) {
         toast({
           title: 'Invalid Job Descriptions',
           description: 'Please enter valid job descriptions, each on a new line.',
           variant: 'destructive',
           duration: 4000,
         });
         setIsLoading(false);
         return;
      }

      const result = await relevantJobRecommendations({
        jobSeekerProfile: trimmedProfile,
        jobDescriptions: descriptionsArray,
      });

       if (!result || !result.recommendedJobs || result.recommendedJobs.length === 0) {
            toast({
                title: 'No Recommendations Found',
                description: 'The AI could not find relevant matches based on the input. Try refining your profile or job descriptions.',
                variant: 'default', // Use default or a specific "warning" style if available
                 duration: 5000,
            });
            setRecommendations([]); // Ensure recommendations are empty
       } else {
            setRecommendations(result.recommendedJobs);
            toast({
              title: 'Recommendations Ready!',
              description: `AI has ranked ${result.recommendedJobs.length} job(s) based on your profile.`,
              variant: 'default',
              duration: 3000,
            });
       }

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to generate recommendations due to an internal error. Please try again later.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-screen-lg py-12 space-y-8">
      <Card className="shadow-lg border border-border rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-secondary/50 to-card p-6">
          <CardTitle className="text-2xl text-primary flex items-center gap-2">
             <Wand2 className="h-6 w-6"/> AI Job Matcher
          </CardTitle>
          <CardDescription>Paste your profile/resume details and job descriptions (one per line) to discover the best matches.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="profileInput" className="block text-sm font-medium text-foreground mb-2">Your Profile / Resume Details</label>
              <Textarea
                id="profileInput"
                placeholder="Paste your skills, experience summary, education, career goals..."
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                rows={12}
                className="transition-default focus:ring-primary focus:border-primary resize-y"
                aria-label="Your Profile or Resume Details Input"
              />
              <p className="text-xs text-muted-foreground mt-1">The more detail, the better the match.</p>
            </div>
            <div>
             <label htmlFor="jobDescriptionsInput" className="block text-sm font-medium text-foreground mb-2">Job Descriptions (One per line)</label>
             <Textarea
               id="jobDescriptionsInput"
               placeholder="Paste full job descriptions here, each starting on a new line."
               value={jobDescriptionsInput}
               onChange={(e) => setJobDescriptionsInput(e.target.value)}
               rows={12}
               className="transition-default focus:ring-primary focus:border-primary resize-y"
               aria-label="Job Descriptions Input"
             />
               <p className="text-xs text-muted-foreground mt-1">Separate each job description clearly.</p>
            </div>
          </div>

           <Separator className="my-6" />

          <div className="flex justify-center">
             <Button onClick={handleGetRecommendations} disabled={isLoading} className="bg-primary hover:bg-primary/90 h-11 px-8 text-base transition-default">
               {isLoading ? (
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
               ) : (
                 <Wand2 className="mr-2 h-5 w-5" />
               )}
               {isLoading ? 'Analyzing...' : 'Get AI Recommendations'}
             </Button>
          </div>


          {/* Results Section */}
           {(isLoading || recommendations.length > 0 || (!isLoading && recommendations.length === 0 && (profileInput || jobDescriptionsInput))) && ( // Show section if loading, has results, or attempted with no results
             <div className="mt-8 border-t border-border pt-8">
               <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                 <FileText className="h-5 w-5"/> Matching Results
               </h3>
               {isLoading ? (
                 <div className="flex items-center justify-center p-8 space-x-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin"/>
                    <span>Analyzing jobs against your profile...</span>
                 </div>
               ) : recommendations.length > 0 ? (
                 <div className="space-y-4">
                   <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                     <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                     <AlertTitle className="text-green-800 dark:text-green-300">Recommendations Ready</AlertTitle>
                     <AlertDescription className="text-green-700 dark:text-green-400">
                       Jobs ranked by relevance to your profile. Review the details below.
                     </AlertDescription>
                   </Alert>
                   {recommendations.map((job, index) => (
                     <Card key={index} className="bg-card border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                       <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job}</p>
                       {/* TODO: Consider adding action buttons (e.g., View Original, Save) */}
                     </Card>
                   ))}
                 </div>
               ) : (
                 // Show this only if an attempt was made (inputs were present) but no results
                 profileInput.trim() && jobDescriptionsInput.trim() && (
                     <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                       <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                       <AlertTitle className="text-yellow-800 dark:text-yellow-300">No Matches Found</AlertTitle>
                       <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                         The AI couldn't find strong matches with the provided information. Try adding more detail to your profile or using different job descriptions.
                       </AlertDescription>
                     </Alert>
                   )
               )}
             </div>
           )}
        </CardContent>
      </Card>
       {/* TODO: Add placeholders for other tools like Resume Builder, Interview Prep etc. */}
       {/*
       <Card>
         <CardHeader>
           <CardTitle>Resume Builder (Coming Soon)</CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-muted-foreground">Create a professional resume with AI assistance.</p>
         </CardContent>
       </Card>
       */}
    </div>
  );
}

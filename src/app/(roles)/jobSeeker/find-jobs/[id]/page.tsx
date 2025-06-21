
'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter as StandardDialogFooter, // Aliasing to avoid conflict if needed locally
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Building, MapPin, Activity, Type, PackageCheck, UsersRound,
  CalendarDays, DollarSignIcon, Tags, InfoIcon as Info, FileText, HelpCircle, Send, Bookmark, Share2, AlertTriangle, Loader2, Clock, Globe, Linkedin, CheckCircle, Eye, Briefcase as BriefcaseIcon, BriefcaseBusiness, UserCircle as UserProfileIcon, ListChecks
} from 'lucide-react';
import { getJobDetailsById, getSimilarJobs, getOtherJobsByCompany } from './actions';
import { saveJobAction } from '../actions'; // Corrected path for saveJobAction
import { submitApplicationAction } from './actions'; // submitApplicationAction is from local actions
import type { JobSeekerJobPreviewData, SuggestedJobData, PublicCompanyProfileData } from './schema';
import type { CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';
import { ApplyFlowDialogs } from './ApplyFlowDialogs';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { useToast } from '@/hooks/use-toast';
import LoadingJobDetail from './loading';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyPublicProfileDialog } from '@/components/dialogs/CompanyPublicProfileDialog';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';


interface TopNavigationBarProps {
  onBack: () => void;
  onViewJobActivities: () => void;
}

const TopNavigationBar: React.FC<TopNavigationBarProps> = React.memo(({ onBack, onViewJobActivities }) => (
  <div className="w-full mb-4">
    <div className="flex justify-end mb-4">
      <Button
        variant="default"
        size="sm"
        onClick={onViewJobActivities}
        className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm flex items-center gap-2"
      >
        <BriefcaseIcon className="h-4 w-4" /> My Job Activities
      </Button>
    </div>
    <div className="w-full flex justify-between items-center">
      <Button variant="outline" onClick={onBack} className="group h-9 text-sm">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Listings
      </Button>
    </div>
  </div>
));
TopNavigationBar.displayName = 'TopNavigationBar';

interface JobHeaderProps {
  job: JobSeekerJobPreviewData;
  postedDate: string;
  onViewCompanyProfile: () => void;
  onSaveJobToggle: () => void;
  onShareJob: () => void;
  onApply: () => void;
  isSavingJob: boolean;
  isApplying: boolean;
}

const JobHeader: React.FC<JobHeaderProps> = React.memo(({ job, postedDate, onViewCompanyProfile, onSaveJobToggle, onShareJob, onApply, isSavingJob, isApplying }) => {
  const salaryDisplay = useMemo(() => {
    if ((job.minimumSalary === null || job.minimumSalary === undefined || job.minimumSalary === 0) && (job.maximumSalary === null || job.maximumSalary === undefined || job.maximumSalary === 0)) return null;
    const minLakh = job.minimumSalary ? (job.minimumSalary / 100000).toFixed(1) : null;
    const maxLakh = job.maximumSalary ? (job.maximumSalary / 100000).toFixed(1) : null;
    if (minLakh && parseFloat(minLakh) > 0 && maxLakh && parseFloat(maxLakh) > 0) {
      if (parseFloat(minLakh) < parseFloat(maxLakh)) return `(₹${minLakh}L - ₹${maxLakh}L PA)`;
      if (parseFloat(minLakh) === parseFloat(maxLakh)) return `(₹${minLakh}L PA)`;
      return `(₹${minLakh}L PA)`;
    }
    if (minLakh && parseFloat(minLakh) > 0) return `(From ₹${minLakh}L PA)`;
    if (maxLakh && parseFloat(maxLakh) > 0) return `(Up to ₹${maxLakh}L PA)`;
    return "(Not Disclosed)";
  }, [job.minimumSalary, job.maximumSalary]);

  return (
    <CardHeader className="p-6 bg-gradient-to-br from-card to-secondary/10 border-b border-border">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <button
          onClick={onViewCompanyProfile}
          className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20 bg-background shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 hover:border-primary transition-all"
          aria-label={`View company profile for ${job.companyName}`}
        >
          <Image src={job.companyLogoUrl || 'https://placehold.co/64x64.png'} alt={`${job.companyName} logo`} fill style={{ objectFit: 'contain' }} className="p-0.5" data-ai-hint="company office" sizes="64px" />
        </button>

        <div className="flex-grow pt-1 space-y-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-primary leading-tight">{job.jobTitle}</h1>
            <div className="flex items-center gap-0.5 mt-0.5 flex-shrink-0 whitespace-nowrap">
              <p className="text-xs text-muted-foreground mr-2 whitespace-nowrap flex items-center">
                <Clock className="inline-block h-3.5 w-3.5 mr-1 align-text-bottom text-primary/80" /> Posted: {postedDate}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onSaveJobToggle} className={cn("h-9 w-9 p-0", job.isSaved ? 'text-primary fill-primary' : 'text-primary/70 hover:text-primary')} disabled={isSavingJob} aria-label={job.isSaved ? "Unsave Job" : "Save Job"}>
                    {isSavingJob && !job.isSaved ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={cn("h-5 w-5", job.isSaved && "fill-current")} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{job.isSaved ? "Unsave Job" : "Save Job"}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onShareJob} className="h-9 w-9 p-0 text-primary/70 hover:text-primary"><Share2 className="h-5 w-5" /></Button>
                </TooltipTrigger>
                <TooltipContent><p>Share Job</p></TooltipContent>
              </Tooltip>
              <Button onClick={onApply} variant="default" size="sm" className={cn("h-9 px-3 text-sm", job.isApplied ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90")} disabled={job.isApplied || isApplying}>
                {isApplying && !job.isApplied ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : (job.isApplied ? <CheckCircle className="mr-1.5 h-4 w-4" /> : <Send className="mr-1.5 h-4 w-4" />)}
                {job.isApplied ? "Applied" : "Quick Apply"}
              </Button>
            </div>
          </div>
          <button onClick={onViewCompanyProfile} className="text-base md:text-lg text-foreground font-medium hover:underline hover:text-primary flex items-center focus:outline-none truncate">
            <Building className="inline-block h-4 w-4 mr-1.5 align-text-bottom shrink-0" /> <span className="truncate">{job.companyName}</span>
          </button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {job.jobLocation && <p className="flex items-center text-muted-foreground"><MapPin className="mr-1 h-4 w-4 text-primary/80" /> {job.jobLocation}</p>}
            {salaryDisplay && <p className="flex items-center text-foreground font-semibold">{salaryDisplay}</p>}
            <div className="flex items-center gap-2 ml-auto">
                {job.companyWebsite && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="outline" className="text-primary border-primary/50 hover:bg-primary/10 h-7 px-2 text-xs" asChild>
                        <a href={job.companyWebsite.startsWith('http') ? job.companyWebsite : `https://${job.companyWebsite}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" /> Website
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Visit Company Website</p></TooltipContent>
                  </Tooltip>
                )}
                {job.linkedinUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" className="bg-sky-600 hover:bg-sky-700 text-white h-7 px-2 text-xs" asChild>
                        <a href={job.linkedinUrl.startsWith('http') ? job.linkedinUrl : `https://${job.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 fill-current"><title>LinkedIn</title><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.772 13.019H3.565V9h3.544v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"></path></svg>
                          LinkedIn
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>View LinkedIn Profile</p></TooltipContent>
                  </Tooltip>
                )}
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
});
JobHeader.displayName = 'JobHeader';

interface JobOverviewDetailsProps { job: JobSeekerJobPreviewData; }
const JobOverviewDetails: React.FC<JobOverviewDetailsProps> = React.memo(({ job }) => {
  const experienceDisplay = useMemo(() => {
    if ((job.minimumExperience === null || job.minimumExperience === undefined || job.minimumExperience < 0) && (job.maximumExperience === null || job.maximumExperience === undefined || job.maximumExperience < 0)) return "Not Specified";
    if (job.minimumExperience === 0 && (job.maximumExperience === 0 || job.maximumExperience === null || job.maximumExperience === undefined)) return "Fresher";
    if (job.minimumExperience !== null && job.minimumExperience !== undefined && job.maximumExperience !== null && job.maximumExperience !== undefined) {
      if (job.minimumExperience < job.maximumExperience) return `${job.minimumExperience}-${job.maximumExperience} Yrs`;
      if (job.minimumExperience === job.maximumExperience && job.minimumExperience > 0) return `${job.minimumExperience} Yrs`;
      if (job.minimumExperience > 0) return `${job.minimumExperience}+ Yrs`;
    }
    if (job.minimumExperience !== null && job.minimumExperience !== undefined && job.minimumExperience > 0) return `${job.minimumExperience}+ Yrs`;
    if (job.maximumExperience !== null && job.maximumExperience !== undefined && job.maximumExperience > 0) return `Up to ${job.maximumExperience} Yrs`;
    return "Not Specified";
  }, [job.minimumExperience, job.maximumExperience]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Job Overview</h2>
      <div className="space-y-3 text-sm">
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {job.industry && <div className="flex items-start gap-2"> <Activity className="h-5 w-5 text-accent mt-0.5 shrink-0" /> <div><p className="font-semibold text-foreground">Industry:</p><p className="text-muted-foreground">{job.industry}</p></div> </div>}
            {job.industryType && <div className="flex items-start gap-2"> <BriefcaseIcon className="h-5 w-5 text-accent mt-0.5 shrink-0" /> <div><p className="font-semibold text-foreground">Industry Type:</p><p className="text-muted-foreground">{job.industryType}</p></div> </div>}
            {job.jobType && <div className="flex items-start gap-2"> <Type className="h-5 w-5 text-accent mt-0.5 shrink-0" /> <div><p className="font-semibold text-foreground">Job Type:</p><p className="text-muted-foreground">{job.jobType}</p></div> </div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {job.qualification && <div className="flex items-start gap-2"> <PackageCheck className="h-5 w-5 text-accent mt-0.5 shrink-0" /> <div><p className="font-semibold text-foreground">Qualification:</p><p className="text-muted-foreground">{job.qualification}</p></div> </div>}
            {experienceDisplay !== "Not Specified" && <div className="flex items-start gap-2"> <CalendarDays className="h-5 w-5 text-accent mt-0.5 shrink-0" /> <div><p className="font-semibold text-foreground">Experience:</p><p className="text-muted-foreground">{experienceDisplay}</p></div> </div>}
            {job.numberOfVacancies !== null && <div className="flex items-start gap-2"> <UsersRound className="h-5 w-5 text-accent mt-0.5 shrink-0" /> <div><p className="font-semibold text-foreground">Vacancies:</p><p className="text-muted-foreground">{job.numberOfVacancies}</p></div> </div>}
        </div>
      </div>
    </section>
  );
});
JobOverviewDetails.displayName = 'JobOverviewDetails';

interface JobSkillsDisplayProps { skills: string[]; }
const JobSkillsDisplay: React.FC<JobSkillsDisplayProps> = React.memo(({ skills }) => {
  if (!skills || skills.length === 0) return null;
  return (
    <section>
      <Separator className="my-6"/>
      <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><Tags className="h-5 w-5 text-primary" />Key Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => <Badge key={index} variant="secondary" className="text-sm px-3 py-1">{skill}</Badge>)}
      </div>
    </section>
  );
});
JobSkillsDisplay.displayName = 'JobSkillsDisplay';

interface JobAdditionalInformationProps { additionalData: string | null; }
const JobAdditionalInformation: React.FC<JobAdditionalInformationProps> = React.memo(({ additionalData }) => {
  if (!additionalData) return null;
  return (
    <section>
      <Separator className="my-6"/>
      <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Additional Information</h2>
      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: additionalData }} />
    </section>
  );
});
JobAdditionalInformation.displayName = 'JobAdditionalInformation';

interface JobFullDescriptionProps { description: string; }
const JobFullDescription: React.FC<JobFullDescriptionProps> = React.memo(({ description }) => (
  <section>
    <Separator className="my-6"/>
    <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Full Job Description</h2>
    <div className="prose prose-sm max-w-none p-4 border border-border rounded-lg bg-background shadow-inner text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: description || '<p class="italic">No full description provided.</p>' }} />
  </section>
));
JobFullDescription.displayName = 'JobFullDescription';

interface JobScreeningQuestionsDisplayProps { questions?: CustomQuestion[]; }
const JobScreeningQuestionsDisplay: React.FC<JobScreeningQuestionsDisplayProps> = React.memo(({ questions }) => {
  if (!questions || questions.length === 0) return null;
  return (
    <section>
      <Separator className="my-6"/>
      <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />Screening Questions</h2>
      <div className="space-y-3">
        {questions.map((q, index) => (
          <Card key={q.id || index} className="p-3 bg-muted/30 border-border/70 rounded-md">
            <p className="font-medium text-sm text-foreground">{q.questionText}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Answer Type: {q.answerType === 'yes_no' ? 'Yes/No' : 'Text'}</p>
          </Card>
        ))}
      </div>
    </section>
  );
});
JobScreeningQuestionsDisplay.displayName = 'JobScreeningQuestionsDisplay';

interface JobDetailCardFooterProps { job: JobSeekerJobPreviewData; onApply: () => void; isApplying: boolean;}
const JobDetailCardFooter: React.FC<JobDetailCardFooterProps> = React.memo(({ job, onApply, isApplying }) => (
  <CardFooter className="p-6 bg-secondary/10 border-t border-border flex justify-end">
    <Button onClick={onApply} variant="default" size="lg" className={cn("h-11 px-8 text-base font-semibold transition-default", job.isApplied ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90")} disabled={job.isApplied || isApplying}>
      {isApplying && !job.isApplied ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (job.isApplied ? <CheckCircle className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />)}
      {job.isApplied ? "Applied" : "Quick Apply"}
    </Button>
  </CardFooter>
));
JobDetailCardFooter.displayName = 'JobDetailCardFooter';

interface SuggestedJobCardItemProps { job: SuggestedJobData; showCompanyLogo?: boolean; }
const SuggestedJobCardItem: React.FC<SuggestedJobCardItemProps> = React.memo(({ job, showCompanyLogo = true }) => (
  <NextLink href={`/jobSeeker/find-jobs/${job.id}`} passHref legacyBehavior>
    <a className="block h-full">
      <div className={cn("p-3 border border-border rounded-md hover:bg-muted/50 hover:shadow-sm transition-all cursor-pointer bg-card h-full flex flex-col", !showCompanyLogo && "items-start")}>
        <div className={cn("flex items-start gap-3", !showCompanyLogo && "w-full")}>
          {showCompanyLogo && (
            <div className="relative h-10 w-10 rounded-md overflow-hidden border bg-background shrink-0 shadow-sm">
              <Image src={job.companyLogoUrl || 'https://placehold.co/40x40.png'} alt={`${job.companyName} logo`} fill style={{ objectFit: 'contain' }} className="p-0.5" data-ai-hint="company building" sizes="40px"/>
            </div>
          )}
          <div className={cn("flex-grow min-w-0 space-y-0.5", !showCompanyLogo && "ml-0 w-full")}>
            <h3 className="font-semibold text-sm text-foreground truncate" title={job.jobTitle}>{job.jobTitle}</h3>
            {job.companyName && <p className="text-xs text-foreground truncate" title={job.companyName}>{job.companyName}</p>}
            {job.location && <p className="text-xs text-muted-foreground truncate flex items-center"><MapPin className="h-3 w-3 mr-1 shrink-0" /> {job.location}</p>}
          </div>
        </div>
      </div>
    </a>
  </NextLink>
));
SuggestedJobCardItem.displayName = 'SuggestedJobCardItem';

interface SimilarJobsDisplayProps { jobs: SuggestedJobData[]; isLoading: boolean; }
const SimilarJobsDisplay: React.FC<SimilarJobsDisplayProps> = React.memo(({ jobs, isLoading }) => (
  <Card className="shadow-lg border-border rounded-xl">
    <CardHeader className="bg-secondary/20 border-b border-border p-4">
      <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
        <BriefcaseIcon className="h-5 w-5 text-accent" /> Similar Jobs
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      {isLoading && <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {!isLoading && jobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No similar jobs found.</p>}
      {!isLoading && jobs.length > 0 && (
        <ScrollArea className="h-auto max-h-[calc(100vh-320px)]">
          <div className="space-y-3">
            {jobs.map(sj => <SuggestedJobCardItem key={sj.id} job={sj} />)}
          </div>
        </ScrollArea>
      )}
    </CardContent>
  </Card>
));
SimilarJobsDisplay.displayName = 'SimilarJobsDisplay';

interface OtherJobsByCompanyDisplayProps { jobs: SuggestedJobData[]; companyName: string; isLoading: boolean; }
const OtherJobsByCompanyDisplay: React.FC<OtherJobsByCompanyDisplayProps> = React.memo(({ jobs, companyName, isLoading }) => (
  <Card className="shadow-lg border-border rounded-xl">
    <CardHeader className="bg-secondary/20 border-b border-border p-4">
      <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
        <Building className="h-5 w-5 text-accent" /> More from {companyName}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      {isLoading && <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
      {!isLoading && jobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No other jobs found from this company.</p>}
      {!isLoading && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.map(oj => <SuggestedJobCardItem key={oj.id} job={oj} showCompanyLogo={false} />)}
        </div>
      )}
    </CardContent>
  </Card>
));
OtherJobsByCompanyDisplay.displayName = 'OtherJobsByCompanyDisplay';


function PageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParamsHook = useSearchParams(); // Renamed to avoid conflict with window.searchParams
  const { toast } = useToast();

  const [job, setJob] = useState<JobSeekerJobPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [jobLinkToShare, setJobLinkToShare] = useState('');
  const [isCompanyProfileDialogOpen, setIsCompanyProfileDialogOpen] = useState(false);
  const [selectedCompanyProfileData, setSelectedCompanyProfileData] = useState<PublicCompanyProfileData | null>(null);
  const [isUnsaveConfirmOpen, setIsUnsaveConfirmOpen] = useState(false);

  const [similarJobs, setSimilarJobs] = useState<SuggestedJobData[]>([]);
  const [otherJobsByCompany, setOtherJobsByCompany] = useState<SuggestedJobData[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  // State for the new Quick Apply dialog flow
  const [isApplyFlowDialogOpen, setIsApplyFlowDialogOpen] = useState(false);
  const [showApplicationSuccessDialog, setShowApplicationSuccessDialog] = useState<boolean>(false);
  const [successfullyAppliedJobTitle, setSuccessfullyAppliedJobTitle] = useState<string | null>(null);
  

  const fetchJobDetails = useCallback(async (jobIdParam: string, userId: number | null) => {
    setIsLoading(true);
    setError(null);
    console.log(`[JobDetailPage] Fetching job ID: ${jobIdParam} for user: ${userId}`);
    try {
      const response = await getJobDetailsById(jobIdParam, userId);
      console.log("[JobDetailPage] Raw response from getJobDetailsById:", JSON.stringify(response, null, 2));
      if (response.success && response.jobData) {
        setJob(response.jobData);
        console.log("[JobDetailPage] Fetched job data for client:", JSON.stringify(response.jobData, null, 2));
        
        setIsLoadingSuggestions(true);
        try {
          const [similarJobsResponse, otherJobsResponse] = await Promise.all([
            getSimilarJobs(response.jobData),
            getOtherJobsByCompany(response.jobData.employer_user_id, response.jobData.id)
          ]);
          if (similarJobsResponse.success && similarJobsResponse.jobs) setSimilarJobs(similarJobsResponse.jobs);
          if (otherJobsResponse.success && otherJobsResponse.jobs) setOtherJobsByCompany(otherJobsResponse.jobs);
        } catch (suggestionError) {
          console.error("[JobDetailPage] Error fetching suggested jobs:", suggestionError);
        } finally {
          setIsLoadingSuggestions(false);
        }

      } else {
        setError(response.error || 'Job not found or no longer available.');
        setJob(null);
      }
    } catch (e: any) {
      console.error("[JobDetailPage] Catch block error fetching job details:", e);
      setError("An unexpected error occurred fetching job details.");
      setJob(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    const parsedUserId = userIdStr ? parseInt(userIdStr, 10) : null;
    setCurrentUserId(parsedUserId);
    const jobId = params.id as string;

    if (jobId) {
      fetchJobDetails(jobId, parsedUserId);
      const applyParam = searchParamsHook.get('apply');
      if (applyParam === 'true' && parsedUserId) {
         setIsApplyFlowDialogOpen(true);
      }
    } else {
      setError('Invalid job ID provided in URL.');
      setIsLoading(false);
    }
  }, [params.id, fetchJobDetails, searchParamsHook]);


  const handleSaveJobToggle = useCallback(async (save: boolean) => {
    if (!currentUserId) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!job) return;

    if (!save && job.isSaved) {
      setIsUnsaveConfirmOpen(true); // Trigger confirmation dialog for unsaving
      return;
    }
    
    setIsSavingJob(true);
    const response = await saveJobAction(job.id, currentUserId, save);
    if (response.success && response.isSaved !== undefined) {
      setJob(prev => prev ? { ...prev, isSaved: response.isSaved } : null);
      toast({ title: save ? 'Job Saved!' : 'Job Unsaved', description: response.message, variant: 'default' });
    } else {
      toast({ title: 'Error', description: response.error || 'Could not update save status.', variant: 'destructive' });
    }
    setIsSavingJob(false);
  }, [currentUserId, job, toast]);

  const confirmUnsaveJob = useCallback(async () => {
    if (!currentUserId || !job) return;
    setIsSavingJob(true);
    const response = await saveJobAction(job.id, currentUserId, false); // Explicitly unsave
    if (response.success && response.isSaved !== undefined) {
      setJob(prev => prev ? { ...prev, isSaved: response.isSaved } : null);
      toast({ title: 'Job Unsaved', description: response.message, variant: 'default' });
    } else {
      toast({ title: 'Error', description: response.error || 'Could not unsave job.', variant: 'destructive' });
    }
    setIsSavingJob(false);
    setIsUnsaveConfirmOpen(false);
  }, [currentUserId, job, toast]);


  const handleShareJob = () => {
    if (!job) return;
    const shareLink = `${window.location.origin}/jobSeeker/find-jobs/${job.id}`;
    setJobLinkToShare(shareLink);
    setIsShareModalOpen(true);
  };

  const copyShareLinkToClipboard = () => {
    navigator.clipboard.writeText(jobLinkToShare)
      .then(() => toast({ title: 'Copied!', description: 'Job link copied to clipboard.' }))
      .catch(() => toast({ title: 'Error', description: 'Failed to copy link.', variant: 'destructive' }));
    setIsShareModalOpen(false);
  };

  const handleViewCompanyProfile = () => {
    if (!job) return;
    setSelectedCompanyProfileData({
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      companyWebsite: job.companyWebsite,
      aboutCompany: job.aboutCompany,
      yearOfEstablishment: job.yearOfEstablishment,
      teamSize: job.teamSize,
      linkedinUrl: job.linkedinUrl,
      address: job.address,
    });
    setIsCompanyProfileDialogOpen(true);
  };
  
  const handleOpenApplyDialog = () => {
    if (!currentUserId) {
        setIsAuthModalOpen(true);
        return;
    }
    if (job && job.isApplied) {
        toast({ title: "Already Applied", description: "You have already applied for this job.", variant: "default"});
        return;
    }
    setIsApplyFlowDialogOpen(true);
  };
  
  const handleApplicationSuccess = useCallback((appliedJobTitle: string) => {
    setSuccessfullyAppliedJobTitle(appliedJobTitle);
    setShowApplicationSuccessDialog(true);
    setJob(prev => prev ? { ...prev, isApplied: true, isSaved: false } : null); // Also mark as unsaved
  }, []);


  if (isLoading) return <LoadingJobDetail />;
  if (error || !job) {
    return (
      <div className="w-full py-8 md:py-12 px-4 md:px-8 lg:px-16">
        <TopNavigationBar onBack={() => router.back()} onViewJobActivities={() => router.push('/jobSeeker/dashboard?section=jobActivities')} />
        <div className="mt-6">
          <Card><CardContent className="p-6"><p className="text-destructive text-center">{error || 'Job not found.'}</p></CardContent></Card>
        </div>
      </div>
    );
  }

  const postedDate = format(parseISO(job.createdAt), "MMM d, yyyy");

  return (
    <TooltipProvider>
    <div className="w-full py-8 md:py-12 px-4 md:px-8 lg:px-16">
       <TopNavigationBar onBack={() => router.back()} onViewJobActivities={() => router.push('/jobSeeker/dashboard?section=jobActivities')} />
      
      <div className="flex flex-col lg:flex-row gap-8 w-full mt-4">
        <div className="lg:w-2/3 w-full space-y-6">
          <Card className="shadow-xl border border-border rounded-xl overflow-hidden">
            <JobHeader
              job={job}
              postedDate={postedDate}
              onViewCompanyProfile={handleViewCompanyProfile}
              onSaveJobToggle={() => handleSaveJobToggle(!job.isSaved)}
              onShareJob={handleShareJob}
              onApply={handleOpenApplyDialog}
              isSavingJob={isSavingJob}
              isApplying={isApplying}
            />
            <CardContent className="p-6 space-y-6">
              <JobOverviewDetails job={job} />
              <JobSkillsDisplay skills={job.skillsRequired} />
              <JobAdditionalInformation additionalData={job.additionalData} />
              <JobFullDescription description={job.jobDescription} />
              <JobScreeningQuestionsDisplay questions={job.customQuestions} />
            </CardContent>
            <JobDetailCardFooter job={job} onApply={handleOpenApplyDialog} isApplying={isApplying}/>
          </Card>
        </div>

        <div className="lg:w-1/3 w-full space-y-6 lg:sticky lg:top-24 self-start">
           <SimilarJobsDisplay jobs={similarJobs} isLoading={isLoadingSuggestions} />
        </div>
      </div>
      
      {otherJobsByCompany.length > 0 && (
        <div className="lg:w-2/3 w-full mt-8">
          <OtherJobsByCompanyDisplay jobs={otherJobsByCompany} companyName={job.companyName} isLoading={isLoadingSuggestions} />
        </div>
      )}
        
       <AuthRequiredModal isOpen={isAuthModalOpen} onCloseAndGoBack={() => setIsAuthModalOpen(false)} userRole="jobSeeker" />
      
       {job && <ApplyFlowDialogs
            isOpen={isApplyFlowDialogOpen}
            onOpenChange={setIsApplyFlowDialogOpen}
            job={job}
            jobSeekerUserId={currentUserId}
            onApplicationSuccess={handleApplicationSuccess}
        />}
      
       <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2"><Share2 className="text-primary h-5 w-5" />Share Job Link</DialogTitle>
             <DialogDescription>Copy the link below to share this job posting.</DialogDescription>
           </DialogHeader>
           <div className="py-4">
             <Input id="share-link-detail-page" readOnly value={jobLinkToShare} className="focus:ring-primary focus:border-primary" aria-label="Shareable job link"/>
           </div>
           <StandardDialogFooter className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>Close</Button>
             <Button onClick={copyShareLinkToClipboard} className="bg-primary text-primary-foreground hover:bg-primary/90">
               <Share2 className="mr-2 h-4 w-4" /> Copy Link
             </Button>
           </StandardDialogFooter>
         </DialogContent>
       </Dialog>

      <CompanyPublicProfileDialog isOpen={isCompanyProfileDialogOpen} onOpenChange={setIsCompanyProfileDialogOpen} company={selectedCompanyProfileData}/>
      
      <AlertDialog open={isUnsaveConfirmOpen} onOpenChange={setIsUnsaveConfirmOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
               <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5"/>Confirm Unsave</AlertDialogTitle>
           </AlertDialogHeader>
           <AlertDialogDescription>
               Are you sure you want to remove "{job?.jobTitle}" from your saved jobs?
           </AlertDialogDescription>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setIsUnsaveConfirmOpen(false)}>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={confirmUnsaveJob} className="bg-destructive hover:bg-destructive/90" disabled={isSavingJob}>
               {isSavingJob ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
               Unsave
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
       
       <Dialog open={showApplicationSuccessDialog} onOpenChange={setShowApplicationSuccessDialog}>
          <DialogContent className="sm:max-w-md rounded-xl shadow-2xl border-border bg-card p-0">
            <div className="p-6 flex flex-col items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-5 animate-pulse" />
              <DialogTitle className="text-2xl font-bold text-green-600">Application Submitted!</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2 px-2 text-base">
                Your application for "<span className="font-semibold text-foreground">{successfullyAppliedJobTitle}</span>" has been successfully sent.
              </DialogDescription>
            </div>
            <StandardDialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between gap-2 p-6 pt-4 bg-secondary/20 border-t border-border rounded-b-xl">
              <Button
                onClick={() => {
                  setShowApplicationSuccessDialog(false);
                  router.push('/jobSeeker/find-jobs');
                }}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                Find More Jobs
              </Button>
              <Button
                onClick={() => {
                  setShowApplicationSuccessDialog(false);
                  router.push('/jobSeeker/dashboard?section=jobActivities');
                }}
                variant="default"
                size="sm"
                className="text-sm bg-primary hover:bg-primary/90"
              >
                View Applied Jobs
              </Button>
            </StandardDialogFooter>
          </DialogContent>
        </Dialog>
    </div>
    </TooltipProvider>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense fallback={<LoadingJobDetail />}>
      <PageContent />
    </Suspense>
  );
}

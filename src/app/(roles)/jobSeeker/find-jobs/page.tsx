
'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter, // Added AlertDialogFooter
  AlertDialogHeader, // Added AlertDialogHeader
  AlertDialogTitle, // Added AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent as ShareDialogContent, DialogHeader as ShareDialogHeader, DialogTitle as ShareDialogTitle, DialogFooter as ShareDialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Loader2, Briefcase, MapPin, Building, Share2, InfoIcon, AlertTriangle, Eye, CalendarDays, DollarSign, Tag, Search as SearchIcon,
  FilterX, Bookmark, CheckCircle, Send, Type, PackageCheck, Clock, SlidersHorizontal, GraduationCap
} from 'lucide-react';
import { getPostedJobsAction, saveJobAction, type JobListingData, type PublicCompanyProfileData } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { Badge } from '@/components/ui/badge';
import { CompanyPublicProfileDialog } from '@/components/dialogs/CompanyPublicProfileDialog';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const ALL_INDUSTRIES_FILTER_VALUE = "_all_industries_filter_";
const ALL_JOB_TYPES_FILTER_VALUE = "_all_job_types_filter_";

interface JobRowProps {
  job: JobListingData;
  currentUserId: number | null;
  onShare: (job: JobListingData) => void;
  onSaveToggle: (jobId: number, save: boolean) => Promise<void>;
  onViewCompany: (company: PublicCompanyProfileData) => void;
  onTriggerAuthModal: () => void;
  isAuthModalOpen: boolean;
  onCloseAuthModal: () => void;
}

const JobRow: React.FC<JobRowProps> = ({
  job,
  currentUserId,
  onShare,
  onSaveToggle,
  onViewCompany,
  onTriggerAuthModal,
  isAuthModalOpen: parentAuthModalOpen,
  onCloseAuthModal: parentOnCloseAuthModal,
}) => {
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [jobToUnsaveConfirm, setJobToUnsaveConfirm] = useState<JobListingData | null>(null);
  const [isUnsaveConfirmOpen, setIsUnsaveConfirmOpen] = useState(false);

  const handleSaveClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!currentUserId) {
      onTriggerAuthModal();
      return;
    }
    if (job.isSaved) {
      setJobToUnsaveConfirm(job);
      setIsUnsaveConfirmOpen(true);
    } else {
      setIsSavingInProgress(true);
      await onSaveToggle(job.id, true);
      setIsSavingInProgress(false);
    }
  }, [currentUserId, job, onSaveToggle, onTriggerAuthModal]);

  const confirmUnsave = useCallback(async () => {
    if (!jobToUnsaveConfirm || !currentUserId) return;
    setIsSavingInProgress(true);
    await onSaveToggle(jobToUnsaveConfirm.id, false);
    setIsSavingInProgress(false);
    setIsUnsaveConfirmOpen(false);
    setJobToUnsaveConfirm(null);
  }, [jobToUnsaveConfirm, currentUserId, onSaveToggle]);

  const daysSincePosted = job.createdAt ? differenceInDays(new Date(), parseISO(job.createdAt)) : null;
  let postedDateText = job.createdAt ? format(parseISO(job.createdAt), "MMM d, yyyy") : 'N/A';
  if (daysSincePosted !== null) {
    if (daysSincePosted === 0) postedDateText = "Today";
    else if (daysSincePosted === 1) postedDateText = "Yesterday";
    else if (daysSincePosted < 7) postedDateText = `${daysSincePosted} days ago`;
  }

  const formatSalary = (min?: number | null, max?: number | null): string | null => {
    if ((min === null || min === undefined) && (max === null || max === undefined)) return null;
    if (min === 0 && max === 0) return "Not Disclosed";
    const minLakh = min ? (min / 100000).toFixed(1) : null;
    const maxLakh = max ? (max / 100000).toFixed(1) : null;
    if (minLakh && parseFloat(minLakh) > 0 && maxLakh && parseFloat(maxLakh) > 0) {
      if (parseFloat(minLakh) < parseFloat(maxLakh)) return `₹${minLakh}L - ₹${maxLakh}L PA`;
      if (parseFloat(minLakh) === parseFloat(maxLakh)) return `₹${minLakh}L PA`;
      return `₹${minLakh}L PA`;
    }
    if (minLakh && parseFloat(minLakh) > 0) return `From ₹${minLakh}L PA`;
    if (maxLakh && parseFloat(maxLakh) > 0) return `Up to ₹${maxLakh}L PA`;
    return "Not Disclosed";
  };

  const formatExperience = (min?: number | null, max?: number | null): string | null => {
    if ((min === null || min === undefined) && (max === null || max === undefined)) return "Not Specified";
    if (min === 0 && (max === 0 || max === null || max === undefined)) return "Fresher";
    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      if (min < max) return `${min}-${max} Yrs`;
      if (min === max) return `${min} Yrs`;
      return `${min}+ Yrs`;
    }
    if (min !== null && min !== undefined && min > 0) return `${min}+ Yrs`;
    if (max !== null && max !== undefined && max > 0) return `Up to ${max} Yrs`;
    return "Not Specified";
  };

  const salaryDisplay = formatSalary(job.minimumSalary, job.maximumSalary);
  const experienceDisplay = formatExperience(job.minimumExperience, job.maximumExperience);

  return (
    <Card className="group w-full hover:shadow-xl transition-shadow duration-300 ease-in-out border border-border rounded-lg overflow-hidden hover:border-primary/30">
      <CardHeader className="p-4 bg-secondary/20 border-b border-border/50">
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onViewCompany(job); }}
            className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 bg-background shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 group-hover:border-primary transition-all"
            aria-label={`View company profile for ${job.companyName}`}
            data-ai-hint="company building"
          >
            <Image
              src={job.companyLogoUrl || 'https://placehold.co/40x40.png'}
              alt={`${job.companyName} logo`}
              fill
              style={{ objectFit: 'contain' }}
              className="p-0.5"
              sizes="40px"
            />
          </button>
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start gap-2">
                <NextLink href={`/jobSeeker/find-jobs/${job.id}`} passHref legacyBehavior>
                    <a className="text-lg font-bold text-foreground hover:text-primary group-hover:text-primary transition-colors break-words leading-tight">
                    {job.jobTitle}
                    </a>
                </NextLink>
              <div className="flex items-center gap-0.5 shrink-0 ml-2 whitespace-nowrap">
                 <span className="text-xs text-muted-foreground mr-1.5 flex items-center">
                  <Clock className="inline-block h-3.5 w-3.5 mr-1 align-text-bottom text-primary/80"/> {postedDateText}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSaveClick} className={cn("h-8 w-8 p-0 text-primary", {'fill-primary text-primary': job.isSaved})} aria-label={job.isSaved ? "Unsave Job" : "Save Job"} disabled={isSavingInProgress}>
                      {isSavingInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className={cn("h-4 w-4", job.isSaved && "fill-current")} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>{job.isSaved ? "Unsave Job" : "Save Job"}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onShare(job); }} className="h-8 w-8 p-0 text-primary" aria-label="Share Job">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Share Job</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NextLink href={`/jobSeeker/find-jobs/${job.id}`} passHref legacyBehavior>
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 p-0 text-primary" aria-label="View Details">
                        <a><Eye className="h-4 w-4" /></a>
                      </Button>
                    </NextLink>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>View Details</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex items-center group/company mt-0.5">
              <button onClick={(e) => { e.stopPropagation(); onViewCompany(job); }} className="hover:underline hover:text-primary flex items-center focus:outline-none truncate transition-colors">
                <Building className="inline-block h-4 w-4 mr-1.5 align-text-bottom shrink-0 text-muted-foreground group-hover/company:text-primary" />
                <span className="font-medium group-hover/company:text-primary truncate">{job.companyName}</span>
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={(e) => { e.stopPropagation(); onViewCompany(job); }} className="ml-1 text-muted-foreground hover:text-primary focus:outline-none p-0.5">
                    <InfoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>View Company Info</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-sm">
          {job.jobLocation && <span className="flex items-center truncate text-muted-foreground"><MapPin className="mr-1.5 h-4 w-4 text-purple-600 shrink-0" /> {job.jobLocation}</span>}
          {job.jobType && <span className="flex items-center truncate text-muted-foreground"><Type className="mr-1.5 h-4 w-4 text-purple-600 shrink-0" />{job.jobType}</span>}
          {job.industry && <span className="flex items-center truncate text-muted-foreground"><Briefcase className="mr-1.5 h-4 w-4 text-purple-600 shrink-0" />{job.industry} {job.industryType && job.industryType !== job.industry ? <span className="ml-1 text-xs text-muted-foreground/80">({job.industryType})</span> : null}</span>}
          {job.qualification && <span className="flex items-center truncate text-muted-foreground"><PackageCheck className="mr-1.5 h-4 w-4 text-purple-600 shrink-0" />{job.qualification}</span>}
          {experienceDisplay && <span className="flex items-center truncate text-muted-foreground"><CalendarDays className="mr-1.5 h-4 w-4 text-purple-600 shrink-0" />{experienceDisplay}</span>}
          {salaryDisplay && <span className="flex items-center truncate text-muted-foreground"><DollarSign className="mr-1.5 h-4 w-4 text-purple-600 shrink-0" />{salaryDisplay}</span>}
        </div>
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {job.skillsRequired.slice(0, 5).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5 border-purple-500/70 text-purple-700 bg-purple-500/10 font-normal">{skill}</Badge>
              ))}
              {job.skillsRequired.length > 5 && <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-normal border-muted-foreground/50">+{job.skillsRequired.length - 5} more</Badge>}
            </div>
          </div>
        )}
      </CardContent>
      {/* Apply Now button in footer removed as per previous request to remove apply button from job card */}
      
      <AlertDialog open={isUnsaveConfirmOpen} onOpenChange={setIsUnsaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5"/>Confirm Unsave</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to remove "{jobToUnsaveConfirm?.jobTitle}" from your saved jobs?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setJobToUnsaveConfirm(null); setIsUnsaveConfirmOpen(false);}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnsave} className="bg-destructive hover:bg-destructive/90" disabled={isSavingInProgress}>
              {isSavingInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Unsave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AuthRequiredModal
        isOpen={parentAuthModalOpen}
        onCloseAndGoBack={parentOnCloseAuthModal}
        userRole="jobSeeker"
      />
    </Card>
  );
};
JobRow.displayName = 'JobRow';

function FindJobsPage() {
  const [jobs, setJobs] = useState<JobListingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [industryTerm, setIndustryTerm] = useState(ALL_INDUSTRIES_FILTER_VALUE);
  const [jobTypeTerm, setJobTypeTerm] = useState(ALL_JOB_TYPES_FILTER_VALUE);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [jobLinkToShare, setJobLinkToShare] = useState('');
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<PublicCompanyProfileData | null>(null);
  const [isCompanyProfileDialogOpen, setIsCompanyProfileDialogOpen] = useState(false);
  
  const [isAuthModalForParentOpen, setIsAuthModalForParentOpen] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0); 

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    console.log("[FindJobsPage] Component mounted or currentUserId changed.");
    const userIdStr = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (userIdStr && userRole === 'jobSeeker') {
      setCurrentUserId(parseInt(userIdStr, 10));
    } else {
      setCurrentUserId(null);
    }
    setFetchTrigger(prev => prev + 1); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userId' || event.key === 'userRole') {
        console.log("[FindJobsPage] localStorage changed, re-evaluating auth and triggering fetch.");
        const userIdStr = localStorage.getItem('userId');
        const userRole = localStorage.getItem('userRole');
        if (userIdStr && userRole === 'jobSeeker') {
          setCurrentUserId(parseInt(userIdStr, 10));
        } else {
          setCurrentUserId(null);
        }
        setFetchTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchJobs = useCallback(async () => {
    console.log("[FindJobsPage] fetchJobs called. Current filters:", { searchTerm, locationTerm, industryTerm, jobTypeTerm, currentUserId });
    setIsLoading(true);
    setError(null);
    try {
      const effectiveIndustryTerm = industryTerm === ALL_INDUSTRIES_FILTER_VALUE ? "" : industryTerm;
      const effectiveJobTypeTerm = jobTypeTerm === ALL_JOB_TYPES_FILTER_VALUE ? "" : jobTypeTerm;

      const response = await getPostedJobsAction(searchTerm, locationTerm, effectiveIndustryTerm, effectiveJobTypeTerm, currentUserId);
      console.log("[FindJobsPage] Response from getPostedJobsAction:", response.success, "Data length:", response.data?.length);

      if (response.success && Array.isArray(response.data)) {
        setJobs(response.data);
        if(response.data.length === 0 && (searchTerm || locationTerm || effectiveIndustryTerm || effectiveJobTypeTerm)) {
           setError("No jobs found matching your current filters. Try broadening your search.");
        } else if (response.data.length === 0) {
            setError(null); 
        }
      } else {
        setJobs([]);
        const errorMessage = response.error || 'Failed to load job listings.';
        setError(errorMessage);
        console.error("[FindJobsPage] Error in response:", response.error);
      }
    } catch (e: any) {
      console.error("[FindJobsPage] Catch block error in fetchJobs:", e);
      setError("An unexpected error occurred while fetching jobs.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, locationTerm, industryTerm, jobTypeTerm, currentUserId]);

  useEffect(() => {
    if (fetchTrigger > 0) { 
      console.log("[FindJobsPage] useEffect triggered fetchJobs due to fetchTrigger change.");
      fetchJobs();
    }
  }, [fetchTrigger, fetchJobs]); 

  const handleSearchButtonClick = () => {
    console.log("[FindJobsPage] Search button clicked, triggering fetch.");
    setFetchTrigger(prev => prev + 1); 
  };

  const handleIndustryChange = (value: string) => {
    setIndustryTerm(value);
  };

  const handleJobTypeChange = (value: string) => {
    setJobTypeTerm(value);
  };

  const handleClearFilters = () => {
    console.log("[FindJobsPage] Clear filters clicked.");
    setSearchTerm('');
    setLocationTerm('');
    setIndustryTerm(ALL_INDUSTRIES_FILTER_VALUE);
    setJobTypeTerm(ALL_JOB_TYPES_FILTER_VALUE);
    setFetchTrigger(prev => prev + 1); 
  };

  const handleShare = (job: JobListingData) => {
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

  const handleSaveToggle = async (jobId: number, save: boolean) => {
    if (!currentUserId) {
      setIsAuthModalForParentOpen(true);
      return;
    }
    const response = await saveJobAction(jobId, currentUserId, save);
    if (response.success) {
      toast({ title: response.isSaved ? 'Job Saved!' : 'Job Unsaved', description: response.message });
      setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, isSaved: response.isSaved } : j));
    } else {
      toast({ title: 'Error', description: response.error || 'Could not update save status.', variant: 'destructive' });
    }
  };

  const handleViewCompanyProfile = (companyData: PublicCompanyProfileData) => {
    setSelectedCompanyProfile(companyData);
    setIsCompanyProfileDialogOpen(true);
  };
  
  const handleTriggerAuthModalForParent = useCallback(() => {
    setIsAuthModalForParentOpen(true);
  }, []);

  const handleCloseAuthModalForParent = useCallback(() => {
    setIsAuthModalForParentOpen(false);
  }, []);

  return (
    <TooltipProvider>
    <div className="w-full py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-xl border border-border rounded-xl overflow-hidden mb-8 bg-card">
        <CardHeader className="bg-gradient-to-b from-secondary/30 to-card p-6 border-b border-border">
          <CardTitle className="text-2xl md:text-3xl text-primary flex items-center gap-3 font-bold">
            <Briefcase className="h-7 w-7 text-accent" /> Find Your Ideal Jobs
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Pinpoint your perfect job. Use keywords, location, industry, and job type to discover opportunities tailored to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-end gap-3 mb-4">
            <div className="relative lg:col-span-2">
              <Label htmlFor="search-keywords" className="text-xs font-medium text-muted-foreground">Keywords</Label>
              <SearchIcon className="absolute left-3 top-1/2 translate-y-0.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-keywords"
                type="text"
                placeholder="Job title, company, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 text-sm bg-background pl-9"
                aria-label="Search jobs by title, company, or keywords"
              />
            </div>
            <div className="relative">
              <Label htmlFor="search-location" className="text-xs font-medium text-muted-foreground">Location</Label>
              <MapPin className="absolute left-3 top-1/2 translate-y-0.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-location"
                type="text"
                placeholder="City or 'Remote'"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="h-10 text-sm bg-background pl-9"
                aria-label="Filter by location"
              />
            </div>
            <div className="md:w-auto lg:w-52">
              <Label htmlFor="filter-industry" className="text-xs font-medium text-muted-foreground">Industry</Label>
              <Select value={industryTerm} onValueChange={handleIndustryChange}>
                <SelectTrigger id="filter-industry" className="h-10 text-sm bg-background mt-1" aria-label="Filter by industry">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_INDUSTRIES_FILTER_VALUE}>All Industries</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Customer Service">Customer Service</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Hospitality">Hospitality</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-auto lg:w-52">
              <Label htmlFor="filter-jobtype" className="text-xs font-medium text-muted-foreground">Job Type</Label>
              <Select value={jobTypeTerm} onValueChange={handleJobTypeChange}>
                <SelectTrigger id="filter-jobtype" className="h-10 text-sm bg-background mt-1" aria-label="Filter by job type">
                  <SelectValue placeholder="All Job Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_JOB_TYPES_FILTER_VALUE}>All Job Types</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleClearFilters} variant="outline" size="icon" className="h-10 w-10">
                  <FilterX className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Clear Filters</p></TooltipContent>
            </Tooltip>
            <Button onClick={handleSearchButtonClick} className="h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground">
              <SearchIcon className="mr-2 h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive bg-card border border-dashed border-destructive/50 rounded-lg p-8">
          <AlertTriangle className="h-16 w-16 mx-auto mb-6 opacity-70" />
          <p className="text-xl font-semibold">Error Loading Jobs</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground bg-card border border-dashed border-border rounded-lg p-8">
          <Briefcase className="h-16 w-16 mx-auto mb-6 opacity-40 text-primary" />
          <p className="text-xl font-semibold text-foreground">No Job Listings Found</p>
          <p className="text-sm mt-2">
            There are currently no active positions matching your criteria. Please check back later or broaden your search.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3 w-full">
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              currentUserId={currentUserId}
              onShare={handleShare}
              onSaveToggle={handleSaveToggle}
              onViewCompany={handleViewCompanyProfile}
              onTriggerAuthModal={handleTriggerAuthModalForParent}
              isAuthModalOpen={isAuthModalForParentOpen}
              onCloseAuthModal={handleCloseAuthModalForParent}
            />
          ))}
        </div>
      )}

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <ShareDialogContent className="sm:max-w-md">
          <ShareDialogHeader>
            <ShareDialogTitle className="flex items-center gap-2"><Share2 className="text-primary h-5 w-5" />Share Job Link</ShareDialogTitle>
          </ShareDialogHeader>
          <div className="py-4">
            <Input
              id="share-link-listing"
              readOnly
              value={jobLinkToShare}
              className="focus:ring-primary focus:border-primary"
              aria-label="Shareable job link"
            />
          </div>
          <ShareDialogFooter>
            <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>Close</Button>
            <Button onClick={copyShareLinkToClipboard} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Share2 className="mr-2 h-4 w-4" /> Copy Link
            </Button>
          </ShareDialogFooter>
        </ShareDialogContent>
      </Dialog>
      <CompanyPublicProfileDialog
        isOpen={isCompanyProfileDialogOpen}
        onOpenChange={setIsCompanyProfileDialogOpen}
        company={selectedCompanyProfile}
      />
      <AuthRequiredModal
        isOpen={isAuthModalForParentOpen && !currentUserId}
        onCloseAndGoBack={handleCloseAuthModalForParent}
        userRole="jobSeeker"
      />
    </div>
    </TooltipProvider>
  );
}

function FindJobsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <FindJobsPage />
    </Suspense>
  );
}
export default FindJobsPageWrapper;


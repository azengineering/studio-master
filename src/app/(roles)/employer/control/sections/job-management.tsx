// src/app/(roles)/employer/control/sections/job-management.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Adjusted import path for actions
import { getJobsByStatus, updateJobStatusAction, deleteJobAction, getJobForDashboardById, type FullJobDashboardData, type JobListingTableData } from '../../dashboard/actions';
import { type JobStatus, VALID_JOB_STATUSES } from '../../dashboard/types'; // Import from new types file
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DialogDescription as JobPreviewDialogDescriptionOriginal } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, PlusCircle, Search, Trash2, Edit3, Eye, Share2, Copy, MoreHorizontal, AlertTriangle, CheckCircle, XCircle, Edit, Briefcase, Building, MapPin, CalendarDays, DollarSign, Users as UsersIconLucide, Info, Tag, ListChecks, Settings, ChevronDown, Hash, PackageCheck, FileText, InfoIcon, FilterX, Calendar as CalendarIconLucide, Activity, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isWithinInterval } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';


interface JobPreviewDialogProps {
  job: FullJobDashboardData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoadingPreview: boolean;
}

const JobPreviewDialog: React.FC<JobPreviewDialogProps> = ({ job, isOpen, onOpenChange, isLoadingPreview }) => {
  if (!isOpen) return null;

  if (isLoadingPreview) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl md:max-w-3xl lg:max-w-4xl w-[90vw] rounded-lg shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/30 rounded-t-lg">
            <DialogTitle className="text-2xl font-bold text-primary">Loading Job Details...</DialogTitle>
          </DialogHeader>
          <div className="p-6 flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <DialogFooter className="p-4 border-t border-border bg-secondary/30 rounded-b-lg">
            <DialogClose asChild><Button variant="outline" disabled>Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!job) {
     return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-lg shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle className="text-xl font-bold text-destructive">Error</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p>Could not load job details. Please try again.</p>
          </div>
          <DialogFooter className="p-4 border-t border-border">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const displayIndustryText = job.industry || 'Not specified';
  const displayIndustryType = job.industryType && !['other', ''].includes(job.industryType.toLowerCase()) ? job.industryType : (job.otherIndustryType || 'Not specified');
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl md:max-w-3xl lg:max-w-4xl w-[95vw] sm:w-[90vw] rounded-lg shadow-2xl bg-card border-border"
        aria-describedby="job-preview-dialog-description-control" 
      >
        <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/30 rounded-t-lg relative">
          <DialogTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Briefcase className="h-7 w-7"/>
            {job.jobTitle || 'Job Title Not Provided'}
          </DialogTitle>
           <div id="job-preview-dialog-description-control" className="mt-2 text-base text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <span>{job.companyName} (Job ID: #{job.id})</span>
            </div>
            {job.jobLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{job.jobLocation}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-150px)]">
          <div className="p-6 space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-start gap-2">
                  <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Industry</p>
                    <p className="text-muted-foreground">{displayIndustryText}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ListChecks className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Industry Type</p>
                    <p className="text-muted-foreground">{displayIndustryType}</p>
                  </div>
                </div>
              {job.jobType && (
                <div className="flex items-start gap-2">
                  <Settings className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Job Type</p>
                    <p className="text-muted-foreground">{job.jobType}</p>
                  </div>
                </div>
              )}
              {job.qualification && (
                 <div className="flex items-start gap-2">
                  <PackageCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Qualification</p>
                    <p className="text-muted-foreground">{job.qualification}</p>
                  </div>
                </div>
              )}
              {job.numberOfVacancies && (
                 <div className="flex items-start gap-2">
                  <UsersIconLucide className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Number of Vacancies</p>
                    <p className="text-muted-foreground">{job.numberOfVacancies}</p>
                  </div>
                </div>
              )}
            </div>

            {(job.minimumExperience !== null && job.minimumExperience !== undefined) || (job.maximumExperience !== null && job.maximumExperience !== undefined) ? (
              <div className="flex items-start gap-2">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Experience Required</p>
                  <p className="text-muted-foreground">
                    {job.minimumExperience !== null && job.minimumExperience !== undefined ? `${job.minimumExperience} yrs` : ''}
                    {(job.minimumExperience !== null && job.minimumExperience !== undefined) && (job.maximumExperience !== null && job.maximumExperience !== undefined) ? ' - ' : ''}
                    {job.maximumExperience !== null && job.maximumExperience !== undefined ? `${job.maximumExperience} yrs` : (job.minimumExperience === null || job.minimumExperience === undefined ? 'Not specified' : '')}
                  </p>
                </div>
              </div>
            ) : null}

            {(job.minimumSalary !== null && job.minimumSalary !== undefined) || (job.maximumSalary !== null && job.maximumSalary !== undefined) ? (
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Salary Range (Annual)</p>
                  <p className="text-muted-foreground">
                    {job.minimumSalary !== null && job.minimumSalary !== undefined ? `₹${job.minimumSalary.toLocaleString()}` : ''}
                    {(job.minimumSalary !== null && job.minimumSalary !== undefined) && (job.maximumSalary !== null && job.maximumSalary !== undefined) ? ' - ' : ''}
                    {job.maximumSalary !== null && job.maximumSalary !== undefined ? `₹${job.maximumSalary.toLocaleString()}` : (job.minimumSalary === null || job.minimumSalary === undefined ? 'Not specified' : '')}
                  </p>
                </div>
              </div>
            ) : null}

            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Key Skills</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {job.skillsRequired.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs font-medium">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {job.additionalData && (
              <div className="flex items-start gap-2">
                <InfoIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Additional Information</p>
                  <div className="mt-1 prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: job.additionalData }} />
                </div>
              </div>
            )}
            
            <Separator className="my-5"/>
            
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-2.5 flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Full Job Description</h4>
              <div
                className="prose prose-sm max-w-none p-4 border border-border rounded-lg bg-background shadow-inner min-h-[150px] text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: job.jobDescription || '<p class="italic">No full description provided.</p>' }}
              />
            </div>

            {job.customQuestions && job.customQuestions.length > 0 && (
              <>
                <Separator className="my-5"/>
                <div>
                  <h4 className="font-semibold text-lg text-foreground mb-2.5 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/>Custom Screening Questions</h4>
                  <ul className="space-y-3 mt-2">
                    {(job.customQuestions as CustomQuestion[]).map((q, i) => (
                       <li key={q.id || i} className="p-3 border border-border/70 bg-secondary/30 rounded-md shadow-sm">
                        <p className="font-medium text-foreground">{q.questionText}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Answer Type: {q.answerType === 'yes_no' ? 'Yes/No' : 'Text'}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-border bg-secondary/30 rounded-b-lg">
          <DialogClose asChild><Button variant="outline" className="h-10">Close Preview</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function JobManagementSection() {
  const router = useRouter();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<JobListingTableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('active');
  
  const [jobTitleFilter, setJobTitleFilter] = useState(''); 
  const [jobDateRangeFilter, setJobDateRangeFilter] = useState<DateRange | undefined>(undefined); 

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [selectedJobForPreview, setSelectedJobForPreview] = useState<FullJobDashboardData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const [jobToConfirmDelete, setJobToConfirmDelete] = useState<JobListingTableData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [jobToUpdateStatus, setJobToUpdateStatus] = useState<{ job: JobListingTableData, newStatus: JobStatus } | null>(null);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [jobLinkToShare, setJobLinkToShare] = useState('');


  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      setCurrentUserId(parseInt(userIdStr, 10));
    } else {
      toast({ title: "Authentication Error", description: "User ID not found. Please log in.", variant: "destructive"});
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchJobs = useCallback(async (status: JobStatus | 'all') => { 
    if (!currentUserId) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        
        const response = await getJobsByStatus(currentUserId, status); 
        if (response.success && response.data) {
            setJobs(response.data);
        } else {
            setJobs([]);
            if(response.error && !response.message?.includes("currently unavailable")) { 
              toast({ title: 'Error', description: response.error, variant: 'destructive' });
            }
        }
    } catch (error) {
        setJobs([]);
        toast({ title: 'Error', description: 'An unexpected error occurred while fetching jobs.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [currentUserId, toast]);

  useEffect(() => {
    if (currentUserId) { 
        fetchJobs(activeTab); 
    }
  }, [activeTab, fetchJobs, currentUserId]);

  const filteredJobs = useMemo(() => {
    let currentJobs = jobs;
    if (jobTitleFilter) {
      currentJobs = currentJobs.filter(job => job.jobTitle.toLowerCase().includes(jobTitleFilter.toLowerCase()));
    }
    if (jobDateRangeFilter?.from && jobDateRangeFilter?.to) {
      currentJobs = currentJobs.filter(job => {
        try {
          const jobDate = parseISO(job.createdAt); 
          return isWithinInterval(jobDate, { start: jobDateRangeFilter.from!, end: jobDateRangeFilter.to! });
        } catch (e) {
          console.error("Error parsing job date:", job.createdAt, e);
          return false;
        }
      });
    }
    return currentJobs;
  }, [jobs, jobTitleFilter, jobDateRangeFilter]);

  const handleClearClientFilters = () => {
    setJobTitleFilter('');
    setJobDateRangeFilter(undefined);
  };


  const handleTabChange = (value: string) => {
    setActiveTab(value as JobStatus | 'all');
  };
  
  const handleUpdateStatus = async (jobId: number, newStatus: JobStatus) => {
    if (!currentUserId) return;
    console.log(`[JobManagementSection] Requesting status update for job ${jobId} to ${newStatus} by user ${currentUserId}`);
    const response = await updateJobStatusAction(jobId, currentUserId, newStatus);
    if (response.success) {
      toast({ title: 'Success', description: response.message, variant: 'default' });
      fetchJobs(activeTab); 
    } else {
      toast({ title: 'Error', description: response.error || 'Failed to update status.', variant: 'destructive' });
    }
    setIsStatusConfirmOpen(false);
    setJobToUpdateStatus(null);
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!currentUserId) return;
    const response = await deleteJobAction(jobId, currentUserId);
    if (response.success) {
      toast({ title: 'Success', description: response.message, variant: 'default' });
      fetchJobs(activeTab); 
    } else {
      toast({ title: 'Error', description: response.error || 'Failed to delete job.', variant: 'destructive' });
    }
    setIsDeleteConfirmOpen(false);
    setJobToConfirmDelete(null);
  };

  const handlePreviewJob = async (jobId: number) => {
    if (!currentUserId) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive"});
      return;
    }
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    setSelectedJobForPreview(null); 
    try {
      const response = await getJobForDashboardById(jobId, currentUserId);
      if (response.success && response.jobData) {
        setSelectedJobForPreview(response.jobData);
      } else {
        toast({ title: 'Error', description: response.error || 'Failed to fetch job details.', variant: 'destructive' });
        setIsPreviewModalOpen(false); 
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred while fetching job details.', variant: 'destructive' });
      setIsPreviewModalOpen(false);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const handleEditJob = (jobId: number) => {
    router.push(`/employer/post-job?editJobId=${jobId}`);
  };

  const handleCopyJob = (jobId: number) => {
    router.push(`/employer/post-job?copyJobId=${jobId}`);
  };

  const handleShareJob = (job: JobListingTableData) => {
    const shareLink = `${window.location.origin}/jobSeeker/find-jobs/${job.id}`; 
    setJobLinkToShare(shareLink);
    setIsShareModalOpen(true);
  };

  const copyShareLinkToClipboard = () => {
    navigator.clipboard.writeText(jobLinkToShare)
      .then(() => {
        toast({ title: 'Copied!', description: 'Job link copied to clipboard.', variant: 'default' });
        setIsShareModalOpen(false);
      })
      .catch(err => {
        toast({ title: 'Error', description: 'Failed to copy link.', variant: 'destructive' });
      });
  };

  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case 'active': return {bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-600', icon: <CheckCircle className="mr-1.5 h-3.5 w-3.5" />, label: 'Active' };
      case 'draft': return {bg: 'bg-yellow-100 dark:bg-yellow-600/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600', icon: <Edit className="mr-1.5 h-3.5 w-3.5" />, label: 'Draft' };
      case 'closed': return {bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-600', icon: <XCircle className="mr-1.5 h-3.5 w-3.5" />, label: 'Closed' };
      default: return {bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600', icon: <Briefcase className="mr-1.5 h-3.5 w-3.5" />, label: status };
    }
  };

  const renderJobTable = (jobList: JobListingTableData[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }
    if (jobList.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground bg-card border border-dashed border-border rounded-lg p-8">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50 text-primary" />
          <p className="text-lg font-medium">No jobs found in this category or matching your filters.</p>
          {activeTab === 'active' && !jobTitleFilter && !jobDateRangeFilter && <p className="text-sm mt-1">Try creating a new job posting!</p>}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border border-border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">Job ID</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[200px]">Job Title</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">Posted</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">Status</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobList.map((job) => {
               const statusStyle = getStatusBadgeVariant(job.status);
               const postedDateTime = job.createdAt ? new Date(job.createdAt + 'Z').toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
               return (
                <TableRow key={job.id} className="hover:bg-muted/20 transition-colors duration-150">
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">#{job.id}</TableCell>
                  <TableCell className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{job.jobTitle}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{postedDateTime}</TableCell>
                  <TableCell className="px-4 py-3 text-center">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className={cn(`capitalize text-xs py-1 px-2.5 rounded-full font-semibold min-w-[90px] justify-between hover:opacity-80`, statusStyle.bg, statusStyle.text, statusStyle.border)}>
                             <span className="flex items-center">{statusStyle.icon} {statusStyle.label}</span>
                            <ChevronDown className="ml-1 h-3 w-3 opacity-70"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel className="text-xs px-2 py-1.5">Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {VALID_JOB_STATUSES.map((newStatusOption) => (
                            job.status !== newStatusOption && (
                              <DropdownMenuItem
                                key={newStatusOption}
                                onClick={() => {
                                  setJobToUpdateStatus({ job, newStatus: newStatusOption });
                                  setIsStatusConfirmOpen(true);
                                }}
                                className="capitalize text-xs cursor-pointer"
                              >
                                Mark as {getStatusBadgeVariant(newStatusOption).label}
                              </DropdownMenuItem>
                            )
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <TooltipProvider delayDuration={100}>
                      <div className="flex items-center justify-center space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-primary/80 hover:text-primary hover:bg-primary/10" onClick={() => handlePreviewJob(job.id)} aria-label="View Job">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View Job</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-primary/80 hover:text-primary hover:bg-primary/10" onClick={() => handleEditJob(job.id)} aria-label="Edit Job">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit Job</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10" 
                                    onClick={() => {
                                      setJobToConfirmDelete(job);
                                      setIsDeleteConfirmOpen(true);
                                    }}
                                    aria-label="Delete Job"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Job</p></TooltipContent>
                        </Tooltip>
                        {job.status !== 'draft' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-sky-600/80 hover:text-sky-600 hover:bg-sky-600/10" onClick={() => handleShareJob(job)} aria-label="Share Job">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Share Job</p></TooltipContent>
                          </Tooltip>
                        )}
                         {job.status !== 'draft' && (
                            <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-teal-600/80 hover:text-teal-600 hover:bg-teal-600/10" onClick={() => handleCopyJob(job.id)} aria-label="Copy to New Job">
                                <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Copy to New Job</p></TooltipContent>
                            </Tooltip>
                         )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
               );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const currentJobList = useMemo(() => {
    if (activeTab === 'all') return filteredJobs;
    return filteredJobs.filter(job => job.status === activeTab);
  }, [filteredJobs, activeTab]);


  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <CardTitle className="text-2xl flex items-center gap-3 text-primary">
            <Briefcase className="h-7 w-7" /> Job Management
          </CardTitle>
          <CardDescription>Oversee all your job postings and drafts.</CardDescription>
        </div>
        <Button asChild className="h-10 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/employer/post-job">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Job
            </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-6 md:p-8">
        <Card className="p-4 mb-6 bg-card border-border shadow-sm rounded-lg">
          <h4 className="text-md font-semibold mb-3 text-foreground">Filter Displayed Jobs:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="job-title-client-filter" className="text-sm font-medium text-muted-foreground">By Job Title (Current View)</Label>
              <Input
                id="job-title-client-filter"
                type="text"
                placeholder="Enter job title..."
                value={jobTitleFilter}
                onChange={(e) => setJobTitleFilter(e.target.value)}
                className="h-10 bg-background mt-1"
                aria-label="Filter current view by job title"
              />
            </div>
            <div>
              <Label htmlFor="job-date-range-filter" className="text-sm font-medium text-muted-foreground">By Posted Date (Current View)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="job-date-range-filter"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 bg-background mt-1",
                      !jobDateRangeFilter && "text-muted-foreground"
                    )}
                  >
                    <CalendarIconLucide className="mr-2 h-4 w-4" />
                    {jobDateRangeFilter?.from ? (
                      jobDateRangeFilter.to ? (
                        <>
                          {format(jobDateRangeFilter.from, "LLL dd, y")} - {format(jobDateRangeFilter.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(jobDateRangeFilter.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={jobDateRangeFilter?.from}
                    selected={jobDateRangeFilter}
                    onSelect={setJobDateRangeFilter}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleClearClientFilters} variant="outline" className="h-10">
              <FilterX className="mr-2 h-4 w-4" /> Clear Display Filters
            </Button>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="all" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">All Jobs</TabsTrigger>
            <TabsTrigger value="active" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">Active Jobs</TabsTrigger>
            <TabsTrigger value="draft" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">Drafts</TabsTrigger>
            <TabsTrigger value="closed" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">Closed Jobs</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderJobTable(currentJobList)}</TabsContent>
          <TabsContent value="active">{renderJobTable(currentJobList.filter(job => job.status === 'active'))}</TabsContent>
          <TabsContent value="draft">{renderJobTable(currentJobList.filter(job => job.status === 'draft'))}</TabsContent>
          <TabsContent value="closed">{renderJobTable(currentJobList.filter(job => job.status === 'closed'))}</TabsContent>
        </Tabs>
      </CardContent>
      
      <JobPreviewDialog job={selectedJobForPreview} isOpen={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} isLoadingPreview={isLoadingPreview} />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5"/>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the job "{jobToConfirmDelete?.jobTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobToConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => jobToConfirmDelete && handleDeleteJob(jobToConfirmDelete.id)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-primary h-5 w-5"/>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of "{jobToUpdateStatus?.job.jobTitle}" to <span className="font-semibold capitalize">{getStatusBadgeVariant(jobToUpdateStatus?.newStatus || 'draft').label}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobToUpdateStatus(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => jobToUpdateStatus && handleUpdateStatus(jobToUpdateStatus.job.id, jobToUpdateStatus.newStatus)}
              className="bg-primary hover:bg-primary/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Share2 className="text-primary h-5 w-5"/>Share Job Link</DialogTitle>
                    <JobPreviewDialogDescriptionOriginal className="text-sm text-muted-foreground">
                        Copy the link below to share this job posting.
                    </JobPreviewDialogDescriptionOriginal>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        id="share-link-control"
                        readOnly
                        value={jobLinkToShare}
                        className="focus:ring-primary focus:border-primary"
                        aria-describedby="share-dialog-description-control"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>Close</Button>
                    <Button onClick={copyShareLinkToClipboard} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Copy className="mr-2 h-4 w-4"/> Copy Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </Card>
  );
}
// src/app/(roles)/employer/dashboard/sections/job-management.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getJobsByStatus, updateJobStatusAction, deleteJobAction, getJobForDashboardById, type JobListingDashboardData, type DashboardActionResponse } from '../actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as JobPreviewDialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, PlusCircle, Search, Trash2, Edit3, Eye, Share2, Copy, MoreHorizontal, AlertTriangle, CheckCircle, XCircle, Edit, Briefcase, Building, MapPin, CalendarDays, DollarSign, Users, Info, Tag, ListChecks, Settings, ChevronDown, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';


type JobStatus = 'draft' | 'posted' | 'closed';

interface JobPreviewDialogProps {
  job: JobListingDashboardData | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobPreviewDialog: React.FC<JobPreviewDialogProps> = ({ job, isOpen, onOpenChange }) => {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl md:max-w-3xl lg:max-w-4xl w-[90vw] rounded-lg shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/30 rounded-t-lg">
          <DialogTitle className="text-2xl font-bold text-primary">{job.jobTitle}</DialogTitle>
           <JobPreviewDialogDescription className="space-y-1 mt-1">
            <div className="flex items-center text-sm text-muted-foreground"><Building className="mr-1.5 h-4 w-4" /> {job.companyName}</div>
            {job.jobLocation && <div className="flex items-center text-sm text-muted-foreground"><MapPin className="mr-1.5 h-4 w-4" /> {job.jobLocation}</div>}
          </JobPreviewDialogDescription>
        </DialogHeader>
        <div className="p-6 max-h-[calc(80vh-120px)] overflow-y-auto space-y-5 text-sm">
          {job.industry && <p><strong>Industry:</strong> {job.industry}</p>}
          {job.jobType && <p><strong>Job Type:</strong> {job.jobType}</p>}
          
          {(job.minimumExperience !== null || job.maximumExperience !== null) && (
            <p><strong>Experience:</strong> 
              {job.minimumExperience !== null ? `${job.minimumExperience} yrs` : ''}
              {(job.minimumExperience !== null && job.maximumExperience !== null) ? ' - ' : ''}
              {job.maximumExperience !== null ? `${job.maximumExperience} yrs` : (job.minimumExperience === null ? 'Not specified' : '')}
            </p>
          )}
          {(job.minimumSalary !== null || job.maximumSalary !== null) && (
            <p><strong>Salary (Annual, ₹):</strong> 
              {job.minimumSalary !== null ? `₹${job.minimumSalary.toLocaleString()}` : ''}
              {(job.minimumSalary !== null && job.maximumSalary !== null) ? ' - ' : ''}
              {job.maximumSalary !== null ? `₹${job.maximumSalary.toLocaleString()}` : (job.minimumSalary === null ? 'Not specified' : '')}
            </p>
          )}
          {job.numberOfVacancies && <p><strong>Vacancies:</strong> {job.numberOfVacancies}</p>}
          {job.qualification && <p><strong>Qualification:</strong> {job.qualification}</p>}

          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <div><strong><Tag className="inline-block mr-1.5 h-4 w-4 align-middle"/>Skills:</strong> <div className="flex flex-wrap gap-1.5 mt-1.5">{job.skillsRequired.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></div>
          )}
          
          {job.additionalData && (
            <div className="prose prose-sm max-w-none">
              <strong><Info className="inline-block mr-1.5 h-4 w-4 align-middle"/>Additional Information:</strong>
              <div className="mt-1 p-3 border rounded-md bg-muted/30" dangerouslySetInnerHTML={{ __html: job.additionalData }} />
            </div>
          )}
          
          <Separator className="my-4"/>
          <h4 className="font-semibold text-md text-foreground flex items-center"><ListChecks className="mr-1.5 h-5 w-5 text-primary"/>Full Job Description:</h4>
          <div 
            className="prose prose-sm max-w-none p-4 border rounded-md bg-background shadow-inner min-h-[150px]" 
            dangerouslySetInnerHTML={{ __html: job.jobDescription || '<p class="text-muted-foreground italic">No full description provided.</p>' }} 
          />

          {job.customQuestions && job.customQuestions.length > 0 && (
            <>
              <Separator className="my-4"/>
              <h4 className="font-semibold text-md text-foreground flex items-center"><Settings className="mr-1.5 h-5 w-5 text-primary"/>Custom Questions:</h4>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                {(job.customQuestions as CustomQuestion[]).map((q, i) => (
                  <li key={i}><strong>{q.questionText}</strong> (Answer Type: {q.answerType === 'yes_no' ? 'Yes/No' : 'Text'})</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <DialogFooter className="p-4 border-t border-border bg-secondary/30 rounded-b-lg">
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function JobManagementSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<JobListingDashboardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [selectedJobForPreview, setSelectedJobForPreview] = useState<JobListingDashboardData | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const [jobToConfirmDelete, setJobToConfirmDelete] = useState<JobListingDashboardData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [jobToUpdateStatus, setJobToUpdateStatus] = useState<{ job: JobListingDashboardData, newStatus: JobStatus } | null>(null);
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
  
  const fetchJobs = useCallback(async (status: JobStatus | 'all', search?: string) => {
    if (!currentUserId) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const response = await getJobsByStatus(currentUserId, status, search);
        if (response.success && response.data) {
            setJobs(response.data);
        } else {
            setJobs([]);
            if(response.error) toast({ title: 'Error', description: response.error, variant: 'destructive' });
        }
    } catch (error) {
        setJobs([]);
        toast({ title: 'Error', description: 'An unexpected error occurred while fetching jobs.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [currentUserId, toast]);

  useEffect(() => {
    if (currentUserId) { // Only fetch if userId is available
        fetchJobs(activeTab, searchTerm);
    }
  }, [activeTab, searchTerm, fetchJobs, currentUserId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as JobStatus | 'all');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleUpdateStatus = async (jobId: number, newStatus: JobStatus) => {
    if (!currentUserId) return;
    const response = await updateJobStatusAction(jobId, currentUserId, newStatus);
    if (response.success) {
      toast({ title: 'Success', description: response.message, variant: 'default' });
      fetchJobs(activeTab, searchTerm); 
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
      fetchJobs(activeTab, searchTerm); 
    } else {
      toast({ title: 'Error', description: response.error || 'Failed to delete job.', variant: 'destructive' });
    }
    setIsDeleteConfirmOpen(false);
    setJobToConfirmDelete(null);
  };

  const handlePreviewJob = (job: JobListingDashboardData) => {
    setSelectedJobForPreview(job);
    setIsPreviewModalOpen(true);
  };
  
  const handleEditJob = (jobId: number) => {
    router.push(`/employer/post-job?editJobId=${jobId}`);
  };

  const handleCopyJob = (jobId: number) => {
    router.push(`/employer/post-job?copyJobId=${jobId}`);
  };

  const handleShareJob = (job: JobListingDashboardData) => {
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
      case 'posted': return {bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-600', icon: <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> };
      case 'draft': return {bg: 'bg-yellow-100 dark:bg-yellow-600/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600', icon: <Edit className="mr-1.5 h-3.5 w-3.5" /> };
      case 'closed': return {bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-600', icon: <XCircle className="mr-1.5 h-3.5 w-3.5" /> };
      default: return {bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600', icon: <Briefcase className="mr-1.5 h-3.5 w-3.5" /> };
    }
  };

  const renderJobTable = (jobList: JobListingDashboardData[]) => {
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
          <p className="text-lg font-medium">No jobs found in this category.</p>
          {activeTab === 'all' && <p className="text-sm mt-1">Try creating a new job posting!</p>}
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
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[150px]">Company</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">Posted</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">Status</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobList.map((job) => {
               const statusStyle = getStatusBadgeVariant(job.status);
               return (
                <TableRow key={job.id} className="hover:bg-muted/20 transition-colors duration-150">
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">#{job.id}</TableCell>
                  <TableCell className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{job.jobTitle}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{job.companyName}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{job.postedDate}</TableCell>
                  <TableCell className="px-4 py-3 text-center">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className={cn(`capitalize text-xs py-1 px-2.5 rounded-full font-semibold min-w-[90px] justify-between hover:opacity-80`, statusStyle.bg, statusStyle.text, statusStyle.border)}>
                             <span className="flex items-center">{statusStyle.icon} {job.status}</span>
                            <ChevronDown className="ml-1 h-3 w-3 opacity-70"/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuLabel className="text-xs px-2 py-1.5">Change Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(['posted', 'draft', 'closed'] as JobStatus[]).map((newStatusOption) => (
                            job.status !== newStatusOption && (
                              <DropdownMenuItem
                                key={newStatusOption}
                                onClick={() => {
                                  setJobToUpdateStatus({ job, newStatus: newStatusOption });
                                  setIsStatusConfirmOpen(true);
                                }}
                                className="capitalize text-xs cursor-pointer"
                              >
                                Mark as {newStatusOption}
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-primary/80 hover:text-primary hover:bg-primary/10" onClick={() => handlePreviewJob(job)} aria-label="View Job Details">
                              <Eye className="h-4 w-4" />
                            </Button>

 </TooltipTrigger>
 <TooltipContent><p>View Job</p></TooltipContent>
 </Tooltip>
 <Tooltip>
                          <TooltipTrigger asChild>
 <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-primary/80 hover:text-primary hover:bg-primary/10" aria-label="View Applications" asChild>
 <Link href={`/employer/control/applications/${job.applicantCount > 0 ? job.firstApplicantId : ''}`}>
                               <Users className="h-4 w-4" />
 </Link>
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-accent/80 hover:text-accent hover:bg-accent/10" onClick={() => handleShareJob(job)} aria-label="Share Job">
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Share Job</p></TooltipContent>
                          </Tooltip>
                        )}
                         <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-sky-600/80 hover:text-sky-600 hover:bg-sky-600/10" onClick={() => handleCopyJob(job.id)} aria-label="Copy to New Job">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Copy to New Job</p></TooltipContent>
                        </Tooltip>
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

  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <CardTitle className="text-2xl flex items-center gap-3 text-primary">
            <Briefcase className="h-7 w-7" /> Job Management
          </CardTitle>
          <CardDescription>Oversee all your job postings and drafts.</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                type="search"
                placeholder="Search jobs (title, company)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9 w-full h-10 rounded-lg bg-background focus:ring-primary focus:border-primary"
                />
            </div>
            <Button asChild className="h-10 rounded-lg shadow-md hover:shadow-lg transition-shadow bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/employer/post-job">
                <PlusCircle className="mr-2 h-5 w-5" /> Create New Job
              </Link>
            </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="all" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">All Jobs</TabsTrigger>
            <TabsTrigger value="posted" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">Active Jobs</TabsTrigger>
            <TabsTrigger value="draft" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">Drafts</TabsTrigger>
            <TabsTrigger value="closed" className="py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">Closed Jobs</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderJobTable(jobs)}</TabsContent>
          <TabsContent value="posted">{renderJobTable(jobs.filter(job => job.status === 'posted'))}</TabsContent>
          <TabsContent value="draft">{renderJobTable(jobs.filter(job => job.status === 'draft'))}</TabsContent>
          <TabsContent value="closed">{renderJobTable(jobs.filter(job => job.status === 'closed'))}</TabsContent>
        </Tabs>
      </CardContent>
      
      <JobPreviewDialog job={selectedJobForPreview} isOpen={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} />

      {/* Confirmation Dialog for Deleting Job */}
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

      {/* Confirmation Dialog for Updating Job Status */}
       <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-primary h-5 w-5"/>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of "{jobToUpdateStatus?.job.jobTitle}" to <span className="font-semibold capitalize">{jobToUpdateStatus?.newStatus}</span>?
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

      {/* Share Job Modal */}
        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Share2 className="text-primary h-5 w-5"/>Share Job Link</DialogTitle>
                    <JobPreviewDialogDescription>
                        Copy the link below to share this job posting.
                    </JobPreviewDialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        id="share-link"
                        readOnly
                        value={jobLinkToShare}
                        className="focus:ring-primary focus:border-primary"
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


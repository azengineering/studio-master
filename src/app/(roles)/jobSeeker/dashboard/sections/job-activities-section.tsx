
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NextLink from 'next/link'; // Renamed to NextLink to avoid conflict
import { useRouter } from 'next/navigation';
import {
  getAppliedJobs,
  getSavedJobs,
  withdrawApplicationAction,
  type AppliedJobData,
  type SavedJobData
} from '../actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Briefcase, CheckCircle, Eye, Trash2, Bookmark, Building, MessageSquare, CalendarDays, Share2, Copy, Send, PackageCheck, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saveJobAction } from '@/app/(roles)/jobSeeker/find-jobs/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyPublicProfileDialog, type CompanyPublicProfile } from '@/components/dialogs/CompanyPublicProfileDialog';
import { format, parseISO, isValid as isValidDateFn } from 'date-fns';
import type { ApplicationStatus, JobStatus } from '@/app/(roles)/employer/dashboard/types';
import { cn } from '@/lib/utils';


export default function JobActivitiesSection() {
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobData[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJobData[]>([]);
  const [isLoadingApplied, setIsLoadingApplied] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [applicationToWithdraw, setApplicationToWithdraw] = useState<AppliedJobData | null>(null);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);

  const [jobToUnsaveConfirm, setJobToUnsaveConfirm] = useState<SavedJobData | null>(null);
  const [isUnsaveDialogVisible, setIsUnsaveDialogVisible] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const [isCompanyProfileDialogOpen, setIsCompanyProfileDialogOpen] = useState(false);
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<CompanyPublicProfile | null>(null);

  const [isRemarksPopupOpen, setIsRemarksPopupOpen] = useState(false);
  const [remarksToShow, setRemarksToShow] = useState<string | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [jobLinkToShare, setJobLinkToShare] = useState('');


  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      setCurrentUserId(parseInt(userIdStr, 10));
    } else {
      toast({ title: "Authentication Error", description: "User ID not found. Please log in to view your activities.", variant: "destructive" });
      setIsLoadingApplied(false);
      setIsLoadingSaved(false);
    }
  }, [toast]);

  const fetchApplied = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingApplied(true);
    const response = await getAppliedJobs(currentUserId);
    if (response.success && response.data) {
      setAppliedJobs(response.data);
    } else {
      toast({ title: 'Error Fetching Applied Jobs', description: response.error || "Could not fetch applied jobs.", variant: 'destructive' });
      setAppliedJobs([]);
    }
    setIsLoadingApplied(false);
  }, [currentUserId, toast]);

  const fetchSaved = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingSaved(true);
    const response = await getSavedJobs(currentUserId);
    if (response.success && response.data) {
      setSavedJobs(response.data);
    } else {
      toast({ title: 'Error Fetching Saved Jobs', description: response.error || "Could not fetch saved jobs.", variant: 'destructive' });
      setSavedJobs([]);
    }
    setIsLoadingSaved(false);
  }, [currentUserId, toast]);

  useEffect(() => {
    if (currentUserId) {
      fetchApplied();
      fetchSaved();
    }
  }, [currentUserId, fetchApplied, fetchSaved]);

  const handleWithdrawApplication = async () => {
    if (!currentUserId || !applicationToWithdraw) return;
    const response = await withdrawApplicationAction(applicationToWithdraw.applicationId, currentUserId);
    if (response.success) {
      toast({ title: "Application Withdrawn", description: response.message, variant: "default"});
      fetchApplied(); // Refresh applied jobs list
    } else {
      toast({ title: "Error", description: response.error || "Failed to withdraw application.", variant: "destructive"});
    }
    setIsWithdrawConfirmOpen(false);
    setApplicationToWithdraw(null);
  };

  const handleUnsaveJobConfirm = async () => {
    if (!currentUserId || !jobToUnsaveConfirm) {
        toast({ title: "Error", description: "User not authenticated or job not selected.", variant: "destructive"});
        return;
    }
    // Note: The third argument `false` tells saveJobAction to unsave
    const response = await saveJobAction(jobToUnsaveConfirm.jobId, currentUserId, false); 
    if (response.success) {
        toast({ title: "Job Unsaved", description: response.message, variant: "default"});
        fetchSaved(); // Refresh saved jobs list
    } else {
        toast({ title: "Error", description: response.error || "Failed to unsave job.", variant: "destructive"});
    }
    setIsUnsaveDialogVisible(false);
    setJobToUnsaveConfirm(null);
  };

  const getApplicationStatusBadge = (status: ApplicationStatus) => {
    const s = status.toLowerCase() as ApplicationStatus;
    if (s === 'submitted') return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300">Submitted</Badge>;
    if (s === 'viewed') return <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300">Viewed</Badge>;
    if (s === 'shortlisted') return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-600/30 dark:text-yellow-300">Shortlisted</Badge>;
    if (s === 'interviewing') return <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-300">Interviewing</Badge>;
    if (s === 'hired') return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300">Hired</Badge>;
    if (s === 'rejected') return <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400 border-red-200 dark:border-red-600">Rejected</Badge>;
    if (s === 'declined') return <Badge variant="destructive" className="bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-400 border-orange-200 dark:border-orange-600">Declined by You</Badge>;
    return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  };

  const getJobStatusBadge = (status?: JobStatus) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    switch (status.toLowerCase() as JobStatus) {
      case 'active': return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300">Active</Badge>;
      case 'closed': return <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-400 border-red-200 dark:border-red-600">Closed</Badge>;
      case 'draft': return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-600/30 dark:text-yellow-300">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const handleViewCompany = (companyData: Partial<SavedJobData | AppliedJobData>) => {
    const profileToView: CompanyPublicProfile = {
        companyName: companyData.companyName || "Company Information",
        companyLogoUrl: 'companyLogoUrl' in companyData ? companyData.companyLogoUrl || null : null,
        companyWebsite: 'companyWebsite' in companyData && typeof companyData.companyWebsite === 'string' ? companyData.companyWebsite : null,
        aboutCompany: 'aboutCompany' in companyData && typeof companyData.aboutCompany === 'string' ? companyData.aboutCompany : null,
        yearOfEstablishment: 'yearOfEstablishment' in companyData && typeof companyData.yearOfEstablishment === 'number' ? companyData.yearOfEstablishment : null,
        teamSize: 'teamSize' in companyData && typeof companyData.teamSize === 'number' ? companyData.teamSize : null,
        linkedinUrl: 'linkedinUrl' in companyData && typeof companyData.linkedinUrl === 'string' ? companyData.linkedinUrl : null,
        address: 'address' in companyData && typeof companyData.address === 'string' ? companyData.address : null,
    };
    setSelectedCompanyProfile(profileToView);
    setIsCompanyProfileDialogOpen(true);
  };

  const openRemarksPopup = (remarks: string) => {
    setRemarksToShow(remarks);
    setIsRemarksPopupOpen(true);
  };

  const handleShareJobClick = (jobId: number) => {
    const shareLink = `${window.location.origin}/jobSeeker/find-jobs/${jobId}`;
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

  const formatDateWithTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const dateStrToParse = dateString.endsWith('Z') || /\+\d{2}:\d{2}$/.test(dateString)
          ? dateString
          : dateString + 'Z';
      const date = parseISO(dateStrToParse);
      if (isValidDateFn(date)) {
        return format(date, "MMM d, yyyy, p");
      }
      return 'Invalid Date';
    } catch (e) {
      console.error("Error formatting date with time:", dateString, e);
      return 'Invalid Date';
    }
  };

  const formatDateOnly = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const dateStrToParse = dateString.endsWith('Z') || /\+\d{2}:\d{2}$/.test(dateString)
          ? dateString
          : dateString + 'Z';
      const date = parseISO(dateStrToParse);
      if (isValidDateFn(date)) {
        return format(date, "MMM d, yyyy");
      }
      return 'Invalid Date';
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };


  const renderAppliedJobs = () => {
    if (isLoadingApplied) return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (appliedJobs.length === 0) return <p className="text-center text-muted-foreground py-6">You haven't applied to any jobs yet.</p>;
    return (
      <ScrollArea className="h-[400px] pr-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Employer Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appliedJobs.map(job => (
                <TableRow key={job.applicationId}>
                  <TableCell className="font-medium">
                    <NextLink href={`/jobSeeker/find-jobs/${job.jobId}`} className="hover:underline hover:text-primary">
                        {job.jobTitle}
                    </NextLink>
                  </TableCell>
                  <TableCell>
                      <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" onClick={() => handleViewCompany(job)}>
                          <Building className="mr-1.5 h-3.5 w-3.5"/>{job.companyName}
                      </Button>
                  </TableCell>
                  <TableCell className="flex items-center gap-1 text-xs"><CalendarDays className="h-3 w-3"/>{formatDateWithTime(job.applicationDate)}</TableCell>
                  <TableCell>{getApplicationStatusBadge(job.applicationStatus)}</TableCell>
                  <TableCell className="text-center">
                    {job.employer_remarks && job.employer_remarks.trim() !== "" ? (
                       <Tooltip>
                          <TooltipTrigger asChild>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                  onClick={() => openRemarksPopup(job.employer_remarks!)}
                                  aria-label="View Employer Remarks"
                              >
                                  <MessageSquare className="h-4 w-4"/>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View Employer Remarks</p></TooltipContent>
                       </Tooltip>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 p-0 text-primary/80 hover:text-primary">
                              <NextLink href={`/jobSeeker/find-jobs/${job.jobId}`}><Eye className="h-4 w-4"/></NextLink>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>View Job</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleShareJobClick(job.jobId)} className="h-8 w-8 p-0 text-sky-600/80 hover:text-sky-600 hover:bg-sky-600/10">
                          <Share2 className="h-4 w-4"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Share Job</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => { setApplicationToWithdraw(job); setIsWithdrawConfirmOpen(true); }} className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive">
                              <Trash2 className="h-4 w-4"/>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Withdraw Application</p></TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  const renderSavedJobs = () => {
    if (isLoadingSaved) return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (savedJobs.length === 0) return <p className="text-center text-muted-foreground py-6">You haven't saved any jobs yet.</p>;
    return (
      <ScrollArea className="h-[400px] pr-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Saved On</TableHead>
              <TableHead>Job Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedJobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                     <NextLink href={`/jobSeeker/find-jobs/${job.jobId}`} className="hover:underline hover:text-primary">
                        {job.jobTitle}
                    </NextLink>
                  </TableCell>
                  <TableCell>
                       <Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary" onClick={() => handleViewCompany(job)}>
                          <Building className="mr-1.5 h-3.5 w-3.5"/>{job.companyName}
                      </Button>
                  </TableCell>
                  <TableCell className="flex items-center gap-1 text-xs"><CalendarDays className="h-3 w-3"/>{formatDateOnly(job.savedDate)}</TableCell>
                  <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 p-0 text-primary/80 hover:text-primary">
                              <NextLink href={`/jobSeeker/find-jobs/${job.jobId}`}><Eye className="h-4 w-4"/></NextLink>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>View Job</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleShareJobClick(job.jobId)} className="h-8 w-8 p-0 text-sky-600/80 hover:text-sky-600 hover:bg-sky-600/10">
                          <Share2 className="h-4 w-4"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Share Job</p></TooltipContent>
                    </Tooltip>
                    {job.status === 'active' && !job.isApplied && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 p-0 text-green-600/80 hover:text-green-600 hover:bg-green-600/10">
                                    <NextLink href={`/jobSeeker/find-jobs/${job.jobId}?apply=true`}><Send className="h-4 w-4"/></NextLink>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Apply Now</p></TooltipContent>
                        </Tooltip>
                    )}
                    {job.status === 'active' && job.isApplied && (
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-green-500 opacity-70 cursor-not-allowed" disabled>
                                    <CheckCircle className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Already Applied</p></TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => {setJobToUnsaveConfirm(job); setIsUnsaveDialogVisible(true);}} className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive">
                              <Trash2 className="h-4 w-4"/>
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Unsave Job</p></TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <TooltipProvider>
        <Card className="shadow-xl border-border rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/20 p-6">
            <CardTitle className="text-2xl flex items-center gap-3 text-primary">
            <Briefcase className="h-7 w-7" /> My Job Activities
            </CardTitle>
            <CardDescription>Track your job applications and saved opportunities.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
            <Tabs defaultValue="applied" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger value="applied" className="py-2 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">
                <CheckCircle className="mr-2 h-4 w-4"/> Applied Jobs ({appliedJobs.length})
                </TabsTrigger>
                <TabsTrigger value="saved" className="py-2 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md rounded-md">
                <Bookmark className="mr-2 h-4 w-4"/> Saved Jobs ({savedJobs.length})
                </TabsTrigger>
            </TabsList>
            <TabsContent value="applied">{renderAppliedJobs()}</TabsContent>
            <TabsContent value="saved">{renderSavedJobs()}</TabsContent>
            </Tabs>
        </CardContent>
        </Card>
         <AlertDialog open={isWithdrawConfirmOpen} onOpenChange={setIsWithdrawConfirmOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5"/>Confirm Withdrawal</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to withdraw your application for "{applicationToWithdraw?.jobTitle}"?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {setApplicationToWithdraw(null); setIsWithdrawConfirmOpen(false);}}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdrawApplication} className="bg-destructive hover:bg-destructive/90">
                Withdraw
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isUnsaveDialogVisible} onOpenChange={setIsUnsaveDialogVisible}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive h-5 w-5"/>Confirm Unsave</AlertDialogTitle>
                    <AlertDialogDescription>
                    Are you sure you want to remove "{jobToUnsaveConfirm?.jobTitle}" from your saved jobs?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {setJobToUnsaveConfirm(null); setIsUnsaveDialogVisible(false);}}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleUnsaveJobConfirm} className="bg-destructive hover:bg-destructive/90">
                    Unsave
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <CompanyPublicProfileDialog
            isOpen={isCompanyProfileDialogOpen}
            onOpenChange={setIsCompanyProfileDialogOpen}
            company={selectedCompanyProfile}
        />
        <AlertDialog open={isRemarksPopupOpen} onOpenChange={setIsRemarksPopupOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <MessageSquare className="text-yellow-500 h-5 w-5" /> Employer Remarks
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2 text-sm text-foreground whitespace-pre-wrap">
                {remarksToShow || "No remarks provided."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsRemarksPopupOpen(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Share2 className="text-primary h-5 w-5"/>Share Job Link</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Copy the link below to share this job posting.
              </p>
            </DialogHeader>
            <div className="py-4">
              <Input
                id="share-link-activities"
                readOnly
                value={jobLinkToShare}
                className="focus:ring-primary focus:border-primary"
                aria-label="Shareable job link"
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

    </TooltipProvider>
  );
}


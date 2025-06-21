
// src/app/(roles)/employer/control/sections/track-applications-section.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckSquare, Users, ArrowLeft, Briefcase, ChevronDown, Eye, FileText, HelpCircle, MessageSquare, InfoIcon, FilterX, SlidersHorizontal, CheckCircle as CheckCircleIcon, Edit, XCircle, AlertTriangle, CalendarDays as CalendarIconLucide } from 'lucide-react';
import { getJobsWithApplicationCountsAction, getApplicationsForJobAction, updateApplicationStatusAction, type JobWithApplicationCount, type ApplicantData } from '../../dashboard/actions';
import { type ApplicationStatus, APPLICATION_STATUS_OPTIONS, type JobStatus } from '@/app/(roles)/employer/dashboard/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Badge } from '@/components/ui/badge'; // Added Badge import

type ViewMode = 'jobsList' | 'applicantsList';

// --- Helper for Status Badges ---
const getApplicationStatusBadgeVariant = (status: ApplicationStatus): {bg: string, text: string, border: string, icon: JSX.Element, label: string } => {
    const s = status.toLowerCase() as ApplicationStatus;
    if (s === 'submitted') return {bg: 'bg-blue-100 dark:bg-blue-700/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-600', icon: <FileText className="mr-1.5 h-3.5 w-3.5" />, label: 'Submitted' };
    if (s === 'viewed') return {bg: 'bg-indigo-100 dark:bg-indigo-700/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-600', icon: <Eye className="mr-1.5 h-3.5 w-3.5" />, label: 'Viewed' };
    if (s === 'shortlisted') return {bg: 'bg-yellow-100 dark:bg-yellow-600/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600', icon: <CheckSquare className="mr-1.5 h-3.5 w-3.5" />, label: 'Shortlisted' };
    if (s === 'interviewing') return {bg: 'bg-teal-100 dark:bg-teal-700/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-600', icon: <Users className="mr-1.5 h-3.5 w-3.5" />, label: 'Interviewing' };
    if (s === 'hired') return {bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-600', icon: <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" />, label: 'Hired' };
    if (s === 'rejected') return {bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-600', icon: <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />, label: 'Rejected' }; 
    if (s === 'declined') return {bg: 'bg-orange-100 dark:bg-orange-700/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-600', icon: <XCircle className="mr-1.5 h-3.5 w-3.5" />, label: 'Declined' }; 
    return {bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600', icon: <InfoIcon className="mr-1.5 h-3.5 w-3.5" />, label: status };
};

const getJobStatusBadgeVariant = (status: JobStatus): {bg: string, text: string, border: string, icon: JSX.Element, label: string } => {
  switch (status.toLowerCase() as JobStatus) {
    case 'active': return {bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-600', icon: <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" />, label: 'Active' };
    case 'draft': return {bg: 'bg-yellow-100 dark:bg-yellow-600/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600', icon: <Edit className="mr-1.5 h-3.5 w-3.5" />, label: 'Draft' };
    case 'closed': return {bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-600', icon: <XCircle className="mr-1.5 h-3.5 w-3.5" />, label: 'Closed' };
    default: return {bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600', icon: <Briefcase className="mr-1.5 h-3.5 w-3.5" />, label: status };
  }
};

// --- Sub-component for Jobs List View ---
interface JobsListTableViewProps {
  jobsWithCounts: JobWithApplicationCount[];
  isLoading: boolean;
  onViewApplicants: (job: JobWithApplicationCount) => void;
  jobTitleFilter: string;
  onJobTitleFilterChange: (value: string) => void;
  jobDateRangeFilter?: DateRange;
  onJobDateRangeFilterChange: (range?: DateRange) => void;
  onClearJobFilters: () => void;
}

const JobsListTableView: React.FC<JobsListTableViewProps> = ({
  jobsWithCounts, isLoading, onViewApplicants,
  jobTitleFilter, onJobTitleFilterChange,
  jobDateRangeFilter, onJobDateRangeFilterChange,
  onClearJobFilters
}) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-foreground">Jobs & Application Counts</h3>
    
    <Card className="p-4 bg-secondary/30 border-border shadow-sm rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="job-title-filter-track" className="text-sm font-medium text-muted-foreground">Filter by Job Title</Label>
          <Input
            id="job-title-filter-track"
            type="text"
            placeholder="Enter job title..."
            value={jobTitleFilter}
            onChange={(e) => onJobTitleFilterChange(e.target.value)}
            className="h-10 bg-background mt-1"
          />
        </div>
        <div>
          <Label htmlFor="job-date-filter-track" className="text-sm font-medium text-muted-foreground">Filter by Posted Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="job-date-filter-track"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-10 bg-background mt-1",
                  !jobDateRangeFilter && "text-muted-foreground"
                )}
              >
                <CalendarIconLucide className="mr-2 h-4 w-4" />
                {jobDateRangeFilter?.from ? (
                  jobDateRangeFilter.to ? (
                    <>{format(jobDateRangeFilter.from, "LLL dd, y")} - {format(jobDateRangeFilter.to, "LLL dd, y")}</>
                  ) : (format(jobDateRangeFilter.from, "LLL dd, y"))
                ) : (<span>Pick a date range</span>)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar initialFocus mode="range" defaultMonth={jobDateRangeFilter?.from} selected={jobDateRangeFilter} onSelect={onJobDateRangeFilterChange} numberOfMonths={2}/>
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={onClearJobFilters} variant="outline" className="h-10">
          <FilterX className="mr-2 h-4 w-4" /> Clear Job Filters
        </Button>
      </div>
    </Card>

    {isLoading ? (
      <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    ) : jobsWithCounts.length === 0 ? (
      <p className="text-muted-foreground text-center py-6">
        {jobTitleFilter || jobDateRangeFilter ? 'No jobs match your filters.' : 'You have not posted any jobs yet, or no applications have been received for active jobs.'}
      </p>
    ) : (
      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Title</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Status</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Posted On</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Applications</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobsWithCounts.map((job) => {
              const jobStatusStyle = getJobStatusBadgeVariant(job.status);
              return (
              <TableRow key={job.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="px-4 py-3 font-medium text-foreground">{job.jobTitle}</TableCell>
                <TableCell className="px-4 py-3 text-center">
                   <Badge variant="outline" className={cn("capitalize text-xs py-1 px-2.5 rounded-full font-semibold min-w-[90px] justify-center flex items-center", jobStatusStyle.bg, jobStatusStyle.text, jobStatusStyle.border)}>
                      {jobStatusStyle.icon} {jobStatusStyle.label}
                    </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-center text-muted-foreground">{format(parseISO(job.createdAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="px-4 py-3 text-center">
                  {job.totalApplications > 0 ? (
                    <Button variant="link" onClick={() => onViewApplicants(job)} className="text-primary p-0 h-auto">
                      {job.totalApplications} Application{job.totalApplications !== 1 ? 's' : ''}
                    </Button>
                  ) : (<span className="text-muted-foreground">0 Applications</span>)}
                </TableCell>
              </TableRow>);
          })}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
);
JobsListTableView.displayName = 'JobsListTableView';


// --- Sub-component for Applicants List View ---
interface ApplicantsListTableViewProps {
  selectedJob: JobWithApplicationCount;
  applicants: ApplicantData[];
  isLoading: boolean;
  statusFilter: ApplicationStatus | 'all';
  onStatusFilterChange: (status: ApplicationStatus | 'all') => void;
  statusCounts: Record<ApplicationStatus, number>;
  onConfirmStatusUpdate: (applicant: ApplicantData, newStatus: ApplicationStatus) => void;
  onBackToJobs: () => void;
  updatingStatusForAppId: number | null;
}

const ApplicantsListTableView: React.FC<ApplicantsListTableViewProps> = ({
  selectedJob, applicants, isLoading, statusFilter, onStatusFilterChange, statusCounts,
  onConfirmStatusUpdate, onBackToJobs, updatingStatusForAppId
}) => {
  const router = useRouter();
  const currentStatusFilterStyle = getApplicationStatusBadgeVariant(statusFilter as ApplicationStatus); 

  const navigateToApplicantDetails = (applicantId: number) => {
    router.push(`/employer/control/applications/${applicantId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-foreground">Applicants for: <span className="text-primary">{selectedJob.jobTitle}</span></h3>
          <Button variant="outline" onClick={onBackToJobs} size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs List</Button>
      </div>
      {Object.keys(statusCounts).length > 0 && (
          <Card className="p-4 border rounded-lg bg-secondary/30 shadow-sm"><h4 className="text-md font-semibold mb-2 text-foreground">Application Status Summary:</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {APPLICATION_STATUS_OPTIONS.map(statusKey => {
                      const count = statusCounts[statusKey] || 0; const style = getApplicationStatusBadgeVariant(statusKey);
                      return count > 0 && (<div key={statusKey} className="text-sm text-muted-foreground"><span className={cn("font-semibold capitalize p-1 rounded-sm text-xs mr-1 inline-flex items-center", style.bg, style.text)}> {style.icon} {style.label}:</span>{count}</div>);
                  })}
              </div>
          </Card>
      )}
      <div className="flex items-center gap-3 mt-4 mb-3">
        <Label htmlFor="status-filter-track" className="text-sm font-medium text-muted-foreground">Filter by Status:</Label>
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as ApplicationStatus | 'all')}>
          <SelectTrigger className={cn("w-full sm:w-[220px] h-9 text-sm", statusFilter !== 'all' && `${currentStatusFilterStyle.bg} ${currentStatusFilterStyle.text} ${currentStatusFilterStyle.border} hover:opacity-90 font-semibold` )}>
             <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {APPLICATION_STATUS_OPTIONS.map(status => { const style = getApplicationStatusBadgeVariant(status); return (<SelectItem key={status} value={status} className={cn("capitalize text-xs flex items-center", style.text)}>{style.icon} <span className="ml-1.5">{style.label}</span></SelectItem>);})}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (<div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : applicants.length === 0 ? (<p className="text-muted-foreground text-center py-6">{statusFilter === 'all' ? "No applicants for this job yet." : `No applicants found with status: ${getApplicationStatusBadgeVariant(statusFilter as ApplicationStatus).label}.`}</p>
      ) : (
          <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
          <Table><TableHeader className="bg-muted/50"><TableRow><TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Applicant</TableHead><TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Applied On</TableHead><TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Status</TableHead><TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
              {applicants.map((applicant) => { const statusStyle = getApplicationStatusBadgeVariant(applicant.applicationStatus); return (
                  <TableRow key={applicant.applicationId} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="px-4 py-3 font-medium">
                     <Button variant="link" className="p-0 h-auto text-foreground hover:text-primary text-left" onClick={() => navigateToApplicantDetails(applicant.applicationId)}>
                        {applicant.jobSeekerName || applicant.jobSeekerEmail}
                     </Button>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground flex items-center gap-1.5 text-sm">
                     <CalendarIconLucide className="h-3.5 w-3.5"/>{format(parseISO(applicant.applicationDate), "MMM d, yyyy, p")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center"><DropdownMenu><DropdownMenuTrigger asChild>
                      <Button variant="outline" size="xs" className={cn("capitalize text-xs py-1 px-2.5 rounded-full font-semibold min-w-[120px] justify-between hover:opacity-90 flex items-center", statusStyle.bg, statusStyle.text, statusStyle.border)} disabled={updatingStatusForAppId === applicant.applicationId}>
                      {updatingStatusForAppId === applicant.applicationId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : statusStyle.icon}{statusStyle.label}<ChevronDown className="ml-1 h-3 w-3 opacity-70" /></Button>
                  </DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48">{APPLICATION_STATUS_OPTIONS.map((statusOption) => { const optionStyle = getApplicationStatusBadgeVariant(statusOption); const isCurrentStatus = applicant.applicationStatus.toLowerCase() === statusOption.toLowerCase(); return (
                      <DropdownMenuItem key={statusOption} onClick={() => !isCurrentStatus && onConfirmStatusUpdate(applicant, statusOption)} className={cn("capitalize text-xs flex items-center", optionStyle.text, isCurrentStatus ? "opacity-50 cursor-not-allowed" : "cursor-pointer")} disabled={isCurrentStatus || updatingStatusForAppId === applicant.applicationId}>{optionStyle.icon} <span className="ml-1.5">{optionStyle.label}</span></DropdownMenuItem>);})}</DropdownMenuContent></DropdownMenu></TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-primary/80 hover:text-primary" onClick={() => navigateToApplicantDetails(applicant.applicationId)} aria-label="View Application Details">
                        <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  </TableRow>);})}
              </TableBody>
          </Table></div>)}
    </div>);
};
ApplicantsListTableView.displayName = 'ApplicantsListTableView';


// --- Main Section Component ---
export default function TrackApplicationsSection() {
  const [viewMode, setViewMode] = useState<ViewMode>('jobsList');
  const [jobsWithCounts, setJobsWithCounts] = useState<JobWithApplicationCount[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithApplicationCount | null>(null);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const [applicationToUpdate, setApplicationToUpdate] = useState<ApplicantData | null>(null);
  const [newStatusForUpdate, setNewStatusForUpdate] = useState<ApplicationStatus | null>(null);
  const [remarksForUpdate, setRemarksForUpdate] = useState<string>('');
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [updatingStatusForAppId, setUpdatingStatusForAppId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('');
  const [jobDateRangeFilter, setJobDateRangeFilter] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) setCurrentUserId(parseInt(userIdStr, 10));
    else { toast({ title: "Authentication Error", description: "User ID not found.", variant: "destructive" }); setIsLoadingJobs(false); }
  }, [toast]);

  const fetchJobsWithCounts = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoadingJobs(true);
    const response = await getJobsWithApplicationCountsAction(currentUserId);
    if (response.success && response.jobsWithCounts) setJobsWithCounts(response.jobsWithCounts);
    else { setJobsWithCounts([]); toast({ title: 'Error', description: response.error || 'Failed to load job application counts.', variant: 'destructive' });}
    setIsLoadingJobs(false);
  }, [currentUserId, toast]);

  useEffect(() => { if (currentUserId) fetchJobsWithCounts(); }, [currentUserId, fetchJobsWithCounts]);

  const handleViewApplicants = async (job: JobWithApplicationCount) => {
    if (!currentUserId) return;
    setSelectedJob(job);
    setIsLoadingApplicants(true);
    setViewMode('applicantsList');
    setStatusFilter('all'); 
    const response = await getApplicationsForJobAction(job.id, currentUserId);
    if (response.success && response.applicants) setApplicants(response.applicants);
    else { setApplicants([]); toast({ title: 'Error', description: response.error || 'Failed to load applicants for this job.', variant: 'destructive' });}
    setIsLoadingApplicants(false);
  };
  
  const confirmStatusUpdate = (applicant: ApplicantData, newStatus: ApplicationStatus) => {
    setApplicationToUpdate(applicant); setNewStatusForUpdate(newStatus);
    setRemarksForUpdate(applicant.employer_remarks || ''); setIsStatusConfirmOpen(true);
  };

  const executeStatusUpdate = async () => {
    if (!currentUserId || !applicationToUpdate || !newStatusForUpdate) return;
    if(!remarksForUpdate.trim()){ toast({ title: "Remarks Required", description: "Please provide remarks for the status change.", variant: "destructive"}); return;}
    setUpdatingStatusForAppId(applicationToUpdate.applicationId);
    const response = await updateApplicationStatusAction(applicationToUpdate.applicationId, newStatusForUpdate, currentUserId, remarksForUpdate);
    setUpdatingStatusForAppId(null); setIsStatusConfirmOpen(false);
    if (response.success) {
      toast({ title: 'Status Updated', description: response.message || 'Application status updated successfully.', variant: 'default' });
      setApplicants(prev => prev.map(app => app.applicationId === applicationToUpdate.applicationId ? { ...app, applicationStatus: newStatusForUpdate!, employer_remarks: remarksForUpdate } : app));
    } else toast({ title: 'Error Updating Status', description: response.error || 'Failed to update application status.', variant: 'destructive' });
    setApplicationToUpdate(null); setNewStatusForUpdate(null); setRemarksForUpdate('');
  };
  
  const statusCounts = useMemo(() => applicants.reduce((acc, curr) => { acc[curr.applicationStatus] = (acc[curr.applicationStatus] || 0) + 1; return acc; }, {} as Record<ApplicationStatus, number>), [applicants]);
  const filteredApplicants = useMemo(() => statusFilter === 'all' ? applicants : applicants.filter(app => app.applicationStatus.toLowerCase() === statusFilter.toLowerCase()), [applicants, statusFilter]);
  const filteredJobsWithCounts = useMemo(() => {
    let filtered = jobsWithCounts;
    if (jobTitleFilter) filtered = filtered.filter(job => job.jobTitle.toLowerCase().includes(jobTitleFilter.toLowerCase()));
    if (jobDateRangeFilter?.from && jobDateRangeFilter?.to) filtered = filtered.filter(job => { try { const d = parseISO(job.createdAt); return isWithinInterval(d, { start: jobDateRangeFilter.from!, end: jobDateRangeFilter.to! });} catch(e) { return false;}});
    return filtered;
  }, [jobsWithCounts, jobTitleFilter, jobDateRangeFilter]);

  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary"><CheckSquare className="h-7 w-7" /> Candidate Application Tracking</CardTitle>
        <CardDescription>View applications per job and manage candidate statuses.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        {viewMode === 'jobsList' ? (
          <JobsListTableView
            jobsWithCounts={filteredJobsWithCounts}
            isLoading={isLoadingJobs}
            onViewApplicants={handleViewApplicants}
            jobTitleFilter={jobTitleFilter}
            onJobTitleFilterChange={setJobTitleFilter}
            jobDateRangeFilter={jobDateRangeFilter}
            onJobDateRangeFilterChange={setJobDateRangeFilter}
            onClearJobFilters={() => {setJobTitleFilter(''); setJobDateRangeFilter(undefined);}}
          />
        ) : selectedJob ? (
          <ApplicantsListTableView
            selectedJob={selectedJob}
            applicants={filteredApplicants}
            isLoading={isLoadingApplicants}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusCounts={statusCounts}
            onConfirmStatusUpdate={confirmStatusUpdate}
            onBackToJobs={() => { setViewMode('jobsList'); setSelectedJob(null); setApplicants([]); }}
            updatingStatusForAppId={updatingStatusForAppId}
          />
        ) : null}
      </CardContent>
      <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 text-lg text-primary"><MessageSquare className="h-5 w-5"/>Update Application Status</AlertDialogTitle>
            <AlertDialogDescription>You are changing status of <strong className="text-foreground">{applicationToUpdate?.jobSeekerName || applicationToUpdate?.jobSeekerEmail}</strong> for "<em>{applicationToUpdate?.jobTitleApplyingFor || selectedJob?.jobTitle}</em>" to <span className="font-semibold capitalize">{getApplicationStatusBadgeVariant(newStatusForUpdate || 'submitted').label}</span>.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-2"><Label htmlFor="remarks" className="font-medium text-foreground">Add Remarks (Mandatory)</Label>
            <Textarea id="remarks" placeholder="e.g., Strong candidate, good fit for the role. OR Lacks specific skill X." value={remarksForUpdate} onChange={(e) => setRemarksForUpdate(e.target.value)} rows={3} className="mt-1 transition-default focus:ring-primary focus:border-primary"/>
             <p className="text-xs text-blue-600 dark:text-blue-400 p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20"><InfoIcon className="inline-block h-3.5 w-3.5 mr-1 align-text-bottom"/>Providing clear remarks helps job seekers understand their application status and improve for future opportunities.</p>
          </div>
          <AlertDialogFooter><AlertDialogCancel onClick={() => {setApplicationToUpdate(null); setNewStatusForUpdate(null); setRemarksForUpdate('');}}>Cancel</AlertDialogCancel><AlertDialogAction onClick={executeStatusUpdate} className="bg-primary hover:bg-primary/90" disabled={!remarksForUpdate.trim()}>Confirm & Save</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
    


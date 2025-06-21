
// src/app/(roles)/employer/control/applications/[applicationId]/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getApplicantDetailsById,
  updateApplicationStatusAction,
  getApplicationsForJobAction,
  getJobsByStatus,
  type ApplicantData,
  type JobListingTableData,
} from '@/app/(roles)/employer/dashboard/actions';
import { type ApplicationStatus, APPLICATION_STATUS_OPTIONS, type JobStatus as AppJobStatus } from '@/app/(roles)/employer/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as RemarksDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  Github,
  Globe,
  MapPin,
  CalendarDays,
  MessageSquare,
  FileText,
  Edit,
  ChevronDown,
  Briefcase as BriefcaseIcon, 
  Tags,
  HelpCircle,
  DollarSign,
  Clock,
  InfoIcon,
  Eye,
  CheckCircle,
  AlertTriangle,
  CheckSquare,
  Users as UsersIconLucide,
  ExternalLink,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ListChecks,
  XCircle,
  BookOpen,
  BriefcaseBusiness, 
  Layers, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Helper Functions & Constants ---
const getInitials = (name?: string | null): string => {
  if (!name) return "AP";
  const parts = name.split(" ");
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDateDisplay = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return isValidDate(date) ? format(date, "MMM d, yyyy, p") : 'Invalid Date';
  } catch (e) {
    console.error("Error parsing date:", dateString, e);
    return 'Invalid Date String';
  }
};

const getApplicationStatusBadgeVariant = (status: ApplicationStatus): { bg: string; text: string; border: string; icon: JSX.Element; label: string } => {
  const s = status.toLowerCase() as ApplicationStatus;
  if (s === 'submitted') return { bg: 'bg-blue-100 dark:bg-blue-700/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-600', icon: <FileText className="mr-1.5 h-3.5 w-3.5" />, label: 'Submitted' };
  if (s === 'viewed') return { bg: 'bg-indigo-100 dark:bg-indigo-700/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-600', icon: <Eye className="mr-1.5 h-3.5 w-3.5" />, label: 'Viewed' };
  if (s === 'shortlisted') return { bg: 'bg-yellow-100 dark:bg-yellow-600/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600', icon: <CheckSquare className="mr-1.5 h-3.5 w-3.5" />, label: 'Shortlisted' };
  if (s === 'interviewing') return { bg: 'bg-teal-100 dark:bg-teal-700/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-600', icon: <UsersIconLucide className="mr-1.5 h-3.5 w-3.5" />, label: 'Interviewing' };
  if (s === 'hired') return { bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-600', icon: <CheckCircle className="mr-1.5 h-3.5 w-3.5" />, label: 'Hired' };
  if (s === 'rejected') return { bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-600', icon: <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />, label: 'Rejected' };
  if (s === 'declined') return { bg: 'bg-orange-100 dark:bg-orange-700/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-600', icon: <XCircle className="mr-1.5 h-3.5 w-3.5" />, label: 'Declined' };
  return { bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600', icon: <InfoIcon className="mr-1.5 h-3.5 w-3.5" />, label: status };
};

const getJobStatusBadgeForList = (status: AppJobStatus): { bg: string, text: string, border: string, icon?: JSX.Element, label: string } => {
  switch (status.toLowerCase() as AppJobStatus) {
    case 'active': return {bg: 'bg-green-100 dark:bg-green-700/30', text: 'text-green-600 dark:text-green-300', border: 'border-green-300 dark:border-green-600', label: 'Active' };
    case 'draft': return {bg: 'bg-yellow-100 dark:bg-yellow-600/30', text: 'text-yellow-600 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-500', label: 'Draft' };
    case 'closed': return {bg: 'bg-red-100 dark:bg-red-700/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-300 dark:border-red-600', label: 'Closed' };
    default: return {bg: 'bg-gray-100 dark:bg-gray-700/30', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-500', label: status };
  }
};

// --- Sub-component: ApplicantDetailsSection Helper ---
interface ApplicantDetailsSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  noDataMessage?: string;
}
const ApplicantDetailsSection: React.FC<ApplicantDetailsSectionProps> = ({ title, icon: Icon, children, className, noDataMessage = "Not provided." }) => {
  const isEmpty = !children || (typeof children === 'string' && !children.trim()) || (Array.isArray(children) && React.Children.count(children) === 0);
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic">{noDataMessage}</p>
      ) : (
        <div className="text-sm text-muted-foreground leading-relaxed pl-1">
          {children}
        </div>
      )}
      <Separator className="mt-4 mb-3" />
    </section>
  );
};

// --- Sub-component: ApplicantPageHeader ---
interface ApplicantPageHeaderProps {
  applicant: ApplicantData;
  onConfirmStatusUpdate: (applicantData: ApplicantData, newStatus: ApplicationStatus) => void;
  updatingStatusForAppId: number | null;
  onPreviousApplicant: () => void;
  onNextApplicant: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
}
const ApplicantPageHeader: React.FC<ApplicantPageHeaderProps> = ({
  applicant, onConfirmStatusUpdate, updatingStatusForAppId,
  onPreviousApplicant, onNextApplicant, isPreviousDisabled, isNextDisabled
}) => {
  const currentStatusStyle = getApplicationStatusBadgeVariant(applicant.applicationStatus);
  return (
    <Card className="mb-6 shadow-lg border-border rounded-xl overflow-hidden">
      <CardHeader className="p-6 bg-secondary/20 border-b border-border"> {/* Adjusted padding */}
        <div className="flex flex-col sm:flex-row items-center gap-x-6 gap-y-4"> {/* Avatar and Main Info Block */}
          <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-lg shrink-0" data-ai-hint="person photo"> {/* Larger Avatar */}
            <AvatarImage src={applicant.profilePictureUrl || undefined} alt={applicant.jobSeekerName || 'Applicant'} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
              {getInitials(applicant.jobSeekerName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-grow space-y-2 min-w-0"> {/* Main Info Block beside Avatar */}
            {/* Top Row: Applicant Name, Job Title, Prev/Next Nav */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground truncate" title={applicant.jobSeekerName || applicant.jobSeekerEmail}>
                  {applicant.jobSeekerName || applicant.jobSeekerEmail}
                  {applicant.gender && <span className="text-base text-muted-foreground font-normal ml-1.5">({applicant.gender})</span>}
                </h1>
                {applicant.jobTitleApplyingFor && (
                  <p className="text-md text-primary font-medium flex items-center gap-1.5">
                    <BriefcaseIcon className="h-4 w-4" /> Applied for: {applicant.jobTitleApplyingFor}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-1 sm:mt-0">
                  <Button variant="outline" size="icon" onClick={onPreviousApplicant} disabled={isPreviousDisabled} className="h-8 w-8 text-primary hover:bg-primary/10">
                    <ChevronLeftIcon className="h-5 w-5" /><span className="sr-only">Previous</span>
                  </Button>
                  <Button variant="outline" size="icon" onClick={onNextApplicant} disabled={isNextDisabled} className="h-8 w-8 text-primary hover:bg-primary/10">
                    <ChevronRightIcon className="h-5 w-5" /><span className="sr-only">Next</span>
                  </Button>
              </div>
            </div>

            {/* Second Row: Status Dropdown, Applied Date, Contact Icons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Button variant="outline" size="sm" className={cn("capitalize text-xs py-1 px-2.5 rounded-full font-semibold min-w-[120px] justify-between hover:opacity-90 flex items-center h-8", currentStatusStyle.bg, currentStatusStyle.text, currentStatusStyle.border)} disabled={updatingStatusForAppId === applicant.applicationId}>
                    {updatingStatusForAppId === applicant.applicationId ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : currentStatusStyle.icon} {currentStatusStyle.label} <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
                  </Button>
                  <select
                    onChange={(e) => onConfirmStatusUpdate(applicant, e.target.value as ApplicationStatus)}
                    value={applicant.applicationStatus}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Change application status"
                  >
                    {APPLICATION_STATUS_OPTIONS.map(statusOption => (
                      <option key={statusOption} value={statusOption} disabled={statusOption === applicant.applicationStatus}>
                        {getApplicationStatusBadgeVariant(statusOption).label}
                      </option>
                    ))}
                  </select>
                </div>
                 <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Applied: {formatDateDisplay(applicant.applicationDate)}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                  <Tooltip><TooltipTrigger asChild>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 text-xs space-y-1.5 shadow-lg rounded-md border bg-popover">
                        {applicant.jobSeekerEmail && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{applicant.jobSeekerEmail}</p>}
                        {applicant.phoneNumber ? <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{applicant.phoneNumber}</p> : <p className="italic text-muted-foreground">Phone N/A</p>}
                        {!applicant.jobSeekerEmail && !applicant.phoneNumber && <p className="italic">No contact details.</p>}
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger><TooltipContent><p>Contact Details</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild>
                    <Popover>
                      <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"><Globe className="h-4 w-4" /></Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 text-xs space-y-1.5 shadow-lg rounded-md border bg-popover">
                        {applicant.githubProfileUrl ? <a href={applicant.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Github className="h-3 w-3" />GitHub</a> : <p className="italic text-muted-foreground">GitHub N/A</p>}
                        {applicant.portfolioUrl ? <a href={applicant.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink className="h-3 w-3" />Portfolio</a> : <p className="italic text-muted-foreground">Portfolio N/A</p>}
                         {!applicant.githubProfileUrl && !applicant.portfolioUrl && <p className="italic">No social/portfolio links.</p>}
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger><TooltipContent><p>Social & Portfolio</p></TooltipContent></Tooltip>
              </div>
            </div>

            {/* Third Row: Key Profile Highlights */}
            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              {applicant.currentDesignation && (
                <span className="flex items-center gap-1">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-accent" />
                  {applicant.currentDesignation}
                  {applicant.currentWorkingLocation && <span className="ml-0.5">({applicant.currentWorkingLocation})</span>}
                </span>
              )}
              {applicant.currentIndustry && (
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="h-3.5 w-3.5 text-accent" />
                  {applicant.currentIndustry}
                  {applicant.currentIndustryType && applicant.currentIndustryType.toLowerCase() !== 'other' && applicant.currentIndustryType !== applicant.currentIndustry && (
                    <span className="ml-0.5">({applicant.currentIndustryType})</span>
                  )}
                </span>
              )}
              {applicant.totalExperience !== null && applicant.totalExperience !== undefined && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  {applicant.totalExperience} Yrs Exp
                </span>
              )}
              {applicant.presentSalary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-accent" />
                  Current Sal: {applicant.presentSalary}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

// --- Sub-component: ApplicantMainContent (Consolidated) ---
interface ApplicantMainContentProps {
  applicant: ApplicantData;
}
const ApplicantMainContent: React.FC<ApplicantMainContentProps> = ({ applicant }) => (
  <Card className="shadow-lg border-border rounded-xl overflow-hidden">
    <CardContent className="p-6 space-y-1">
      {applicant.professionalSummary && (
        <ApplicantDetailsSection title="Professional Summary" icon={BookOpen} noDataMessage="No professional summary provided.">
          <p className="whitespace-pre-wrap p-3 bg-muted/50 border border-border/50 rounded-md">{applicant.professionalSummary}</p>
        </ApplicantDetailsSection>
      )}
      <ApplicantDetailsSection title="Skills" icon={Tags} noDataMessage="No skills listed.">
        {applicant.skills && applicant.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {applicant.skills.map((skill, i) => <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>)}
          </div>
        ) : null}
      </ApplicantDetailsSection>
      
      <ApplicantDetailsSection title="Quick Info & Links" icon={InfoIcon}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Expected Salary:</p>
              <p className="font-semibold text-foreground">{applicant.expectedSalary || 'Not Specified'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Notice Period:</p>
              <p className="font-semibold text-foreground">{applicant.noticePeriod !== null && applicant.noticePeriod !== undefined ? `${applicant.noticePeriod} days` : 'Not Specified'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {applicant.resumeUrl && (
            <Button asChild variant="outline" size="sm" className="justify-start gap-1.5 h-9 text-xs border-primary/40 text-primary hover:bg-primary/10">
              <a href={applicant.resumeUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" /> Resume/CV <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
              </a>
            </Button>
          )}
          {applicant.portfolioUrl && (
            <Button asChild variant="outline" size="sm" className="justify-start gap-1.5 h-9 text-xs border-primary/40 text-primary hover:bg-primary/10">
              <a href={applicant.portfolioUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" /> Portfolio <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
              </a>
            </Button>
          )}
          {applicant.githubProfileUrl && (
            <Button asChild variant="outline" size="sm" className="justify-start gap-1.5 h-9 text-xs border-primary/40 text-primary hover:bg-primary/10">
              <a href={applicant.githubProfileUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" /> GitHub <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
              </a>
            </Button>
          )}
        </div>
        {!applicant.resumeUrl && !applicant.portfolioUrl && !applicant.githubProfileUrl && (
            <p className="text-xs text-muted-foreground italic text-left py-1">No external links provided for resume, portfolio, or GitHub.</p>
        )}
      </ApplicantDetailsSection>
      
      <ApplicantDetailsSection title="Screening Question Answers" icon={HelpCircle} noDataMessage="No screening questions were answered or asked.">
        {applicant.customQuestionAnswers && applicant.customQuestionAnswers.length > 0 ? (
          <ul className="space-y-3">
            {applicant.customQuestionAnswers.map((qa, index) => (
              <li key={index} className="p-3 bg-muted/50 border border-border/50 rounded-md text-sm">
                <p className="font-medium text-foreground">{qa.questionText}</p>
                <p className="text-muted-foreground whitespace-pre-wrap mt-0.5">{qa.answer}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ApplicantDetailsSection>
      
      <ApplicantDetailsSection title="Your Remarks" icon={MessageSquare} noDataMessage="No remarks added for this applicant yet.">
        {applicant.employer_remarks ? <p className="whitespace-pre-wrap p-3 bg-muted/50 border border-border/50 rounded-md">{applicant.employer_remarks}</p> : null}
      </ApplicantDetailsSection>
    </CardContent>
  </Card>
);

// --- Sub-component: AllJobsList (Left Column) ---
interface AllJobsListProps {
  jobs: JobListingTableData[];
  selectedJobIdForDisplay: number | null;
  isLoading: boolean;
  error?: string | null;
  onJobSelect: (jobId: number) => void;
}
const AllJobsList: React.FC<AllJobsListProps> = ({ jobs, selectedJobIdForDisplay, isLoading, error, onJobSelect }) => {
  if (isLoading) {
    return (
      <Card className="h-full shadow-lg border-border rounded-xl overflow-hidden">
        <CardHeader className="p-3 border-b border-border bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> All Company Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex justify-center items-center h-[calc(100%-50px)]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="h-full shadow-lg border-border rounded-xl overflow-hidden">
        <CardHeader className="p-3 border-b border-border bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> All Company Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex flex-col justify-center items-center h-[calc(100%-50px)] text-center">
          <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
          <p className="text-xs text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }
  if (jobs.length === 0) {
    return (
      <Card className="h-full shadow-lg border-border rounded-xl overflow-hidden">
        <CardHeader className="p-3 border-b border-border bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> All Company Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex flex-col justify-center items-center h-[calc(100%-50px)] text-center">
          <InfoIcon className="h-6 w-6 text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">No jobs posted yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-lg border-border rounded-xl overflow-hidden flex flex-col">
      <CardHeader className="p-3 border-b border-border bg-secondary/30 shrink-0">
        <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" /> All Company Jobs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1.5">
            {jobs.map((job) => {
              const jobStatusStyle = getJobStatusBadgeForList(job.status);
              const isHighlighted = job.id === selectedJobIdForDisplay;
              const postedDateFormatted = format(parseISO(job.createdAt), "MMM d, yy");
              return (
                <button
                  key={job.id}
                  onClick={() => onJobSelect(job.id)}
                  className={cn(
                    "w-full text-left p-2 border border-border rounded-md hover:bg-muted/50 transition-colors cursor-pointer block",
                    isHighlighted ? "bg-primary/10 border-primary shadow-sm" : "bg-card"
                  )}
                  title={`View applicants for ${job.jobTitle}`}
                >
                    <>
                      <p className={cn("text-xs font-medium truncate", isHighlighted ? "text-primary" : "text-foreground")}>
                        {job.jobTitle}
                      </p>
                      <div className="flex items-center justify-between mt-0.5 text-[10px] text-muted-foreground">
                        <span>{postedDateFormatted} ({jobStatusStyle.label})</span>
                      </div>
                    </>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};


// --- Main Orchestrating Component for the Page ---
interface ApplicantDetailPageContentProps {
  applicantId: number;
  employerUserId: number;
}
const ApplicantDetailPageContent: React.FC<ApplicantDetailPageContentProps> = ({ applicantId, employerUserId }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [applicant, setApplicant] = useState<ApplicantData | null>(null);
  const [isLoadingApplicant, setIsLoadingApplicant] = useState(true);
  const [errorApplicant, setErrorApplicant] = useState<string | null>(null);

  const [applicationToUpdate, setApplicationToUpdate] = useState<ApplicantData | null>(null);
  const [newStatusForUpdate, setNewStatusForUpdate] = useState<ApplicationStatus | null>(null);
  const [remarksForUpdate, setRemarksForUpdate] = useState<string>('');
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [updatingStatusForAppId, setUpdatingStatusForAppId] = useState<number | null>(null);

  const [allApplicantsForThisJob, setAllApplicantsForThisJob] = useState<ApplicantData[]>([]);
  const [currentApplicantIndex, setCurrentApplicantIndex] = useState<number>(-1);
  const [isLoadingSiblingApplicants, setIsLoadingSiblingApplicants] = useState(false);

  const [allEmployerJobs, setAllEmployerJobs] = useState<JobListingTableData[]>([]);
  const [isLoadingEmployerJobs, setIsLoadingEmployerJobs] = useState(true);
  const [errorEmployerJobs, setErrorEmployerJobs] = useState<string | null>(null);
  
  const [selectedJobIdForLeftPanel, setSelectedJobIdForLeftPanel] = useState<number | null>(null);
  const [isSwitchingJobContext, setIsSwitchingJobContext] = useState(false);

  const fetchApplicantAndSiblings = useCallback(async (currentAppId: number) => {
    setIsLoadingApplicant(true);
    setErrorApplicant(null);
    const response = await getApplicantDetailsById(currentAppId, employerUserId);
    if (response.success && response.applicant) {
      setApplicant(response.applicant);
      setSelectedJobIdForLeftPanel(response.applicant.jobId || null); 
      if (response.applicant.jobId) {
        setIsLoadingSiblingApplicants(true);
        const siblingsResponse = await getApplicationsForJobAction(response.applicant.jobId, employerUserId);
        if (siblingsResponse.success && siblingsResponse.applicants) {
          setAllApplicantsForThisJob(siblingsResponse.applicants);
          const currentIndex = siblingsResponse.applicants.findIndex(app => app.applicationId === currentAppId);
          setCurrentApplicantIndex(currentIndex);
        } else {
          setAllApplicantsForThisJob([]);
          setCurrentApplicantIndex(-1);
        }
        setIsLoadingSiblingApplicants(false);
      }
    } else {
      setErrorApplicant(response.error || 'Failed to load applicant details.');
      setApplicant(null);
      setAllApplicantsForThisJob([]);
      setCurrentApplicantIndex(-1);
      setSelectedJobIdForLeftPanel(null);
    }
    setIsLoadingApplicant(false);
  }, [employerUserId]);

  const fetchAllEmployerJobs = useCallback(async () => {
    if (!employerUserId) return;
    setIsLoadingEmployerJobs(true);
    setErrorEmployerJobs(null);
    const response = await getJobsByStatus(employerUserId, 'all'); 
    if (response.success && response.data) {
      setAllEmployerJobs(response.data);
    } else {
      setErrorEmployerJobs(response.error || "Failed to load company's jobs.");
      setAllEmployerJobs([]);
    }
    setIsLoadingEmployerJobs(false);
  }, [employerUserId]);

  useEffect(() => {
    fetchApplicantAndSiblings(applicantId);
    fetchAllEmployerJobs();
  }, [applicantId, fetchApplicantAndSiblings, fetchAllEmployerJobs]);

  const confirmStatusUpdate = (app: ApplicantData, newStatus: ApplicationStatus) => {
    setApplicationToUpdate(app);
    setNewStatusForUpdate(newStatus);
    setRemarksForUpdate(app.employer_remarks || '');
    setIsStatusConfirmOpen(true);
  };

  const executeStatusUpdate = async () => {
    if (!employerUserId || !applicationToUpdate || !newStatusForUpdate) return;
    if (!remarksForUpdate.trim()) {
      toast({ title: "Remarks Required", description: "Please provide remarks for the status change.", variant: "destructive" });
      return;
    }
    setUpdatingStatusForAppId(applicationToUpdate.applicationId);
    const response = await updateApplicationStatusAction(applicationToUpdate.applicationId, newStatusForUpdate, employerUserId, remarksForUpdate);
    setUpdatingStatusForAppId(null);
    setIsStatusConfirmOpen(false);

    if (response.success) {
      toast({ title: 'Status Updated', description: response.message || 'Application status updated.', variant: 'default' });
      if (applicant?.applicationId === applicationToUpdate.applicationId) {
        setApplicant(prev => prev ? { ...prev, applicationStatus: newStatusForUpdate!, employer_remarks: remarksForUpdate } : null);
      }
      setAllApplicantsForThisJob(prevList => prevList.map(app =>
        app.applicationId === applicationToUpdate.applicationId
          ? { ...app, applicationStatus: newStatusForUpdate!, employer_remarks: remarksForUpdate }
          : app
      ));
    } else {
      toast({ title: 'Error Updating Status', description: response.error || 'Failed to update status.', variant: 'destructive' });
    }
    setApplicationToUpdate(null);
    setNewStatusForUpdate(null);
    setRemarksForUpdate('');
  };

  const handlePreviousApplicant = () => {
    if (currentApplicantIndex > 0 && allApplicantsForThisJob[currentApplicantIndex - 1]) {
      router.push(`/employer/control/applications/${allApplicantsForThisJob[currentApplicantIndex - 1].applicationId}`);
    }
  };

  const handleNextApplicant = () => {
    if (currentApplicantIndex < allApplicantsForThisJob.length - 1 && allApplicantsForThisJob[currentApplicantIndex + 1]) {
      router.push(`/employer/control/applications/${allApplicantsForThisJob[currentApplicantIndex + 1].applicationId}`);
    }
  };

  const isPreviousDisabled = useMemo(() => currentApplicantIndex <= 0 || isLoadingSiblingApplicants, [currentApplicantIndex, isLoadingSiblingApplicants]);
  const isNextDisabled = useMemo(() => currentApplicantIndex >= allApplicantsForThisJob.length - 1 || isLoadingSiblingApplicants, [currentApplicantIndex, allApplicantsForThisJob.length, isLoadingSiblingApplicants]);
  
  const handleJobSelectFromList = async (jobId: number) => {
    if (!employerUserId) return;
    
    setIsSwitchingJobContext(true);
    setSelectedJobIdForLeftPanel(jobId); 

    const response = await getApplicationsForJobAction(jobId, employerUserId);
    if (response.success && response.applicants && response.applicants.length > 0) {
        router.push(`/employer/control/applications/${response.applicants[0].applicationId}`);
    } else if (response.success && (!response.applicants || response.applicants.length === 0)) {
        const jobTitle = allEmployerJobs.find(j => j.id === jobId)?.jobTitle || 'Selected Job';
        toast({ title: "No Applicants", description: `Job "${jobTitle}" has no applicants yet.`, variant: "default" });
        setApplicant(null); 
        setAllApplicantsForThisJob([]);
        setCurrentApplicantIndex(-1);
    } else {
        toast({ title: "Error", description: response.error || "Could not fetch applicants for the selected job.", variant: "destructive" });
    }
    setIsSwitchingJobContext(false);
  };

  if (isLoadingApplicant && isLoadingEmployerJobs && !applicant) { 
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  // Default expanded layout widths
  const jobListWidth = "lg:w-1/5 w-full"; // Fixed width for job list
  const mainContentWidth = "lg:w-4/5 w-full";


  return (
    <div className="container max-w-screen-2xl mx-auto py-6 px-2 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between mb-4">
        <Button onClick={() => router.push('/employer/control?section=trackApplications')} variant="outline" className="group">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Overview
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-180px)]">
        <div className={cn("lg:h-full", jobListWidth )}>
          <AllJobsList
            jobs={allEmployerJobs}
            selectedJobIdForDisplay={selectedJobIdForLeftPanel}
            isLoading={isLoadingEmployerJobs || isSwitchingJobContext}
            error={errorEmployerJobs}
            onJobSelect={handleJobSelectFromList}
          />
        </div>

        <div className={cn("lg:h-full flex flex-col gap-4", mainContentWidth)}>
          {(isLoadingApplicant || isSwitchingJobContext) && !applicant && (
             <div className="flex-grow flex justify-center items-center "><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          )}
          {errorApplicant && !applicant && !isLoadingApplicant && (
            <div className="flex-grow container mx-auto py-8 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <p className="mt-4 text-lg text-destructive">{errorApplicant}</p>
            </div>
          )}
          {!applicant && !isLoadingApplicant && !errorApplicant && (
             <div className="flex-grow container mx-auto py-8 text-center">
              <InfoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">No applicant selected or job has no applicants.</p>
            </div>
          )}
          {applicant && (
            <>
              <ApplicantPageHeader
                applicant={applicant}
                onConfirmStatusUpdate={confirmStatusUpdate}
                updatingStatusForAppId={updatingStatusForAppId}
                onPreviousApplicant={handlePreviousApplicant}
                onNextApplicant={handleNextApplicant}
                isPreviousDisabled={isPreviousDisabled}
                isNextDisabled={isNextDisabled}
              />
              <ScrollArea className="flex-grow">
                <div className="w-full"> 
                  <ApplicantMainContent applicant={applicant} />
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <RemarksDialogTitle className="flex items-center gap-2 text-lg text-primary">
              <MessageSquare className="h-5 w-5" />Update Application Status
            </RemarksDialogTitle>
            <AlertDialogDescription>
              You are changing status of <strong className="text-foreground">{applicationToUpdate?.jobSeekerName || applicationToUpdate?.jobSeekerEmail}</strong> to <span className="font-semibold capitalize">{getApplicationStatusBadgeVariant(newStatusForUpdate || 'submitted').label}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-2">
            <Label htmlFor="remarks-update" className="font-medium text-foreground">Add Remarks (Mandatory)</Label>
            <Textarea id="remarks-update" placeholder="e.g., Strong candidate, good fit..." value={remarksForUpdate} onChange={(e) => setRemarksForUpdate(e.target.value)} rows={3} className="mt-1 transition-default focus:ring-primary focus:border-primary" />
            <p className="text-xs text-blue-600 dark:text-blue-400 p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <InfoIcon className="inline-block h-3.5 w-3.5 mr-1 align-text-bottom" />Remarks help job seekers understand their application.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setApplicationToUpdate(null); setNewStatusForUpdate(null); setRemarksForUpdate(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeStatusUpdate} className="bg-primary hover:bg-primary/90" disabled={!remarksForUpdate.trim()}>Confirm & Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- Wrapper Component for Auth and Params Handling ---
function ApplicantDetailPageWrapper() {
  const params = useParams();
  const applicantIdStr = params.applicationId as string;
  const [currentEmployerUserId, setCurrentEmployerUserId] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (userIdStr && userRole === 'employer') {
      setCurrentEmployerUserId(parseInt(userIdStr, 10));
    }
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!currentEmployerUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">You must be logged in as an employer to view this page.</p>
        <Button asChild className="mt-6"><Link href="/login?role=employer">Login as Employer</Link></Button>
      </div>
    );
  }

  if (!applicantIdStr || isNaN(parseInt(applicantIdStr))) {
    return (
      <div className="container mx-auto py-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <p className="mt-4 text-lg text-destructive">Invalid Applicant ID.</p>
        <Button onClick={() => router.push('/employer/control?section=trackApplications')} variant="outline" className="mt-6">Go Back to Applicants Overview</Button>
      </div>
    );
  }

  const applicantId = parseInt(applicantIdStr);

  return (
    <TooltipProvider>
      <ApplicantDetailPageContent applicantId={applicantId} employerUserId={currentEmployerUserId} />
    </TooltipProvider>
  );
}

// --- Default Export for the Page ---
export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ApplicantDetailPageWrapper />
    </Suspense>
  );
}
        

    

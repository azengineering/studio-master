// src/app/(roles)/employer/post-job/sections/JobPreviewDialog.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as JobPreviewDialogDescriptionOriginal, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BriefcaseBusiness, Building, MapPin, Activity, Type, PackageCheck, UsersRound,
  CalendarDays, DollarSignIcon, Tags, InfoIcon, FileText, HelpCircle, Settings
} from 'lucide-react';
import type { JobPreviewData, CustomQuestion } from '../job-schema'; 
import { cn } from '@/lib/utils';

interface JobPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jobData: JobPreviewData | null;
}

export const JobPreviewDialog: React.FC<JobPreviewDialogProps> = ({ isOpen, onOpenChange, jobData }) => {
  if (!jobData) return null;

  const displayCompanyName = jobData.companyName || "Your Company (Complete Profile)";
  const displayIndustryType = jobData.industryType === 'other' && jobData.otherIndustryType ? `Other: ${jobData.otherIndustryType}` : jobData.industryType;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl md:max-w-3xl lg:max-w-4xl w-[95vw] sm:w-[90vw] rounded-lg shadow-2xl bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-secondary/30 rounded-t-lg relative">
          <DialogTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <BriefcaseBusiness className="h-7 w-7"/>
            {jobData.jobTitle || 'Job Title Not Provided'}
          </DialogTitle>
          <JobPreviewDialogDescriptionOriginal className="mt-2 text-base text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              <span>{displayCompanyName}</span>
            </div>
            {jobData.jobLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{jobData.jobLocation}</span>
              </div>
            )}
          </JobPreviewDialogDescriptionOriginal>
          {/* Removed the X close button from here as per request */}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-150px)]">
          <div className="p-6 space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {jobData.industry && (
                <div className="flex items-start gap-2">
                  <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Industry (General)</p>
                    <p className="text-muted-foreground">{jobData.industry}</p>
                  </div>
                </div>
              )}
              {displayIndustryType && (
                <div className="flex items-start gap-2">
                  <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Industry Type</p>
                    <p className="text-muted-foreground">{displayIndustryType}</p>
                  </div>
                </div>
              )}
              {jobData.jobType && (
                <div className="flex items-start gap-2">
                  <Type className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Job Type</p>
                    <p className="text-muted-foreground">{jobData.jobType}</p>
                  </div>
                </div>
              )}
              {jobData.qualification && (
                 <div className="flex items-start gap-2">
                  <PackageCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Qualification</p>
                    <p className="text-muted-foreground">{jobData.qualification}</p>
                  </div>
                </div>
              )}
              {jobData.numberOfVacancies && (
                 <div className="flex items-start gap-2">
                  <UsersRound className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Number of Vacancies</p>
                    <p className="text-muted-foreground">{jobData.numberOfVacancies}</p>
                  </div>
                </div>
              )}
            </div>

            {(jobData.minimumExperience !== null && jobData.minimumExperience !== undefined) || (jobData.maximumExperience !== null && jobData.maximumExperience !== undefined) ? (
              <div className="flex items-start gap-2">
                <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Experience Required</p>
                  <p className="text-muted-foreground">
                    {jobData.minimumExperience !== null && jobData.minimumExperience !== undefined ? `${jobData.minimumExperience} yrs` : ''}
                    {(jobData.minimumExperience !== null && jobData.minimumExperience !== undefined) && (jobData.maximumExperience !== null && jobData.maximumExperience !== undefined) ? ' - ' : ''}
                    {jobData.maximumExperience !== null && jobData.maximumExperience !== undefined ? `${jobData.maximumExperience} yrs` : (jobData.minimumExperience === null || jobData.minimumExperience === undefined ? 'Not specified' : '')}
                  </p>
                </div>
              </div>
            ) : null}

            {(jobData.minimumSalary !== null && jobData.minimumSalary !== undefined) || (jobData.maximumSalary !== null && jobData.maximumSalary !== undefined) ? (
              <div className="flex items-start gap-2">
                <DollarSignIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Salary Range (Annual)</p>
                  <p className="text-muted-foreground">
                    {jobData.minimumSalary !== null && jobData.minimumSalary !== undefined ? `₹${jobData.minimumSalary.toLocaleString()}` : ''}
                    {(jobData.minimumSalary !== null && jobData.minimumSalary !== undefined) && (jobData.maximumSalary !== null && jobData.maximumSalary !== undefined) ? ' - ' : ''}
                    {jobData.maximumSalary !== null && jobData.maximumSalary !== undefined ? `₹${jobData.maximumSalary.toLocaleString()}` : (jobData.minimumSalary === null || jobData.minimumSalary === undefined ? 'Not specified' : '')}
                  </p>
                </div>
              </div>
            ) : null}

            {jobData.skillsRequired && jobData.skillsRequired.length > 0 && (
              <div className="flex items-start gap-2">
                <Tags className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Key Skills</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {jobData.skillsRequired.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs font-medium">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {jobData.additionalData && (
              <div className="flex items-start gap-2">
                <InfoIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Additional Information</p>
                  <div className="mt-1 prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: jobData.additionalData }} />
                </div>
              </div>
            )}
            
            <Separator className="my-5"/>
            
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-2.5 flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Full Job Description</h4>
              <div
                className="prose prose-sm max-w-none p-4 border border-border rounded-lg bg-background shadow-inner min-h-[150px] text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: jobData.jobDescription || '<p class="italic">No full description provided.</p>' }}
              />
            </div>

            {jobData.customQuestions && jobData.customQuestions.length > 0 && (
              <>
                <Separator className="my-5"/>
                <div>
                  <h4 className="font-semibold text-lg text-foreground mb-2.5 flex items-center gap-2"><Settings className="h-5 w-5 text-primary"/>Custom Screening Questions</h4>
                  <ul className="space-y-3 mt-2">
                    {(jobData.customQuestions as CustomQuestion[]).map((q, i) => (
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
          <DialogClose asChild>
            <Button variant="outline" className="h-10">Close Preview</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


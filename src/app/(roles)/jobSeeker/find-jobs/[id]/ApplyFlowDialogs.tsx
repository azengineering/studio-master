// src/app/(roles)/jobSeeker/find-jobs/[id]/ApplyFlowDialogs.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, HelpCircle, UserCircle as UserCircleIcon, UserCog as UserCogIcon, Info, Briefcase, FileSignature, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitApplicationAction } from './actions';
import { saveJobAction } from '../actions'; // Action to save a job
import {
  applyJobFormSchema,
  type ApplyJobFormData,
} from './schema';
import type { JobSeekerJobPreviewData } from './schema';
import type { CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';
import { cn } from '@/lib/utils';

interface ApplyFlowDialogsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: (JobSeekerJobPreviewData & { customQuestions?: CustomQuestion[] }) | null;
  jobSeekerUserId: number | null;
  onApplicationSuccess: (jobTitle: string) => void;
}

export const ApplyFlowDialogs: React.FC<ApplyFlowDialogsProps> = ({
  isOpen,
  onOpenChange,
  job,
  jobSeekerUserId,
  onApplicationSuccess,
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingJobForProfileUpdate, setIsSavingJobForProfileUpdate] = useState(false);
  const [currentDialogStep, setCurrentDialogStep] = useState<'initialChoice' | 'applicationForm'>('initialChoice');
  const [showUpdateProfileGuidanceDialog, setShowUpdateProfileGuidanceDialog] = useState(false);

  const form = useForm<ApplyJobFormData>({
    resolver: zodResolver(applyJobFormSchema),
    defaultValues: {
      jobId: job?.id,
      jobSeekerUserId: jobSeekerUserId ?? undefined,
      employerUserId: job?.employer_user_id,
      currentWorkingLocation: '',
      expectedSalary: '',
      noticePeriod: 0,
      customQuestionAnswers: job?.customQuestions?.map(q => ({ questionText: q.questionText, answer: '' })) || [],
    },
  });

  useEffect(() => {
    if (job && jobSeekerUserId) {
      form.reset({
        jobId: job.id,
        jobSeekerUserId: jobSeekerUserId,
        employerUserId: job.employer_user_id,
        currentWorkingLocation: '',
        expectedSalary: '',
        noticePeriod: 0,
        customQuestionAnswers: job.customQuestions?.map(q => ({ questionText: q.questionText, answer: '' })) || [],
      });
    }
    if (!isOpen) {
      setCurrentDialogStep('initialChoice');
      setShowUpdateProfileGuidanceDialog(false); // Reset guidance dialog state too
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, jobSeekerUserId, isOpen]);

  const onSubmitApplication = async (data: ApplyJobFormData) => {
    if (!jobSeekerUserId || !job?.id || job?.employer_user_id === undefined) {
      toast({ title: 'Error', description: 'Critical information missing for application.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const response = await submitApplicationAction({
      ...data,
      jobId: job.id,
      jobSeekerUserId: jobSeekerUserId,
      employerUserId: job.employer_user_id,
    });
    setIsSubmitting(false);

    if (response.success) {
      onApplicationSuccess(job.jobTitle);
      onOpenChange(false);
      form.reset();
    } else {
      toast({ title: 'Application Failed', description: response.error || 'An error occurred. Please try again.', variant: 'destructive' });
      if (response.validationErrors) {
        response.validationErrors.forEach(err => {
          const path = err.path;
          if (path.length > 1 && typeof path[1] === 'number' && path[0] === 'customQuestionAnswers') {
            form.setError(`customQuestionAnswers.${path[1]}.answer` as any, { message: err.message });
          } else if (path.length > 0) {
            form.setError(path.join('.') as keyof ApplyJobFormData, { message: err.message });
          }
        });
      }
    }
  };

  const handleProceedWithExistingProfile = () => {
    setCurrentDialogStep('applicationForm');
  };

  const handleInitiateUpdateProfile = async () => {
    if (!jobSeekerUserId || !job) {
      toast({ title: 'Error', description: 'User or Job information missing.', variant: 'destructive' });
      return;
    }
    setIsSavingJobForProfileUpdate(true);
    const saveResponse = await saveJobAction(job.id, jobSeekerUserId, true); // true to save
    setIsSavingJobForProfileUpdate(false);

    if (saveResponse.success) {
      toast({
        title: saveResponse.message?.includes("already saved") ? "Job Already Saved" : "Job Saved",
        description: saveResponse.message?.includes("already saved") 
          ? `"${job.jobTitle}" was already in your saved jobs.`
          : `"${job.jobTitle}" has been added to your saved jobs.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Failed to Save Job",
        description: saveResponse.error || "Could not save the job before profile update.",
        variant: "destructive",
      });
    }
    setShowUpdateProfileGuidanceDialog(true);
    // Keep the initial choice dialog open until user acts on the guidance dialog
  };

  const handleCloseAllDialogsAndNavigate = (path: string) => {
    setShowUpdateProfileGuidanceDialog(false);
    onOpenChange(false); // Close the main ApplyFlowDialogs
    router.push(path);
  };

  const handleCloseAllDialogs = () => {
    setShowUpdateProfileGuidanceDialog(false);
    onOpenChange(false); // Close the main ApplyFlowDialogs
  };

  if (!job) return null;

  const renderInitialChoiceDialog = () => (
    <DialogContent className="sm:max-w-lg bg-card border-border shadow-xl rounded-xl p-0">
      <DialogHeader className="p-6 pb-4 border-b border-border text-center">
        <DialogTitle className="text-xl font-bold text-primary">
          Apply for: {job.jobTitle}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">At {job.companyName}</DialogDescription>
      </DialogHeader>
      <div className="px-6 py-3 space-y-2 text-center">
        <h3 className="text-md font-semibold text-foreground pt-1">Proceed With:</h3>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleProceedWithExistingProfile}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-sm font-medium shadow-md flex items-center gap-2"
            disabled={isSavingJobForProfileUpdate}
          >
            <UserCircleIcon className="h-5 w-5" /> My Existing Profile Data
          </Button>
          <Button
            onClick={handleInitiateUpdateProfile}
            variant="outline"
            className="flex-1 h-10 text-sm font-medium border-primary text-primary hover:bg-primary/5 shadow-sm flex items-center gap-2"
            disabled={isSavingJobForProfileUpdate}
          >
            {isSavingJobForProfileUpdate ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCogIcon className="h-5 w-5" />}
            Update Main Profile
          </Button>
        </div>
        <Alert className="mt-3 text-left bg-accent/10 border-accent/20 text-accent-foreground/90 text-xs p-3">
          <Info className="h-4 w-4 text-accent" />
          <AlertTitle className="text-xs font-semibold text-accent">Pro Tip!</AlertTitle>
          <AlertDescription className="text-xs">
            An up-to-date profile attracts more opportunities & can speed up selection!
          </AlertDescription>
        </Alert>
      </div>
      <DialogFooter className="p-4 pt-3 border-t border-border">
        <DialogClose asChild>
          <Button type="button" variant="ghost" disabled={isSavingJobForProfileUpdate}>Cancel</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );

  const renderApplicationFormDialog = () => (
    <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl w-[95vw] bg-card border-border shadow-lg rounded-lg p-0 flex flex-col max-h-[90vh]">
      <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
        <DialogTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
          <FileSignature className="h-6 w-6" /> Apply for: {job.jobTitle}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          At {job.companyName}. Please provide the following details.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="px-6 py-4 flex-grow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitApplication)} id="quick-apply-form-step2" className="space-y-6">
            <div className="p-4 border border-border/70 bg-secondary/20 rounded-md space-y-4">
              <h3 className="text-md font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="h-5 w-5 text-primary" /> Supplementary Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="currentWorkingLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Location <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="e.g., Mumbai, Remote" {...field} className="bg-background h-9 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Salary (Annual) <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="e.g., 10 LPA or Negotiable" {...field} className="bg-background h-9 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noticePeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notice Period (in days) <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 30" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="bg-background h-9 text-sm" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {job.customQuestions && job.customQuestions.length > 0 && (
              <div className="p-4 border border-border/70 bg-secondary/20 rounded-md space-y-4">
                <h3 className="text-md font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-5 w-5 text-primary" /> Employer's Questions
                </h3>
                {job.customQuestions.map((customQ, index) => (
                  <FormField
                    key={customQ.id || index}
                    control={form.control}
                    name={`customQuestionAnswers.${index}.answer`}
                    render={({ field }) => (
                      <FormItem className="p-3 border border-border/50 bg-background/50 rounded-sm shadow-sm">
                        <FormLabel className="text-sm text-foreground font-medium">
                          {customQ.questionText} <span className="text-destructive">*</span>
                        </FormLabel>
                        {customQ.answerType === 'text' ? (
                          <FormControl>
                            <Textarea placeholder="Your answer..." {...field} value={field.value ?? ''} rows={3} className="bg-background text-sm" />
                          </FormControl>
                        ) : (
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex gap-4 pt-1"
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="yes" id={`q${index}-yes`} /></FormControl>
                                <Label htmlFor={`q${index}-yes`} className="font-normal text-sm">Yes</Label>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="no" id={`q${index}-no`} /></FormControl>
                                <Label htmlFor={`q${index}-no`} className="font-normal text-sm">No</Label>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
             <DialogFooter className="p-4 pt-6 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCurrentDialogStep('initialChoice')} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" form="quick-apply-form-step2" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </ScrollArea>
    </DialogContent>
  );
  
  const renderGuidanceDialog = () => (
    <Dialog open={showUpdateProfileGuidanceDialog} onOpenChange={setShowUpdateProfileGuidanceDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary"/> Job Saved & Profile Update Recommended
          </DialogTitle>
          <DialogDescription className="pt-2">
            The job "{job?.jobTitle || 'this job'}" has been saved to your 'My Job Activities'. 
            Keeping your profile up-to-date helps attract better opportunities. You can easily apply for this saved job later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleCloseAllDialogs}>Maybe Later</Button>
          <Button onClick={() => handleCloseAllDialogsAndNavigate('/jobSeeker/dashboard?section=profile')}>
            Proceed to Update Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { 
      if(!open) {
        form.reset(); 
        setCurrentDialogStep('initialChoice');
        setShowUpdateProfileGuidanceDialog(false); // Also reset guidance dialog
      } 
      onOpenChange(open); 
    }}>
      {currentDialogStep === 'initialChoice' && !showUpdateProfileGuidanceDialog && renderInitialChoiceDialog()}
      {currentDialogStep === 'applicationForm' && !showUpdateProfileGuidanceDialog && renderApplicationFormDialog()}
      {showUpdateProfileGuidanceDialog && renderGuidanceDialog()}
    </Dialog>
  );
};

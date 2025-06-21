// src/app/(roles)/jobSeeker/find-jobs/[id]/ApplyJobDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitApplicationAction } from './actions';
import { 
  applyJobFormSchema, 
  type ApplyJobFormData, 
  type ApplyActionResponse, 
} from './schema';
import type { JobPreviewData, CustomQuestion } from '@/app/(roles)/employer/post-job/job-schema';
import { Label } from '@/components/ui/label'; 
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

interface ApplyJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: (JobPreviewData & { customQuestions?: CustomQuestion[] }) | null;
  jobSeekerUserId: number | null;
}

export const ApplyJobDialog: React.FC<ApplyJobDialogProps> = ({ isOpen, onOpenChange, job, jobSeekerUserId }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplyJobFormData>({
    resolver: zodResolver(applyJobFormSchema),
    defaultValues: {
      jobId: job?.id,
      jobSeekerUserId: jobSeekerUserId ?? undefined, 
      employerUserId: job?.employer_user_id, 
      // Cover letter and resume URL are removed from this dialog's direct input
      customQuestionAnswers: job?.customQuestions?.map(q => ({ questionText: q.questionText, answer: '' })) || [],
    },
  });

  const { fields: answerFields } = useFieldArray({
    control: form.control,
    name: "customQuestionAnswers",
  });


  useEffect(() => {
    if (job && jobSeekerUserId) {
      form.reset({
        jobId: job.id,
        jobSeekerUserId: jobSeekerUserId,
        employerUserId: job.employer_user_id,
        coverLetter: null, // Not collected here
        resumeUrl: null,   // Not collected here
        customQuestionAnswers: job.customQuestions?.map(q => ({ questionText: q.questionText, answer: '' })) || [],
      });
    }
  }, [job, jobSeekerUserId, form]);

  const onSubmit = async (data: ApplyJobFormData) => {
    if (!jobSeekerUserId) {
      toast({ title: 'Error', description: 'User not identified. Please log in.', variant: 'destructive' });
      return;
    }
    if (!job?.id || job?.employer_user_id === undefined) {
      toast({ title: 'Error', description: 'Job details are incomplete.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const response: ApplyActionResponse = await submitApplicationAction({
      ...data,
      jobId: job.id,
      jobSeekerUserId: jobSeekerUserId,
      employerUserId: job.employer_user_id,
      // coverLetter and resumeUrl are not part of this dialog's direct submission anymore
      // they are optional in the schema and will be null if not provided by other means (e.g., profile)
    });
    setIsSubmitting(false);

    if (response.success) {
      toast({ title: 'Success!', description: response.message, variant: 'default' });
      onOpenChange(false);
      form.reset(); 
    } else {
      toast({ title: 'Application Failed', description: response.error || 'An error occurred.', variant: 'destructive' });
       if (response.validationErrors) {
         response.validationErrors.forEach(err => {
           const path = err.path;
           if (path.length > 1 && typeof path[1] === 'number' && path[0] === 'customQuestionAnswers') {
             form.setError(`customQuestionAnswers.${path[1]}.${path[2]}` as any, { message: err.message });
           } else if (path.length > 0) {
             form.setError(path.join('.') as keyof ApplyJobFormData, { message: err.message });
           }
         });
       }
    }
  };

  if (!job) return null;

  // If there are no custom questions, this dialog might not be shown
  // The logic to show/hide or directly apply would be in the parent component (Job Detail Page)
  if (!job.customQuestions || job.customQuestions.length === 0) {
    // This dialog isn't needed if there are no questions. 
    // The parent component should handle direct application.
    // However, if it's somehow opened, provide a way to close.
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {job.jobTitle}</DialogTitle>
            <DialogDescription>No additional questions for this job. Ready to submit?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => onSubmit(form.getValues())} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border shadow-lg rounded-lg">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-semibold text-primary">Apply for {job.jobTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Answer the following questions for <span className="font-medium text-foreground">{job.companyName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {job.customQuestions && job.customQuestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-5 w-5 text-primary" /> Employer Questions
                </h3>
                {job.customQuestions.map((customQ, index) => (
                  <FormField
                    key={index} 
                    control={form.control}
                    name={`customQuestionAnswers.${index}.answer`}
                    render={({ field }) => (
                      <FormItem className="p-4 border border-border/70 bg-secondary/20 rounded-md">
                        <FormLabel className="text-sm text-foreground font-medium">{customQ.questionText} <span className="text-destructive">*</span></FormLabel>
                        {customQ.answerType === 'text' ? (
                          <FormControl>
                            <Textarea placeholder="Your answer..." {...field} value={field.value ?? ''} rows={3}/>
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
                                <Label htmlFor={`q${index}-yes`} className="font-normal">Yes</Label>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl><RadioGroupItem value="no" id={`q${index}-no`} /></FormControl>
                                <Label htmlFor={`q${index}-no`} className="font-normal">No</Label>
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

            <DialogFooter className="pt-6 border-t border-border sticky bottom-0 bg-card py-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

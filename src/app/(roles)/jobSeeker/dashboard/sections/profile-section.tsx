// src/app/(roles)/jobSeeker/dashboard/sections/profile-section.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  jobSeekerProfileSchema,
  type JobSeekerProfileFormData,
  initialJobSeekerProfileValues,
} from '../profile-schema';
import { getJobSeekerProfile, saveJobSeekerProfile } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Save, UserCheck, ArrowLeft, ArrowRight, Share2, Eye, CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as ShadDialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Step1FormFields from './profile/Step1FormFields';
import Step2FormFields from './profile/Step2FormFields';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const TOTAL_STEPS = 2;

export default function ProfileSection() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isShareProfileDialogOpen, setIsShareProfileDialogOpen] = useState(false);
  const [profileShareLink, setProfileShareLink] = useState('');
  
  const form = useForm<JobSeekerProfileFormData>({
    resolver: zodResolver(jobSeekerProfileSchema),
    defaultValues: initialJobSeekerProfileValues,
    mode: 'onChange', 
    shouldUnregister: false, 
  });

  const loadProfile = useCallback(async (userIdToLoad: number, emailToSet: string) => {
    setIsLoading(true);
    const response = await getJobSeekerProfile(userIdToLoad);
    if (response.success && response.data) {
      const fetchedData = response.data;
      const profileData = {
        ...initialJobSeekerProfileValues, 
        ...fetchedData, 
        email: emailToSet, 
        skills: Array.isArray(fetchedData.skills) ? fetchedData.skills : [],
        preferredLocations: Array.isArray(fetchedData.preferredLocations) ? fetchedData.preferredLocations : [],
        educationalDetails: Array.isArray(fetchedData.educationalDetails) ? fetchedData.educationalDetails.map((edu) => ({ ...edu, id: edu.id || String(Date.now() + Math.random()), yearOfCompletion: edu.yearOfCompletion ? Number(edu.yearOfCompletion) : new Date().getFullYear(), percentageMarks: edu.percentageMarks !== undefined && edu.percentageMarks !== null ? Number(edu.percentageMarks) : null })) : [],
        experienceDetails: Array.isArray(fetchedData.experienceDetails) ? fetchedData.experienceDetails.map((exp) => ({ ...exp, id: exp.id || String(Date.now() + Math.random()), isPresent: exp.isPresent || false, aboutCompany: exp.aboutCompany || null })) : [],
      };
      form.reset(profileData);
    } else {
      form.reset({ ...initialJobSeekerProfileValues, email: emailToSet, educationalDetails: [], experienceDetails: [], preferredLocations: [], skills: [] });
      if (response.error) toast({ title: 'Error Loading Profile', description: response.error, variant: 'destructive' });
      else if (response.message) toast({ title: 'Profile', description: response.message, variant: 'default' });
    }
    setIsLoading(false);
  }, [form, toast]);

  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    const userEmailStr = localStorage.getItem('userEmail');
    if (userIdStr && userEmailStr) {
      const id = parseInt(userIdStr, 10);
      setCurrentUserId(id);
      setCurrentUserEmail(userEmailStr);
    } else {
      toast({ title: 'Authentication Error', description: 'User not logged in.', variant: 'destructive' });
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUserId && currentUserEmail) {
      loadProfile(currentUserId, currentUserEmail);
    }
  }, [currentUserId, currentUserEmail, loadProfile]);


  const onSubmit = async (data: JobSeekerProfileFormData) => {
    if (!currentUserId) { toast({ title: 'Error', description: 'User ID not found.', variant: 'destructive' }); return; }
    setIsSaving(true);
    const profileDataToSave: JobSeekerProfileFormData = {
      ...data,
      email: currentUserEmail, 
      educationalDetails: (data.educationalDetails || []).map(edu => ({ ...edu, id: edu.id || String(Date.now() + Math.random()), yearOfCompletion: Number(edu.yearOfCompletion), percentageMarks: edu.percentageMarks !== null && edu.percentageMarks !== undefined && !isNaN(Number(edu.percentageMarks)) ? Number(edu.percentageMarks) : null })),
      experienceDetails: (data.experienceDetails || []).map(exp => ({ ...exp, id: exp.id || String(Date.now() + Math.random()), isPresent: exp.isPresent || false, aboutCompany: exp.aboutCompany || null })),
      preferredLocations: data.preferredLocations || [],
    };
    const response = await saveJobSeekerProfile(currentUserId, profileDataToSave);
    if (response.success) {
      toast({ title: 'Profile Saved', description: response.message || "Profile updated!", variant: 'default' });
      form.reset(profileDataToSave, { keepValues: true, keepDirty: false }); 
    } else {
      toast({ title: 'Save Failed', description: response.error || "Could not save.", variant: 'destructive' });
      if (response.validationErrors) { response.validationErrors.forEach(err => { form.setError(err.path.join('.') as keyof JobSeekerProfileFormData, { message: err.message }); }); }
    }
    setIsSaving(false);
  };

  const handleShareProfile = () => {
    if (currentUserId) { const link = `${window.location.origin}/public-profile/${currentUserId}`; setProfileShareLink(link); setIsShareProfileDialogOpen(true); }
    else { toast({ title: "Error", description: "User ID not available to generate share link.", variant: "destructive" }); }
  };
  const copyShareLinkToClipboard = () => {
    navigator.clipboard.writeText(profileShareLink)
      .then(() => { toast({ title: 'Link Copied!', description: 'Profile link copied to clipboard.', variant: 'default' }); setIsShareProfileDialogOpen(false); })
      .catch(err => { toast({ title: 'Error', description: 'Failed to copy link.', variant: 'destructive' }); });
  };
  const handlePreviewPublicProfile = () => {
    if (currentUserId) { window.open(`/public-profile/${currentUserId}`, '_blank'); }
    else { toast({ title: "Error", description: "User ID not available to preview profile.", variant: "destructive" }); }
  };

  const handleNextStep = () => { if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1); };
  const handlePreviousStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const currentStepText = `Step ${currentStep} of ${TOTAL_STEPS}: ${currentStep === 1 ? "Personal & Educational Details" : "Professional & Online Presence"}`;

  if (isLoading) return <div className="flex justify-center items-center p-8 min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <TooltipProvider>
      <FormProvider {...form}>
        <Card className="shadow-xl border-border rounded-xl overflow-hidden w-full">
          <CardHeader className="border-b border-border bg-secondary/20 p-6">
            <div className="flex justify-between items-center">
              <div><CardTitle className="text-2xl flex items-center gap-3 text-primary"><UserCheck className="h-7 w-7" />Complete Your Profile</CardTitle><p className="text-base text-muted-foreground mt-1">{currentStepText}</p></div>
              <div className="flex items-center gap-2">
                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handlePreviewPublicProfile} disabled={!currentUserId} className="text-primary border-primary/50 hover:bg-primary/10"><Eye className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Preview your public profile</p></TooltipContent></Tooltip>
                <Dialog open={isShareProfileDialogOpen} onOpenChange={setIsShareProfileDialogOpen}>
                  <Tooltip><TooltipTrigger asChild><Button variant="default" size="sm" onClick={handleShareProfile} disabled={!currentUserId} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 text-sm flex items-center"><Share2 className="h-4 w-4 mr-2" /> Share Profile</Button></TooltipTrigger><TooltipContent><p>Share your public profile: Get a link to send to employers or your network.</p></TooltipContent></Tooltip>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Share2 className="text-primary h-5 w-5" />Share Profile</DialogTitle><DialogDescription>Copy the link below to share your public profile.</DialogDescription></DialogHeader>
                    <div className="py-4"><Input readOnly value={profileShareLink} className="focus:ring-primary focus:border-primary" aria-label="Shareable profile link" /></div>
                    <ShadDialogFooter><Button variant="outline" onClick={() => setIsShareProfileDialogOpen(false)}>Close</Button><Button onClick={copyShareLinkToClipboard} className="bg-primary text-primary-foreground hover:bg-primary/90"><CheckCircle className="mr-2 h-4 w-4" /> Copy Link</Button></ShadDialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-8">
              {currentStep === 1 && <Step1FormFields />}
              {currentStep === 2 && <Step2FormFields />}
            </CardContent>
            <CardFooter className="border-t border-border p-6 bg-secondary/20 flex justify-between items-center">
              <div>{currentStep > 1 && (<Button type="button" variant="default" onClick={handlePreviousStep} disabled={isSaving} className="h-10 px-5 text-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-default"><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>)}</div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSaving || !form.formState.isDirty} className="h-10 px-5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md min-w-[90px]">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
                </Button>
                {currentStep < TOTAL_STEPS && (<Button type="button" variant="default" onClick={handleNextStep} disabled={isSaving} className="h-10 px-5 text-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-default">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>)}
              </div>
            </CardFooter>
          </form>
        </Card>
      </FormProvider>
    </TooltipProvider>
  );
}

// src/app/(roles)/jobSeeker/dashboard/sections/profile/Step1FormFields.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import {
  type JobSeekerProfileFormData,
  QUALIFICATION_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  urlOrDataUriSchema,
} from '../../profile-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  UploadCloud, Trash2, User, Phone, Mail,
  CalendarDays as CalendarIconLucide, Link as LinkIconLucide, PlusCircle, X,
  MapPin, GraduationCap, CheckCircle, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter as ShadDialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MAX_RESUME_SIZE_KB = 500;
const MAX_RESUME_SIZE_BYTES = MAX_RESUME_SIZE_KB * 1024;
const ALLOWED_RESUME_TYPES = ['application/pdf'];
const MAX_PIC_SIZE_MB = 2;
const MAX_PIC_SIZE_BYTES = MAX_PIC_SIZE_MB * 1024 * 1024;
const ALLOWED_PIC_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];

const Step1FormFields: React.FC = () => {
  const form = useFormContext<JobSeekerProfileFormData>();
  const { toast } = useToast();

  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(form.watch('profilePictureUrl') || null);
  const profilePicFileInputRef = useRef<HTMLInputElement>(null);

  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const [isResumeOptionDialogOpen, setIsResumeOptionDialogOpen] = useState(false);
  const [resumeLinkInput, setResumeLinkInput] = useState(form.watch('resumeUrl')?.startsWith('http') ? form.watch('resumeUrl') || '' : '');
  
  const [isSameAsCurrentAddress, setIsSameAsCurrentAddress] = useState(false);
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control: form.control, name: "educationalDetails" });
  const [isEducationSectionOpen, setIsEducationSectionOpen] = useState(true);

  const watchedProfilePicUrl = form.watch('profilePictureUrl');
  const watchedResumeUrl = form.watch('resumeUrl');

  useEffect(() => {
    setProfilePicPreview(watchedProfilePicUrl || null);
  }, [watchedProfilePicUrl]);

  useEffect(() => {
    if (watchedResumeUrl) {
      if (watchedResumeUrl.startsWith('data:application/pdf;base64,')) {
        setResumeFileName("Resume Uploaded");
        setResumeLinkInput(''); 
      } else if (watchedResumeUrl.startsWith('http')) {
        try {
          const urlParts = new URL(watchedResumeUrl);
          const pathParts = urlParts.pathname.split('/');
          setResumeFileName(decodeURIComponent(pathParts[pathParts.length - 1]) || "Linked Resume");
        } catch (e) {
          setResumeFileName("Linked Resume");
        }
        setResumeLinkInput(watchedResumeUrl); 
      } else {
        setResumeFileName(null);
        setResumeLinkInput('');
      }
    } else {
      setResumeFileName(null);
      setResumeLinkInput('');
    }
  }, [watchedResumeUrl]);

  useEffect(() => {
    const currentAddressValues = {
      address: form.getValues('currentAddress'),
      city: form.getValues('currentCity'),
      pinCode: form.getValues('currentPinCode'),
    };

    if (isSameAsCurrentAddress) {
      if (form.getValues('correspondenceAddress') !== (currentAddressValues.address || null)) {
        form.setValue('correspondenceAddress', currentAddressValues.address || null, { shouldValidate: true, shouldDirty: true });
      }
      if (form.getValues('correspondenceCity') !== (currentAddressValues.city || null)) {
        form.setValue('correspondenceCity', currentAddressValues.city || null, { shouldValidate: true, shouldDirty: true });
      }
      if (form.getValues('correspondencePinCode') !== (currentAddressValues.pinCode || null)) {
        form.setValue('correspondencePinCode', currentAddressValues.pinCode || null, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [isSameAsCurrentAddress, form]);

  const handleProfilePicFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_PIC_SIZE_BYTES) { form.setError('profilePictureUrl', { message: `File size < ${MAX_PIC_SIZE_MB}MB.` }); return; }
      if (!ALLOWED_PIC_TYPES.includes(file.type)) { form.setError('profilePictureUrl', { message: 'Use JPG, PNG, GIF, SVG.' }); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue('profilePictureUrl', dataUri, { shouldValidate: true, shouldDirty: true });
        form.clearErrors('profilePictureUrl');
      };
      reader.readAsDataURL(file);
    }
  };
  const removeProfilePic = () => {
    form.setValue('profilePictureUrl', null, { shouldValidate: true, shouldDirty: true });
    if (profilePicFileInputRef.current) profilePicFileInputRef.current.value = '';
  };

  const handleResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ALLOWED_RESUME_TYPES.includes(file.type)) { toast({ title: "Invalid File Type", description: "Please upload a PDF file for your resume.", variant: "destructive" }); if (resumeFileInputRef.current) resumeFileInputRef.current.value = ''; return; }
      if (file.size > MAX_RESUME_SIZE_BYTES) { toast({ title: "File Too Large", description: `Resume PDF size must be less than ${MAX_RESUME_SIZE_KB}KB.`, variant: "destructive" }); if (resumeFileInputRef.current) resumeFileInputRef.current.value = ''; return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('resumeUrl', reader.result as string, { shouldValidate: true, shouldDirty: true });
        form.clearErrors('resumeUrl');
      };
      reader.readAsDataURL(file);
      setIsResumeOptionDialogOpen(false);
    }
  };
  const handleSetResumeLinkFromDialog = () => {
    const trimmedLink = resumeLinkInput.trim();
    if (trimmedLink) {
      if (!trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
        toast({ title: "Invalid Link", description: "Resume link must start with http:// or https://", variant: "destructive" });
        return;
      }
      form.setValue('resumeUrl', trimmedLink, { shouldValidate: true, shouldDirty: true });
      form.clearErrors('resumeUrl');
    } else {
      form.setValue('resumeUrl', null, { shouldValidate: true, shouldDirty: true });
    }
    if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
    setIsResumeOptionDialogOpen(false);
  };
  const removeResume = () => {
    form.setValue('resumeUrl', null, { shouldValidate: true, shouldDirty: true });
    if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
  };
  const handleViewResume = () => {
    const resume = form.watch('resumeUrl');
    if (resume) window.open(resume, '_blank');
    else toast({ title: "No Resume", description: "No resume has been uploaded or linked.", variant: "default" });
  };

  const addNewEducation = () => {
    if (educationFields.length < 5) {
      appendEducation({
        id: String(Date.now() + Math.random()), qualification: '', stream: '', institution: '',
        yearOfCompletion: new Date().getFullYear(), percentageMarks: null,
      });
    } else { toast({ title: "Limit Reached", description: "Maximum 5 education entries.", variant: "default" }); }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col items-center sm:items-start shrink-0">
          <div className="relative w-24 h-24 rounded-full border-2 border-primary/30 bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {profilePicPreview ? (
              <NextImage src={profilePicPreview} alt="Profile Preview" layout="fill" objectFit="cover" data-ai-hint="profile person" />
            ) : ( <div className="h-full w-full flex items-center justify-center bg-muted"><User className="h-12 w-12 text-muted-foreground/40" /></div>)}
            <Button type="button" variant="outline" size="icon" className="absolute bottom-1 right-1 rounded-full bg-card text-primary hover:bg-primary/10 h-8 w-8 shadow-md border border-primary/40" onClick={() => profilePicFileInputRef.current?.click()} aria-label="Upload profile picture">
              <UploadCloud className="h-4 w-4" />
            </Button>
          </div>
          <FormField control={form.control} name="profilePictureUrl" render={() => (
            <FormItem className="mt-1"><FormControl><Input type="file" accept={ALLOWED_PIC_TYPES.join(',')} onChange={handleProfilePicFileChange} ref={profilePicFileInputRef} className="hidden" /></FormControl><FormMessage className="text-xs" /></FormItem>
          )} />
          {profilePicPreview && (
            <Button type="button" variant="ghost" size="sm" onClick={removeProfilePic} className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs h-7 mt-1">
              <Trash2 className="h-3.5 w-3.5" /> Remove Photo
            </Button>
          )}
        </div>

        {/* Resume/CV Section - Aligned to the right */}
        <div className="flex-grow w-full flex flex-col sm:flex-row items-center sm:justify-end gap-4 sm:gap-6">
          <div className="flex flex-col items-center sm:items-end"> {/* Changed items-center to sm:items-end */}
            <Dialog open={isResumeOptionDialogOpen} onOpenChange={setIsResumeOptionDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/5 transition-default h-9 text-sm flex items-center gap-2 px-3">
                  <UploadCloud className="mr-1 h-4 w-4" /> Resume/CV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><UploadCloud className="text-primary h-5 w-5" />Choose Resume Option</DialogTitle><DialogDescription>Upload a PDF (Max {MAX_RESUME_SIZE_KB}KB) or enter a link to your online resume.</DialogDescription></DialogHeader>
                <div className="py-4 space-y-4">
                  <Button type="button" variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { resumeFileInputRef.current?.click(); }}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload PDF File
                  </Button>
                  <input type="file" accept={ALLOWED_RESUME_TYPES.join(',')} onChange={handleResumeFileChange} ref={resumeFileInputRef} className="hidden" id="resume-upload" />
                  <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div></div>
                  <div className="space-y-1.5"><Label htmlFor="resume-link-input">Enter Resume Link</Label><Input id="resume-link-input" type="url" placeholder="https://example.com/my-resume.pdf" value={resumeLinkInput} onChange={(e) => setResumeLinkInput(e.target.value)} /></div>
                </div>
                <ShadDialogFooter><Button type="button" variant="ghost" onClick={() => { setIsResumeOptionDialogOpen(false); setResumeLinkInput(form.watch('resumeUrl')?.startsWith('http') ? form.watch('resumeUrl') || '' : ''); }}>Cancel</Button><Button type="button" onClick={handleSetResumeLinkFromDialog} className="bg-primary text-primary-foreground hover:bg-primary/90">Set Link</Button></ShadDialogFooter>
              </DialogContent>
            </Dialog>
            <div className="text-center sm:text-right mt-1"> {/* Changed text-center to sm:text-right */}
              {!form.watch('resumeUrl') && (<p className="text-xs text-muted-foreground">No file</p>)}
              {form.watch('resumeUrl') && (
                <div className="flex items-center justify-center sm:justify-end gap-1 text-xs text-muted-foreground"> {/* Added sm:justify-end */}
                  {form.watch('resumeUrl')?.startsWith('data:') ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <LinkIconLucide className="h-3.5 w-3.5 text-blue-600" />}
                  <span className="truncate max-w-[120px]">{resumeFileName || (form.watch('resumeUrl')?.startsWith('data:') ? "Uploaded" : "Linked")}</span>
                  <Tooltip><TooltipTrigger asChild><Button type="button" variant="link" size="xs" onClick={handleViewResume} className="text-primary p-0 h-auto">(View)</Button></TooltipTrigger><TooltipContent><p>View Resume/CV</p></TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button type="button" variant="link" size="xs" onClick={removeResume} className="text-destructive p-0 h-auto">(Remove)</Button></TooltipTrigger><TooltipContent><p>Remove Resume/CV</p></TooltipContent></Tooltip>
                </div>
              )}
            </div>
            <FormField control={form.control} name="resumeUrl" render={() => <FormMessage className="text-xs text-center sm:text-left" />} />
          </div>
        </div>
      </div>
      <Separator />
      <FormField control={form.control} name="fullName" render={({ field }) => (
        <FormItem><FormLabel className="flex items-center text-sm font-medium"><User className="h-4 w-4 mr-1.5 text-muted-foreground" />Full Name <span className="text-destructive ml-1">*</span></FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <FormItem>
          <FormLabel className="flex items-center text-sm font-medium"><Mail className="h-4 w-4 mr-1.5 text-muted-foreground" />Email Address</FormLabel>
          <Input placeholder="your.email@example.com" value={form.watch('email') || ''} readOnly disabled className="bg-muted/50" />
        </FormItem>
        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium"><Phone className="h-4 w-4 mr-1.5 text-muted-foreground" />Contact Number</FormLabel><FormControl><Input type="tel" placeholder="e.g., +91 9876543210" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
          <FormItem className="flex flex-col"><FormLabel className="flex items-center text-sm font-medium"><CalendarIconLucide className="h-4 w-4 mr-1.5 text-muted-foreground" />Date of Birth</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant={"outline"} className={cn("pl-3 text-left font-normal h-10", !field.value && "text-muted-foreground")}>
                    {field.value ? new Date(field.value + 'T00:00:00').toLocaleDateString() : <span>Pick a date</span>}
                    <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={field.value ? new Date(field.value + 'T00:00:00') : undefined} onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)} captionLayout="dropdown-buttons" fromYear={new Date().getFullYear() - 100} toYear={new Date().getFullYear() - 15} initialFocus />
              </PopoverContent>
            </Popover><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="gender" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium"><User className="h-4 w-4 mr-1.5 text-muted-foreground" />Gender</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="maritalStatus" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium"><User className="h-4 w-4 mr-1.5 text-muted-foreground" />Marital Status</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl><SelectContent>{MARITAL_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
      </div>
      <Separator />
      <h3 className="text-lg font-semibold text-foreground pt-2 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Address Details</h3>
      <FormField control={form.control} name="currentAddress" render={({ field }) => (
        <FormItem><FormLabel className="flex items-center text-sm font-medium">Current Address</FormLabel><FormControl><Textarea placeholder="House No, Street, Area, Landmark" {...field} value={field.value ?? ''} rows={2} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <FormField control={form.control} name="currentCity" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">City</FormLabel><FormControl><Input placeholder="e.g., Mumbai" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="currentPinCode" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">Pin Code</FormLabel><FormControl><Input placeholder="e.g., 400001" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="correspondenceAddress" render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel className="flex items-center text-sm font-medium">Correspondence Address</FormLabel>
            <div className="flex items-center space-x-2">
              <Checkbox id="sameAsCurrent" checked={isSameAsCurrentAddress} onCheckedChange={(checked) => setIsSameAsCurrentAddress(!!checked)} />
              <label htmlFor="sameAsCurrent" className="text-xs text-muted-foreground">Same as Current</label>
            </div>
          </div>
          <FormControl><Textarea placeholder="House No, Street, Area, Landmark" {...field} value={field.value ?? ''} rows={2} disabled={isSameAsCurrentAddress} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <FormField control={form.control} name="correspondenceCity" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">City</FormLabel><FormControl><Input placeholder="e.g., Mumbai" {...field} value={field.value ?? ''} disabled={isSameAsCurrentAddress} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="correspondencePinCode" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">Pin Code</FormLabel><FormControl><Input placeholder="e.g., 400001" {...field} value={field.value ?? ''} disabled={isSameAsCurrentAddress} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-semibold">Educational Details</span>
                <span className="text-sm font-normal text-muted-foreground">(Latest First)</span>
            </h3>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsEducationSectionOpen(!isEducationSectionOpen)}
                className="text-primary hover:bg-primary/10"
                aria-label={isEducationSectionOpen ? "Collapse Educational Details" : "Expand Educational Details"}
            >
                {isEducationSectionOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
        </div>
        {isEducationSectionOpen && (
            <div className="space-y-4">
            {educationFields.map((item, index) => (
              <Card key={item.id} className="p-4 border bg-secondary/30 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mb-2">
                  <FormField name={`educationalDetails.${index}.qualification`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Qualification <span className="text-destructive">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value ?? ''}><FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{QUALIFICATION_OPTIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField name={`educationalDetails.${index}.stream`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Stream <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g., Computer Science" {...field} value={field.value ?? ''} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name={`educationalDetails.${index}.yearOfCompletion`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Passing Year <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" placeholder="e.g., 2022" {...field} value={field.value ?? ''} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-3">
                  <FormField name={`educationalDetails.${index}.institution`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Institution <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g., Stanford University" {...field} value={field.value ?? ''} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name={`educationalDetails.${index}.percentageMarks`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">% Marks</FormLabel><FormControl><Input type="number" placeholder="e.g., 85" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} className="h-10 max-w-[120px]" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEducation(index)} className="text-destructive border-destructive/50 hover:bg-destructive/10 h-8 px-2.5">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </Card>
            ))}
            <div className="flex justify-start">
              <Button type="button" variant="default" size="sm" onClick={addNewEducation} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> {educationFields.length > 0 ? "Add More" : "Add"}
              </Button>
            </div>
            <FormField name="educationalDetails" control={form.control} render={() => (<FormMessage />)} />
            </div>
        )}
      </div>
    </>
  );
};
Step1FormFields.displayName = 'Step1FormFields';

export default Step1FormFields;

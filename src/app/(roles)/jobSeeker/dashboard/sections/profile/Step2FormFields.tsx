// src/app/(roles)/jobSeeker/dashboard/sections/profile/Step2FormFields.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import {
  type JobSeekerProfileFormData,
  CURRENT_INDUSTRY_TYPE_OPTIONS,
} from '../../profile-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Globe, Github, Tag, X, Link as LinkIconLucide,
  PlusCircle, BriefcaseBusiness, Layers, MapPin, Users as UsersIcon,
  BookOpen, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Step2FormFields: React.FC = () => {
  const form = useFormContext<JobSeekerProfileFormData>();
  const { toast } = useToast();

  const [currentSkill, setCurrentSkill] = useState('');
  const [currentPreferredLocation, setCurrentPreferredLocation] = useState('');

  const { fields: skillsFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: "skills" });
  const watchedSkills = form.watch('skills');

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: form.control, name: "experienceDetails" });
  
  const { fields: preferredLocationsFields, append: appendPreferredLocation, remove: removePreferredLocation } = useFieldArray({ control: form.control, name: "preferredLocations" });
  const watchedPreferredLocations = form.watch('preferredLocations');
  const watchedCurrentIndustryType = form.watch('currentIndustryType');

  const [isExperienceSectionOpen, setIsExperienceSectionOpen] = useState(true); 

  useEffect(() => {
    if (watchedCurrentIndustryType !== 'Other') {
      form.setValue('otherCurrentIndustryType', null);
    }
  }, [watchedCurrentIndustryType, form]);

  const handleAddSkill = () => {
    if (currentSkill.trim()) {
      const currentSkillsArray = form.watch('skills') || [];
      if (currentSkillsArray.length < 50) {
        if (!currentSkillsArray.some(skillValue => skillValue.toLowerCase() === currentSkill.trim().toLowerCase())) {
          appendSkill(currentSkill.trim()); setCurrentSkill('');
        } else { toast({ title: "Skill Exists", variant: "default" }); }
      } else {
        toast({ title: "Skill Limit Reached", description: "Maximum 50 skills.", variant: "default" });
      }
    }
  };
  const handleAddPreferredLocation = () => {
    if (currentPreferredLocation.trim()) {
      const currentLocationsArray = form.watch('preferredLocations') || [];
      if (currentLocationsArray.length < 10) {
        if (!currentLocationsArray.some(loc => loc.toLowerCase() === currentPreferredLocation.trim().toLowerCase())) {
          appendPreferredLocation(currentPreferredLocation.trim()); setCurrentPreferredLocation('');
        } else { toast({ title: "Location Exists", variant: "default" }); }
      } else {
        toast({ title: "Location Limit Reached", description: "Maximum 10 locations.", variant: "default" });
      }
    }
  };
  const addNewExperience = () => {
    if (experienceFields.length < 10) {
      appendExperience({
        id: String(Date.now() + Math.random()), companyName: '', designation: '', aboutCompany: null,
        startDate: '', endDate: null, isPresent: false, responsibilities: '',
      });
    } else { toast({ title: "Limit Reached", description: "Maximum 10 experience entries.", variant: "default" }); }
  };
  const handleIsPresentChange = (index: number, checked: boolean) => {
    form.setValue(`experienceDetails.${index}.isPresent`, checked, { shouldValidate: true, shouldDirty: true });
    if (checked) {
      form.setValue(`experienceDetails.${index}.endDate`, null, { shouldValidate: true, shouldDirty: true });
      experienceFields.forEach((_, otherIndex) => {
        if (index !== otherIndex) { form.setValue(`experienceDetails.${otherIndex}.isPresent`, false, { shouldValidate: true, shouldDirty: true }); }
      });
    }
  };

  return (
    <>
      <h3 className="text-lg text-foreground flex items-center gap-2">
        <BriefcaseBusiness className="h-5 w-5 text-primary" />
        <span className="font-semibold">Professional Details</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
        <FormField control={form.control} name="currentDesignation" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">Current Designation</FormLabel><FormControl><Input placeholder="e.g., Software Developer" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="currentDepartment" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">Department</FormLabel><FormControl><Input placeholder="e.g., Engineering" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="presentSalary" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">Present Salary</FormLabel><FormControl><Input placeholder="e.g., 5 LPA or Not Disclosed" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
        <FormField control={form.control} name="totalExperience" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium">Total Experience (Years)</FormLabel><FormControl><Input type="number" step="0.5" placeholder="e.g., 5.5" {...field} value={field.value === null || field.value === undefined ? '' : String(field.value)} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="currentIndustry" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium">Industry</FormLabel><FormControl><Input placeholder="e.g., Technology, Finance" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="currentIndustryType" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium">Industry Type</FormLabel>
            <Select onValueChange={(value) => { field.onChange(value); if (value !== 'Other') form.setValue('otherCurrentIndustryType', null); }} value={field.value ?? ''}>
              <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
              <SelectContent>{CURRENT_INDUSTRY_TYPE_OPTIONS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
      </div>
      {form.watch('currentIndustryType') === 'Other' && (
        <FormField control={form.control} name="otherCurrentIndustryType" render={({ field }) => (
          <FormItem><FormLabel className="text-sm font-medium">Specify Other Industry Type</FormLabel><FormControl><Input placeholder="Enter specific industry type" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      )}
      <FormItem>
        <FormLabel className="text-sm font-medium flex items-center"><MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />Preferred Locations</FormLabel>
        <div className="flex gap-2 items-center">
          <Input placeholder="Enter a preferred location" value={currentPreferredLocation} onChange={(e) => setCurrentPreferredLocation(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPreferredLocation(); } }} className="flex-1 min-w-0 h-10 text-sm" />
          <Button type="button" onClick={handleAddPreferredLocation} size="sm" variant="outline" className="shrink-0 h-10"><PlusCircle className="mr-1.5 h-4 w-4" /> Add</Button>
        </div>
        {preferredLocationsFields.length < 10 ? (<p className="text-xs text-muted-foreground mt-1">Add up to 10 preferred work locations.</p>) : (<p className="text-xs text-destructive mt-1">Maximum 10 locations reached.</p>)}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {preferredLocationsFields.map((item, index) => (
            <Badge key={item.id} variant="secondary" className="py-1 px-2.5 text-sm">
              {watchedPreferredLocations?.[index]}
              <button type="button" onClick={() => removePreferredLocation(index)} className="ml-1.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </Badge>
          ))}
        </div>
        <FormField name="preferredLocations" control={form.control} render={() => (<FormMessage />)} />
      </FormItem>
      <FormItem>
        <FormLabel className="text-sm font-medium flex items-center"><Tag className="h-4 w-4 mr-1.5 text-muted-foreground" />Key Skills</FormLabel>
        <div className="flex gap-2 items-center">
          <Input placeholder="Enter a skill (e.g., React, Python)" value={currentSkill} onChange={(e) => setCurrentSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }} className="flex-1 min-w-0 h-10 text-sm" />
          <Button type="button" onClick={handleAddSkill} size="sm" variant="outline" className="shrink-0 h-10"><PlusCircle className="mr-1.5 h-4 w-4" /> Add</Button>
        </div>
        {skillsFields.length < 50 ? (<p className="text-xs text-muted-foreground mt-1">Add relevant skills.</p>) : (<p className="text-xs text-destructive mt-1">Maximum 50 skills reached.</p>)}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {skillsFields.map((item, index) => (
            <Badge key={item.id} variant="secondary" className="py-1 px-2.5 text-sm">
              {watchedSkills?.[index]}
              <button type="button" onClick={() => removeSkill(index)} className="ml-1.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </Badge>
          ))}
        </div>
        <FormField name="skills" control={form.control} render={() => (<FormMessage />)} />
      </FormItem>

       <FormField control={form.control} name="professionalSummary" render={({ field }) => (
        <FormItem>
            <FormLabel className="text-sm font-medium flex items-center"><BookOpen className="h-4 w-4 mr-1.5 text-muted-foreground" />Professional Summary</FormLabel>
            <FormControl><Textarea placeholder="Craft a concise overview of your career, key achievements, and aspirations..." {...field} value={field.value ?? ''} rows={5} className="min-h-[120px]" /></FormControl>
            <FormDescription>
              Highlight your most relevant experience and skills. Aim for 3-5 impactful sentences. (Max 1000 characters)
            </FormDescription>
            <FormMessage />
        </FormItem>
      )} />
      
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span className="font-semibold">Work Experience</span>
                <span className="text-sm font-normal text-muted-foreground">(Latest First)</span>
            </h3>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsExperienceSectionOpen(!isExperienceSectionOpen)}
                className="text-primary hover:bg-primary/10"
                aria-label={isExperienceSectionOpen ? "Collapse Work Experience" : "Expand Work Experience"}
            >
                {isExperienceSectionOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
        </div>
        {isExperienceSectionOpen && (
            <div className="space-y-4">
            {experienceFields.map((item, index) => (
              <Card key={item.id} className="p-4 border bg-secondary/30 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-2">
                  <FormField name={`experienceDetails.${index}.companyName`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Company Name <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g., Google, Microsoft" {...field} value={field.value ?? ''} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name={`experienceDetails.${index}.designation`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Designation <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="e.g., Senior Developer" {...field} value={field.value ?? ''} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField name={`experienceDetails.${index}.aboutCompany`} control={form.control} render={({ field }) => (
                  <FormItem className="mb-2"><FormLabel className="text-sm font-medium">About Company</FormLabel><FormControl><Textarea placeholder="Briefly describe the company (max 500 chars)" {...field} value={field.value ?? ''} rows={2} className="min-h-[60px]" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mb-2 items-end">
                  <FormField name={`experienceDetails.${index}.startDate`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">Start Date (MM-YYYY) <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="MM-YYYY" {...field} value={field.value ?? ''} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name={`experienceDetails.${index}.endDate`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel className="text-sm font-medium">End Date (MM-YYYY)</FormLabel><FormControl><Input placeholder="MM-YYYY or blank" {...field} value={field.value ?? ''} disabled={form.watch(`experienceDetails.${index}.isPresent`)} className="h-10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Controller name={`experienceDetails.${index}.isPresent`} control={form.control} render={({ field: { onChange, value, ref } }) => (
                    <FormItem className="flex items-center pb-2"><div className="flex items-center space-x-2 pt-5"><Checkbox id={`exp-present-${index}`} checked={value} onCheckedChange={(checked) => handleIsPresentChange(index, !!checked)} ref={ref} /><label htmlFor={`exp-present-${index}`} className="text-xs font-normal leading-none">Currently Working Here</label></div></FormItem>
                  )} />
                </div>
                <FormField name={`experienceDetails.${index}.responsibilities`} control={form.control} render={({ field }) => (
                  <FormItem><FormLabel className="text-sm font-medium">Responsibilities</FormLabel><FormControl><Textarea placeholder="Describe your key roles and achievements..." {...field} value={field.value ?? ''} rows={3} className="min-h-[80px]" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex justify-end mt-2">
                  <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" onClick={() => removeExperience(index)} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove</p></TooltipContent></Tooltip>
                </div>
              </Card>
            ))}
            <div className="flex justify-start">
              <Button type="button" variant="default" size="sm" onClick={addNewExperience} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 text-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> {experienceFields.length > 0 ? "Add More" : "Add"}
              </Button>
            </div>
            <FormField name="experienceDetails" control={form.control} render={() => (<FormMessage />)} />
            </div>
        )}
      </div>
      <Separator />
      <h3 className="text-lg font-semibold text-foreground pt-2 flex items-center gap-2"><LinkIconLucide className="h-5 w-5 text-primary" />Online Presence</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
        <FormField control={form.control} name="portfolioUrl" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium"><Globe className="h-4 w-4 mr-1.5 text-muted-foreground" />Portfolio/Website</FormLabel><FormControl><Input type="text" placeholder="yourpersonalwebsite.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="githubProfileUrl" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium"><Github className="h-4 w-4 mr-1.5 text-muted-foreground" />GitHub Profile</FormLabel><FormControl><Input type="text" placeholder="github.com/yourusername" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="otherSocialLinks" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center text-sm font-medium"><UsersIcon className="h-4 w-4 mr-1.5 text-muted-foreground" />Other Social Links</FormLabel><FormControl><Input placeholder="e.g., Twitter, Dribbble" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
    </>
  );
};
Step2FormFields.displayName = 'Step2FormFields';

export default Step2FormFields;

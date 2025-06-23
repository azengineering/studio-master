typescript
'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Search as SearchIcon, X, PlusCircle, SlidersHorizontal, RotateCcw, Briefcase, GraduationCap, Gavel, Sparkles, ChevronDown, ChevronUp, Save, Bookmark, ListFilter, ChevronLeft, ChevronRight, MapPin, Building, User, Phone, Mail, Copy, BookmarkPlus, Trash2, XCircle, FileText, Award, BookOpenText, Calendar, PersonStanding, Home, MailOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const industryTypeOptions = ["All Industry Types", "Technology", "Healthcare", "Finance", "Education", "Manufacturing", "Retail", "Marketing", "Other"];
const genderOptions = ["All", "Male", "Female", "Non-binary", "Prefer not to say"];

interface AddRemoveTagsInputProps {
  label: string; placeholder: string; currentInputValue: string; setCurrentInputValue: (value: string) => void;
  items: string[]; setItems: (items: string[]) => void; maxItems?: number;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  inputRef?: React.RefObject<HTMLInputElement>; showClearAllButton?: boolean;
  limitReachedMessage?: string; className?: string; tooltipPlacement?: "top" | "bottom" | "left" | "right";
}

const AddRemoveTagsInput: React.FC<AddRemoveTagsInputProps> = ({
  label, placeholder, currentInputValue, setCurrentInputValue,
  items, setItems, maxItems, badgeVariant = "secondary",
  inputRef, showClearAllButton = true, limitReachedMessage, className, tooltipPlacement = "top",
}) => {
  const handleAddItem = useCallback(() => {
    if (currentInputValue.trim()) {
      const newItem = currentInputValue.trim();
      if (!items.some(item => item.toLowerCase() === newItem.toLowerCase())) {
        if (!maxItems || items.length < maxItems) {
          setItems(prev => [...prev, newItem]);
          setCurrentInputValue('');
          inputRef?.current?.focus();
        }
      }
    }
  }, [currentInputValue, items, setItems, maxItems, setCurrentInputValue, inputRef]);

  const handleRemoveItem = useCallback((itemToRemove: string) => {
    setItems(prev => prev.filter(item => item !== itemToRemove));
  }, [setItems]);

  const handleClearAll = useCallback(() => {
    setItems([]);
    setCurrentInputValue('');
  }, [setItems, setCurrentInputValue]);

  const isLimitReached = maxItems !== undefined && items.length >= maxItems;

  return (
    <div className={className}>
      <Label htmlFor={`${label.toLowerCase().replace(/\s/g, '-')}-input`} className="text-sm font-medium text-foreground flex items-center gap-1">
        {label}
      </Label>
      <div className="flex items-center gap-2 mt-1">
        <Input
          id={`${label.toLowerCase().replace(/\s/g, '-')}-input`}
          ref={inputRef}
          placeholder={placeholder}
          value={currentInputValue}
          onChange={(e) => setCurrentInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
          className="h-9 text-sm"
          disabled={isLimitReached}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" size="icon" onClick={handleAddItem} className="h-9 w-9 shrink-0" disabled={!currentInputValue.trim() || isLimitReached}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltipPlacement}>
            <p>{isLimitReached ? (limitReachedMessage || `Max ${maxItems} items reached`) : `Add ${label.split(' ')[0]}`}</p>
          </TooltipContent>
        </Tooltip>
        {showClearAllButton && items.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleClearAll} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={tooltipPlacement}><p>Clear All {label.split(' ')[0]}s</p></TooltipContent>
          </Tooltip>
        )}
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map(item => (
            <Badge key={item} variant={badgeVariant} className="text-xs py-0.5 px-2">
              {item}
              <button onClick={() => handleRemoveItem(item)} className="ml-1 text-muted-foreground hover:text-destructive rounded-full focus:outline-none focus:ring-1 focus:ring-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Posted jobs will be fetched from database

interface WorkExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string; // Or null if current
  responsibilities: string[];
}

interface Education {
  degree: string;
  institution: string;
  year: number;
}

interface Candidate {
  id: string; name: string; designation: string; experience: number; location: string; skills: string[];
  industry: string; qualifications: string[]; salaryLPA: number; gender: string; age: number;
  profileImageUrl: string; email: string; phone: string; linkedinProfileUrl: string;
  company: string;
  department: string;
  preferredLocations: string[];
  professionalSummary?: string;
  workExperience?: WorkExperience[];
  education?: Education[];
  awards?: string[];
  certifications?: string[];
  resumePdfUrl?: string; // New field for resume PDF URL
  dob: string; // Added D.O.B
  maritalStatus: string; // Added Marital Status
  currentAddress: string; // Added Current Address
  correspondenceAddress: string; // Added Correspondence Address
}

// API functions to fetch real data from database
const fetchCandidates = async (filters: any, page: number = 1, limit: number = 25) => {
  const queryParams = new URLSearchParams({
    keywords: JSON.stringify(filters.keywords || []),
    excludedKeywords: JSON.stringify(filters.excludedKeywords || []),
    skills: JSON.stringify(filters.skills || []),
    locations: JSON.stringify(filters.locations || []),
    includeRelocatingCandidates: filters.includeRelocatingCandidates?.toString() || 'false',
    designationInput: filters.designationInput || '',
    includedCompanies: JSON.stringify(filters.includedCompanies || []),
    excludedCompanies: JSON.stringify(filters.excludedCompanies || []),
    minExperience: filters.minExperience || '',
    maxExperience: filters.maxExperience || '',
    minSalary: filters.minSalary || '',
    maxSalary: filters.maxSalary || '',
    qualifications: JSON.stringify(filters.qualifications || []),
    selectedGender: filters.selectedGender || 'All',
    minAge: filters.minAge || '',
    maxAge: filters.maxAge || '',
    industryInput: filters.industryInput || '',
    selectedIndustryType: filters.selectedIndustryType || 'All Industry Types',
    page: page.toString(),
    limit: limit.toString()
  });

  const response = await fetch(`/api/candidates?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch candidates');
  }
  return response.json();
};

const fetchCandidateDetails = async (candidateId: string) => {
  const response = await fetch(`/api/candidates/${candidateId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch candidate details');
  }
  return response.json();
};

// Extracted filter components for better organization and clarity
interface KeywordsFilterProps {
  currentKeywordInput: string; setCurrentKeywordInput: (value: string) => void; keywords: string[]; setKeywords: (items: string[]) => void;
  keywordInputRef: React.RefObject<HTMLInputElement>; currentExcludeKeywordInput: string; setCurrentExcludeKeywordInput: (value: string) => void;
  excludedKeywords: string[]; setExcludedKeywords: (items: string[]) => void; excludeKeywordInputRef: React.RefObject<HTMLInputElement>;
  industryInput: string; setIndustryInput: (value: string) => void; selectedIndustryType: string; setSelectedIndustryType: (value: string) => void;
}

const KeywordsFilter: React.FC<KeywordsFilterProps> = ({
  currentKeywordInput, setCurrentKeywordInput, keywords, setKeywords, keywordInputRef,
  currentExcludeKeywordInput, setCurrentExcludeKeywordInput, excludedKeywords, setExcludedKeywords, excludeKeywordInputRef,
  industryInput, setIndustryInput, selectedIndustryType, setSelectedIndustryType
}) => (
  <>
    <AddRemoveTagsInput label="Search Keywords" placeholder="e.g., Java, Project Manager" currentInputValue={currentKeywordInput} setCurrentInputValue={setCurrentKeywordInput} items={keywords} setItems={setKeywords} maxItems={15} inputRef={keywordInputRef} />
    <AddRemoveTagsInput label="Exclude Keywords" placeholder="e.g., Junior, Intern" currentInputValue={currentExcludeKeywordInput} setCurrentInputValue={setCurrentExcludeKeywordInput} items={excludedKeywords} setItems={setExcludedKeywords} maxItems={10} badgeVariant="destructive" inputRef={excludeKeywordInputRef} />
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
      <div className="w-full sm:w-1/2">
        <Label htmlFor="industry-input" className="text-sm font-medium text-foreground">Industry</Label>
        <Input id="industry-input" placeholder="e.g., E-commerce, SaaS" className="h-9 text-sm mt-1" value={industryInput} onChange={(e) => setIndustryInput(e.target.value)} />
      </div>
      <div className="w-full sm:w-1/2">
        <Label htmlFor="industry-type" className="text-sm font-medium text-foreground">Industry Type</Label>
        <Select value={selectedIndustryType} onValueChange={setSelectedIndustryType}>
          <SelectTrigger id="industry-type" className="h-9 text-sm mt-1">
            <SelectValue placeholder="Select industry type" />
          </SelectTrigger>
          <SelectContent>
            {industryTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
    <Separator />
  </>
);

interface SkillsAndLocationsFilterProps {
  currentSkillInput: string; setCurrentSkillInput: (value: string) => void; skills: string[]; setSkills: (items: string[]) => void;
  skillInputRef: React.RefObject<HTMLInputElement>; currentLocationInput: string; setCurrentLocationInput: (value: string) => void;
  locations: string[]; setLocations: (items: string[]) => void; locationInputRef: React.RefObject<HTMLInputElement>;
  includeRelocatingCandidates: boolean; setIncludeRelocatingCandidates: (checked: boolean) => void;
}

const SkillsAndLocationsFilter: React.FC<SkillsAndLocationsFilterProps> = ({
  currentSkillInput, setCurrentSkillInput, skills, setSkills, skillInputRef,
  currentLocationInput, setCurrentLocationInput, locations, setLocations, locationInputRef,
  includeRelocatingCandidates, setIncludeRelocatingCandidates
}) => (
  <>
    <AddRemoveTagsInput label="Skills" placeholder="e.g., Python, React" currentInputValue={currentSkillInput} setCurrentInputValue={setCurrentSkillInput} items={skills} setItems={setSkills} maxItems={15} inputRef={skillInputRef} />
    <Separator />
    <div>
      <AddRemoveTagsInput label="Current Locations" placeholder="City, State or Remote" currentInputValue={currentLocationInput} setCurrentInputValue={setCurrentLocationInput} items={locations} setItems={setLocations} maxItems={5} inputRef={locationInputRef} />
      <div className="flex items-center space-x-2 mt-2.5">
        <Checkbox id="include-relocating" checked={includeRelocatingCandidates} onCheckedChange={(checked) => setIncludeRelocatingCandidates(!!checked)} />
        <Label htmlFor="include-relocating" className="text-xs font-normal text-muted-foreground cursor-pointer">
          Include candidates who prefer to relocate to above locations
        </Label>
      </div>
    </div>
    <Separator />
  </>
);

interface ExperienceAndSalaryFilterProps {
  minExperience: string; setMinExperience: (value: string) => void; maxExperience: string; setMaxExperience: (value: string) => void;
  minSalary: string; setMinSalary: (value: string) => void; maxSalary: string; setMaxSalary: (value: string) => void;
}

const ExperienceAndSalaryFilter: React.FC<ExperienceAndSalaryFilterProps> = ({
  minExperience, setMinExperience, maxExperience, setMaxExperience,
  minSalary, setMinSalary, maxSalary, setMaxSalary
}) => (
  <>
    <div>
      <Label className="text-sm font-medium text-foreground">Experience (Years)</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input id="min-exp" type="number" placeholder="Min" className="h-9 text-sm" aria-label="Minimum experience in years" value={minExperience} onChange={(e) => setMinExperience(e.target.value)} />
        <span className="text-muted-foreground">-</span>
        <Input id="max-exp" type="number" placeholder="Max" className="h-9 text-sm" aria-label="Maximum experience in years" value={maxExperience} onChange={(e) => setMaxExperience(e.target.value)} />
      </div>
    </div>
    <div>
      <Label className="text-sm font-medium text-foreground flex items-center gap-1">Salary</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input id="min-salary" type="number" placeholder="Min (LPA)" className="h-9 text-sm" aria-label="Minimum annual salary in lakhs per annum" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} />
        <span className="text-muted-foreground">-</span>
        <Input id="max-salary" type="number" placeholder="Max (LPA)" className="h-9 text-sm" aria-label="Maximum annual salary in lakhs per annum" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} />
      </div>
    </div>
    <Separator />
  </>
);

interface EmploymentDetailsFilterProps {
  isEmploymentDetailsOpen: boolean; setIsEmploymentDetailsOpen: (open: boolean) => void;
  designationInput: string; setDesignationInput: (value: string) => void; includePreviousDesignations: boolean; setIncludePreviousDesignations: (checked: boolean) => void;
  currentIncludeCompanyInput: string; setCurrentIncludeCompanyInput: (value: string) => void; includedCompanies: string[]; setIncludedCompanies: (items: string[]) => void;
  includeCompanyInputRef: React.RefObject<HTMLInputElement>; currentExcludeCompanyInput: string; setCurrentExcludeCompanyInput: (value: string) => void;
  excludedCompanies: string[]; setExcludedCompanies: (items: string[]) => void; excludeCompanyInputRef: React.RefObject<HTMLInputElement>;
}

const EmploymentDetailsFilter: React.FC<EmploymentDetailsFilterProps> = ({
  isEmploymentDetailsOpen, setIsEmploymentDetailsOpen,
  designationInput, setDesignationInput, includePreviousDesignations, setIncludePreviousDesignations,
  currentIncludeCompanyInput, setCurrentIncludeCompanyInput, includedCompanies, setIncludedCompanies, includeCompanyInputRef,
  currentExcludeCompanyInput, setCurrentExcludeCompanyInput, excludedCompanies, setExcludedCompanies, excludeCompanyInputRef
}) => (
  <div>
    <Button variant="ghost" onClick={() => setIsEmploymentDetailsOpen(!isEmploymentDetailsOpen)} className="w-full justify-between px-1 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50">
      <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" /> Employment Details</span>
      {isEmploymentDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
    {isEmploymentDetailsOpen && (
      <div className="mt-2 pl-2 border-l-2 border-muted space-y-4 py-2">
        <div>
          <Label htmlFor="designation-input" className="text-xs font-medium text-foreground">Designation</Label>
          <Input id="designation-input" placeholder="e.g., Software Engineer" value={designationInput} onChange={(e) => setDesignationInput(e.target.value)} className="h-9 text-sm mt-1" />
          <div className="flex items-center space-x-2 mt-1.5">
            <Checkbox id="include-previous-designations" checked={includePreviousDesignations} onCheckedChange={(checked) => setIncludePreviousDesignations(!!checked)} />
            <Label htmlFor="include-previous-designations" className="text-xs font-normal text-muted-foreground cursor-pointer">Include Previous Designations</Label>
          </div>
        </div>
        <AddRemoveTagsInput label="Include Companies" placeholder="Company name" currentInputValue={currentIncludeCompanyInput} setCurrentInputValue={setCurrentIncludeCompanyInput} items={includedCompanies} setItems={setIncludedCompanies} maxItems={5} inputRef={includeCompanyInputRef} tooltipPlacement="top" />
        <AddRemoveTagsInput label="Exclude Companies" placeholder="Company name" currentInputValue={currentExcludeCompanyInput} setCurrentInputValue={setCurrentExcludeCompanyInput} items={excludedCompanies} setItems={setExcludedCompanies} maxItems={5} badgeVariant="destructive" inputRef={excludeCompanyInputRef} tooltipPlacement="top" />
      </div>
    )}
  </div>
);

interface AdditionalParametersFilterProps {
  isAdditionalParametersOpen: boolean; setIsAdditionalParametersOpen: (open: boolean) => void;
  currentQualificationInput: string; setCurrentQualificationInput: (value: string) => void; qualifications: string[]; setQualifications: (items: string[]) => void;
  qualificationInputRef: React.RefObject<HTMLInputElement>; selectedGender: string; setSelectedGender: (value: string) => void;
  minAge: string; setMinAge: (value: string) => void; maxAge: string; setMaxAge: (value: string) => void;
}

const AdditionalParametersFilter: React.FC<AdditionalParametersFilterProps> = ({
  isAdditionalParametersOpen, setIsAdditionalParametersOpen,
  currentQualificationInput, setCurrentQualificationInput, qualifications, setQualifications, qualificationInputRef,
  selectedGender, setSelectedGender,
  minAge, setMinAge, maxAge, setMaxAge
}) => (
  <div>
    <Button variant="ghost" onClick={() => setIsAdditionalParametersOpen(!isAdditionalParametersOpen)} className="w-full justify-between px-1 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50">
      <span className="flex items-center gap-1"><Gavel className="h-4 w-4 text-muted-foreground" /> Additional Parameters</span>
      {isAdditionalParametersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
    {isAdditionalParametersOpen && (
      <div className="mt-2 pl-2 border-l-2 border-muted space-y-4 py-2">
        <AddRemoveTagsInput label="Qualifications" placeholder="e.g., MBA, B.Tech, PhD" currentInputValue={currentQualificationInput} setCurrentInputValue={setCurrentQualificationInput} items={qualifications} setItems={setQualifications} maxItems={5} inputRef={qualificationInputRef} />
        <div>
          <Label htmlFor="gender-select" className="text-xs font-medium text-foreground">Gender</Label>
          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger id="gender-select" className="h-9 text-sm mt-1">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground">Age (Years)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input id="min-age" type="number" placeholder="Min" className="h-9 text-sm" aria-label="Minimum age" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
            <span className="text-muted-foreground">-</span>
            <Input id="max-age" type="number" placeholder="Max" className="h-9 text-sm" aria-label="Maximum age" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
          </div>
        </div>
      </div>
    )}
  </div>
);

// Utility function to highlight text
const highlightText = (text: string, terms: string[]) => {
  if (!text || terms.length === 0) return text;

  const combinedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
  if (combinedTerms.length === 0) return text;

  const regex = new RegExp(`(${combinedTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-700 text-black dark:text-white rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
};

/**
 * Formats a date string (YYYY-MM-DD) to DD-MM-YY.
 * Handles 'Present' status by returning it as is.
 * @param dateString The date string to format.
 * @returns Formatted date string or 'Present'.
 */
const formatDateToDDMMYY = (dateString: string): string => {
  if (dateString === 'Present') {
    return 'Present';
  }
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year.substring(2)}`;
  }
  return dateString; // Return as is if format is unexpected
};

// Generic copy to clipboard function
const handleCopyToClipboard = (text: string) => {
  if (text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy'); // For iframe compatibility
    document.body.removeChild(tempInput);
  }
};

// New sub-component for Contact Buttons in CandidateDetail
interface ContactButtonProps {
    icon: React.ElementType;
    tooltip: string;
    onClick?: () => void;
    children?: React.ReactNode;
    colorClass?: string; // Tailwind color class for the icon, e.g., 'text-blue-500'
}

const ContactButton = React.forwardRef<HTMLButtonElement, ContactButtonProps>(({ icon: Icon, tooltip, onClick, children, colorClass = 'text-muted-foreground' }, ref) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button ref={ref} variant="ghost" size="icon" className={`h-8 w-8 hover:text-primary ${colorClass}`} onClick={onClick}>
                <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
            </Button>
        </TooltipTrigger>
        <TooltipContent><p>{tooltip}</p></TooltipContent>
        {children}
    </Tooltip>
));
ContactButton.displayName = 'ContactButton'; // Added for better debugging

// Sub-component for Personal Details
interface PersonalDetailsProps {
    candidate: Candidate;
    keywords: string[];
}

const PersonalDetails: React.FC<PersonalDetailsProps> = ({ candidate, keywords }) => (
    <div>
        <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><User className="h-4.5 w-4.5" /> Personal Details</h3>
        <div className="space-y-1.5 text-sm text-gray-700">
            <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Full Name:</strong> {highlightText(candidate.name, keywords)}</p>
            <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> <strong>D.O.B:</strong> {formatDateToDDMMYY(candidate.dob)}</p>
            <p className="flex items-center gap-2"><PersonStanding className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Gender:</strong> {candidate.gender}</p>
            <p className="flex items-center gap-2"><PersonStanding className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Marital Status:</strong> {candidate.maritalStatus}</p>
            <p className="flex items-start gap-2"><Home className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /> <strong>Current Address:</strong> {candidate.currentAddress}</p>
            <p className="flex items-start gap-2"><MailOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /> <strong>Correspondence Address:</strong> {candidate.correspondenceAddress}</p>
        </div>
    </div>
);

// Sub-component for Educational Details
interface EducationalDetailsProps {
    candidate: Candidate;
    qualifications: string[];
}

const EducationalDetails: React.FC<EducationalDetailsProps> = ({ candidate, qualifications }) => (
    <>
        {candidate.education && candidate.education.length > 0 && (
            <div>
                <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><GraduationCap className="h-4.5 w-4.5" /> Educational Details</h3>
                <div className="space-y-3">
                    {candidate.education.map((edu, index) => (
                        <Card key={index} className="p-3 border border-border rounded-lg shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900">{highlightText(edu.degree, qualifications)}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{edu.institution}, {edu.year}</p>
                        </Card>
                    ))}
                </div>
            </div>
        )}
    </>
);

// Sub-component for About Summary
interface AboutSummaryProps {
    candidate: Candidate;
    keywords: string[];
}

const AboutSummary: React.FC<AboutSummaryProps> = ({ candidate, keywords }) => (
    <>
        {candidate.professionalSummary && (
            <div>
                <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><FileText className="h-4.5 w-4.5" /> About Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{highlightText(candidate.professionalSummary, keywords)}</p>
            </div>
        )}
    </>
);

// Sub-component for Work Experience
interface WorkExperienceProps {
    candidate: Candidate;
    designationInput: string;
    keywords: string[];
    includedCompanies: string[];
}

const WorkExperienceSection: React.FC<WorkExperienceProps> = ({ candidate, designationInput, keywords, includedCompanies }) => (
    <>
        {candidate.workExperience && candidate.workExperience.length > 0 && (
            <div>
                <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><Briefcase className="h-4.5 w-4.5" /> Work Experience</h3>
                <div className="space-y-4">
                    {candidate.workExperience.map((job, index) => (
                        <Card key={index} className="p-3 border border-border rounded-lg shadow-sm">
                            <h4 className="text-base font-semibold text-gray-900">{highlightText(job.title, [designationInput, ...keywords])} at {highlightText(job.company, includedCompanies)}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{formatDateToDDMMYY(job.startDate)} - {formatDateToDDMMYY(job.endDate)}</p>
                            <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                {job.responsibilities.map((resp, respIndex) => (
                                    <li key={respIndex}>{highlightText(resp, keywords)}</li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>
            </div>
        )}
    </>
);

// Sub-component for Professional Details Summary
interface ProfessionalDetailsSummaryProps {
    candidate: Candidate;
    designationInput: string;
    keywords: string[];
    industryInput: string;
    selectedIndustryType: string;
    locations: string[];
}

const ProfessionalDetailsSummary: React.FC<ProfessionalDetailsSummaryProps> = ({
    candidate, designationInput, keywords, industryInput, selectedIndustryType, locations
}) => (
    <div>
        <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><Briefcase className="h-4.5 w-4.5" /> Professional Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Current Designation:</strong> {highlightText(candidate.designation, [designationInput, ...keywords])}</p>
            <p className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Department:</strong> {candidate.department}</p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground text-md mr-1">₹</span> <strong>Present Salary:</strong> {candidate.salaryLPA} LPA</p>
            <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Total Experience:</strong> {candidate.experience} Years</p>
            <p className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Industry:</strong> {highlightText(candidate.industry, [industryInput, selectedIndustryType])}</p>
            <p className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Industry Type:</strong> {highlightText(selectedIndustryType, [industryInput])}</p>
            {candidate.preferredLocations && candidate.preferredLocations.length > 0 && (
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> <strong>Preferred Locations:</strong> {highlightText(candidate.preferredLocations.join(', '), locations)}</p>
            )}
        </div>
    </div>
);

// Sub-component for Key Skills (reused)
interface KeySkillsSectionProps {
    candidate: Candidate;
    skills: string[];
}

const KeySkillsSection: React.FC<KeySkillsSectionProps> = ({ candidate, skills }) => (
    <div className="mt-4">
        <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><Sparkles className="h-4.5 w-4.5" /> Key Skills</h3>
        <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map(skill => (
                <Badge key={skill} variant="secondary" className="text-sm px-2.5 py-1 rounded-full">{highlightText(skill, skills)}</Badge>
            ))}
        </div>
    </div>
);

// CandidateDetail Component definition
interface CandidateDetailProps {
  candidateId: string | null;
  onBack: () => void;
  handleAddSingleToWatchlist: (candidate: Candidate) => void;
  keywords: string[];
  designationInput: string;
  includedCompanies: string[];
  locations: string[];
  industryInput: string```tool_code
  selectedIndustryType: string;
  qualifications: string[];
  skills: string[];
}

const CandidateDetail: React.FC<CandidateDetailProps> = React.memo(function CandidateDetail({
  candidateId, onBack, handleAddSingleToWatchlist,
  keywords, designationInput, includedCompanies, locations,
  industryInput, selectedIndustryType, qualifications, skills
}) {
  const resumePdfRef = useRef<HTMLDivElement>(null);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);

  useEffect(() => {
    if (candidateId) {
      setCandidateLoading(true);
      fetchCandidateDetails(candidateId)
        .then(setCandidate)
        .catch((error) => {
          console.error('Error fetching candidate details:', error);
          setCandidate(null);
        })
        .finally(() => setCandidateLoading(false));
    }
  }, [candidateId]);

  const handleResumeClick = useCallback(() => {
    if (candidate?.resumePdfUrl && resumePdfRef.current) {
        resumePdfRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        console.log(`No resume/CV available for ${candidate?.name || 'Unknown'}`);
    }
  }, [candidate?.resumePdfUrl, candidate?.name]);

  if (candidateLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card rounded-lg shadow-lg min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-semibold text-primary">Loading candidate details...</h2>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card rounded-lg shadow-lg min-h-[400px]">
        <XCircle className="h-20 w-20 text-destructive-foreground/40 mb-4" />
        <h2 className="text-2xl font-bold text-destructive">Candidate Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested candidate details could not be loaded from the database.</p>
        <Button onClick={onBack} className="mt-6">Back to Search</Button>
      </div>
    );
  }


  return (
    <div className="py-0 px-0 bg-background min-h-screen">
      <div className="flex justify-start px-0 mb-4">
        <Button variant="ghost" onClick={onBack} className="text-primary hover:bg-secondary/50 transition-all duration-200 ease-in-out">
          <ChevronLeft className="h-5 w-5 mr-2" /> Back to Search
        </Button>
      </div>
      <Card className="p-6 md:p-8 rounded-xl shadow-xl border border-border">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-0">
            <img
              src={candidate.profileImageUrl}
              alt={candidate.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg flex-shrink-0"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/96x96/cccccc/444444?text=${candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}`; }}
            />
            <div className="flex-grow text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-1">
                <h1 className="text-2xl font-bold text-primary">
                  {highlightText(candidate.name, keywords)}{' '}
                  <span className="text-sm text-muted-foreground font-normal">({candidate.gender})</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-3 sm:mt-0 ml-auto">
                  <ContactButton icon={BookmarkPlus} tooltip="Add to Watchlist" onClick={() => handleAddSingleToWatchlist(candidate)} colorClass="text-blue-500" />
                  {candidate.phone && (
                      <Popover>
                          <PopoverTrigger asChild>
                              <ContactButton icon={Phone} tooltip={`Show phone number for ${candidate.name}`} colorClass="text-green-600" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 flex flex-col items-start gap-1">
                              <span className="text-sm font-medium">{candidate.phone}</span>
                              <div className="flex gap-2 mt-1">
                                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => handleCopyToClipboard(candidate.phone)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                                  <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Call</a>
                              </div>
                          </PopoverContent>
                      </Popover>
                  )}
                  {candidate.email && (
                      <Popover>
                          <PopoverTrigger asChild>
                              <ContactButton icon={Mail} tooltip={`Show email address for ${candidate.name}`} colorClass="text-red-500" />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2 flex flex-col items-start gap-1">
                              <span className="text-sm font-medium">{candidate.email}</span>
                              <div className="flex gap-2 mt-1">
                                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => handleCopyToClipboard(candidate.email)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                                  <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Mail</a>
                              </div>
                          </PopoverContent>
                      </Popover>
                  )}
                  {candidate.linkedinProfileUrl && (
                      <ContactButton icon={() => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]"><path d="M20.447 20.452h-3.554v-5.568c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.666H9.153V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.37 2.37 0 01-2.368-2.352 2.365 2.365 0 012.368-2.353 2.364 2.364 0 012.368 2.353 2.362 2.362 0 01-2.368 2.352zm-.008 13.012H2.974V9h2.355v11.445zM22.224 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.453c.979 0 1.772-.773 1.772-1.729V1.729C24 .774 23.207 0 22.224 0z"/></svg>} tooltip="View LinkedIn Profile" onClick={() => window.open(candidate.linkedinProfileUrl, '_blank')} colorClass="text-[#0A66C2]" />
                  )}
                  {candidate.resumePdfUrl && (
                      <ContactButton icon={FileText} tooltip="View Resume/CV" onClick={handleResumeClick} colorClass="text-purple-500" />
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-1">
                  <span className="flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" /> {highlightText(candidate.location, locations)}
                      <span className="ml-2 font-semibold text-gray-800">
                          {highlightText(candidate.designation, [designationInput, ...keywords])} {candidate.department && `(${candidate.department})`}
                      </span>
                      {candidate.company && <span className="text-blue-600 font-bold"> @ {highlightText(candidate.company, includedCompanies)}</span>}
                  </span>
              </p>

              <div className="mt-2 text-sm text-gray-700 flex flex-wrap items-center gap-x-5 gap-y-1">
                  <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{highlightText(candidate.qualifications.join(', '), qualifications)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.experience} Years Exp</span>
                  </span>
                  <span className="flex items-center gap-1">
                      <span className="text-muted-foreground text-md">₹</span>
                      <span>{candidate.salaryLPA} LPA</span>
                  </span>
                  <span className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span>{highlightText(candidate.industry, [industryInput, selectedIndustryType])} ({highlightText(selectedIndustryType, [industryInput, selectedIndustryType])})</span>
                  </span>
              </div>

              {candidate.preferredLocations && candidate.preferredLocations.length > 0 && (
                  <div className="mt-2 text-sm text-gray-700 flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>Preferred Locations: {highlightText(candidate.preferredLocations.join(', '), locations)}</span>
                  </div>
              )}

              <KeySkillsSection candidate={candidate} skills={skills} />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mt-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[30%] space-y-6 p-4 rounded-lg bg-secondary/20 shadow-inner">
                  <PersonalDetails candidate={candidate} keywords={keywords} />
                  <EducationalDetails candidate={candidate} qualifications={qualifications} />
              </div>

              <div className="w-full md:w-[70%] space-y-6">
                <AboutSummary candidate={candidate} keywords={keywords} />
                <WorkExperienceSection
                    candidate={candidate}
                    designationInput={designationInput}
                    keywords={keywords}
                    includedCompanies={includedCompanies}
                />
                <ProfessionalDetailsSummary
                    candidate={candidate}
                    designationInput={designationInput}
                    keywords={keywords}
                    industryInput={industryInput}
                    selectedIndustryType={selectedIndustryType}
                    locations={locations}
                />
                <KeySkillsSection candidate={candidate} skills={skills} />
              </div>
            </div>
          {candidate.resumePdfUrl && (
            <div ref={resumePdfRef} className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><FileText className="h-4.5 w-4.5" /> Candidate Resume</h3>
              <div className="relative w-full overflow-hidden rounded-lg shadow-md border border-border" style={{ paddingTop: 'calc(100% * 11 / 8.5)' }}>
                  <iframe
                      src={candidate.resumePdfUrl}
                      title={`${candidate.name}'s Resume`}
                      className="absolute top-0 left-0 w-full h-full"
                      style={{ border: 'none' }}
                      frameBorder="0"
                      allowFullScreen
                  >
                      Your browser does not support PDFs. You can <a href={candidate.resumePdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">download the resume here</a>.
                  </iframe>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// New Header Component
interface MainHeaderProps {
  totalResultsCount: number;
  setIsMyWatchlistModalOpen: (open: boolean) => void;
  setIsSavedSearchesModalOpen: (open: boolean) => void;
  setIsPostedJobsModalOpen: (open: boolean) => void;
  setIsJobDescriptionModalOpen: (open: boolean) => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({
  totalResultsCount,
  setIsMyWatchlistModalOpen,
  setIsSavedSearchesModalOpen,
  setIsPostedJobsModalOpen,
  setIsJobDescriptionModalOpen,
}) => (
  <CardHeader className="bg-secondary/20 p-3 border-b border-border flex flex-row items-center justify-between shrink-0">
    <div className="text-lg font-bold text-gray-700 dark:text-gray-300 flex items-center">
      <Users className="h-5 w-5 mr-2" />
      <span>{totalResultsCount.toLocaleString()} candidates</span>
    </div>
    <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" className="text-sm font-semibold text-primary py-1 px-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 ease-in-out" onClick={() => setIsMyWatchlistModalOpen(true)}>
            <BookmarkPlus className="h-4 w-4 mr-2" /> My Watchlist
        </Button>
        <Button variant="ghost" className="text-sm font-semibold text-primary py-1 px-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 ease-in-out" onClick={() => setIsSavedSearchesModalOpen(true)}>
          <Bookmark className="h-4 w-4 mr-2" /> Saved Searches
        </Button>
        <Button variant="outline" size="sm" className="text-sm font-semibold text-primary py-1.5 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out" onClick={() => setIsPostedJobsModalOpen(true)}>
          <ListFilter className="h-4 w-4 mr-2" /> Filter by Posted Jobs
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="text-md font-semibold text-primary py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out self-start" onClick={() => setIsJobDescriptionModalOpen(true)}>
              <Sparkles className="h-5 w-5 mr-2 text-yellow-500" /> Generate Filters with AI
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-center">
            <p className="text-sm">Paste a job description below, and AI will suggest relevant search filters.</p>
          </TooltipContent>
        </Tooltip>
    </div>
  </CardHeader>
);

// JobDescriptionModal Component
interface JobDescriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jobDescriptionText: string;
  setJobDescriptionText: (text: string) => void;
  llmGenerationError: string | null;
  isGeneratingFilters: boolean;
  handleGenerateFiltersFromJD: () => void;
}

const JobDescriptionModal: React.FC<JobDescriptionModalProps> = ({
  isOpen, onOpenChange, jobDescriptionText, setJobDescriptionText,
  llmGenerationError, isGeneratingFilters, handleGenerateFiltersFromJD
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[600px] p-6 rounded-lg shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Sparkles className="h-6 w-6 text-yellow-500" /> Generate Filters with AI</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Paste a job description below, and AI will suggest relevant search filters.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Textarea placeholder="Paste your job description here..." className="min-h-[200px] text-sm resize-y" value={jobDescriptionText} onChange={(e) => setJobDescriptionText(e.target.value)} />
        {llmGenerationError && (<p className="text-sm text-destructive">{llmGenerationError}</p>)}
      </div>
      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button variant="outline" onClick={() => { onOpenChange(false); setJobDescriptionText(''); }} disabled={isGeneratingFilters}>Cancel</Button>
        <Button onClick={handleGenerateFiltersFromJD} disabled={isGeneratingFilters || !jobDescriptionText.trim()}>
          {isGeneratingFilters ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>) : (<><Sparkles className="h-4 w-4 mr-2" /> Generate</>)}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// PostedJobsModal Component
interface PostedJobsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  handleFilterByPostedJob: (filters: any) => void;
  postedJobs: any[];
}

const PostedJobsModal: React.FC<PostedJobsModalProps> = ({ isOpen, onOpenChange, handleFilterByPostedJob, postedJobs }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[600px] p-6 rounded-lg shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2"><ListFilter className="h-6 w-6 text-blue-500" /> Filter by Posted Jobs</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Select a job below to automatically apply its filters and find matching candidates.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {postedJobs.length === 0 ? (<p className="text-center text-muted-foreground py-8">No posted jobs available at the moment.</p>) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {postedJobs.map((job) => (
                <Card key={job.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-border" onClick={() => { handleFilterByPostedJob(job.filters); onOpenChange(false); }}>
                  <CardTitle className="text-lg font-semibold text-primary">{job.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    {job.description && job.description.length > 100 ? `${job.description.substring(0, 100)}...` : job.description || 'No description available'}
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {job.filters.skills?.map((skill: string) => (<Badge key={skill} variant="secondary" className="text-xs py-0.5 px-2">{skill}</Badge>))}
                    {job.filters.locations?.map((loc: string) => (<Badge key={loc} variant="outline" className="text-xs py-0.5 px-2 border-blue-500/50 text-blue-500 bg-blue-500/10">{loc}</Badge>))}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      <DialogFooter className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>
);

// SavedSearchesModal Component
interface SavedSearchesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savedSearches: any[];
  handleApplySavedSearch: (filters: any) => void;
  handleDeleteSavedSearch: (searchId: string) => void;
}

const SavedSearchesModal: React.FC<SavedSearchesModalProps> = ({ isOpen, onOpenChange, savedSearches, handleApplySavedSearch, handleDeleteSavedSearch }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[600px] p-6 rounded-lg shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Bookmark className="h-6 w-6 text-green-500" /> My Saved Searches</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Select a saved search to apply its filters, or delete searches you no longer need.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {savedSearches.length === 0 ? (<p className="text-center text-muted-foreground py-8">No saved searches yet. Save your current filters!</p>) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {savedSearches.map((savedSearch) => (
                <Card key={savedSearch.id} className="p-4 hover:shadow-md transition-shadow border border-border">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow cursor-pointer" onClick={() => { handleApplySavedSearch(savedSearch.filters); onOpenChange(false); }}>
                      <CardTitle className="text-lg font-semibold text-primary">{savedSearch.name}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mt-1">
                        Keywords: {savedSearch.filters.keywords?.join(', ') || 'N/A'}
                        <br/>
                        Skills: {savedSearch.filters.skills?.join(', ') || 'N/A'}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {savedSearch.filters.designationInput && <Badge variant="secondary" className="text-xs py-0.5 px-2">{savedSearch.filters.designationInput}</Badge>}
                        {savedSearch.filters.minExperience && <Badge variant="secondary" className="text-xs py-0.5 px-2">{savedSearch.filters.minExperience}+ Yrs Exp</Badge>}
                        {savedSearch.filters.locations?.map((loc: string) => (<Badge key={loc} variant="outline" className="text-xs py-0.5 px-2 border-green-500/50 text-green-500 bg-green-500/10">{loc}</Badge>))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 ml-2 shrink-0" onClick={(e) => { e.stopPropagation(); handleDeleteSavedSearch(savedSearch.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      <DialogFooter className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>
);

// MyWatchlistModal Component
interface MyWatchlistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  watchlistCandidates: Candidate[];
  handleRemoveFromWatchlist: (candidateId: string) => void;
}

const MyWatchlistModal: React.FC<MyWatchlistModalProps> = ({ isOpen, onOpenChange, watchlistCandidates, handleRemoveFromWatchlist }) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[800px] p-6 rounded-lg shadow-xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2"><BookmarkPlus className="h-6 w-6 text-primary" /> My Watchlist ({watchlistCandidates.length})</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Candidates you've added to your watchlist for future reference.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {watchlistCandidates.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-lg font-semibold">Your watchlist is empty.</p>
            <p className="text-sm">Select candidates from the search results to add them here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {watchlistCandidates.map((candidate) => (
                <Card key={candidate.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-border rounded-lg shadow-sm">
                  <div className="flex items-start sm:items-center flex-grow">
                    <img src={candidate.profileImageUrl} alt={candidate.name} className="w-14 h-14 rounded-full mr-4 object-cover border border-gray-200 shadow-sm shrink-0" />
                    <div className="flex-grow">
                      <CardTitle className="text-lg font-semibold text-primary">{candidate.name} <span className="text-gray-500">{candidate.gender && `(${candidate.gender})`}</span></CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" /> {candidate.location}
                              <span className="ml-2 font-medium text-gray-800">
                                  {candidate.designation} {candidate.department && `(${candidate.department})`}
                              </span>
                              {candidate.company && <span className="text-blue-600 font-bold"> @ {candidate.company}</span>}
                          </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4 text-muted-foreground" /><span>{candidate.qualifications.join(', ')}</span></span>
                            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{candidate.experience} Years Exp</span></span>
                            <span className="flex items-center gap-1"><span className="text-muted-foreground text-md">₹</span><span>{candidate.salaryLPA} LPA</span></span>
                            <span className="flex items-center gap-1"><Building className="h-4 w-4 text-muted-foreground" /><span>{candidate.industry} ({candidate.industry})</span></span>
                      </div>
                      {candidate.preferredLocations.length > 0 && (
                          <div className="mt-2 text-sm text-gray-700 flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>Preferred: {highlightText(candidate.preferredLocations.join(', '), [])}</span>
                          </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">{candidate.skills.map(skill => (<Badge key={skill} variant="secondary" className="text-xs py-0.5 px-2">{skill}</Badge>))}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 mt-4 sm:mt-0 sm:ml-4 shrink-0" onClick={() => handleRemoveFromWatchlist(candidate.id)} aria-label="Remove from watchlist">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      <DialogFooter className="flex justify-end">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);


export default function CandidateSearchUITestPage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [activeView, setActiveView] = useState<'search' | 'details'>('search');
  const [selectedCandidateDetailId, setSelectedCandidateDetailId] = useState<string | null>(null);

  const [currentKeywordInput, setCurrentKeywordInput] = useState(''); const [keywords, setKeywords] = useState<string[]>([]); const keywordInputRef = useRef<HTMLInputElement>(null);
  const [currentExcludeKeywordInput, setCurrentExcludeKeywordInput] = useState(''); const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]); const excludeKeywordInputRef = useRef<HTMLInputElement>(null);
  const [isEmploymentDetailsOpen, setIsEmploymentDetailsOpen] = useState(false); const [designationInput, setDesignationInput] = useState(''); const [includePreviousDesignations, setIncludePreviousDesignations] = useState(false);
  const [currentIncludeCompanyInput, setCurrentIncludeCompanyInput] = useState(''); const [includedCompanies, setIncludedCompanies] = useState<string[]>([]); const includeCompanyInputRef = useRef<HTMLInputElement>(null);
  const [currentExcludeCompanyInput, setCurrentExcludeCompanyInput] = useState(''); const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]); const excludeCompanyInputRef = useRef<HTMLInputElement>(null);
  const [currentSkillInput, setCurrentSkillInput] = useState(''); const [skills, setSkills] = useState<string[]>([]); const skillInputRef = useRef<HTMLInputElement>(null);
  const [currentLocationInput, setCurrentLocationInput] = useState(''); const [locations, setLocations] = useState<string[]>([]); const locationInputRef = useRef<HTMLInputElement>(null);
  const [includeRelocatingCandidates, setIncludeRelocatingCandidates] = useState(false);
  const [industryInput, setIndustryInput] = useState(''); const [selectedIndustryType, setSelectedIndustryType] = useState(industryTypeOptions[0]);
  const [minExperience, setMinExperience] = useState(''); const [maxExperience, setMaxExperience] = useState('');
  const [minSalary, setMinSalary] = useState(''); const [maxSalary] = useState('');
  const [isAdditionalParametersOpen, setIsAdditionalParametersOpen] = useState(false);
  const [currentQualificationInput, setCurrentQualificationInput] = useState(''); const [qualifications, setQualifications] = useState<string[]>([]); const qualificationInputRef = useRef<HTMLInputElement>(null);
  const [selectedGender, setSelectedGender] = useState(genderOptions[0]);
  const [minAge, setMinAge] = useState(''); const [maxAge, setMaxAge] = useState('');
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false); const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [isGeneratingFilters, setIsGeneratingFilters] = useState(false); const [llmGenerationError, setLlmGenerationError] = useState<string | null>(null);
  const [isPostedJobsModalOpen, setIsPostedJobsModalOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]); const [isSavedSearchesModalOpen, setIsSavedSearchesModalOpen] = useState(false);
  const [totalResultsCount, setTotalResultsCount] = useState<number>(0);
  const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [displayedCandidates, setDisplayedCandidates] = useState<Candidate[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [hasUserInitiatedSearch, setHasUserInitiatedSearch] = useState(false);
  const [watchlistCandidates, setWatchlistCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isMyWatchlistModalOpen, setIsMyWatchlistModalOpen] = useState(false);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [currentUserId] = useState(1); // TODO: Get from auth context

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthentication = () => {
      // Check if user is authenticated (you can modify this logic based on your auth implementation)
      const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';

      if (!isLoggedIn) {
        setIsAuthModalOpen(true);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, []);

  // Handle auth modal close and redirect
  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false);
    // Redirect to home or login page
    window.location.href = '/';
  }, []);

  // Load data from APIs on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load saved searches
        const savedSearchesResponse = await fetch(`/api/saved-searches?userId=${currentUserId}`);
        if (savedSearchesResponse.ok) {
          const { savedSearches: loadedSearches } = await savedSearchesResponse.json();
          setSavedSearches(loadedSearches);
        }

        // Load posted jobs
        const postedJobsResponse = await fetch(`/api/employer/posted-jobs?employerUserId=${currentUserId}`);
        if (postedJobsResponse.ok) {
          const { jobs } = await postedJobsResponse.json();
          setPostedJobs(jobs);
        }

        // Load watchlist
        const watchlistResponse = await fetch(`/api/watchlist?employerUserId=${currentUserId}`);
        if (watchlistResponse.ok) {
          const { candidates } = await watchlistResponse.json();
          setWatchlistCandidates(candidates);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [currentUserId]);

  const areFiltersActive = useCallback(() => (
    keywords.length > 0 || excludedKeywords.length > 0 || designationInput.trim() !== '' ||
    includedCompanies.length > 0 || excludedCompanies.length > 0 || skills.length > 0 ||
    locations.length > 0 || minExperience.trim() !== '' || maxExperience.trim() !== '' ||
    minSalary.trim() !== '' || maxSalary.trim() !== '' || qualifications.length > 0 ||
    selectedIndustryType !== industryTypeOptions[0] || selectedGender !== genderOptions[0] ||
    minAge.trim() !== '' || maxAge.trim() !== '' || industryInput.trim() !== ''
  ), [keywords, excludedKeywords, designationInput, includedCompanies, excludedCompanies, skills, locations, minExperience, maxExperience, minSalary, maxSalary, qualifications, selectedIndustryType, selectedGender, minAge, maxAge, industryInput]);

  const getCurrentFilters = useCallback(() => ({
    keywords,
    excludedKeywords,
    designationInput,
    includedCompanies,
    excludedCompanies,
    skills,
    locations,
    includeRelocatingCandidates,
    minExperience,
    maxExperience,
    minSalary,
    maxSalary,
    qualifications,
    selectedGender,
    minAge,
    maxAge,
    industryInput,
    selectedIndustryType
  }), [keywords, excludedKeywords, designationInput, includedCompanies, excludedCompanies, skills, locations, includeRelocatingCandidates, minExperience, maxExperience, minSalary, maxSalary, qualifications, selectedGender, minAge, maxAge, industryInput, selectedIndustryType]);

  const handleSearchCandidates = useCallback(async () => {
    setHasUserInitiatedSearch(true);
    setCurrentPage(1);
    setSelectedCandidateIds([]);

    if (!areFiltersActive()) {
        setDisplayedCandidates([]);
        setTotalResultsCount(0);
        setCandidatesError(null);
        setCandidatesLoading(false);
        return;
    }

    setCandidatesLoading(true);
    setCandidatesError(null);

    try {
        const filters = getCurrentFilters();
        const result = await fetchCandidates(filters, 1, itemsPerPage);
        setTotalResultsCount(result.totalCount);
        setDisplayedCandidates(result.candidates);
    } catch (error: any) {
        console.error("Error fetching candidates:", error);
        setCandidatesError("Failed to load candidates from database.");
        setDisplayedCandidates([]);
        setTotalResultsCount(0);
    } finally {
        setCandidatesLoading(false);
    }
  }, [areFiltersActive, getCurrentFilters, itemsPerPage]);

  useEffect(() => {
    if (hasUserInitiatedSearch && areFiltersActive()) {
      setCandidatesLoading(true);
      setCandidatesError(null);

      const loadPage = async () => {
        try {
          const filters = getCurrentFilters();
          const result = await fetchCandidates(filters, currentPage, itemsPerPage);
          setDisplayedCandidates(result.candidates);
        } catch (error: any) {
          console.error("Error fetching candidates for pagination:", error);
          setCandidatesError("Failed to load more candidates.");
          setDisplayedCandidates([]);
        } finally {
          setCandidatesLoading(false);
        }
      };

      const timer = setTimeout(loadPage, 300);
      return () => clearTimeout(timer);
    }
  }, [currentPage, hasUserInitiatedSearch, areFiltersActive, getCurrentFilters, itemsPerPage]);


  const totalPages = totalResultsCount > 0 ? Math.ceil(totalResultsCount / itemsPerPage) : 0;
  const handleNextPage = useCallback(() => { if (currentPage < totalPages) setCurrentPage(prevPage => prevPage + 1); }, [currentPage, totalPages]);
  const handlePrevPage = useCallback(() => { if (currentPage > 1) setCurrentPage(prevPage => prevPage - 1); }, [currentPage]);

  const handleResetFilters = useCallback(() => {
    setCurrentKeywordInput(''); setKeywords([]); setCurrentExcludeKeywordInput(''); setExcludedKeywords([]);
    setDesignationInput(''); setIncludePreviousDesignations(false); setCurrentIncludeCompanyInput(''); setIncludedCompanies([]);
    setCurrentExcludeCompanyInput(''); setExcludedCompanies([]); setCurrentSkillInput(''); setSkills([]);
    setCurrentLocationInput(''); setLocations([]); setIncludeRelocatingCandidates(false); setIndustryInput('');
    setSelectedIndustryType(industryTypeOptions[0]); setMinExperience(''); setMaxExperience(''); setMinSalary('');
    setMaxSalary(''); setIsEmploymentDetailsOpen(false); setIsAdditionalParametersOpen(false); setCurrentQualificationInput('');
    setQualifications([]); setSelectedGender(genderOptions[0]); setMinAge(''); setMaxAge('');
    setTotalResultsCount(0);
    setCandidatesError(null);
    setDisplayedCandidates([]);
    setCurrentPage(1);
    setHasUserInitiatedSearch(false);
    setSelectedCandidateIds([]);
  }, []);

  const handleFilterByPostedJob = useCallback((jobFilters: any) => {
    setKeywords(jobFilters.keywords || []); setSkills(jobFilters.skills || []); setDesignationInput(jobFilters.designation || '');
    setMinExperience(jobFilters.minExperience || ''); setMaxExperience(jobFilters.maxExperience || '');
    setLocations(jobFilters.locations || []); setMinSalary(jobFilters.minSalaryLPA ? String(jobFilters.minSalaryLPA) : '');
    setMaxSalary(jobFilters.maxSalaryLPA ? String(jobFilters.maxSalaryLPA) : '');
    setQualifications(jobFilters.qualifications || []); setIndustryInput(jobFilters.industry || '');
    setIsPostedJobsModalOpen(false);
    setTimeout(() => handleSearchCandidates(), 100);
  }, [handleSearchCandidates]);

  const handleSaveSearch = useCallback(async () => {
    const searchName = prompt("Enter a name for this saved search:");
    if (!searchName?.trim()) return;

    const currentFilters = {keywords, excludedKeywords, designationInput, includePreviousDesignations, includedCompanies, excludedCompanies, skills, locations, includeRelocatingCandidates, industryInput, selectedIndustryType, minExperience, maxExperience, minSalary, maxSalary, qualifications, selectedGender, minAge, maxAge};

    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: searchName.trim(),
          filters: currentFilters
        })
      });

      if (response.ok) {
        const { savedSearch } = await response.json();
        setSavedSearches(prev => [...prev, savedSearch]);
        alert("Search saved successfully!");
      } else {
        alert("Failed to save search. Please try again.");
      }
    } catch (error) {
      console.error("Error saving search:", error);
      alert("Failed to save search. Please try again.");
    }
  }, [keywords, excludedKeywords, designationInput, includePreviousDesignations, includedCompanies, excludedCompanies, skills, locations, includeRelocatingCandidates, industryInput, selectedIndustryType, minExperience, maxExperience, minSalary, maxSalary, qualifications, selectedGender, minAge, maxAge, currentUserId]);

  const handleApplySavedSearch = useCallback((savedFilterSet: any) => {
    setKeywords(savedFilterSet.keywords || []); setExcludedKeywords(savedFilterSet.excludedKeywords || []);
    setDesignationInput(savedFilterSet.designationInput || ''); setIncludePreviousDesignations(savedFilterSet.includePreviousDesignations || false);
    setIncludedCompanies(savedFilterSet.includedCompanies || []); setExcludedCompanies(savedFilterSet.excludedCompanies || []);
    setSkills(savedFilterSet.skills || []); setLocations(savedFilterSet.locations || []);
    setIncludeRelocatingCandidates(savedFilterSet.includeRelocatingCandidates || false); setIndustryInput(savedFilterSet.industryInput || '');
    setSelectedIndustryType(savedFilterSet.selectedIndustryType || industryTypeOptions[0]); setMinExperience(savedFilterSet.minExperience || '');
    setMaxExperience(savedFilterSet.maxExperience || ''); setMinSalary(savedFilterSet.minSalary || '');
    setMaxSalary(savedFilterSet.maxSalary || ''); setQualifications(savedFilterSet.qualifications || []);
    setSelectedGender(savedFilterSet.selectedGender || genderOptions[0]); setMinAge(savedFilterSet.minAge || '');
    setMaxAge(savedFilterSet.maxAge || '');
    setIsSavedSearchesModalOpen(false);
    setTimeout(() => handleSearchCandidates(), 100);
  }, [handleSearchCandidates]);

  const handleDeleteSavedSearch = useCallback(async (searchId: string) => {
    if (!confirm("Are you sure you want to delete this saved search?")) return;

    try {
      const response = await fetch(`/api/saved-searches?id=${searchId}&userId=${currentUserId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSavedSearches(prev => prev.filter(search => search.id !== searchId));
        alert("Saved search deleted successfully!");
      } else {
        alert("Failed to delete saved search.");
      }
    } catch (error) {
      console.error("Error deleting saved search:", error);
      alert("Failed to delete saved search.");
    }
  }, [currentUserId]);

  const handleGenerateFiltersFromJD = useCallback(async () => {
    if (!jobDescriptionText.trim()) { setLlmGenerationError("Please paste a job description to generate filters."); return; }
    setIsGeneratingFilters(true); setLlmGenerationError(null);
    const prompt = `Analyze the following job description and extract the following information. Return the information as a JSON object strictly following this schema. If a piece of information is not explicitly mentioned or clearly inferable, set its value to null or an empty array as appropriate. Job Description: "${jobDescriptionText}" Schema: {"keywords": ["string"], "skills": ["string"], "designation": "string", "minExperience": "integer", "maxExperience": "integer", "minSalaryLPA": "number", "maxSalaryLPA": "number", "qualifications": ["string"], "industry": "string"} Example output for salary: if "150,000 - 200,000 USD/year" convert to LPA (approx 12-16 LPA), if "20 LPA", then minSalaryLPA: 20, maxSalaryLPA: 20. If salary is not specified, use null for both. Do not include any other text or formatting outside the JSON.`;
    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {"keywords": { "type": "ARRAY", "items": { "type": "STRING" } },"skills": { "type": "ARRAY", "items": { "type": "STRING" } },"designation": { "type": "STRING", "nullable": true },"minExperience": { "type": "INTEGER", "nullable": true },"maxExperience": { "type": "INTEGER", "nullable": true },"minSalaryLPA": { "type": "NUMBER", "nullable": true },"maxSalaryLPA": { "type": "NUMBER", "nullable": true },"qualifications": { "type": "ARRAY", "items": { "type": "STRING" } },"industry": { "type": "STRING", "nullable": true }},
            propertyOrdering: ["keywords", "skills", "designation", "minExperience", "maxExperience", "minSalaryLPA", "maxSalaryLPA", "qualifications", "industry"]
          }
        }
      };
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`); }
      const result = await response.json();
      const generatedData = JSON.parse(result.candidates[0].content.parts[0].text);

      if (generatedData.keywords) setKeywords(generatedData.keywords.slice(0, 15));
      if (generatedData.skills) setSkills(generatedData.skills.slice(0, 15));
      if (generatedData.designation) setDesignationInput(generatedData.designation);
      if (generatedData.minExperience !== null) setMinExperience(String(generatedData.minExperience));
      if (generatedData.maxExperience !== null) setMaxExperience(String(generatedData.maxExperience));
      if (generatedData.minSalaryLPA !== null) setMinSalary(String(generatedData.minSalaryLPA));
      if (generatedData.maxSalaryLPA !== null) setMaxSalary(String(generatedData.maxSalaryLPA));
      if (generatedData.qualifications) setQualifications(generatedData.qualifications.slice(0, 5));
      if (generatedData.industry) setIndustryInput(generatedData.industry);

      setIsJobDescriptionModalOpen(false); setJobDescriptionText(''); setLlmGenerationError(null);
      handleSearchCandidates();
    } catch (error: any) {
      console.error("Error generating filters:", error);
      setLlmGenerationError(`Failed to generate filters: ${error.message || 'Please try again.'}`);
    } finally { setIsGeneratingFilters(false); }
  }, [jobDescriptionText, keywords, skills, qualifications, handleSearchCandidates]);

  const handleAddSelectedToWatchlist = useCallback(() => {
    if (selectedCandidateIds.length === 0) {
      alert("Please select at least one candidate to add to watchlist.");
      return;
    }
    const candidatesToAdd = displayedCandidates.filter(candidate => selectedCandidateIds.includes(candidate.id));
    setWatchlistCandidates(prev => {
      const newWatchlist = [...prev];
      let addedCount = 0;
      candidatesToAdd.forEach(candidate => {
        if (!newWatchlist.some(c => c.id === candidate.id)) {
          newWatchlist.push(candidate);
          addedCount++;
        }
      });
      if (addedCount > 0) {
        alert(`${addedCount} candidate(s) added to watchlist.`);
      } else {
        alert("All selected candidates are already in your watchlist.");
      }
      return newWatchlist;
    });
    setSelectedCandidateIds([]);
  }, [selectedCandidateIds, displayedCandidates]);

  const handleAddSingleToWatchlist = useCallback(async (candidate: Candidate) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerUserId: currentUserId,
          candidateId: candidate.id
        })
      });

      if (response.ok) {
        setWatchlistCandidates(prev => [...prev, candidate]);
        alert(`${candidate.name} added to watchlist.`);
      } else if (response.status === 409) {
        alert(`${candidate.name} is already in your watchlist.`);
      } else {
        alert("Failed to add candidate to watchlist.");
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      alert("Failed to add candidate to watchlist.");
    }
  }, [currentUserId]);

  const handleRemoveFromWatchlist = useCallback(async (candidateId: string) => {
    try {
      const response = await fetch(`/api/watchlist?employerUserId=${currentUserId}&candidateId=${candidateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setWatchlistCandidates(prev => prev.filter(candidate => candidate.id !== candidateId));
        alert("Candidate removed from watchlist.");
      } else {
        alert("Failed to remove candidate from watchlist.");
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      alert("Failed to remove candidate from watchlist.");
    }
  }, [currentUserId]);

  const handleSelectCandidate = useCallback((candidateId: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  }, []);

  const handleViewDetails = useCallback((candidateId: string) => {
    setSelectedCandidateDetailId(candidateId);
    setActiveView('details');
  }, []);

  const handleBackToSearch = useCallback(() => {
    setActiveView('search');
    setSelectedCandidateDetailId(null);
  }, []);


  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary mb-4">Authentication Required</h1>
            <p className="text-muted-foreground">Please log in to access the candidate search feature.</p>
          </div>
        </div>
        <AuthRequiredModal
          isOpen={isAuthModalOpen}
          onCloseAndGoBack={handleAuthModalClose}
          userRole="employer"
        />
      </>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground font-inter">
        <Card className="shadow-xl border-border rounded-xl overflow-hidden">
          <MainHeader
            totalResultsCount={totalResultsCount}
            setIsMyWatchlistModalOpen={setIsMyWatchlistModalOpen}
            setIsSavedSearchesModalOpen={setIsSavedSearchesModalOpen}
            setIsPostedJobsModalOpen={setIsPostedJobsModalOpen}
            setIsJobDescriptionModalOpen={setIsJobDescriptionModalOpen}
          />

          <CardContent className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
            {activeView === 'search' ? (
              <>
                <Card className="md:col-span-1 bg-card border-border shadow-md rounded-lg p-0 flex flex-col">
                  <CardHeader className="p-4 border-b border-border bg-secondary/30 shrink-0">
                    <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5" /> Filter Candidates
                    </CardTitle>
                  </CardHeader>
                  <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full md:max-h-[calc(100vh-250px)] [&::-webkit-scrollbar]:!w-2 [&::-webkit-scrollbar-track]:!bg-transparent [&::-webkit-scrollbar-thumb]:!bg-gray-700 [&::-webkit-scrollbar-thumb]:!rounded-full">
                      <CardContent className="p-4 space-y-5">
                        <AddRemoveTagsInput label="Search Keywords" placeholder="e.g., Java, Project Manager" currentInputValue={currentKeywordInput} setCurrentInputValue={setCurrentKeywordInput} items={keywords} setItems={setKeywords} maxItems={15} inputRef={keywordInputRef} />
                        <AddRemoveTagsInput label="Exclude Keywords" placeholder="e.g., Junior, Intern" currentInputValue={currentExcludeKeywordInput} setCurrentInputValue={currentExcludeKeywordInput} items={excludedKeywords} setItems={setExcludedKeywords} maxItems={10} badgeVariant="destructive" inputRef={excludeKeywordInputRef} />
                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
                          <div className="w-full sm:w-1/2">
                            <Label htmlFor="industry-input" className="text-sm font-medium text-foreground">Industry</Label>
                            <Input id="industry-input" placeholder="e.g., E-commerce, SaaS" className="h-9 text-sm mt-1" value={industryInput} onChange={(e) => setIndustryInput(e.target.value)} />
                          </div>
                          <div className="w-full sm:w-1/2">
                            <Label htmlFor="industry-type" className="text-sm font-medium text-foreground">Industry Type</Label>
                            <Select value={selectedIndustryType} onValueChange={setSelectedIndustryType}>
                              <SelectTrigger id="industry-type" className="h-9 text-sm mt-1">
                                <SelectValue placeholder="Select industry type" />
                              </SelectTrigger>
                              <SelectContent>
                                {industryTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Separator />
                        <AddRemoveTagsInput label="Skills" placeholder="e.g., Python, React" currentInputValue={currentSkillInput} setCurrentInputValue={setCurrentSkillInput} items={skills} setItems={setSkills} maxItems={15} inputRef={skillInputRef} />
                        <Separator />
                        <div>
                          <AddRemoveTagsInput label="Current Locations" placeholder="City, State or Remote" currentInputValue={currentLocationInput} setCurrentInputValue={setCurrentLocationInput} items={locations} setItems={setLocations} maxItems={5} inputRef={locationInputRef} />
                          <div className="flex items-center space-x-2 mt-2.5">
                            <Checkbox id="include-relocating" checked={includeRelocatingCandidates} onCheckedChange={(checked) => setIncludeRelocatingCandidates(!!checked)} />
                            <Label htmlFor="include-relocating" className="text-xs font-normal text-muted-foreground cursor-pointer">Include candidates who prefer to relocate to above locations</Label>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium text-foreground">Experience (Years)</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input id="min-exp" type="number" placeholder="Min" className="h-9 text-sm" aria-label="Minimum experience in years" value={minExperience} onChange={(e) => setMinExperience(e.target.value)} />
                            <span className="text-muted-foreground">-</span>
                            <Input id="max-exp" type="number" placeholder="Max" className="h-9 text-sm" aria-label="Maximum experience in years" value={maxExperience} onChange={(e) => setMaxExperience(e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground flex items-center gap-1">Salary</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input id="min-salary" type="number" placeholder="Min (LPA)" className="h-9 text-sm" aria-label="Minimum annual salary in lakhs per annum" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} />
                            <span className="text-muted-foreground">-</span>
                            <Input id="max-salary" type="number" placeholder="Max (LPA)" className="h-9 text-sm" aria-label="Maximum annual salary in lakhs per annum" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} />
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Button variant="ghost" onClick={() => setIsEmploymentDetailsOpen(!isEmploymentDetailsOpen)} className="w-full justify-between px-1 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50">
                            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" /> Employment Details</span>
                            {isEmploymentDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          {isEmploymentDetailsOpen && (
                            <div className="mt-2 pl-2 border-l-2 border-muted space-y-4 py-2">
                              <div>
                                <Label htmlFor="designation-input" className="text-xs font-medium text-foreground">Designation</Label>
                                <Input id="designation-input" placeholder="e.g., Software Engineer" value={designationInput} onChange={(e) => setDesignationInput(e.target.value)} className="h-9 text-sm mt-1" />
                                <div className="flex items-center space-x-2 mt-1.5">
                                  <Checkbox id="include-previous-designations" checked={includePreviousDesignations} onCheckedChange={(checked) => setIncludePreviousDesignations(!!checked)} />
                                  <Label htmlFor="include-previous-designations" className="text-xs font-normal text-muted-foreground cursor-pointer">Include Previous Designations</Label>
                                </div>
                              </div>
                              <AddRemoveTagsInput label="Include Companies" placeholder="Company name" currentInputValue={currentIncludeCompanyInput} setCurrentInputValue={setCurrentIncludeCompanyInput} items={includedCompanies} setItems={setIncludedCompanies} maxItems={5} inputRef={includeCompanyInputRef} tooltipPlacement="top" />
                              <AddRemoveTagsInput label="Exclude Companies" placeholder="Company name" currentInputValue={currentExcludeCompanyInput} setCurrentInputValue={setCurrentExcludeCompanyInput} items={excludedCompanies} setItems={setExcludedCompanies} maxItems={5} badgeVariant="destructive" inputRef={excludeCompanyInputRef} tooltipPlacement="top" />
                            </div>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <Button variant="ghost" onClick={() => setIsAdditionalParametersOpen(!isAdditionalParametersOpen)} className="w-full justify-between px-1 py-1.5 text-sm font-medium text-foreground hover:bg-muted/50">
                            <span className="flex items-center gap-1"><Gavel className="h-4 w-4 text-muted-foreground" /> Additional Parameters</span>
                            {isAdditionalParametersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          {isAdditionalParametersOpen && (
                            <div className="mt-2 pl-2 border-l-2 border-muted space-y-4 py-2">
                              <AddRemoveTagsInput label="Qualifications" placeholder="e.g., MBA, B.Tech, PhD" currentInputValue={currentQualificationInput} setCurrentInputValue={setCurrentQualificationInput} items={qualifications} setItems={setQualifications} maxItems={5} inputRef={qualificationInputRef} />
                              <div>
                                <Label htmlFor="gender-select" className="text-xs font-medium text-foreground">Gender</Label>
                                <Select value={selectedGender} onValueChange={setSelectedGender}>
                                  <SelectTrigger id="gender-select" className="h-9 text-sm mt-1">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {genderOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-foreground">Age (Years)</Label>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input id="min-age" type="number" placeholder="Min" className="h-9 text-sm" aria-label="Minimum age" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                                  <span className="text-muted-foreground">-</span>
                                  <Input id="max-age" type="number" placeholder="Max" className="h-9 text-sm" aria-label="Maximum age" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </ScrollArea>
                  </div>
                  <div className="p-4 border-t border-border bg-secondary/30 flex justify-end gap-3 shrink-0">
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={handleResetFilters} className="h-9 w-9 shrink-0"><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="top"><p>Reset Filters</p></TooltipContent></Tooltip>
                    <Button onClick={handleSaveSearch} className="flex items-center gap-2"><Save className="h-4 w-4" /> Save</Button>
                    <Button onClick={handleSearchCandidates} className="flex items-center gap-2" disabled={!areFiltersActive() && hasUserInitiatedSearch}><SearchIcon className="h-4 w-4" /> Search</Button>
                  </div>
                </Card>

                <Card className="md:col-span-3 bg-card border-border shadow-md rounded-lg flex flex-col">
                  <CardHeader className="p-4 border-b border-border bg-secondary/30 shrink-0 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        {hasUserInitiatedSearch && displayedCandidates.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" className="text-primary hover:bg-secondary/50 transition-all duration-200 ease-in-out" onClick={handleAddSelectedToWatchlist}>
                                  <BookmarkPlus className="h-5 w-5 mr-1" /> Add to Watchlist
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Add selected candidates to watchlist</p></TooltipContent>
                          </Tooltip>
                        )}

                        {(!hasUserInitiatedSearch || (totalResultsCount === 0 && !candidatesLoading && hasUserInitiatedSearch)) && (
                            <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
                                <Users className="h-5 w-5" /> Candidate Search Results
                            </CardTitle>
                        )}
                    </div>

                    {hasUserInitiatedSearch && (displayedCandidates.length > 0 || candidatesLoading) && (
                        <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1 || candidatesLoading} className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages || candidatesLoading} className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    )}
                  </CardHeader>
                  <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full md:max-h-[calc(100vh-250px)]">
                      <CardContent className="p-4">
                        {candidatesLoading ? (
                          <div className="space-y-4">
                            {[...Array(itemsPerPage)].map((_, index) => (
                              <Card key={index} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between border border-border rounded-lg shadow-sm animate-pulse">
                                <div className="flex-grow space-y-2">
                                  <div className="h-6 bg-gray-200 rounded w-3/4"></div> <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                  <div className="flex gap-2"><div className="h-4 bg-gray-200 rounded w-1/4"></div> <div className="h-4 bg-gray-200 rounded w-1/4"></div></div>
                                  <div className="flex flex-wrap gap-1 mt-2"><div className="h-5 bg-gray-200 rounded-full w-16"></div> <div className="h-5 bg-gray-200 rounded-full w-20"></div> <div className="h-5 bg-gray-200 rounded-full w-12"></div></div>
                                </div>
                                <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0"><div className="h-9 w-24 bg-gray-200 rounded"></div></div>
                              </Card>
                            ))}
                          </div>
                        ) : candidatesError ? (
                          <div className="text-center text-destructive py-8">
                            <p className="text-lg font-semibold">Error loading candidates:</p>
                            <p>{candidatesError}</p>
                          </div>
                        ) : displayedCandidates.length > 0 ? (
                          <div className="space-y-4">
                            {displayedCandidates.map((candidate) => (
                              <Card key={candidate.id} className="p-4 flex flex-col border border-border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200">
                                  <div className="flex items-start">
                                      <div className="flex items-center h-full mr-4 mt-2">
                                          <Checkbox
                                              id={`select-${candidate.id}`}
                                              checked={selectedCandidateIds.includes(candidate.id)}
                                              onCheckedChange={() => handleSelectCandidate(candidate.id)}
                                              aria-label={`Select candidate ${candidate.name}`}
                                              className="shrink-0"
                                          />
                                      </div>
                                      <div className="flex-grow">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full mb-4">
                                              <div className="flex items-center mb-2 sm:mb-0">
                                                  <img src={candidate.profileImageUrl} alt={candidate.name} className="w-14 h-14 rounded-full mr-4 object-cover border border-gray-200 shadow-sm" />
                                                  <div>
                                                      <div className="flex items-baseline gap-1">
                                                          <CardTitle className="text-lg font-semibold text-primary cursor-pointer hover:underline" onClick={() => handleViewDetails(candidate.id)}>
                                                              {highlightText(candidate.name, keywords)}
                                                          </CardTitle>
                                                          <span className="text-sm text-muted-foreground font-normal">
                                                              {candidate.gender && `(${candidate.gender})`}
                                                          </span>
                                                      </div>
                                                      <div className="text-sm text-muted-foreground mt-1">
                                                          <span className="flex items-center gap-1">
                                                              <MapPin className="h-4 w-4 text-muted-foreground" /> {highlightText(candidate.location, locations)}
                                                              <span className="ml-2 font-medium text-gray-800">
                                                                  {highlightText(candidate.designation, [designationInput, ...keywords])} {candidate.department && `(${candidate.department})`}
                                                              </span>
                                                              {candidate.company && <span className="text-blue-600 font-bold"> @ {highlightText(candidate.company, includedCompanies)}</span>}
                                                          </span>
                                                      </div>
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-1.5 sm:ml-auto">
                                                  <Tooltip>
                                                      <TooltipTrigger asChild>
                                                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" onClick={() => handleAddSingleToWatchlist(candidate)} aria-label="Add to watchlist">
                                                              <BookmarkPlus className="h-4 w-4" />
                                                          </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent><p>Add to Watchlist</p></TooltipContent>
                                                  </Tooltip>
                                                  {candidate.phone && (
                                                      <Popover>
                                                          <PopoverTrigger asChild>
                                                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" aria-label={`Show phone number for ${candidate.name}`}>
                                                                  <Phone className="h-4 w-4" />
                                                              </Button>
                                                          </PopoverTrigger>

                                                          <PopoverContent className="w-auto p-2 flex flex-col items-start gap-1">
                                                              <span className="text-sm font-medium">{candidate.phone}</span>
                                                              <div className="flex gap-2 mt-1">
                                                                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => handleCopyToClipboard(candidate.phone)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                                                                  <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Call</a>
                                                              </div>
                                                          </PopoverContent>
                                                      </Popover>
                                                  )}
                                                  {candidate.email && (
                                                      <Popover>
                                                          <PopoverTrigger asChild>
                                                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary" aria-label={`Show email address for ${candidate.name}`}>
                                                                  <Mail className="h-4 w-4" />
                                                              </Button>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-auto p-2 flex flex-col items-start gap-1">
                                                              <span className="text-sm font-medium">{candidate.email}</span>
                                                              <div className="flex gap-2 mt-1">
                                                                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => handleCopyToClipboard(candidate.email)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                                                                  <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Mail</a>
                                                              </div>
                                                          </PopoverContent>
                                                      </Popover>
                                                  )}
                                              </div>
                                          </div>
                                          <div className="w-full">
                                              <div className="mt-2 text-sm text-gray-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                  <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4 text-muted-foreground" /><span>{highlightText(candidate.qualifications.join(', '), qualifications)}</span></span>
                                                  <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{candidate.experience} Years Experience</span></span>
                                                  <span className="flex items-center gap-1"><span className="text-muted-foreground text-md">₹</span><span>{candidate.salaryLPA} LPA</span></span>
                                                  <span className="flex items-center gap-1"><Building className="h-4 w-4 text-muted-foreground" /><span>{highlightText(candidate.industry, [industryInput, selectedIndustryType])} ({selectedIndustryType})</span></span>
                                              </div>
                                              {candidate.preferredLocations.length > 0 && (
                                                  <div className="mt-2 text-sm text-gray-700 flex items-center gap-1">
                                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                                      <span>Preferred: {highlightText(candidate.preferredLocations.join(', '), locations)}</span>
                                                  </div>
                                              )}
                                              <div className="mt-3 flex flex-wrap gap-1.5">
                                                  {candidate.skills.map(skill => (<Badge key={skill} variant="secondary" className="text-xs py-0.5 px-2">{highlightText(skill, skills)}</Badge>))}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </Card>
                            ))}
                          </div>
                        ) : (hasUserInitiatedSearch && totalResultsCount === 0) ? (
                          <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[200px] bg-secondary/10 rounded-lg m-4 border border-dashed border-muted-foreground/30">
                            <SearchIcon className="h-20 w-20 text-muted-foreground/40 mb-6" />
                            <p className="text-xl font-bold text-primary mb-2">No candidates found.</p>
                            <p className="text-sm text-muted-foreground max-w-sm">Try adjusting your filters for a broader search.</p>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[200px] bg-secondary/10 rounded-lg m-4 border border-dashed border-muted-foreground/30">
                            <SearchIcon className="h-20 w-20 text-muted-foreground/40 mb-6" />
                            <p className="text-xl font-bold text-primary mb-2">Ready to find talent?</p>
                            <p className="text-sm text-muted-foreground max-w-sm">Apply filters on the left or use AI to streamline your search and discover the perfect candidates.</p>
                          </div>
                        )}
                      </CardContent>
                    </ScrollArea>
                  </div>
                </Card>
              </>
            ) : (
              <div className="md:col-span-4 py-0 px-0 bg-background min-h-screen">
                <CandidateDetail
                  candidateId={selectedCandidateDetailId}
                  onBack={handleBackToSearch}
                  handleAddSingleToWatchlist={handleAddSingleToWatchlist}
                  // Pass filter states for highlighting
                  keywords={keywords}
                  designationInput={designationInput}
                  includedCompanies={includedCompanies}
                  locations={locations}
                  industryInput={industryInput}
                  selectedIndustryType={selectedIndustryType}
                  qualifications={qualifications}
                  skills={skills}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <JobDescriptionModal
        isOpen={isJobDescriptionModalOpen}
        onOpenChange={setIsJobDescriptionModalOpen}
        jobDescriptionText={jobDescriptionText}
        setJobDescriptionText={setJobDescriptionText}
        llmGenerationError={llmGenerationError}
        isGeneratingFilters={isGeneratingFilters}
        handleGenerateFiltersFromJD={handleGenerateFiltersFromJD}
      />

      <PostedJobsModal
        isOpen={isPostedJobsModalOpen}
        onOpenChange={setIsPostedJobsModalOpen}
        handleFilterByPostedJob={handleFilterByPostedJob}
        postedJobs={postedJobs}
      />

      <SavedSearchesModal
        isOpen={isSavedSearchesModalOpen}
        onOpenChange={setIsSavedSearchesModalOpen}
        savedSearches={savedSearches}
        handleApplySavedSearch={handleApplySavedSearch}
        handleDeleteSavedSearch={handleDeleteSavedSearch}
      />

      <MyWatchlistModal
        isOpen={isMyWatchlistModalOpen}
        onOpenChange={setIsMyWatchlistModalOpen}
        watchlistCandidates={watchlistCandidates}
        handleRemoveFromWatchlist={handleRemoveFromWatchlist}
      />
    </TooltipProvider>
  );
}
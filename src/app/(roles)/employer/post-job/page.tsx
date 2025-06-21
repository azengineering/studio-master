// src/app/(roles)/employer/post-job/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  JobFormDataSchema,
  type JobFormData,
  type JobPreviewData,
  type CustomQuestion,
  jobFormBaseSchema,
  initialFormValues
} from './job-schema';
import { saveJobAction, getJobById, type JobActionResponse } from './actions';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as PreviewDialogTitle, // Aliased to avoid conflict with CardTitle
  DialogDescription as PreviewDialogDescription, // Aliased
  DialogClose,
  DialogFooter as ShadDialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';

import RichTextEditor from '@/components/editor/RichTextEditor';
import type { Editor } from '@tiptap/react';

import {
  PlusCircle, Trash2, Eye, Send, Loader2, AlertTriangle, Sparkles, Bot, Tags, Briefcase, MapPin,
  Type, DollarSignIcon, UsersRound, CalendarDays, InfoIcon as InfoIconLucide, Settings2, Activity,
  HelpCircle, Wand2, X, BriefcaseBusiness, RotateCcw, FileSignature, FileText, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { generateJobDescription, type GenerateJobDescriptionInput } from '@/ai/flows/ai-job-description-helper';
import { smartJobPostParser, type SmartJobPostParserOutput, type SmartJobPostParserInput } from '@/ai/flows/ai-smart-job-post-parser';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { JobPreviewDialog } from './sections/JobPreviewDialog';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { Separator } from '@/components/ui/separator';
import { CardSection } from '@/components/ui/card-section';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { suggestSkillsForJob, type SuggestSkillsInput } from '@/ai/flows/ai-skill-suggester';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDescription as ShadcnFormDescription } from '@/components/ui/form';


const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2">Loading Job Poster...</span>
  </div>
);

interface PostJobsPageContentProps {
  userId: number;
  jobIdToEdit?: number | null;
  jobIdToCopy?: number | null;
}


const PostJobsPageContent: React.FC<PostJobsPageContentProps> = ({ userId, jobIdToEdit, jobIdToCopy }) => {
  const router = useRouter();
  const { toast } = useToast();

  const editorRef = useRef<Editor | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<JobPreviewData | null>(null);

  const [isConfirmPostOpen, setIsConfirmPostOpen] = useState(false);
  const [isPostSuccessOpen, setIsPostSuccessOpen] = useState(false);
  const [lastSavedJobId, setLastSavedJobId] = useState<number | null>(null);
  const [lastSavedJobTitle, setLastSavedJobTitle] = useState<string>('');

  const [isSmartPostDialogOpen, setIsSmartPostDialogOpen] = useState(false);
  const [smartPostRawText, setSmartPostRawText] = useState('');
  const [isSmartParsing, setIsSmartParsing] = useState(false);
  const [apiRequestsThisMinute, setApiRequestsThisMinute] = useState(0);

  const [isAiInstructionsDialogOpen, setIsAiInstructionsDialogOpen] = useState(false);
  const [aiCustomInstructions, setAiCustomInstructions] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const [currentSkill, setCurrentSkill] = useState('');
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [currentAnswerType, setCurrentAnswerType] = useState<'text' | 'yes_no'>('text');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState<string | null>(null);

  const [isSkillSuggestionDialogOpen, setIsSkillSuggestionDialogOpen] = useState(false);
  const [aiSuggestedSkills, setAiSuggestedSkills] = useState<string[]>([]);
  const [selectedAiSkills, setSelectedAiSkills] = useState<string[]>([]);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);


  const form = useForm<JobFormData>({
    resolver: zodResolver(JobFormDataSchema),
    defaultValues: initialFormValues,
    mode: 'onChange',
  });

  const { fields: skillsFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: "skillsRequired",
  });

  const { fields: questionsFields, append: appendCustomQuestion, remove: removeCustomQuestion, update: updateCustomQuestion } = useFieldArray({
    control: form.control,
    name: 'customQuestions',
  });

  const watchedIndustryType = form.watch('industryType');

  const debouncedSetJobDescription = useCallback(
    (html: string) => {
      form.setValue('jobDescription', html, { shouldValidate: true, shouldDirty: true });
    },
    [form]
  );

  const handleEditorInstance = useCallback((currentEditor: Editor | null) => {
    editorRef.current = currentEditor;
    if (currentEditor && form.getValues('jobDescription')) {
      if (currentEditor.isEmpty || form.getValues('jobDescription') !== currentEditor.getHTML()) {
        currentEditor.commands.setContent(form.getValues('jobDescription') || '', false);
      }
    }
  }, [form]);


  useEffect(() => {
    const currentEditor = editorRef.current;
    if (currentEditor && !currentEditor.isDestroyed) {
      const updateHandler = ({ editor: updatedEditor }: { editor: Editor }) => {
        debouncedSetJobDescription(updatedEditor.getHTML());
      };
      currentEditor.on('update', updateHandler);

      const formJobDescription = form.getValues('jobDescription');
      if (formJobDescription && formJobDescription !== currentEditor.getHTML()) {
        if (!currentEditor.isEmpty || formJobDescription !== '<p></p>') {
          currentEditor.commands.setContent(formJobDescription, false);
        }
      }
      return () => {
        if (currentEditor && !currentEditor.isDestroyed) {
          currentEditor.off('update', updateHandler);
        }
      };
    }
  }, [debouncedSetJobDescription, form, editorRef]);


  const clearAndSetSkills = useCallback((newSkills: string[] = []) => {
    const currentSkills = form.getValues('skillsRequired');
    if (currentSkills && currentSkills.length > 0) {
      for (let i = currentSkills.length - 1; i >= 0; i--) {
        removeSkill(i);
      }
    }
    newSkills.forEach(skill => appendSkill(skill));
  }, [form, removeSkill, appendSkill]);

  const clearAndSetCustomQuestions = useCallback((newQuestions: CustomQuestion[] = []) => {
    const currentQuestions = form.getValues('customQuestions');
    if (currentQuestions && currentQuestions.length > 0) {
      for (let i = currentQuestions.length - 1; i >= 0; i--) {
        removeCustomQuestion(i);
      }
    }
    newQuestions.forEach(q => appendCustomQuestion(q));
  }, [form, removeCustomQuestion, appendCustomQuestion]);

  const loadAndSetFormValues = useCallback(async (idToLoad: number, isCopyMode: boolean) => {
    setIsLoading(true);
    const response = await getJobById(idToLoad, userId);
    if (response.success && response.jobData) {
      const jobData = response.jobData;

      const transformedData: JobFormData = {
        ...initialFormValues,
        jobTitle: jobData.jobTitle || '',
        industry: jobData.industry || '',
        industryType: jobData.industryType || '',
        otherIndustryType: jobData.industryType === 'Other' && jobData.industry ? jobData.industry : null, // Heuristic for 'other'
        jobType: jobData.jobType || '',
        jobLocation: jobData.jobLocation || '',
        numberOfVacancies: jobData.numberOfVacancies ?? initialFormValues.numberOfVacancies,
        qualification: jobData.qualification || '',
        minimumExperience: jobData.minimumExperience ?? initialFormValues.minimumExperience,
        maximumExperience: jobData.maximumExperience ?? initialFormValues.maximumExperience,
        minimumSalary: jobData.minimumSalary ?? initialFormValues.minimumSalary,
        maximumSalary: jobData.maximumSalary ?? initialFormValues.maximumSalary,
        skillsRequired: Array.isArray(jobData.skillsRequired) ? jobData.skillsRequired : [],
        additionalData: jobData.additionalData || null,
        jobDescription: jobData.jobDescription || '',
        customQuestions: (Array.isArray(jobData.customQuestions) ? jobData.customQuestions : []).map(q => ({
          ...q,
          id: q.id || Math.random().toString(36).substring(2, 9)
        })),
        id: isCopyMode ? undefined : jobData.id,
        status: isCopyMode ? 'draft' : (jobData.status || 'draft'),
      };
      form.reset(transformedData);
      if (editorRef.current && !editorRef.current.isDestroyed) {
        if (editorRef.current.isEmpty || transformedData.jobDescription !== editorRef.current.getHTML()) {
          editorRef.current.commands.setContent(transformedData.jobDescription || '', false);
        }
      }
    } else {
      toast({ title: 'Error Loading Job', description: response.error || 'Could not load job details.', variant: 'destructive' });
      form.reset(initialFormValues);
      if (editorRef.current && !editorRef.current.isDestroyed) editorRef.current.commands.setContent(initialFormValues.jobDescription, false);
      clearAndSetSkills();
      clearAndSetCustomQuestions();
    }
    setIsLoading(false);
  }, [form, userId, toast, editorRef, clearAndSetSkills, clearAndSetCustomQuestions]);


  useEffect(() => {
    const storedCompanyName = localStorage.getItem('companyName');
    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
      // form.setValue('companyName', storedCompanyName); // companyName removed from form
    } else {
      console.warn("Company name not found in localStorage. It will be required for posting jobs.");
    }

    let isMounted = true;
    setIsLoading(true);

    const loadInitialData = async () => {
      if (!userId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      if (jobIdToEdit) {
        await loadAndSetFormValues(jobIdToEdit, false);
      } else if (jobIdToCopy) {
        await loadAndSetFormValues(jobIdToCopy, true);
      } else {
        if (isMounted) {
          form.reset(initialFormValues);
          if (editorRef.current && !editorRef.current.isDestroyed && editorRef.current.isEmpty) {
            editorRef.current.commands.setContent(initialFormValues.jobDescription || '', false);
          }
          clearAndSetSkills();
          clearAndSetCustomQuestions();
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [jobIdToEdit, jobIdToCopy, userId, form, loadAndSetFormValues, editorRef, clearAndSetSkills, clearAndSetCustomQuestions]);


  const handleAddSkill = () => {
    if (currentSkill.trim() && skillsFields.length < 20) {
      const currentSkillsArray = form.getValues('skillsRequired') || [];
      if (!currentSkillsArray.some(skillValue => skillValue.toLowerCase() === currentSkill.trim().toLowerCase())) {
        appendSkill(currentSkill.trim());
        setCurrentSkill('');
      } else {
        toast({ title: "Skill Exists", description: "This skill is already added.", variant: "default" });
      }
    } else if (skillsFields.length >= 20) {
      toast({ title: "Skill Limit Reached", description: "You can add a maximum of 20 skills.", variant: "destructive" });
    }
  };

  const handleAddOrUpdateQuestion = () => {
    if (currentQuestionText.trim() === '') {
      toast({ title: "Question Required", description: "Please enter question text.", variant: "destructive" });
      return;
    }

    const newQuestion: CustomQuestion = {
      id: editingQuestionIndex !== null && questionsFields[editingQuestionIndex]?.id ? questionsFields[editingQuestionIndex].id : Math.random().toString(36).substring(2, 9),
      questionText: currentQuestionText.trim(),
      answerType: currentAnswerType,
    };

    if (editingQuestionIndex !== null) {
      updateCustomQuestion(editingQuestionIndex, newQuestion);
      setEditingQuestionIndex(null);
      toast({ title: "Question Updated", description: "Screening question has been updated.", variant: "default" });
    } else {
      if (questionsFields.length < 10) {
        appendCustomQuestion(newQuestion);
        toast({ title: "Question Added", description: "New screening question added.", variant: "default" });
      } else {
        toast({ title: "Question Limit Reached", description: "You can add a maximum of 10 custom questions.", variant: "destructive" });
        return;
      }
    }
    setCurrentQuestionText('');
    setCurrentAnswerType('text');
  };

  const handleEditQuestion = (index: number) => {
    const questionToEdit = questionsFields[index];
    if (questionToEdit) {
      setCurrentQuestionText(questionToEdit.questionText);
      setCurrentAnswerType(questionToEdit.answerType);
      setEditingQuestionIndex(index);
    }
  };

  const handleCancelEditQuestion = () => {
    setCurrentQuestionText('');
    setCurrentAnswerType('text');
    setEditingQuestionIndex(null);
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    const formData = form.getValues();
    const existingDescription = editorRef.current?.getHTML() || '';

    const aiValidationSchema = z.object({
      jobTitle: jobFormBaseSchema.shape.jobTitle,
      industry: jobFormBaseSchema.shape.industry.optional().nullable(),
      industryType: jobFormBaseSchema.shape.industryType.optional().nullable(),
      jobType: jobFormBaseSchema.shape.jobType.optional().nullable(),
      skillsRequired: jobFormBaseSchema.shape.skillsRequired.optional(),
    });

    const validationResult = aiValidationSchema.safeParse(formData);

    let missingFieldsForToast: string[] = [];
    if (!validationResult.success || !validationResult.data.jobTitle) {
      missingFieldsForToast.push("Job Title");
    }
    if (!aiCustomInstructions || aiCustomInstructions.trim() === '') {
      missingFieldsForToast.push("AI Custom Instructions (in the AI dialog)");
    }

    if (missingFieldsForToast.length > 0) {
      toast({
        title: 'Missing Information for AI Generation',
        description: `Please provide: ${missingFieldsForToast.join(', ')}. These fields help the AI generate a relevant description.`,
        variant: 'destructive',
        duration: 8000,
      });
      setIsGeneratingDescription(false);
      return;
    }

    const companyNameFromStorage = typeof window !== 'undefined' ? localStorage.getItem('companyName') : "Your Company";

    const inputForAI: GenerateJobDescriptionInput = {
      jobTitle: validationResult.data.jobTitle!,
      companyName: companyNameFromStorage || undefined,
      industry: validationResult.data.industry || undefined,
      jobType: validationResult.data.jobType || undefined,
      skillsRequired: validationResult.data.skillsRequired && validationResult.data.skillsRequired.length > 0 ? validationResult.data.skillsRequired : undefined,
      existingJobDescription: existingDescription || undefined,
      customInstructions: aiCustomInstructions,
    };

    try {
      const generatedOutput = await generateJobDescription(inputForAI);
      if (generatedOutput && generatedOutput.jobDescription) {
        form.setValue('jobDescription', generatedOutput.jobDescription, { shouldValidate: true, shouldDirty: true });
        if (editorRef.current && !editorRef.current.isDestroyed) {
          editorRef.current.commands.setContent(generatedOutput.jobDescription, false);
        }
        toast({
          title: 'Job Description Generated!',
          description: 'AI has crafted a job description. Please review and edit as needed.',
          variant: 'default',
          duration: 5000,
        });
        setIsAiInstructionsDialogOpen(false);
        setAiCustomInstructions('');
      } else {
        toast({
          title: 'AI Generation Failed',
          description: 'Could not generate job description. Please try again or write manually.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Error generating job description:", error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'An unexpected error occurred during AI generation.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSmartPostProcess = useCallback(async () => {
    if (!smartPostRawText.trim()) {
      toast({ title: "Input Required", description: "Please paste the job details into the text area.", variant: "destructive" });
      return;
    }
    if (apiRequestsThisMinute >= 2) {
      toast({
        title: "Rate Limit Exceeded",
        description: "You've sent too many requests in a short period. Please wait a minute and try again.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsSmartParsing(true);
    setApiRequestsThisMinute(prev => prev + 1);

    try {
      const result: SmartJobPostParserOutput = await smartJobPostParser({ rawJobDetails: smartPostRawText });
      const currentFormValues = form.getValues();

      if (result) {
        const updatedValues: Partial<JobFormData> = {};
        const isMeaningful = (value: any) => value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');

        if (isMeaningful(result.jobTitle)) updatedValues.jobTitle = result.jobTitle;
        if (isMeaningful(result.industry)) updatedValues.industry = result.industry;
        if (isMeaningful(result.industryType)) updatedValues.industryType = result.industryType;
        if (isMeaningful(result.jobType)) updatedValues.jobType = result.jobType;
        if (isMeaningful(result.jobLocation)) updatedValues.jobLocation = result.jobLocation;
        if (isMeaningful(result.qualification)) updatedValues.qualification = result.qualification;

        updatedValues.numberOfVacancies = isMeaningful(result.numberOfVacancies) ? Number(result.numberOfVacancies) : currentFormValues.numberOfVacancies;
        updatedValues.minimumExperience = isMeaningful(result.minimumExperience) ? Number(result.minimumExperience) : currentFormValues.minimumExperience;
        updatedValues.maximumExperience = isMeaningful(result.maximumExperience) ? Number(result.maximumExperience) : currentFormValues.maximumExperience;
        updatedValues.minimumSalary = isMeaningful(result.minimumSalary) ? Number(result.minimumSalary) : currentFormValues.minimumSalary;
        updatedValues.maximumSalary = isMeaningful(result.maximumSalary) ? Number(result.maximumSalary) : currentFormValues.maximumSalary;

        const newSkills = result.skillsRequired && result.skillsRequired.length > 0 ? result.skillsRequired : [];

        form.reset({
          ...currentFormValues,
          ...updatedValues,
          skillsRequired: newSkills,
        });

        if (isMeaningful(result.jobDescription) && editorRef.current && !editorRef.current.isDestroyed) {
          editorRef.current.commands.setContent(result.jobDescription || '', false);
          form.setValue('jobDescription', result.jobDescription || '', { shouldValidate: true, shouldDirty: true });
        } else if (!isMeaningful(result.jobDescription) && isMeaningful(currentFormValues.jobDescription) && editorRef.current && !editorRef.current.isDestroyed) {
          editorRef.current.commands.setContent(currentFormValues.jobDescription || '', false);
        }

        toast({ title: "Smart Fill Complete!", description: "Job details extracted. Please review and complete the form.", variant: "default", duration: 6000 });
        setIsSmartPostDialogOpen(false);
        setSmartPostRawText('');
      } else {
        toast({ title: "Smart Fill Incomplete", description: "AI could not extract all details. Please review and fill manually.", variant: "default" });
      }
    } catch (error) {
      console.error("Smart Post error:", error);
      toast({ title: "Error", description: (error as Error).message || "An unexpected error occurred during Smart Fill.", variant: "destructive" });
    } finally {
      setIsSmartParsing(false);
    }
  }, [form, smartPostRawText, editorRef, toast, apiRequestsThisMinute]);


  useEffect(() => {
    const resetCounter = () => {
      setApiRequestsThisMinute(0);
    };
    const intervalId = setInterval(resetCounter, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handlePreview = async () => {
    await form.trigger();
    const currentFormData = form.getValues();

    if (editorRef.current && !editorRef.current.isDestroyed) {
      currentFormData.jobDescription = editorRef.current.getHTML();
    }
    const validation = JobFormDataSchema.safeParse(currentFormData);

    if (!validation.success) {
      let errorMessages = "Please correct the errors highlighted: ";
      const fieldErrors = validation.error.flatten().fieldErrors;
      const formErrors = validation.error.flatten().formErrors;
      const rawIssues = validation.error.issues;

      const fieldErrorMessages = Object.entries(fieldErrors)
        .map(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const messages = Array.isArray(value) ? value.join(', ') : String(value);
          return `${formattedKey}: ${messages}`;
        })
        .join('; ');

      if (fieldErrorMessages.length > 0) errorMessages += `${fieldErrorMessages}. `;

      const formErrorMessages = formErrors.join('; ');
      if (formErrorMessages.length > 0) errorMessages += `General form errors: ${formErrorMessages}. `;

      if (fieldErrorMessages.length === 0 && formErrorMessages.length === 0 && rawIssues && rawIssues.length > 0) {
        const rawIssueMessages = rawIssues.map(issue => `${issue.path.join('.') || 'Form'}: ${issue.message}`).join('; ');
        if (rawIssueMessages) errorMessages += `Validation issues: ${rawIssueMessages}.`;
      } else if (fieldErrorMessages.length === 0 && formErrorMessages.length === 0) {
        errorMessages += "An unknown validation error occurred.";
      }
      // Removed detailed console.error logs for cleaner console in expected validation failures
      toast({
        title: 'Validation Errors for Preview',
        description: errorMessages,
        variant: 'destructive',
        duration: 7000,
      });

      const firstErrorPath = validation.error.issues[0]?.path;
      if (firstErrorPath && firstErrorPath.length > 0) {
        const fieldName = firstErrorPath.join('.') as keyof JobFormData;
        try {
          form.setFocus(fieldName as any);
        } catch (e) {
          console.warn("Could not focus on field:", fieldName, e);
          const errorElements = document.querySelectorAll('[aria-invalid="true"]');
          if (errorElements.length > 0 && errorElements[0] instanceof HTMLElement) {
            errorElements[0].focus();
          }
        }
      }
      return;
    }

    const data = validation.data;
    const fetchedCompanyName = companyName || "Your Company (Profile Incomplete)";

    setPreviewData({
      ...data,
      id: data.id || undefined,
      companyName: fetchedCompanyName,
      createdAt: (jobIdToEdit || jobIdToCopy) && form.getValues('createdAt' as any) ? form.getValues('createdAt' as any) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employer_user_id: userId,
    });
    setIsPreviewOpen(true);
  };


  const processJobSubmission = async (status: 'draft' | 'active'): Promise<JobActionResponse> => {
    setIsSaving(true);

    let jobDescriptionContent = '';
    if (editorRef.current && !editorRef.current.isDestroyed) {
      jobDescriptionContent = editorRef.current.getHTML();
    }

    const currentFormData = form.getValues();
    const dataToValidate: JobFormData = {
      ...currentFormData,
      jobDescription: jobDescriptionContent,
      status: status,
    };

    const validation = JobFormDataSchema.safeParse(dataToValidate);

    if (!validation.success) {
      // console.warn("Client-side validation failed (processJobSubmission). Full Zod flattened errors:", validation.error.flatten());
      console.warn("Client-side validation failed (processJobSubmission). Raw Zod issues:", JSON.stringify(validation.error.issues, null, 2));

      let errorMessages = "Please correct the errors highlighted: ";
      const fieldErrors = validation.error.flatten().fieldErrors;
      const fieldErrorMessages = Object.entries(fieldErrors)
        .map(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const messages = Array.isArray(value) ? value.join(', ') : String(value);
          return `${formattedKey}: ${messages}`;
        })
        .join('; ');
      if (fieldErrorMessages) {
        errorMessages += `${fieldErrorMessages}. `;
      }

      const formErrors = validation.error.flatten().formErrors;
      if (formErrors.length > 0) {
        errorMessages += `General form errors: ${formErrors.join('; ')}. `;
      }

      const rawIssues = validation.error.issues;
      if (!fieldErrorMessages && formErrors.length === 0 && rawIssues && rawIssues.length > 0) {
        const issueMessages = rawIssues.map(issue => `${(issue.path.join('.') || 'Form').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${issue.message}`).join('; ');
        if (issueMessages) errorMessages += `Validation issues: ${issueMessages}.`;
      }

      toast({
        title: 'Validation Failed',
        description: errorMessages,
        variant: 'destructive',
        duration: 8000,
      });

      const firstErrorPath = validation.error.issues[0]?.path;
      if (firstErrorPath && firstErrorPath.length > 0) {
        const fieldName = firstErrorPath.join('.') as keyof JobFormData;
        try {
          form.setFocus(fieldName as any);
        } catch (e) {
          console.warn("Could not focus on field after server validation error:", fieldName, e);
          const errorElements = document.querySelectorAll('[aria-invalid="true"]');
          if (errorElements.length > 0 && errorElements[0] instanceof HTMLElement) {
            errorElements[0].focus();
          }
        }
      }
      setIsSaving(false);
      return { success: false, error: "Validation failed", validationErrors: validation.error.issues };
    }

    const validatedData = validation.data;
    const finalJobIdToUpdate = jobIdToCopy ? undefined : (jobIdToEdit || undefined);

    const response = await saveJobAction(userId, { ...validatedData, status }, finalJobIdToUpdate);
    setIsSaving(false);
    return response;
  };


  const handleProceedToPost = async () => {
    await form.trigger();
    let jobDescriptionContent = '';
    if (editorRef.current && !editorRef.current.isDestroyed) {
      jobDescriptionContent = editorRef.current.getHTML();
    }
    const currentFormData = form.getValues();
    const dataToValidate: JobFormData = {
      ...currentFormData,
      jobDescription: jobDescriptionContent,
      status: 'active',
    };

    const validation = JobFormDataSchema.safeParse(dataToValidate);

    if (!validation.success) {
      // console.warn("Client-side validation failed (handleProceedToPost). Full Zod flattened errors:", validation.error.flatten());
      console.warn("Client-side validation failed (handleProceedToPost). Raw Zod issues:", JSON.stringify(validation.error.issues, null, 2));

      let errorMessages = "Please correct the errors highlighted: ";
      const fieldErrors = validation.error.flatten().fieldErrors;
      const formErrors = validation.error.flatten().formErrors;
      const rawIssues = validation.error.issues;

      const fieldErrorMessages = Object.entries(fieldErrors)
        .map(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const messages = Array.isArray(value) ? value.join(', ') : String(value);
          return `${formattedKey}: ${messages}`;
        })
        .join('; ');

      if (fieldErrorMessages.length > 0) errorMessages += `${fieldErrorMessages}. `;

      const formErrorString = formErrors.join('; ');
      if (formErrorString.length > 0) errorMessages += `General form errors: ${formErrorString}. `;

      if (fieldErrorMessages.length === 0 && formErrorString.length === 0 && rawIssues && rawIssues.length > 0) {
        const issueMessages = rawIssues.map(issue => `${(issue.path.join('.') || 'Form').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${issue.message}`).join('; ');
        if (issueMessages) errorMessages += `Validation issues: ${issueMessages}.`;
      } else if (fieldErrorMessages.length === 0 && formErrorString.length === 0) {
        errorMessages += "An unknown validation error occurred.";
      }

      toast({
        title: 'Validation Failed',
        description: errorMessages,
        variant: 'destructive',
        duration: 8000,
      });

      const firstErrorPath = validation.error.issues[0]?.path;
      if (firstErrorPath && firstErrorPath.length > 0) {
        const fieldName = firstErrorPath.join('.') as keyof JobFormData;
        try {
          form.setFocus(fieldName as any);
        } catch (e) {
          console.warn("Could not focus on field after validation error:", fieldName, e);
          const errorElements = document.querySelectorAll('[aria-invalid="true"]');
          if (errorElements.length > 0 && errorElements[0] instanceof HTMLElement) {
            errorElements[0].focus();
          }
        }
      }
      return;
    }
    setIsConfirmPostOpen(true);
  };

  const confirmAndPostJob = async () => {
    setIsConfirmPostOpen(false);
    const response = await processJobSubmission('active');
    if (response.success && response.jobId) {
      setLastSavedJobId(response.jobId);
      setLastSavedJobTitle(response.jobData?.jobTitle || 'Your Job');
      setIsPostSuccessOpen(true);

      form.reset(initialFormValues);
      if (editorRef.current && editorRef.current.commands && !editorRef.current.isDestroyed) editorRef.current.commands.setContent(initialFormValues.jobDescription || '', false);
      clearAndSetSkills();
      clearAndSetCustomQuestions();

    } else {
      toast({
        title: response.error === "Validation failed" ? 'Posting Failed: Validation Error' : 'Posting Failed',
        description: response.error === "Validation failed" && response.validationErrors ?
          `Please correct the following: ${response.validationErrors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')}` :
          response.error || 'Could not post the job. Please try again.',
        variant: 'destructive',
        duration: 7000,
      });
    }
  };

  const aiJobPostTooltipContent = useMemo(() => (
    <>
      <p className="text-sm font-medium">
        Try AI Job Post! (Beta)
      </p>
      <p className="text-xs text-muted-foreground">
        Paste raw job details, and AI will attempt to fill the form.
        Review and edit before posting. Results may vary.
      </p>
    </>
  ), []);


  const handleResetForm = useCallback(() => {
    const defaultValuesWithCompany = {
      ...initialFormValues,
    };
    if (jobIdToEdit) {
      loadAndSetFormValues(jobIdToEdit, false);
      toast({ title: "Form Reverted", description: "Changes have been reverted to the originally loaded job data.", variant: "default" });
    } else {
      form.reset(defaultValuesWithCompany);
      if (editorRef.current && !editorRef.current.isDestroyed) {
        editorRef.current.commands.setContent(defaultValuesWithCompany.jobDescription || '', false);
      }
      clearAndSetSkills();
      clearAndSetCustomQuestions();
      toast({ title: "Form Reset", description: "All fields have been cleared.", variant: "default" });
    }
  }, [jobIdToEdit, loadAndSetFormValues, form, editorRef, toast, clearAndSetSkills, clearAndSetCustomQuestions]);


  const handleSkillSelectionFromDialog = (skill: string, checked: boolean) => {
    setSelectedAiSkills(prev =>
      checked ? [...prev, skill] : prev.filter(s => s !== skill)
    );
  };

  const handleSuggestSkillsClick = async () => {
    const { jobTitle, industry, industryType, minimumExperience } = form.getValues();
    if (!jobTitle) {
      toast({ title: "Job Title Required", description: "Please enter a job title to get skill suggestions.", variant: "destructive" });
      return;
    }
    setIsSuggestingSkills(true);
    setAiSuggestedSkills([]);
    try {
      const input: SuggestSkillsInput = {
        jobTitle,
        industry: industry || undefined,
        industryType: industryType || undefined,
        jobDescription: editorRef.current?.getHTML() || undefined,
        minimumExperience: minimumExperience ?? undefined,
      };
      const result = await suggestSkillsForJob(input);
      if (result && result.suggestedSkills) {
        setAiSuggestedSkills(result.suggestedSkills);
        setSelectedAiSkills([]);
        setIsSkillSuggestionDialogOpen(true);
      } else {
        toast({ title: "No Suggestions", description: "AI could not find relevant skills for the provided details.", variant: "default" });
      }
    } catch (error) {
      toast({ title: "Error Suggesting Skills", description: (error as Error).message || "Could not fetch skill suggestions.", variant: "destructive" });
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  const handleAddSelectedAiSkills = () => {
    const currentSkills = form.getValues('skillsRequired') || [];
    const skillsToAdd = selectedAiSkills.filter(s => !currentSkills.some(cs => cs.toLowerCase() === s.toLowerCase()));

    if (skillsToAdd.length > 0) {
      const totalSkillsAfterAdding = currentSkills.length + skillsToAdd.length;
      if (totalSkillsAfterAdding > 20) {
        toast({
          title: "Skill Limit Exceeded",
          description: `You can add ${20 - currentSkills.length} more skill(s). ${skillsToAdd.length} were suggested, but only some can be added.`,
          variant: "destructive",
          duration: 5000,
        });
        skillsToAdd.slice(0, 20 - currentSkills.length).forEach(skill => appendSkill(skill));
      } else {
        skillsToAdd.forEach(skill => appendSkill(skill));
        toast({ title: "Skills Added", description: `${skillsToAdd.length} skill(s) added to your list.`, variant: "default" });
      }
    } else if (selectedAiSkills.length > 0) {
      toast({ title: "Skills Already Present", description: "All selected AI suggestions are already in your list.", variant: "default" });
    }
    setIsSkillSuggestionDialogOpen(false);
  };


  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <TooltipProvider>
      <div className="container max-w-screen-2xl py-8">
        <Card className="shadow-xl border border-border rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-secondary/50 to-card p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl text-primary flex items-center gap-2">
                <FileSignature className="h-7 w-7" /> {jobIdToEdit ? 'Edit Job Opening' : 'Post a New Job Opening'}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground mt-1.5 pl-10">
                {jobIdToEdit ? 'Update the details of this job posting.' : 'Fill in the details below to attract top talent.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isSmartPostDialogOpen} onOpenChange={setIsSmartPostDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    className="bg-gradient-to-br from-primary/90 to-accent/90 hover:from-primary hover:to-accent text-primary-foreground shadow-md hover:shadow-lg animate-blink"
                    type="button"
                  >
                    <Sparkles className="mr-2 h-5 w-5" /> AI Job Post
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span role="button" tabIndex={0} className="ml-2 p-0 border-none bg-transparent cursor-help flex items-center" onClick={(e) => { e.stopPropagation(); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); } }}>
                          <HelpCircle className="ml-2 h-4 w-4 text-primary-foreground/70 cursor-help" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-background text-foreground border border-border shadow-lg rounded-md p-3">
                        {aiJobPostTooltipContent}
                      </TooltipContent>
                    </Tooltip>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <PreviewDialogTitle className="flex items-center gap-2 text-xl"><Sparkles className="text-primary h-5 w-5" />AI Job Post Fill</PreviewDialogTitle>
                    <PreviewDialogDescription>
                      Paste the raw job details below. Our AI will attempt to parse and pre-fill the form fields.
                    </PreviewDialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Paste entire job description text here..."
                    value={smartPostRawText}
                    onChange={(e) => setSmartPostRawText(e.target.value)}
                    rows={15}
                    className="my-4 focus:ring-primary focus:border-primary"
                  />
                  <ShadDialogFooter>
                    <Button variant="ghost" onClick={() => setIsSmartPostDialogOpen(false)} disabled={isSmartParsing}>Cancel</Button>
                    <Button onClick={handleSmartPostProcess} disabled={isSmartParsing || !smartPostRawText.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {isSmartParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                      {isSmartParsing ? 'Parsing...' : 'Parse & Fill Form'}
                    </Button>
                  </ShadDialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <FormProvider {...form}>
            <form>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                {/* Left Column */}
                <div className="space-y-6">
                  <CardSection className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" /> Job Overview</h3>
                    <FormField control={form.control} name="jobTitle" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center font-medium text-foreground">Job Title <span className="text-destructive ml-1">*</span></FormLabel>
                        <FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField control={form.control} name="industry" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Industry <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input placeholder="e.g., E-commerce, SaaS, Consumer Electronics" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="industryType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Industry Type <span className="text-destructive ml-1">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select industry category" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Technology">Technology</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Education">Education</SelectItem>
                              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="Retail">Retail</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Customer Service">Customer Service</SelectItem>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                              <SelectItem value="Design">Design</SelectItem>
                              <SelectItem value="Construction">Construction</SelectItem>
                              <SelectItem value="Hospitality">Hospitality</SelectItem>
                              <SelectItem value="Logistics">Logistics</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    {watchedIndustryType === 'Other' && (
                      <FormField control={form.control} name="otherIndustryType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Specify Other Industry Type <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input placeholder="Enter specific industry type" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField control={form.control} name="jobType" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground"><Type className="h-4 w-4 mr-1.5 text-muted-foreground" />Job Type <span className="text-destructive ml-1">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Temporary">Temporary</SelectItem>
                              <SelectItem value="Internship">Internship</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="jobLocation" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground"><MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />Job Location <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input placeholder="e.g., New York, NY or Remote" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField control={form.control} name="minimumExperience" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Min Experience (Yrs) <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 2" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' || isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="maximumExperience" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Max Experience (Yrs) <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' || isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <FormField control={form.control} name="minimumSalary" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Min Salary (Annual, ₹) <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 600000" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' || isNaN(parseInt(e.target.value, 10)) ? 0 : parseInt(e.target.value, 10))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="maximumSalary" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground">Max Salary (Annual, ₹) <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 900000" {...field} value={field.value ?? 0} onChange={e => field.onChange(e.target.value === '' || isNaN(parseInt(e.target.value, 10)) ? 0 : parseInt(e.target.value, 10))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 items-end">
                      <FormField control={form.control} name="numberOfVacancies" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground"><UsersRound className="h-4 w-4 mr-1.5 text-muted-foreground" />No. of Vacancies <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 1" {...field} value={field.value ?? 1} onChange={e => field.onChange(e.target.value === '' || isNaN(parseInt(e.target.value, 10)) || parseInt(e.target.value, 10) < 1 ? 1 : parseInt(e.target.value, 10))} className="w-full" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="qualification" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center font-medium text-foreground"><BriefcaseBusiness className="h-4 w-4 mr-1.5 text-muted-foreground" />Qualification <span className="text-destructive ml-1">*</span></FormLabel>
                          <FormControl><Input placeholder="e.g., Bachelor's Degree in CS" {...field} className="w-full" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Tags className="h-5 w-5 text-primary" /> Key Skills <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSuggestSkillsClick}
                          disabled={isSuggestingSkills || !form.getValues('jobTitle')}
                          className="text-xs h-8"
                        >
                          {isSuggestingSkills ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                          Suggest Skills
                        </Button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Enter a skill"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                          className="flex-1 min-w-0 h-10 text-sm"
                        />
                        <Button type="button" onClick={handleAddSkill} size="sm" variant="outline" className="shrink-0 h-10">
                          <PlusCircle className="mr-1.5 h-4 w-4" /> Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Add up to 20 relevant skills.</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {skillsFields.map((item, index) => (
                          <Badge key={item.id} variant="secondary" className="py-1 px-2.5 text-sm">
                            {form.getValues('skillsRequired')?.[index]}
                            <button type="button" onClick={() => removeSkill(index)} className="ml-1.5 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <FormField name="skillsRequired" control={form.control} render={() => <FormMessage />} />
                    </FormItem>
                  </CardSection>

                  <FormField control={form.control} name="additionalData" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center text-lg font-semibold text-foreground"><InfoIconLucide className="h-5 w-5 mr-2 text-primary" />Additional Data (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Any other relevant information for candidates (e.g., benefits, specific instructions for application)." {...field} value={field.value ?? ''} rows={4} className="min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <CardSection>
                    <FormField
                      control={form.control}
                      name="jobDescription"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1">
                            <FormLabel className="text-lg font-semibold text-foreground flex items-center">
                              <FileText className="h-5 w-5 mr-1.5 text-primary" />Full Job Description <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <Dialog open={isAiInstructionsDialogOpen} onOpenChange={setIsAiInstructionsDialogOpen}>
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="text-xs h-8">
                                  <Wand2 className="mr-1.5 h-3.5 w-3.5 text-primary" /> Generate with AI
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <PreviewDialogTitle className="flex items-center gap-2"><Wand2 className="text-primary h-5 w-5" /> AI Job Description Helper</PreviewDialogTitle>
                                  <PreviewDialogDescription>
                                    Provide any specific instructions or keywords for the AI to focus on. The AI will also use Job Title, Industry, Job Type, and Key Skills if provided in the form.
                                  </PreviewDialogDescription>
                                </DialogHeader>
                                <Textarea
                                  placeholder="e.g., Emphasize teamwork and remote collaboration skills. Mention company's commitment to diversity."
                                  value={aiCustomInstructions}
                                  onChange={(e) => setAiCustomInstructions(e.target.value)}
                                  rows={4}
                                  className="my-4"
                                />
                                <ShadDialogFooter>
                                  <Button variant="ghost" onClick={() => setIsAiInstructionsDialogOpen(false)} disabled={isGeneratingDescription}>Cancel</Button>
                                  <Button onClick={handleGenerateDescription} disabled={isGeneratingDescription || !aiCustomInstructions.trim()} className="bg-primary hover:bg-primary/90">
                                    {isGeneratingDescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {isGeneratingDescription ? 'Generating...' : 'Generate'}
                                  </Button>
                                </ShadDialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <FormControl>
                            <RichTextEditor
                              content={field.value ?? ''}
                              onChange={(newContent) => form.setValue('jobDescription', newContent, { shouldValidate: true, shouldDirty: true })}
                              onEditorInstance={handleEditorInstance}
                              placeholder="Start writing your job description here..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardSection>
                  <CardSection>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-primary" /> Custom Screening Questions
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">Add up to 10 questions. Current: {questionsFields.length}/10</p>
                    <div className="p-4 border border-border/70 bg-secondary/20 rounded-md shadow-sm space-y-3">
                      <Input
                        placeholder={editingQuestionIndex !== null ? "Edit question text..." : "Enter new question text..."}
                        value={currentQuestionText}
                        onChange={(e) => setCurrentQuestionText(e.target.value)}
                        className="h-10 text-sm bg-background"
                      />
                      <div className="flex items-center justify-between gap-4">
                        <RadioGroup
                          onValueChange={(value: 'text' | 'yes_no') => setCurrentAnswerType(value)}
                          value={currentAnswerType}
                          className="flex gap-3 pt-1"
                        >
                          <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="text" id={`ans-text-current`} />
                            <Label htmlFor={`ans-text-current`} className="font-normal text-sm">Text</Label>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="yes_no" id={`ans-yesno-current`} />
                            <Label htmlFor={`ans-yesno-current`} className="font-normal text-sm">Yes/No</Label>
                          </div>
                        </RadioGroup>
                        {editingQuestionIndex !== null ? (
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="sm" onClick={handleCancelEditQuestion} className="h-9 text-xs">
                              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel Edit
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddOrUpdateQuestion} className="h-9 text-xs border-primary text-primary hover:bg-primary/5 hover:text-primary">
                              <BriefcaseBusiness className="mr-1.5 h-3.5 w-3.5" /> Update
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddOrUpdateQuestion}
                            className={cn(
                              "h-9 text-xs border-primary text-primary hover:bg-primary/5 hover:text-primary",
                              (questionsFields.length >= 10 && editingQuestionIndex === null) || !currentQuestionText.trim() ? "opacity-50 cursor-not-allowed" : ""
                            )}
                            disabled={(questionsFields.length >= 10 && editingQuestionIndex === null) || !currentQuestionText.trim()}
                          >
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Question
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 mt-3 max-h-[250px] overflow-y-auto pr-2">
                      {questionsFields.map((item, index) => (
                        <Card key={item.id} className="p-3 border border-border/70 bg-card rounded-md shadow-sm">
                          <div className="flex items-start gap-2">
                            <div className="flex-grow space-y-1">
                              <p className="text-sm font-medium text-foreground">{item.questionText}</p>
                              <p className="text-xs text-muted-foreground">Answer Type: {item.answerType === 'text' ? 'Text' : 'Yes/No'}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleEditQuestion(index)} className="h-7 w-7 text-primary/70 hover:text-primary hover:bg-primary/10">
                                <FileSignature className="h-3.5 w-3.5" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomQuestion(index)} className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    <FormField name="customQuestions" control={form.control} render={() => <FormMessage />} />
                  </CardSection>
                </div>
              </CardContent>

              <CardFooter className="p-6 border-t border-border bg-secondary/20 flex flex-col sm:flex-row justify-end items-center gap-3">
                <Button type="button" variant="outline" onClick={handleResetForm} disabled={isSaving} className="h-11 px-6 text-base min-w-[150px] sm:min-w-0 transition-default flex items-center justify-center border-muted-foreground/50 text-muted-foreground hover:bg-muted/20">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Form
                </Button>
                <Button type="button" variant="outline" onClick={handlePreview} disabled={isSaving} className="h-11 px-6 text-base min-w-[150px] sm:min-w-0 transition-default flex items-center justify-center border-primary/50 text-primary hover:bg-primary/10">
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
                <Button type="button" variant="default" onClick={handleProceedToPost} disabled={isSaving} className="h-11 px-6 text-base min-w-[180px] sm:min-w-0 transition-default flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg">
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  Proceed to Post
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </Card>

        {previewData && (
          <JobPreviewDialog isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} jobData={previewData} />
        )}

        <Dialog open={isConfirmPostOpen} onOpenChange={setIsConfirmPostOpen}>
          <DialogContent className="sm:max-w-md rounded-xl shadow-2xl border-border bg-card">
            <DialogHeader className="items-center text-center p-6 pb-4">
              <AlertTriangle className="h-12 w-12 text-primary mb-4" />
              <PreviewDialogTitle className="text-xl font-bold text-foreground">Confirm Job Posting</PreviewDialogTitle>
              <PreviewDialogDescription className="text-muted-foreground mt-2 text-base">
                Are you sure you want to post this job? It will become visible to job seekers.
              </PreviewDialogDescription>
            </DialogHeader>
            <ShadDialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-4 bg-secondary/20 border-t border-border rounded-b-xl">
              <Button variant="ghost" onClick={() => setIsConfirmPostOpen(false)} className="w-full sm:w-auto order-2 sm:order-1 text-base py-2.5 h-auto">Cancel</Button>
              <Button onClick={confirmAndPostJob} disabled={isSaving} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 order-1 sm:order-2 text-base">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yes, Post Job
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPostSuccessOpen} onOpenChange={setIsPostSuccessOpen}>
          <DialogContent className="sm:max-w-md rounded-xl shadow-2xl border-border bg-card p-0">
            <div className="p-6 flex flex-col items-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-5 animate-pulse" />
              <PreviewDialogTitle className="text-2xl font-bold text-green-600">Job Posted Successfully!</PreviewDialogTitle>
              <PreviewDialogDescription className="text-muted-foreground mt-2 px-2 text-base">
                Your job "<span className="font-semibold text-foreground">{lastSavedJobTitle}</span>" is now live.
              </PreviewDialogDescription>
            </div>
            <ShadDialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between gap-2 p-6 pt-4 bg-secondary/20 border-t border-border rounded-b-xl">
              <Button onClick={() => { setIsPostSuccessOpen(false); router.push('/employer'); }} variant="ghost" size="sm" className="text-sm"> Home</Button>
              <Button onClick={() => { setIsPostSuccessOpen(false); handleResetForm(); router.replace('/employer/post-job'); }} variant="outline" size="sm" className="text-sm">Post Another</Button>
              <Button onClick={() => { setIsPostSuccessOpen(false); router.push('/employer/control?section=manageJobs'); }} variant="default" size="sm" className="text-sm">View Jobs</Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={isSkillSuggestionDialogOpen} onOpenChange={setIsSkillSuggestionDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <PreviewDialogTitle className="flex items-center gap-2"><Sparkles className="text-primary h-5 w-5" /> AI Skill Suggestions</PreviewDialogTitle>
              <PreviewDialogDescription>
                Select the skills suggested by AI that you'd like to add to your job posting.
              </PreviewDialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-60 overflow-y-auto space-y-2">
              {isSuggestingSkills ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Fetching suggestions...</span>
                </div>
              ) : aiSuggestedSkills.length > 0 ? (
                aiSuggestedSkills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2 p-1.5 rounded hover:bg-muted/50">
                    <Checkbox
                      id={`skill-suggestion-${index}`}
                      checked={selectedAiSkills.includes(skill)}
                      onCheckedChange={(checked) => handleSkillSelectionFromDialog(skill, !!checked)}
                    />
                    <Label htmlFor={`skill-suggestion-${index}`} className="text-sm font-normal text-foreground cursor-pointer">
                      {skill}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No suggestions available for the current job details.</p>
              )}
            </div>
            <ShadDialogFooter>
              <Button variant="ghost" onClick={() => setIsSkillSuggestionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSelectedAiSkills} disabled={selectedAiSkills.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />Add Selected Skills
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};


const PostJobPageWrapper: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const jobIdToEditParam = searchParams.get('editJobId');
  const jobIdToCopyParam = searchParams.get('copyJobId');


  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!userIdStr || userRole !== 'employer') {
      setAuthStatus('unauthorized');
    } else {
      const parsedUserId = parseInt(userIdStr, 10);
      if (!isNaN(parsedUserId)) {
        setCurrentUserId(parsedUserId);
        setAuthStatus('authorized');
      } else {
        console.error("Invalid user ID in localStorage:", userIdStr);
        setAuthStatus('unauthorized');
      }
    }
  }, []);

  if (authStatus === 'loading') {
    return <PageLoader />;
  }

  if (authStatus === 'unauthorized') {
    return (
      <AuthRequiredModal
        isOpen={true}
        onCloseAndGoBack={() => router.push('/employer')}
        userRole="employer"
      />
    );
  }

  if (authStatus === 'authorized' && currentUserId !== null) {
    const finalJobIdToEdit = jobIdToEditParam ? Number(jobIdToEditParam) : null;
    const finalJobIdToCopy = jobIdToCopyParam ? Number(jobIdToCopyParam) : null;
    const suspenseKey = `post-job-${finalJobIdToEdit || finalJobIdToCopy || 'new'}`;

    return <Suspense fallback={<PageLoader />} key={suspenseKey}><PostJobsPageContent userId={currentUserId} jobIdToEdit={finalJobIdToEdit} jobIdToCopy={finalJobIdToCopy} /></Suspense>;
  }

  return <PageLoader />;
};

export default function PostJobPage() {
  return <Suspense fallback={<PageLoader />}><PostJobPageWrapper /></Suspense>;
}

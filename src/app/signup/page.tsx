// src/app/signup/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { UserPlus, User, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { type SignUpFormData, signUpAction, type AuthActionResponse } from '../(auth)/actions';
import { useToast } from '@/hooks/use-toast';


const clientSignUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  confirmPassword: z.string(),
  role: z.enum(['jobSeeker', 'employer'], { required_error: "Please select a role." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ClientSignUpSchema = z.infer<typeof clientSignUpSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialRole, setInitialRole] = useState<'jobSeeker' | 'employer'>('jobSeeker');

  useEffect(() => {
    const roleFromParams = searchParams.get('role') as 'jobSeeker' | 'employer';
    if (roleFromParams && ['jobSeeker', 'employer'].includes(roleFromParams)) {
      setInitialRole(roleFromParams);
    }
  }, [searchParams]);

  const form = useForm<ClientSignUpSchema>({
    resolver: zodResolver(clientSignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: initialRole, 
    },
  });

  useEffect(() => {
    form.reset({ role: initialRole, email: '', password: '', confirmPassword: ''});
  }, [initialRole, form]);

  const handleSignup = async (formData: ClientSignUpSchema) => {
    setIsSubmitting(true);
    const actionData: SignUpFormData = { 
      email: formData.email,
      password: formData.password, 
      role: formData.role,
    };
    
    const response: AuthActionResponse = await signUpAction(actionData);
    const fromPath = searchParams.get('from');

    if (response.success) {
      toast({
        title: 'Signup Successful!',
        description: response.message || 'Your account has been created. Please log in.',
        variant: 'default',
        duration: 3000,
      });
      const loginRedirectParams = new URLSearchParams();
      loginRedirectParams.set('role', formData.role);
      if (fromPath) {
        loginRedirectParams.set('from', fromPath);
      }
      router.push(`/login?${loginRedirectParams.toString()}`);
    } else {
      toast({
        title: 'Signup Failed',
        description: response.error || 'An unexpected error occurred.',
        variant: 'destructive',
      });
       if (response.validationErrors) {
        response.validationErrors.forEach(err => {
          form.setError(err.path[0] as keyof ClientSignUpSchema, { message: err.message });
        });
      }
       setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const fromPath = searchParams.get('from');
    if (fromPath) {
      // If 'from' exists, it means signup was likely triggered by AuthRequiredModal.
      // Redirect to the role's landing page.
      const role = form.getValues('role') || initialRole || localStorage.getItem('userRole');
      if (role === 'jobSeeker') {
        router.push('/jobSeeker');
      } else if (role === 'employer') {
        router.push('/employer');
      } else {
        router.push('/'); // Fallback to homepage
      }
    } else {
      // Standard browser back behavior if signup page was accessed directly
      router.back();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl border border-border rounded-xl overflow-hidden relative">
        <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 left-3 text-muted-foreground hover:text-primary z-10 h-8 w-8"
              onClick={handleBack} 
              aria-label="Back"
              >
              <ArrowLeft className="h-5 w-5" />
          </Button>
         <CardHeader className="text-center bg-card p-6 pt-12"> 
           <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
               <path d="m9.09 9 1.82 1.82L12 9.09l1.09 1.82 1.82-1.82"/>
               <path d="m14.91 12-1.82 1.82L12 12.09l-1.09 1.82-1.82-1.82"/>
               <path d="m12 15 1.82 1.82L15 15.09l1.09 1.82 1.82-1.82"/>
               <path d="m9.09 15 1.82 1.82L12 15.09l-1.09 1.82-1.82-1.82"/>
             </svg>
             <span className="font-bold text-xl text-primary">JobsAI</span>
           </Link>
           <CardTitle className="text-2xl font-bold text-foreground">Create Your Account</CardTitle>
           <CardDescription>Join JobsAI and unlock opportunities</CardDescription>
         </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} className="transition-default focus:ring-primary focus:border-primary" />
              {form.formState.errors.email && <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input id="password" type="password" placeholder="Choose a strong password" {...form.register('password')} className="transition-default focus:ring-primary focus:border-primary" />
              {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
            </div>
             <div className="space-y-2">
               <Label htmlFor="confirmPassword">Confirm Password</Label>
               <Input id="confirmPassword" type="password" placeholder="Re-enter your password" {...form.register('confirmPassword')} className="transition-default focus:ring-primary focus:border-primary" />
               {form.formState.errors.confirmPassword && <p className="text-sm font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>}
             </div>

             <div className="space-y-3 !mt-8">
               <Label className="font-medium">Sign up as:</Label>
               <RadioGroup
                 value={form.watch('role')}
                 onValueChange={(value) => form.setValue('role', value as 'jobSeeker' | 'employer')}
                 className="grid grid-cols-2 gap-4"
               >
                  <FormItemRadio value="jobSeeker" label="Job Seeker" icon={User} currentRole={form.watch('role')} />
                  <FormItemRadio value="employer" label="Employer" icon={Briefcase} currentRole={form.watch('role')} />
               </RadioGroup>
                {form.formState.errors.role && <p className="text-sm font-medium text-destructive">{form.formState.errors.role.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 text-base font-semibold transition-default" disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
             {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

        </CardContent>
         <CardFooter className="bg-secondary/30 p-4 text-center">
             <p className="text-sm text-muted-foreground w-full">
               Already have an account?{' '}
               <Link href={{ pathname: "/login", query: searchParams.toString() ? { from: searchParams.get('from'), role: searchParams.get('role') } : { role: initialRole } }} className="font-medium text-primary hover:underline">
                 Log in
               </Link>
             </p>
         </CardFooter>
      </Card>
    </div>
  );
}

interface FormItemRadioProps {
  value: 'jobSeeker' | 'employer';
  label: string;
  icon: React.ElementType;
  currentRole?: 'jobSeeker' | 'employer';
}

const FormItemRadio: React.FC<FormItemRadioProps> = ({ value, label, icon: Icon, currentRole }) => (
  <Label 
    htmlFor={`role-${value}`}
    className={cn(
        "flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer transition-all hover:border-primary",
        currentRole === value && "border-primary bg-primary/10"
    )}
    >
    <RadioGroupItem value={value} id={`role-${value}`} className="text-primary focus:ring-primary"/>
    <div className="font-medium flex items-center gap-2 cursor-pointer w-full">
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </div>
  </Label>
);

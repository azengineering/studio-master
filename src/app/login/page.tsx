// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LogIn, User, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { type LoginFormData, loginAction, type AuthActionResponse } from '../(auth)/actions'; 
import { useToast } from '@/hooks/use-toast';


// Zod schema for form validation on client-side
const clientLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }), 
  role: z.enum(['jobSeeker', 'employer'], { required_error: "Please select a role." }),
});

type ClientLoginSchema = z.infer<typeof clientLoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const currentPathname = usePathname(); // get current pathname for 'from'
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialRole, setInitialRole] = useState<'jobSeeker' | 'employer'>('jobSeeker');

  useEffect(() => {
    const roleFromParams = searchParams.get('role') as 'jobSeeker' | 'employer';
    if (roleFromParams && ['jobSeeker', 'employer'].includes(roleFromParams)) {
      setInitialRole(roleFromParams);
    }
  }, [searchParams]);

  const form = useForm<ClientLoginSchema>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      role: initialRole, 
    },
  });
  
  useEffect(() => {
    form.reset({ role: initialRole, email: '', password: '' });
  }, [initialRole, form]);


  const handleLogin = async (formData: ClientLoginSchema) => {
    setIsSubmitting(true);
    const actionData: LoginFormData = { 
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };
    
    const response: AuthActionResponse = await loginAction(actionData);
    const fromPath = searchParams.get('from');

    if (response.success && response.userId && response.role && response.email) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', response.role);
        localStorage.setItem('userId', String(response.userId)); 
        localStorage.setItem('userEmail', response.email);
        if (response.role === 'employer' && response.companyLogoUrl) {
          localStorage.setItem('companyLogoUrl', response.companyLogoUrl);
        } else {
          localStorage.removeItem('companyLogoUrl'); 
        }
      }
      
      toast({
        title: 'Login Successful!',
        description: 'Redirecting...',
        variant: 'default',
        duration: 1500, 
      });
      
      if (fromPath && fromPath !== currentPathname) { // Ensure 'from' is not the login page itself
        router.push(fromPath);
      } else {
        const targetPath = response.role === 'jobSeeker' ? '/jobSeeker/dashboard' : '/employer/control';
        router.push(targetPath);
      }
    } else {
      toast({
        title: 'Login Failed',
        description: response.error || 'An unexpected error occurred. Please check your credentials.',
        variant: 'destructive',
      });
      if (response.validationErrors) {
        response.validationErrors.forEach(err => {
          form.setError(err.path[0] as keyof ClientLoginSchema, { message: err.message });
        });
      }
       setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const fromPath = searchParams.get('from');
     // If 'from' exists and is not the login page, go there. Otherwise, go to respective landing page.
    if (fromPath && fromPath !== currentPathname) {
      router.push(fromPath);
    } else {
       const role = form.getValues('role') || initialRole || localStorage.getItem('userRole');
        if (role === 'jobSeeker') {
            router.push('/jobSeeker');
        } else if (role === 'employer') {
            router.push('/employer');
        } else {
            router.push('/'); 
        }
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
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
          <CardDescription>Log in to access your account</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...form.register('email')} className="transition-default focus:ring-primary focus:border-primary" />
              {form.formState.errors.email && <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...form.register('password')} className="transition-default focus:ring-primary focus:border-primary" />
              {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
            </div>

             <div className="space-y-3 !mt-8">
               <Label className="font-medium">Log in as:</Label>
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

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11 text-base font-semibold transition-default" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <LogIn className="mr-2 h-5 w-5"/>}
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="bg-secondary/30 p-4 text-center">
            <p className="text-sm text-muted-foreground w-full">
              Don't have an account?{' '}
              <Link href={{ pathname: "/signup", query: searchParams.toString() ? { from: searchParams.get('from'), role: searchParams.get('role') } : { role: initialRole } }} className="font-medium text-primary hover:underline">
                Sign up
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


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, UserSearch, Building2, LogIn, Info, ArrowRight, SearchCheck, Users, BrainCircuit, SlidersHorizontal, TrendingUp, Briefcase, Settings, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type UserRole = 'jobSeeker' | 'employer';

interface SparkleStyle {
  left: string;
  top: string;
  width: string;
  height: string;
  animationDelay: string;
  animationDuration: string;
}

interface FloatingIconStyle extends SparkleStyle {
  // No additional properties needed for now, inherits from SparkleStyle
}

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [sparkleStyles, setSparkleStyles] = useState<SparkleStyle[]>([]);
  const [floatingIconStyles, setFloatingIconStyles] = useState<FloatingIconStyle[]>([]);
  const router = useRouter();

  useEffect(() => {
    const generatedSparkles = Array.from({ length: 10 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`, // Smaller sparkles
      height: `${Math.random() * 3 + 1}px`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${Math.random() * 2 + 3}s`, // Slower, more subtle pulse
    }));
    setSparkleStyles(generatedSparkles);

    const generatedFloatingIcons = Array.from({ length: 5 }, () => ({
      left: `${Math.random() * 90}%`, // Keep icons within bounds
      top: `${Math.random() * 90}%`,
      width: `${Math.random() * 20 + 25}px`, // Larger icons
      height: `${Math.random() * 20 + 25}px`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 10 + 10}s`, // Slower float
    }));
    setFloatingIconStyles(generatedFloatingIcons);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowRoleSelection(true);
    }, 500); // Slightly longer to appreciate loading screen more

    return () => clearTimeout(timer);
  }, []);


  const handleRoleSelection = useCallback((role: UserRole) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role);
    }
    router.push(`/${role}`);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background p-4 text-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          {sparkleStyles.map((style, i) => (
            <Sparkles
              key={`bg-sparkle-${i}`}
              className="absolute text-primary/20 animate-subtle-pulse"
              style={style}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="p-4 bg-primary/10 rounded-full mb-6 shadow-lg ring-4 ring-primary/20">
             <Sparkles className="h-20 w-20 text-primary animate-logo-pulse" />
          </div>
          <h1 className="text-5xl font-extrabold text-primary mb-3 tracking-tight">
            JobsAI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-lg">
            Initializing Intelligent Connections...
          </p>
          <div className="w-72 h-2.5 bg-primary/20 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-accent to-primary animate-progress-bar" style={{ width: '0%' }}></div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes progress-bar-fill {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-progress-bar {
            animation: progress-bar-fill 0.5s ease-out forwards;
          }
          @keyframes logo-pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
          .animate-logo-pulse {
            animation: logo-pulse 2s infinite ease-in-out;
          }
           @keyframes subtle-pulse {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.4; }
          }
          .animate-subtle-pulse {
            animation: subtle-pulse var(--animation-duration, 4s) var(--animation-delay, 0s) infinite ease-in-out;
          }
        `}</style>
      </div>
    );
  }


  if (showRoleSelection) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background p-6 transition-opacity duration-700 ease-in-out opacity-100 overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 opacity-70">
            <Image
                src="https://placehold.co/1920x1080.png" 
                data-ai-hint="abstract technology"
                alt="Abstract technology background"
                fill
                style={{objectFit: 'cover'}}
                className="opacity-10 blur-sm" // Reduced opacity and more blur
                priority
                sizes="100vw"
            />
            {floatingIconStyles.map((style, i) => { // Use floatingIconStyles
                const Icon = [UserSearch, Building2, Briefcase, BrainCircuit, TrendingUp][i % 5];
                return (
                    <Icon
                        key={`float-icon-${i}`}
                        className="absolute text-primary/5 animate-float opacity-50" // More transparent icons
                        style={{
                            ...style, // Spread the style object
                            width: `${parseFloat(style.width) * 1.2}px`, 
                            height: `${parseFloat(style.height) * 1.2}px`,
                        }}
                    />
                );
            })}
        </div>
        <header className="my-10 md:my-16 text-center relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6 shadow-lg ring-4 ring-primary/20">
            <Sparkles className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tighter">
            JobsAI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
            Your intelligent partner in navigating the future of work. Connect, discover, and grow with JobsAI.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12 md:mb-20 relative z-10">
          <Card className="group transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-accent rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm">
            <CardHeader className="p-8 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-accent/20 rounded-lg text-accent">
                  <SearchCheck className="h-10 w-10" />
                </div>
                <CardTitle className="text-3xl font-bold text-accent">For Job Seekers</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-base leading-relaxed">
                Navigate your career path with AI-driven insights. Get personalized job matches, resume tips, and interview preparation tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Button
                onClick={() => handleRoleSelection('jobSeeker')}
                variant="default"
                size="lg"
                className="w-full h-12 text-lg font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 group-hover:tracking-wider shadow-md hover:shadow-lg"
                aria-label="Proceed as Job Seeker"
              >
                Find My Next Role <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>

          <Card className="group transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-primary rounded-xl overflow-hidden bg-card/90 backdrop-blur-sm">
            <CardHeader className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
               <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/20 rounded-lg text-primary">
                  <Users className="h-10 w-10" />
                </div>
                <CardTitle className="text-3xl font-bold text-primary">For Employers</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-base leading-relaxed">
                Streamline your hiring. Access a diverse talent pool, leverage AI for candidate screening, and reduce time-to-hire significantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Button
                onClick={() => handleRoleSelection('employer')}
                variant="default"
                size="lg"
                className="w-full h-12 text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 group-hover:tracking-wider shadow-md hover:shadow-lg"
                aria-label="Proceed as Employer"
              >
                Hire Top Talent <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="w-full max-w-5xl mb-12 md:mb-20 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Why Choose <span className="text-primary">JobsAI</span>?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center bg-card/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
              <CardHeader className="bg-secondary/30 p-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary/15 rounded-full mb-4 shadow-inner">
                    <BrainCircuit className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Intelligent Matching</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">Our AI analyzes profiles and job descriptions to create precise, relevant connections, saving you time and effort.</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-card/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
              <CardHeader className="bg-secondary/30 p-6">
                <div className="inline-flex items-center justify-center p-3 bg-accent/15 rounded-full mb-4 shadow-inner">
                    <SlidersHorizontal className="h-10 w-10 text-accent" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Efficient Tools</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">From AI-assisted job posting to smart search filters, we provide the tools you need for a seamless experience.</p>
              </CardContent>
            </Card>
            <Card className="text-center bg-card/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
              <CardHeader className="bg-secondary/30 p-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary/15 rounded-full mb-4 shadow-inner">
                    <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Career & Talent Growth</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">Empowering job seekers to advance their careers and helping employers build exceptional teams.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="mt-auto w-full max-w-4xl border-t border-border/50 pt-8 pb-8 relative z-10">
          <p className="text-muted-foreground text-center mb-4">
            Already part of the JobsAI community or want to learn more?
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button variant="outline" asChild className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary group transition-default shadow-sm hover:shadow-md">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5 transition-colors" /> Log In
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary hover:bg-transparent group transition-default">
              <Link href="/about">
                <Info className="mr-2 h-5 w-5 transition-colors" /> Learn More
              </Link>
            </Button>
            <Link href="/admin-login" passHref legacyBehavior>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary hover:bg-transparent group transition-default"
                aria-label="Admin Panel Options"
                title="Admin Panel Options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </footer>
        
        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-20px) rotate(3deg); }
            50% { transform: translateY(0px) rotate(0deg); }
            75% { transform: translateY(20px) rotate(-3deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .animate-float {
            animation-name: float;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
        `}</style>
      </div>
    );
  }

  return null;
}

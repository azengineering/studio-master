import { HeroSection } from '@/components/hero-section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Zap, Filter, BrainCircuit, UsersRound, Handshake, Wand2, Target, BarChartHorizontalBig, Settings2, ArrowRight, CheckSquare } from 'lucide-react';
import Image from 'next/image';

const howItWorksSteps = [
  {
    icon: BrainCircuit,
    title: 'Intelligent Candidate Matching',
    description: 'Our AI sifts through profiles to find candidates whose skills, experience, and cultural fit align perfectly with your requirements.',
    bgColor: 'bg-accent/5',
    iconColor: 'text-accent',
  },
  {
    icon: UsersRound,
    title: 'Review & Engage Top Talent',
    description: 'Access a curated list of matched candidates. Review profiles, shortlist, manage applications, and connect directly.',
    bgColor: 'bg-green-500/5',
    iconColor: 'text-green-600',
  },
  {
    icon: Handshake,
    title: 'Hire with Confidence',
    description: 'Make informed hiring decisions with comprehensive candidate insights and streamline your offer and onboarding process.',
    bgColor: 'bg-blue-500/5',
    iconColor: 'text-blue-600',
  },
];

const keyAdvantages = [
    {
        icon: Target,
        title: "Precision Candidate Matching",
        description: "Go beyond keywords. Our AI understands context and skills to deliver highly relevant candidate matches, reducing screening time.",
        imageHint: "target accuracy",
    },
    {
        icon: BarChartHorizontalBig,
        title: "Data-Driven Insights",
        description: "Access analytics on your hiring pipeline, candidate demographics, and job performance to make informed strategic decisions.",
        imageHint: "analytics dashboard",
    },
     {
        icon: Wand2, // Or a more relevant icon for managing company presence
        title: "Enhanced Company Profile",
        description: "Showcase your company culture and values with a comprehensive profile to attract candidates who align with your vision.",
        imageHint: "company branding office",
    },
];


export default function EmployerHomePage() {
  return (
    <>
      <HeroSection role="employer" />

       {/* Unlock Hiring Efficiency Section */}
       <section className="container max-w-screen-2xl py-16 bg-gradient-to-b from-secondary/30 to-background">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Unlock Hiring Efficiency with JobsAI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
            <CardHeader className="bg-secondary/50 p-6">
              <Users className="h-12 w-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">Access Quality Candidates</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Reach a diverse pool of skilled professionals actively seeking opportunities in our curated talent network.</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
            <CardHeader className="bg-secondary/50 p-6">
              <Zap className="h-12 w-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">Accelerate Time-to-Hire</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Our AI speeds up candidate screening and matching, significantly saving valuable time and resources.</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
            <CardHeader className="bg-secondary/50 p-6">
              <Filter className="h-12 w-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">Smart Filtering & Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Utilize advanced filters and leverage AI-driven insights to pinpoint the best-fit candidates effortlessly.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container max-w-screen-2xl py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">How It Works for Employers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {/* Adjusted to md:grid-cols-3 as there are 3 steps now */}
          {howItWorksSteps.map((step, index) => (
            <Card key={index} className={`group text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden`}>
              <CardHeader className={`p-6 ${step.bgColor}`}>
                <div className="relative mx-auto mb-4">
                    <step.icon className={`h-16 w-16 ${step.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Platform Advantages Section */}
      <section className="container max-w-screen-2xl py-16 bg-secondary/20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Key Platform Advantages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {keyAdvantages.map((advantage, index) => (
            <Card key={index} className="group bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden flex flex-col">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={`https://picsum.photos/seed/advantage${index}/600/375`}
                  alt={advantage.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-500 group-hover:scale-105"
                  data-ai-hint={advantage.imageHint}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70 group-hover:opacity-30 transition-opacity duration-500"></div>
              </div>
              <CardHeader className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <advantage.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors">{advantage.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-grow">
                <p className="text-sm text-muted-foreground">{advantage.description}</p>
              </CardContent>
              <CardFooter className="p-6 pt-2">
                 <Button variant="link" size="sm" asChild className="text-accent hover:text-accent/80 group-hover:underline p-0">
                    <Link href="/employer/tools">
                        Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-screen-lg py-20">
        <Card className="bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground p-8 md:p-12 rounded-xl shadow-2xl text-center">
          <CheckSquare className="h-16 w-16 mx-auto mb-6 text-background/80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Next Star Employee?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-background/90">
            Join hundreds of companies transforming their recruitment with JobsAI.
            Access our tools to connect with exceptional talent.
          </p>
          <Button size="lg" variant="secondary" asChild className="bg-background text-primary hover:bg-background/90 transition-default group text-lg px-8 py-3 shadow-md">
            <Link href="/employer/control">
              Go to Control Panel <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Card>
      </section>

      {/* TODO: Add Testimonials etc. */}
    </>
  );
}

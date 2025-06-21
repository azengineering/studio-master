import { HeroSection } from '@/components/hero-section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, CheckCircle, TrendingUp, FilePenLine, ArrowRight, Search } from 'lucide-react';
import Image from 'next/image';

const howItWorksSteps = [
  {
    icon: FilePenLine,
    title: 'Craft Your Profile',
    description: 'Showcase your skills and experience. A complete profile helps our AI understand your career goals.',
    bgColor: 'bg-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: Sparkles,
    title: 'Explore AI Career Tools',
    description: 'Utilize AI-powered tools to refine your resume, prepare for interviews, and gain career insights.',
    bgColor: 'bg-accent/5',
    iconColor: 'text-accent',
  },
  {
    icon: TrendingUp,
    title: 'Advance Your Career',
    description: 'Leverage insights and tools to make informed decisions and actively pursue your career development.',
    bgColor: 'bg-green-500/5', 
    iconColor: 'text-green-600',
  },
];

const featuredTools = [ // Changed from featuredJobs
  {
    title: 'AI Resume Analyzer',
    category: 'Career Preparation',
    description: 'Get instant feedback on your resume to highlight your strengths and improve its impact.',
    imageHint: 'resume analysis AI',
    link: '/jobSeeker/tools', // Link to tools page
  },
  {
    title: 'Interview Prep Kit',
    category: 'Skill Development',
    description: 'Practice common interview questions and receive AI-driven tips to ace your next interview.',
    imageHint: 'interview preparation online',
    link: '/jobSeeker/tools',
  },
  {
    title: 'Career Path Explorer',
    category: 'Guidance & Planning',
    description: 'Discover potential career paths based on your skills and interests with AI-powered suggestions.',
    imageHint: 'career path graph',
    link: '/jobSeeker/tools',
  },
];


export default function JobSeekerHomePage() {
  return (
    <>
      <HeroSection role="jobSeeker" />

      {/* Why Choose JobsAI Section */}
      <section className="container max-w-screen-2xl py-16 bg-gradient-to-b from-secondary/30 to-background">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Why Choose JobsAI for Your Career?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
            <CardHeader className="bg-secondary/50 p-6">
              <Sparkles className="h-12 w-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Receive guidance precisely tailored to your skills, experience, and career aspirations.</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
            <CardHeader className="bg-secondary/50 p-6">
              <CheckCircle className="h-12 w-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">Personalized Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Access a suite of AI tools designed to enhance your job readiness and career planning.</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden">
            <CardHeader className="bg-secondary/50 p-6">
              <TrendingUp className="h-12 w-12 mx-auto text-accent mb-4" />
              <CardTitle className="text-xl font-semibold text-foreground">Career Growth Focus</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Utilize AI to enhance your resume, prepare for interviews, and effectively plan your career trajectory.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container max-w-screen-2xl py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Start Your Journey in 3 Simple Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* Featured Tools Section - Replaced Featured Jobs */}
      <section className="container max-w-screen-2xl py-16 bg-secondary/20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Explore Our AI Career Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredTools.map((tool, index) => (
            <Card key={index} className="group bg-card hover:shadow-xl transition-all duration-300 ease-in-out border border-border transform hover:-translate-y-1 rounded-lg overflow-hidden flex flex-col">
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={`https://picsum.photos/seed/tool${index}/600/300`}
                  alt={tool.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-500 group-hover:scale-105"
                  data-ai-hint={tool.imageHint}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-semibold text-primary group-hover:text-accent transition-colors">{tool.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{tool.category}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{tool.description}</p>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex justify-end items-center border-t mt-auto">
                <Button variant="link" size="sm" asChild className="text-accent hover:text-accent/80 group-hover:underline">
                  <Link href={tool.link}>
                    Explore Tool <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 transition-default group">
            <Link href="/jobSeeker/tools">
              Discover All Tools <Search className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-screen-lg py-20">
        <Card className="bg-gradient-to-r from-primary/80 to-accent/80 text-primary-foreground p-8 md:p-12 rounded-xl shadow-2xl text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-background/80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Shape Your Career Future?</h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-background/90">
            Join thousands of job seekers who are leveraging AI for career success with JobsAI.
            Create your profile today and let our AI empower your journey.
          </p>
          <Button size="lg" variant="secondary" asChild className="bg-background text-primary hover:bg-background/90 transition-default group text-lg px-8 py-3 shadow-md">
            <Link href="/signup?role=jobSeeker">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </Card>
      </section>
    </>
  );
}

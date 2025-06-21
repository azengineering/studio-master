import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowRight, Briefcase, Search } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
  role: 'jobSeeker' | 'employer';
}

const content = {
  jobSeeker: {
    title: 'Unlock Your Next Career Move with AI Precision',
    description: 'Discover tailored job opportunities that match your unique skills and ambitions. JobsAI intelligently guides you to your dream role faster than ever.',
    ctaText: 'Start Your Job Search',
    ctaLink: '/jobSeeker/find-jobs',
    imageSrc: 'https://picsum.photos/seed/jobseekerhero/1200/800', 
    imageAlt: 'Professional job seeker using a laptop to find opportunities',
    imageHint: 'career growth computer',
    icon: Search,
  },
  employer: {
    title: 'Hire Top Talent Faster with AI',
    description: 'Streamline your recruitment process and connect with qualified candidates using our advanced AI matching technology.',
    ctaText: 'Access Employer Tools',
    ctaLink: '/employer/dashboard', // Changed from /employer/post-jobs
    imageSrc: 'https://picsum.photos/seed/employerhero/1200/800', 
    imageAlt: 'Employer reviewing candidates on a tablet',
    imageHint: 'recruitment meeting tablet',
    icon: Briefcase,
  },
};

export function HeroSection({ role }: HeroSectionProps) {
  const { title, description, ctaText, ctaLink, imageSrc, imageAlt, imageHint, icon: Icon } = content[role];

  return (
    <section className="container max-w-screen-2xl py-16 md:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-primary tracking-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
            {description}
          </p>
          <Button 
            size="lg" 
            asChild 
            className="bg-accent text-accent-foreground hover:bg-accent/90 transition-default group text-lg px-8 py-3 shadow-lg hover:shadow-accent/30 transform hover:scale-105"
            aria-label={ctaText}
            >
            <Link href={ctaLink}>
              <Icon className="mr-2 h-5 w-5" />
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-primary/10 group transform transition-all duration-500 hover:scale-105 hover:shadow-primary/20">
           <Image
             src={imageSrc}
             alt={imageAlt}
             fill
             style={{ objectFit: 'cover' }}
             data-ai-hint={imageHint}
             className="transition-transform duration-700 ease-in-out group-hover:scale-110"
             priority 
             sizes="(max-width: 768px) 100vw, 50vw" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-50 group-hover:opacity-20 transition-opacity duration-500"></div>
        </div>
      </div>
    </section>
  );
}

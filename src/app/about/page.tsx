import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/header'; // Assuming a generic header might be needed if accessed directly
import { Footer } from '@/components/layout/footer';
import Image from 'next/image';

export default function AboutPage() {
  // A generic About page. Ideally, navigation should lead to role-specific about pages.
  // This page serves as a fallback or general info page.
  return (
     <div className="flex flex-col min-h-screen">
       {/* Using jobSeeker header as a fallback, consider a more generic one or redirect logic */}
       <Header role="jobSeeker" />
       <main className="flex-grow container max-w-screen-lg py-12">
        <Card className="overflow-hidden">
           <div className="relative h-48 w-full">
               <Image
                  src="https://picsum.photos/1200/300"
                  alt="Abstract background representing technology and connection"
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint="abstract network technology"
                  sizes="(max-width: 1024px) 100vw, 1024px"
               />
           </div>
          <CardHeader className="pt-6">
            <CardTitle className="text-3xl font-bold text-primary">About JobsAI</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Revolutionizing Recruitment with Artificial Intelligence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              JobsAI is a cutting-edge platform designed to bridge the gap between talented job seekers and innovative employers. We leverage the power of artificial intelligence to create smarter, faster, and more relevant connections in the job market.
            </p>
             <p>
              Our mission is to streamline the hiring process, making it more efficient and effective for everyone involved. For job seekers, we provide personalized recommendations and tools to navigate their career path. For employers, we offer intelligent solutions to find and attract the best talent.
            </p>
             <h3 className="text-xl font-semibold text-primary pt-4">Our Vision</h3>
             <p>
               We envision a future where finding the right job or the perfect candidate is no longer a daunting task, but a seamless experience powered by intelligent technology and human insight.
             </p>
             {/* TODO: Add more sections like 'Our Team', 'Our Technology', 'Values' */}
          </CardContent>
        </Card>
       </main>
       <Footer />
    </div>
  );
}


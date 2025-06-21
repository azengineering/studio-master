import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useEffect, useState } from 'react';


export default function PrivacyPolicyPage() {
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString());
  }, []);

  return (
     <div className="flex flex-col min-h-screen">
       {/* Using jobSeeker header as a fallback */}
       <Header role="jobSeeker" />
       <main className="flex-grow container max-w-screen-lg py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
             <CardDescription className="text-muted-foreground">Last Updated: {lastUpdated || 'Loading...'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose max-w-none">
             {/* Replace with actual Privacy Policy content */}
            <p>Welcome to JobsAI's Privacy Policy. Your privacy is critically important to us.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">1. Information We Collect</h2>
             <p>We collect information you provide directly to us (like when you create an account), information collected automatically (like log data), and information from third parties.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">2. How We Use Information</h2>
             <p>We use the information we collect to provide, maintain, and improve our services, including using AI to match job seekers with employers, communicate with you, and personalize your experience.</p>

              <h2 className="text-xl font-semibold text-primary pt-4">3. How We Share Information</h2>
              <p>We may share information with vendors, consultants, and other service providers, in response to legal requests, or if we believe disclosure is necessary to protect the rights, property, or safety of JobsAI, our users, or others. Job seeker profiles may be shared with potential employers, and job postings may be shared with potential candidates, based on user settings and platform functionality.</p>

              <h2 className="text-xl font-semibold text-primary pt-4">4. AI and Data Usage</h2>
              <p>Our AI features analyze the data you provide (like resumes, job descriptions) to generate matches and insights. We are committed to responsible AI practices and data security.</p>

              <h2 className="text-xl font-semibold text-primary pt-4">5. Your Choices</h2>
              <p>You have choices regarding your information, including accessing, updating, or deleting your account information.</p>

              <h2 className="text-xl font-semibold text-primary pt-4">6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@jobsai.com.</p>

              <p className="text-sm text-muted-foreground italic">This is a placeholder privacy policy. Consult with a legal professional to draft a comprehensive policy suitable for your specific services and jurisdiction.</p>
          </CardContent>
        </Card>
       </main>
       <Footer />
    </div>
  );
}

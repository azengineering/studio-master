import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useEffect, useState } from 'react';


export default function TermsOfServicePage() {
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
            <CardTitle className="text-3xl font-bold text-primary">Terms of Service</CardTitle>
             <CardDescription className="text-muted-foreground">Last Updated: {lastUpdated || 'Loading...'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose max-w-none">
             {/* Replace with actual Terms of Service content */}
            <p>Welcome to JobsAI! These Terms of Service ("Terms") govern your use of the JobsAI website and services ("Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">1. Use of Service</h2>
             <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must be of legal age to form a binding contract to use the Service. You are responsible for maintaining the confidentiality of your account.</p>
              <p>You may not register or use the Service for both job seeker and employer roles simultaneously with the same account credentials.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">2. User Content</h2>
             <p>You retain ownership of any content you submit (e.g., resume details, job postings). By submitting content, you grant JobsAI a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with the Service, including for AI analysis and matching.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">3. AI Features</h2>
             <p>The Service includes AI-powered features. While we strive for accuracy, AI outputs (like job matches or generated descriptions) are provided for informational purposes and may contain inaccuracies. You are responsible for reviewing and verifying any AI-generated content.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">4. Disclaimers</h2>
             <p>The Service is provided "as is" without warranties of any kind. JobsAI does not guarantee employment or candidate placement.</p>

             <h2 className="text-xl font-semibold text-primary pt-4">5. Limitation of Liability</h2>
             <p>JobsAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>

              <h2 className="text-xl font-semibold text-primary pt-4">6. Governing Law</h2>
              <p>These Terms shall be governed by the laws of the State of Texas, without regard to its conflict of law provisions.</p>

              <h2 className="text-xl font-semibold text-primary pt-4">7. Changes to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page.</p>

               <h2 className="text-xl font-semibold text-primary pt-4">8. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at legal@jobsai.com.</p>

             <p className="text-sm text-muted-foreground italic">This is a placeholder terms of service. Consult with a legal professional to draft comprehensive terms suitable for your specific services and jurisdiction.</p>
          </CardContent>
        </Card>
       </main>
       <Footer />
    </div>
  );
}

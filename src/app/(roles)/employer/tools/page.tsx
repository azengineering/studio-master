import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Users, FileText } from 'lucide-react';

export default function EmployerToolsPage() {
  return (
    <div className="container max-w-screen-lg py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Recruiter Tools Dashboard</CardTitle>
           <CardDescription>Access powerful tools to enhance your recruitment strategy.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-accent"/> AI Candidate Screening
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">Automatically screen resumes and applications based on job requirements.</p>
                 {/* TODO: Link to screening tool */}
                 <Button variant="link" className="p-0 h-auto mt-2 text-primary">Go to Screening Tool</Button>
              </CardContent>
           </Card>
           <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-accent"/> Talent Pool Insights
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">Analyze your candidate pipeline and identify top performers.</p>
                  {/* TODO: Link to insights tool */}
                 <Button variant="link" className="p-0 h-auto mt-2 text-primary">View Talent Insights</Button>
              </CardContent>
           </Card>
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart className="h-5 w-5 text-accent"/> Hiring Analytics
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">Track key recruitment metrics and optimize your hiring process.</p>
                  {/* TODO: Link to analytics tool */}
                 <Button variant="link" className="p-0 h-auto mt-2 text-primary">Access Analytics</Button>
              </CardContent>
           </Card>
            {/* TODO: Add more tool cards */}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function JobSeekerAboutPage() {
  return (
    <div className="container max-w-screen-lg py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">About JobsAI for Job Seekers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the About page for Job Seekers! Here we'll explain how JobsAI helps you find your next career move using cutting-edge AI technology.
            [Content to be added]
          </p>
           {/* TODO: Add detailed content about the platform's benefits for job seekers */}
        </CardContent>
      </Card>
    </div>
  );
}

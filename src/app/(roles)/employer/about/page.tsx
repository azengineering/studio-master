import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployerAboutPage() {
  return (
    <div className="container max-w-screen-lg py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-primary">About JobsAI for Employers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Welcome to the About page for Employers! Discover how JobsAI can revolutionize your hiring process, helping you find the perfect candidates faster with AI.
            [Content to be added]
          </p>
           {/* TODO: Add detailed content about the platform's benefits for employers */}
        </CardContent>
      </Card>
    </div>
  );
}

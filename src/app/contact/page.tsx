import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  // TODO: Add form handling logic
   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     console.log('Contact form submitted (placeholder)');
     // Add logic to send form data
   };


  return (
     <div className="flex flex-col min-h-screen">
       {/* Using jobSeeker header as a fallback */}
       <Header role="jobSeeker" />
       <main className="flex-grow container max-w-screen-lg py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Contact Us</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">We'd love to hear from you!</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6">
                <h3 className="text-xl font-semibold text-primary">Get in Touch</h3>
                 <p className="flex items-start gap-3">
                   <MapPin className="h-5 w-5 text-accent mt-1 shrink-0" />
                   <span>123 AI Avenue, Tech City, TX 75001</span>
                 </p>
                 <p className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-accent shrink-0" />
                    <a href="mailto:info@jobsai.com" className="hover:text-primary">info@jobsai.com</a>
                 </p>
                 <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-accent shrink-0" />
                    <a href="tel:+1234567890" className="hover:text-primary">+1 (234) 567-890</a>
                 </p>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your Name" required />
                 </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your Email" required />
                 </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="Subject" required />
                 </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Your Message" required rows={5}/>
                 </div>
                 <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Send Message</Button>
             </form>
          </CardContent>
        </Card>
       </main>
       <Footer />
    </div>
  );
}

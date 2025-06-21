// src/app/public-profile/[userId]/page.tsx
import { getJobSeekerProfile } from "@/app/(roles)/jobSeeker/dashboard/actions";
import type { JobSeekerProfileFormData, EducationDetail, ExperienceDetail } from "@/app/(roles)/jobSeeker/dashboard/profile-schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Mail, Phone, Globe, Github, MapPin, BriefcaseBusiness, GraduationCap, BookOpen, ExternalLink, CalendarDays, InfoIcon, Layers, Tag, Users as UsersIcon, Type, FileText
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import NextImage from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

async function fetchProfile(userId: string): Promise<JobSeekerProfileFormData | null> {
  try {
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      console.error("[PublicProfilePage] Invalid userId parameter:", userId);
      return null;
    }
    const response = await getJobSeekerProfile(id);
    if (response.success && response.data) {
      return response.data;
    }
    console.error("[PublicProfilePage] Failed to fetch profile:", response.error);
    return null;
  } catch (error) {
    console.error("[PublicProfilePage] Exception fetching profile:", error);
    return null;
  }
}

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  const profile = await fetchProfile(params.userId);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary/20 p-8">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive">Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested profile could not be loaded or does not exist.</p>
            <Button asChild variant="link" className="mt-4">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length -1]) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length > 1) return parts[0].substring(0, 2).toUpperCase();
    if (parts.length === 1 && parts[0].length === 1) return parts[0].toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  
  const formatMonthYear = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) { 
            return `${new Date(dateString + 'T00:00:00').toLocaleString('default', { month: 'short' })}, ${parts[0]}`;
        } else if (parts.length === 2) { 
             const month = parseInt(parts[0], 10);
             const year = parseInt(parts[1], 10);
             if (!isNaN(month) && !isNaN(year) && month >=1 && month <=12) {
                const date = new Date(year, month - 1);
                return `${date.toLocaleString('default', { month: 'short' })}, ${year}`;
             }
        }
    }
    return dateString; 
  };


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-secondary/30 py-8 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-3xl mx-auto shadow-2xl border border-border rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-card to-card p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-28 w-28 border-4 border-primary/30 shadow-lg">
                {profile.profilePictureUrl ? (
                  <AvatarImage src={profile.profilePictureUrl} alt={profile.fullName || "Profile Picture"} />
                ) : (
                  <AvatarFallback className="text-3xl bg-primary/20 text-primary font-semibold">
                    {getInitials(profile.fullName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center sm:text-left flex-grow">
                <CardTitle className="text-3xl font-bold text-primary">{profile.fullName || "Job Seeker"}</CardTitle>
                {profile.currentDesignation && <p className="text-lg text-muted-foreground">{profile.currentDesignation}</p>}
                {profile.currentCity && profile.currentPinCode && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> {profile.currentCity}, {profile.currentPinCode}
                  </p>
                )}
                 <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3 items-center">
                  {profile.email && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a href={`mailto:${profile.email}`} className="text-primary hover:underline flex items-center gap-1 p-1 rounded-md hover:bg-primary/10 transition-colors">
                            <Mail className="h-4 w-4"/> <span className="text-xs sm:hidden md:inline">Email</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent><p>{profile.email}</p></TooltipContent>
                    </Tooltip>
                  )}
                  {profile.phoneNumber && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a href={`tel:${profile.phoneNumber}`} className="text-primary hover:underline flex items-center gap-1 p-1 rounded-md hover:bg-primary/10 transition-colors">
                            <Phone className="h-4 w-4"/> <span className="text-xs sm:hidden md:inline">Phone</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent><p>{profile.phoneNumber}</p></TooltipContent>
                    </Tooltip>
                  )}
                  {profile.resumeUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button asChild variant="outline" size="icon" className="h-8 w-8 border-primary/30 text-primary/80 hover:bg-primary/10 hover:text-primary">
                          <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="View Resume/CV">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>View Resume/CV</p></TooltipContent>
                    </Tooltip>
                  )}
                  {/* LinkedIn Profile Link Removed from here */}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Professional Summary Removed from here */}

            {profile.skills && profile.skills.length > 0 && (
              <section>
                <Separator className="my-5"/>
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2"><Tag className="h-5 w-5 text-primary"/>Key Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => <Badge key={index} variant="secondary" className="text-sm">{skill}</Badge>)}
                </div>
              </section>
            )}
            
            {profile.experienceDetails && profile.experienceDetails.length > 0 && (
              <section>
                <Separator className="my-5"/>
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><Layers className="h-5 w-5 text-primary"/>Work Experience</h2>
                <div className="space-y-4">
                  {profile.experienceDetails.map((exp, index) => (
                    <div key={exp.id || index} className="p-4 border rounded-lg bg-card shadow-sm">
                      <h3 className="font-semibold text-md text-primary">{exp.designation}</h3>
                      <p className="text-sm font-medium text-foreground">{exp.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatMonthYear(exp.startDate)} - {exp.isPresent ? 'Present' : formatMonthYear(exp.endDate)}
                      </p>
                      {exp.aboutCompany && <p className="text-xs text-muted-foreground mt-1 italic">About {exp.companyName}: {exp.aboutCompany}</p>}
                      {exp.responsibilities && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{exp.responsibilities}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profile.educationalDetails && profile.educationalDetails.length > 0 && (
              <section>
                <Separator className="my-5"/>
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/>Education</h2>
                <div className="space-y-3">
                  {profile.educationalDetails.map((edu, index) => (
                    <div key={edu.id || index} className="p-3 border rounded-md bg-card shadow-sm">
                      <h3 className="font-semibold text-md text-primary">{edu.qualification} - {edu.stream}</h3>
                      <p className="text-sm text-foreground">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">Completed: {edu.yearOfCompletion} {edu.percentageMarks ? `| Marks: ${edu.percentageMarks}%` : ''}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {(profile.portfolioUrl || profile.githubProfileUrl || profile.otherSocialLinks) && (
              <section>
                <Separator className="my-5"/>
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2"><ExternalLink className="h-5 w-5 text-primary"/>Online Presence</h2>
                <div className="space-y-2 text-sm">
                    {profile.portfolioUrl && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Globe className="h-4 w-4 text-primary shrink-0"/>
                        <span className="font-medium text-foreground">Portfolio/Website:</span>
                        <a href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {profile.portfolioUrl}
                        </a>
                    </p>
                    )}
                    {profile.githubProfileUrl && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Github className="h-4 w-4 text-primary shrink-0"/>
                        <span className="font-medium text-foreground">GitHub:</span>
                        <a href={profile.githubProfileUrl.startsWith('http') ? profile.githubProfileUrl : `https://${profile.githubProfileUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {profile.githubProfileUrl}
                        </a>
                    </p>
                    )}
                    {profile.otherSocialLinks && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                        <UsersIcon className="h-4 w-4 text-primary shrink-0"/>
                        <span className="font-medium text-foreground">Other Links:</span>
                        <span>{profile.otherSocialLinks}</span>
                    </p>
                    )}
                </div>
              </section>
            )}

          </CardContent>
          <CardFooter className="p-4 bg-secondary/30 border-t border-border text-center">
               <p className="text-xs text-muted-foreground w-full">
                  Profile shared via JobsAI.
              </p>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}

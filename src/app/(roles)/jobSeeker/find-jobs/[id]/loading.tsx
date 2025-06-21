// src/app/(roles)/jobSeeker/find-jobs/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Briefcase, Building, MapPin, Tag, InfoIcon, FileText, HelpCircle, Send, Bookmark, Share2 } from "lucide-react";

export default function LoadingJobDetail() {
  return (
    <div className="container max-w-screen-lg py-8 md:py-12">
      <div className="mb-6">
         <Skeleton className="h-10 w-28 rounded-md" /> {/* Back button placeholder */}
      </div>
      
      <Card className="shadow-xl border border-border rounded-xl overflow-hidden">
        <CardHeader className="p-6 bg-gradient-to-br from-card to-secondary/20 border-b border-border">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-lg shrink-0" /> {/* Company Logo placeholder */}
            <div className="flex-grow space-y-2">
              <Skeleton className="h-8 w-3/4 md:w-2/3 rounded" /> {/* Title placeholder */}
              <Skeleton className="h-5 w-1/2 rounded" /> {/* Company Name placeholder */}
              <Skeleton className="h-5 w-1/3 rounded" /> {/* Location placeholder */}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Job Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-1/4 rounded" /> {/* Label placeholder */}
                <Skeleton className="h-5 w-3/4 rounded" /> {/* Value placeholder */}
              </div>
            ))}
          </div>

          {/* Skills Section */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3 rounded" /> {/* Skills title placeholder */}
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" /> // Skill badge placeholder
              ))}
            </div>
          </div>
          
          {/* Additional Data Section */}
           <div className="space-y-2">
            <Skeleton className="h-6 w-1/4 rounded" /> {/* Additional Data title placeholder */}
            <Skeleton className="h-20 w-full rounded-md" /> {/* Additional Data content placeholder */}
          </div>


          {/* Job Description Section */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3 rounded" /> {/* Job Description title placeholder */}
            <Skeleton className="h-48 w-full rounded-md" /> {/* Job Description content placeholder */}
          </div>

          {/* Custom Questions Section */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/3 rounded" /> {/* Custom Questions title placeholder */}
             <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" /> // Question placeholder
                ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 bg-secondary/20 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
           <div className="flex flex-wrap gap-2">
             <Skeleton className="h-9 w-24 rounded-md" /> {/* Save button placeholder */}
             <Skeleton className="h-9 w-24 rounded-md" /> {/* Share button placeholder */}
           </div>
           <Skeleton className="h-10 w-32 rounded-md" /> {/* Apply button placeholder */}
        </CardFooter>
      </Card>
    </div>
  );
}

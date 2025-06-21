
// src/components/dialogs/CompanyPublicProfileDialog.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Globe, Users, Calendar, Building, Linkedin, ExternalLink, InfoIcon, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export interface CompanyPublicProfile {
  companyName: string;
  companyLogoUrl: string | null;
  companyWebsite: string | null;
  aboutCompany: string | null;
  yearOfEstablishment: number | null;
  teamSize: number | null;
  linkedinUrl?: string | null;
  address?: string | null;
}

interface CompanyPublicProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyPublicProfile | null;
}

export const CompanyPublicProfileDialog: React.FC<CompanyPublicProfileDialogProps> = ({ isOpen, onOpenChange, company }) => {
  if (!isOpen || !company) return null; // Ensure dialog doesn't render if not open or no company data

  console.log("[CompanyPublicProfileDialog] Received company data:", company); // Debugging

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl w-[90vw] bg-card border-border rounded-xl shadow-2xl p-0">
        <DialogHeader className="p-5 pb-4 border-b border-border bg-secondary/20 rounded-t-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {company.companyLogoUrl ? (
              <Image
                src={company.companyLogoUrl}
                alt={`${company.companyName} logo`}
                width={80} 
                height={80}
                className="rounded-full border-2 border-primary/20 bg-background object-contain p-0.5 shadow-sm shrink-0"
                data-ai-hint="company logo"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground shrink-0 border-2 border-primary/20">
                <Building className="w-10 h-10" />
              </div>
            )}
            <div className="flex-grow text-center sm:text-left">
              <DialogTitle className="text-xl font-bold text-primary">{company.companyName}</DialogTitle>
              {company.address && (
                <p className="flex items-center justify-center sm:justify-start gap-1 mt-0.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0"/> {company.address}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(70vh-160px)]"> {/* Adjusted max-h for footer */}
          <div className="p-5 space-y-5 text-sm">
            {company.aboutCompany && (
              <div>
                <h4 className="font-semibold text-md text-foreground mb-1.5 flex items-center gap-1.5">
                  <InfoIcon className="h-4 w-4 text-primary" />
                  About {company.companyName}
                </h4>
                <div 
                  className="prose prose-xs max-w-none text-muted-foreground leading-relaxed p-3 border rounded-md bg-background shadow-inner text-sm"
                  dangerouslySetInnerHTML={{ __html: company.aboutCompany.replace(/\n/g, '<br />') || '<p><em>No detailed information provided.</em></p>' }}
                />
              </div>
            )}

            {(company.yearOfEstablishment || company.teamSize) && (
              <>
                {company.aboutCompany && <Separator className="my-4"/>}
                <h4 className="font-semibold text-md text-foreground mb-2 flex items-center gap-1.5">
                   Key Facts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.yearOfEstablishment && (
                    <Card className="p-3 bg-muted/30 border-border shadow-sm rounded-md">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-accent shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Established In</p>
                          <p className="text-sm font-semibold text-foreground">{company.yearOfEstablishment}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                  {company.teamSize && (
                     <Card className="p-3 bg-muted/30 border-border shadow-sm rounded-md">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-accent shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Size</p>
                          <p className="text-sm font-semibold text-foreground">{company.teamSize.toLocaleString()}+</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </>
            )}

            {(!company.aboutCompany && !company.yearOfEstablishment && !company.teamSize && !company.address && !company.companyWebsite && !company.linkedinUrl) && (
                 <div className="text-center py-6">
                    <InfoIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground italic">Company details are not available at this time.</p>
                 </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 pt-3 border-t border-border bg-secondary/20 rounded-b-xl flex justify-between items-center">
          <TooltipProvider>
            <div className="flex gap-2">
              {company.companyWebsite && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild className="text-primary hover:bg-primary/10 h-9 w-9">
                      <a
                        href={company.companyWebsite.startsWith('http') ? company.companyWebsite : `https://${company.companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Company Website"
                        className="flex items-center justify-center"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Visit Company Website</p></TooltipContent>
                </Tooltip>
              )}
              {company.linkedinUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild className="text-primary hover:bg-primary/10 h-9 w-9">
                      <a
                        href={company.linkedinUrl.startsWith('http') ? company.linkedinUrl : `https://${company.linkedinUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn Profile"
                        className="flex items-center justify-center"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>View LinkedIn Profile</p></TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9 text-sm">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

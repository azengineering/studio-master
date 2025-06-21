
// src/app/(admin)/admin-panel/jobseeker-data/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users as UsersIcon, Mail, User, Loader2, AlertCircle, Eye, Briefcase, Bookmark, UserCircle as UserCircleIcon, Search as SearchIcon, Info } from 'lucide-react';
import { searchJobSeekersAdminView, type JobSeekerAdminView, type JobSeekerSearchType } from '../actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function JobSeekerDataPage() {
  const [searchResults, setSearchResults] = useState<JobSeekerAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<JobSeekerAdminView | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<JobSeekerSearchType>('email');
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
     if (!searchTerm.trim()) {
      setError("Please enter a search term.");
      setSearchResults([]);
      setSearchAttempted(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSearchAttempted(true);
    setSelectedJobSeeker(null);
    try {
      const data = await searchJobSeekersAdminView(searchType, searchTerm);
      setSearchResults(data);
      if (data.length === 0) {
        setError("No job seekers found matching your criteria.");
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to search job seeker data.';
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchType, searchTerm]);

  const renderSearchResults = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Searching...</span></div>;
    }
    if (error && searchAttempted) {
      return (
        <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          <p>{error}</p>
        </div>
      );
    }
    if (searchAttempted && searchResults.length === 0 && !error) {
      return (
        <div className="text-center py-10 text-muted-foreground bg-card border border-dashed border-border rounded-lg p-8">
          <Info className="h-12 w-12 mx-auto mb-3 opacity-50 text-primary" />
          <p className="text-lg font-medium">No Job Seekers Found</p>
          <p className="text-sm mt-1">Your search did not return any results.</p>
        </div>
      );
    }
     if (searchResults.length > 0) {
      if (!selectedJobSeeker && searchResults.length === 1) {
        setSelectedJobSeeker(searchResults[0]);
      } else if (!selectedJobSeeker && searchResults.length > 1) {
         return (
            <div className="mt-6 space-y-3">
                 <h3 className="text-md font-semibold">{searchResults.length} Job Seekers Found:</h3>
                 <ScrollArea className="h-60 border rounded-md p-2">
                    {searchResults.map(js => (
                        <div key={js.userId} className="p-2 hover:bg-muted/50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium">{js.fullName || js.email}</p>
                                <p className="text-xs text-muted-foreground">ID: {js.userId} | Email: {js.email}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedJobSeeker(js)}>View Details</Button>
                        </div>
                    ))}
                 </ScrollArea>
            </div>
         )
      }
    }
    return null;
  };
  
  const renderJobSeekerDetails = () => {
    if (!selectedJobSeeker) return null;
    return (
      <Card className="mt-6 shadow-lg border-border rounded-xl bg-card">
        <CardHeader className="bg-secondary/20 p-5 border-b border-border">
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> {selectedJobSeeker.fullName || selectedJobSeeker.email}
          </CardTitle>
          <CardDescription>Profile ID: {selectedJobSeeker.profileId || 'N/A'} | User ID: #{selectedJobSeeker.userId}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div><strong className="text-foreground">Email:</strong> <span className="text-muted-foreground">{selectedJobSeeker.email}</span></div>
            {selectedJobSeeker.phoneNumber && <div><strong className="text-foreground">Phone:</strong> <span className="text-muted-foreground">{selectedJobSeeker.phoneNumber}</span></div>}
            <div><strong className="text-foreground">Registered:</strong> <span className="text-muted-foreground">{format(new Date(selectedJobSeeker.userCreatedAt), "PPpp")}</span></div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-md mb-1 flex items-center gap-1.5 text-foreground">
                <Briefcase className="h-4 w-4 text-primary" /> Applied Jobs ({selectedJobSeeker.applications.length}):
              </h4>
              {selectedJobSeeker.applications.length > 0 ? (
                <ScrollArea className="h-32 border border-border rounded-md p-2 bg-background">
                  <ul className="space-y-1.5 text-sm">
                    {selectedJobSeeker.applications.map(app => (
                      <li key={app.applicationId} className="flex justify-between items-center p-1.5 rounded hover:bg-muted/50">
                        <div>
                          <span className="text-foreground">{app.jobTitle}</span> at <span className="text-muted-foreground">{app.companyName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({format(new Date(app.applicationDate), "MMM d, yy")})</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{app.applicationStatus}</Badge>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground italic">No applications found.</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-md mb-1 flex items-center gap-1.5 text-foreground">
                <Bookmark className="h-4 w-4 text-primary" /> Saved Jobs ({selectedJobSeeker.savedJobs.length}):
              </h4>
              {selectedJobSeeker.savedJobs.length > 0 ? (
                 <ScrollArea className="h-32 border border-border rounded-md p-2 bg-background">
                  <ul className="space-y-1.5 text-sm">
                    {selectedJobSeeker.savedJobs.map(job => (
                      <li key={job.jobId} className="p-1.5 rounded hover:bg-muted/50">
                        <span className="text-foreground">{job.jobTitle}</span> at <span className="text-muted-foreground">{job.companyName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({format(new Date(job.savedDate), "MMM d, yy")})</span>
                        </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground italic">No jobs saved.</p>
              )}
            </div>
          </div>
          <div className="md:col-span-2 text-right mt-2">
            <Button variant="outline" onClick={() => setSelectedJobSeeker(null)}>Close Details</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="shadow-lg border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <UsersIcon className="h-7 w-7" /> Job Seeker Data Management
        </CardTitle>
        <CardDescription>Search for job seeker accounts to view their activities.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
         <form onSubmit={handleSearch} className="mb-6 p-4 border border-border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-3">Search Job Seekers</h3>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="grid gap-1.5 w-full sm:flex-grow">
              <Label htmlFor="search-term-js">Search Term</Label>
              <Input
                id="search-term-js"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter search term..."
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5 w-full sm:w-auto">
              <Label htmlFor="search-type-js">Search By</Label>
              <Select value={searchType} onValueChange={(value) => setSearchType(value as JobSeekerSearchType)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="userId">User ID</SelectItem>
                  <SelectItem value="fullName">Full Name</SelectItem>
                  <SelectItem value="phoneNumber">Phone Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading} className="h-10 sm:self-end">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
           {error && !isLoading && searchAttempted && (
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}
        </form>

        {renderSearchResults()}
        {selectedJobSeeker && renderJobSeekerDetails()}
        {!searchAttempted && !selectedJobSeeker && (
            <div className="text-center py-10 text-muted-foreground">
                <UserCircleIcon className="h-12 w-12 mx-auto mb-3 opacity-50 text-primary" />
                <p>Enter search criteria above to find a job seeker.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}


// src/app/(admin)/admin-panel/employer-data/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Mail, Building, Loader2, AlertCircle, ExternalLink, Eye, UserCircle, Search as SearchIcon, Info } from 'lucide-react';
import { searchEmployersAdminView, type EmployerAdminView, type EmployerSearchType } from '../actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployerDataPage() {
  const [searchResults, setSearchResults] = useState<EmployerAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerAdminView | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<EmployerSearchType>('email');
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
    setSelectedEmployer(null); // Clear previous selection
    try {
      const data = await searchEmployersAdminView(searchType, searchTerm);
      setSearchResults(data);
      if (data.length === 0) {
        setError("No employers found matching your criteria.");
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to search employer data.';
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
          <p className="text-lg font-medium">No Employers Found</p>
          <p className="text-sm mt-1">Your search did not return any results.</p>
        </div>
      );
    }
    if (searchResults.length > 0) {
      // For simplicity, if multiple results, we'll still focus on showing details for the first one.
      // A more complex UI might list multiple results.
      if (!selectedEmployer && searchResults.length === 1) {
        setSelectedEmployer(searchResults[0]);
      } else if (!selectedEmployer && searchResults.length > 1) {
         // If multiple results, provide a way to select one or show a list
         return (
            <div className="mt-6 space-y-3">
                 <h3 className="text-md font-semibold">{searchResults.length} Employers Found:</h3>
                 <ScrollArea className="h-60 border rounded-md p-2">
                    {searchResults.map(emp => (
                        <div key={emp.userId} className="p-2 hover:bg-muted/50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium">{emp.companyName || emp.email}</p>
                                <p className="text-xs text-muted-foreground">ID: {emp.userId} | Email: {emp.email}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setSelectedEmployer(emp)}>View Details</Button>
                        </div>
                    ))}
                 </ScrollArea>
            </div>
         )
      }
    }
    return null; // Handled by selectedEmployer rendering
  };

  const renderEmployerDetails = () => {
    if (!selectedEmployer) return null;
    return (
      <Card className="mt-6 shadow-lg border-border rounded-xl bg-card">
        <CardHeader className="bg-secondary/20 p-5 border-b border-border">
          <CardTitle className="text-xl flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> {selectedEmployer.companyName || selectedEmployer.email}
          </CardTitle>
          <CardDescription>Profile ID: {selectedEmployer.profileId || 'N/A'} | User ID: #{selectedEmployer.userId}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong className="text-foreground">User Email:</strong> <span className="text-muted-foreground">{selectedEmployer.email}</span></div>
            <div><strong className="text-foreground">Official Company Email:</strong> <span className="text-muted-foreground">{selectedEmployer.officialEmail || 'N/A'}</span></div>
            <div><strong className="text-foreground">User Registered:</strong> <span className="text-muted-foreground">{format(new Date(selectedEmployer.userCreatedAt), "PPpp")}</span></div>
          </div>
          
          <div>
            <h4 className="font-semibold text-md mb-2 text-foreground flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary"/>Posted Jobs ({selectedEmployer.jobs.length}):</h4>
            {selectedEmployer.jobs.length > 0 ? (
              <ScrollArea className="h-40 border border-border rounded-md p-3 bg-background">
                <ul className="space-y-2 text-sm">
                  {selectedEmployer.jobs.map(job => (
                    <li key={job.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                      <div>
                        <span className="text-foreground">{job.jobTitle}</span>
                        <span className="text-xs text-muted-foreground ml-2">({format(new Date(job.createdAt), "MMM d, yy")})</span>
                      </div>
                      <Badge variant={job.status === 'posted' ? 'default' : 'secondary'} className="text-xs">{job.status}</Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground italic">No jobs posted by this employer.</p>
            )}
          </div>
          <Button variant="outline" onClick={() => setSelectedEmployer(null)} className="mt-4">Close Details</Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="shadow-lg border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <Briefcase className="h-7 w-7" /> Employer Data Management
        </CardTitle>
        <CardDescription>Search for employer accounts to view their activities.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="mb-6 p-4 border border-border rounded-lg bg-card shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-3">Search Employers</h3>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="grid gap-1.5 w-full sm:flex-grow">
              <Label htmlFor="search-term">Search Term</Label>
              <Input
                id="search-term"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter search term..."
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5 w-full sm:w-auto">
              <Label htmlFor="search-type">Search By</Label>
              <Select value={searchType} onValueChange={(value) => setSearchType(value as EmployerSearchType)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="userId">User ID</SelectItem>
                  <SelectItem value="companyName">Company Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading} className="h-10 sm:self-end">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
           {error && !isLoading && searchAttempted && ( // Show error related to search input specifically here
                <p className="text-sm text-destructive mt-2">{error}</p>
            )}
        </form>

        {renderSearchResults()}
        {selectedEmployer && renderEmployerDetails()}
        {!searchAttempted && !selectedEmployer && (
            <div className="text-center py-10 text-muted-foreground">
                <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-primary" />
                <p>Enter search criteria above to find an employer.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

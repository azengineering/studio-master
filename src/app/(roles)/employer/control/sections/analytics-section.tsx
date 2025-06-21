
// src/app/(roles)/employer/control/sections/analytics-section.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart as BarChartIconLucide, Briefcase, FileText, Filter, CalendarDays, TrendingUp, CheckSquare, LineChart as LineChartIcon, AlertCircle, Loader2, PieChart as PieChartIcon, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { format, subDays, parseISO, compareAsc, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  getEmployerAnalyticsKeyMetrics, 
  getEmployerApplicationsTrend, 
  getEmployerApplicationFunnel,
  getTopPerformingJobsAnalytics,
  type EmployerAnalyticsKeyMetrics, 
  type ApplicationTrendDataPoint,
  type ApplicationFunnelDataPoint,
  type TopPerformingJobDataPoint
} from '../actions';
import { Label } from '@/components/ui/label';


const initialFunnelChartDataConfig: ApplicationFunnelDataPoint[] = [
  { stage: 'Applied', count: 0, fill: 'hsl(var(--chart-1))' },
  { stage: 'Reviewed', count: 0, fill: 'hsl(var(--chart-2))' },
  { stage: 'Shortlisted', count: 0, fill: 'hsl(var(--chart-3))' },
  { stage: 'Interviewing', count: 0, fill: 'hsl(var(--chart-4))' },
  { stage: 'Hired', count: 0, fill: 'hsl(var(--primary))' },
];

const initialApplicationsTrendData: ApplicationTrendDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(new Date(), 29 - i);
  return {
    date: format(date, 'MMM d'),
    count: 0, 
  };
});

interface StatCardProps {
  title: string;
  metric: { value: string | number; unit?: string };
  icon: React.ElementType;
  description?: string;
  color?: string;
  bgColor?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, metric, icon: Icon, description, color = 'text-primary', bgColor = 'bg-primary/5', isLoading }) => (
  <Card className={`shadow-md hover:shadow-lg transition-shadow border ${bgColor} dark:${bgColor.replace('bg-', 'dark:bg-')}/30 rounded-xl`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
      <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent className="px-4 pb-4">
       {isLoading ? (
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground my-1" />
       ) : (
         <div className="text-2xl font-bold text-foreground">{metric.value}{metric.unit ? <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span> : ''}</div>
       )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const presetDateRanges = [
    { label: "Last 7 Days", getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: "Last 30 Days", getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: "Last Month", getRange: () => { const last = subMonths(new Date(), 1); return { from: startOfMonth(last), to: endOfMonth(last) }; }},
];


export default function AnalyticsSection() {
  const [analyticsMetrics, setAnalyticsMetrics] = useState<EmployerAnalyticsKeyMetrics | null>(null);
  const [applicationsTrendData, setApplicationsTrendData] = useState<ApplicationTrendDataPoint[]>(initialApplicationsTrendData);
  const [applicationFunnelData, setApplicationFunnelData] = useState<ApplicationFunnelDataPoint[]>(initialFunnelChartDataConfig.map(d => ({...d, count: 0})));
  const [topPerformingJobs, setTopPerformingJobs] = useState<TopPerformingJobDataPoint[]>([]);
  
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [isLoadingFunnel, setIsLoadingFunnel] = useState(true);
  const [isLoadingTopJobs, setIsLoadingTopJobs] = useState(true); 
  
  const [currentEmployerId, setCurrentEmployerId] = useState<number | null>(null);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), 
    to: new Date(),
  });
  const { toast } = useToast();
  const [popoverOpen, setPopoverOpen] = useState(false); 
  const [funnelChartType, setFunnelChartType] = useState<'bar' | 'pie'>('bar');


  useEffect(() => {
    const userIdStr = localStorage.getItem('userId');
    if (userIdStr) {
      setCurrentEmployerId(parseInt(userIdStr, 10));
    } else {
      toast({ title: "Error", description: "Employer ID not found. Please log in.", variant: "destructive" });
      setIsLoadingMetrics(false);
      setIsLoadingTrend(false);
      setIsLoadingFunnel(false);
      setIsLoadingTopJobs(false);
    }
  }, [toast]);

  const fetchAnalyticsData = useCallback(async (currentDateRange?: DateRange) => {
    if (!currentEmployerId) {
      setIsLoadingMetrics(false);
      setIsLoadingTrend(false);
      setIsLoadingFunnel(false);
      setIsLoadingTopJobs(false);
      return;
    }
    setIsLoadingMetrics(true);
    setIsLoadingTrend(true);
    setIsLoadingFunnel(true);
    setIsLoadingTopJobs(true);
    
    try {
      const [metricsResponse, trendResponse, funnelResponse, topJobsResponse] = await Promise.all([
        getEmployerAnalyticsKeyMetrics(currentEmployerId, currentDateRange),
        getEmployerApplicationsTrend(currentEmployerId, currentDateRange),
        getEmployerApplicationFunnel(currentEmployerId, currentDateRange),
        getTopPerformingJobsAnalytics(currentEmployerId, currentDateRange) 
      ]);

      // Handle Metrics
      if (metricsResponse.success && metricsResponse.data) {
        setAnalyticsMetrics(metricsResponse.data);
      } else {
        toast({ title: "Error Loading Key Metrics", description: metricsResponse.error || "Could not fetch key metrics.", variant: "destructive" });
        setAnalyticsMetrics(null);
      }

      // Handle Trend
      if (trendResponse.success && trendResponse.data) {
        setApplicationsTrendData(trendResponse.data);
      } else {
        toast({ title: "Error Loading Trend Data", description: trendResponse.error || "Could not fetch applications trend.", variant: "destructive" });
        setApplicationsTrendData(initialApplicationsTrendData);
      }

      // Handle Funnel
      if (funnelResponse.success && funnelResponse.data) {
        const mergedFunnelData = initialFunnelChartDataConfig.map(configItem => {
          const serverDataItem = funnelResponse.data?.find(d => d.stage === configItem.stage);
          return {
            ...configItem,
            count: serverDataItem ? serverDataItem.count : 0,
          };
        });
        setApplicationFunnelData(mergedFunnelData);
      } else {
        toast({ title: "Error Loading Funnel Data", description: funnelResponse.error || "Could not fetch application funnel.", variant: "destructive" });
        setApplicationFunnelData(initialFunnelChartDataConfig.map(d => ({...d, count: 0})));
      }

      // Handle Top Jobs
      if (topJobsResponse.success && topJobsResponse.data) {
        setTopPerformingJobs(topJobsResponse.data);
      } else {
        toast({ title: "Error Loading Top Jobs", description: topJobsResponse.error || "Could not fetch top performing jobs.", variant: "destructive" });
        setTopPerformingJobs([]);
      }

    } catch (err) {
      toast({ title: "Error Loading Analytics", description: (err as Error).message || "An unexpected error occurred.", variant: "destructive" });
      setAnalyticsMetrics(null);
      setApplicationsTrendData(initialApplicationsTrendData);
      setApplicationFunnelData(initialFunnelChartDataConfig.map(d => ({...d, count: 0})));
      setTopPerformingJobs([]);
    } finally {
      setIsLoadingMetrics(false);
      setIsLoadingTrend(false);
      setIsLoadingFunnel(false);
      setIsLoadingTopJobs(false);
    }
  }, [currentEmployerId, toast]);

  useEffect(() => {
    if (currentEmployerId) {
      fetchAnalyticsData(dateRange);
    }
  }, [currentEmployerId, dateRange, fetchAnalyticsData]);

  const handleApplyFilter = useCallback(() => {
    if (!dateRange?.from || !dateRange?.to) {
        toast({ title: "Invalid Date Range", description: "Please select both a 'from' and 'to' date.", variant: "destructive" });
        return;
    }
    if (compareAsc(dateRange.from, dateRange.to) > 0) {
        toast({ title: "Invalid Date Range", description: "'From' date cannot be after 'To' date.", variant: "destructive" });
        return;
    }
    fetchAnalyticsData(dateRange); 
    toast({
      title: "Filter Applied",
      description: `Analytics refreshed for: ${format(dateRange.from, "PP")} - ${format(dateRange.to, "PP")}`,
    });
    setPopoverOpen(false); 
  }, [dateRange, toast, fetchAnalyticsData]);

  const handleResetFilter = useCallback(() => {
    const defaultRange = { from: subDays(new Date(), 29), to: new Date() };
    setDateRange(defaultRange);
    fetchAnalyticsData(defaultRange); 
     toast({
      title: "Filter Reset",
      description: "Date range reset to the last 30 days.",
    });
    setPopoverOpen(false); 
  }, [toast, fetchAnalyticsData]);

  const handleSetPresetDateRange = (range: DateRange) => {
    setDateRange(range);
    setPopoverOpen(false); 
  };

  const pieChartData = applicationFunnelData.filter(d => d.count > 0);

  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <BarChartIconLucide className="h-7 w-7" /> Hiring Analytics Dashboard
        </CardTitle>
        <CardDescription>Gain insights into your recruitment performance and pipeline.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-8">
        <Card className="p-4 bg-card border-border shadow rounded-lg">
          <h4 className="text-md font-semibold mb-2 text-foreground">Filter by Date Range</h4>
            <div className="flex flex-col sm:flex-row items-end gap-3">
                 <div className="grid gap-1.5 w-full sm:max-w-xs">
                     <Label htmlFor="analytics-date-range-picker" className="text-xs font-medium">Date Range</Label>
                     <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                        <Button
                            id="analytics-date-range-picker"
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row" align="start">
                            <div className="flex flex-col p-3 border-b sm:border-b-0 sm:border-r border-border space-y-1.5">
                                {presetDateRanges.map(preset => (
                                    <Button
                                        key={preset.label}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetPresetDateRange(preset.getRange())}
                                        className="justify-start text-xs px-2 py-1.5 h-auto"
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1} 
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button onClick={handleApplyFilter} className="h-10" disabled={isLoadingMetrics || isLoadingTrend || isLoadingFunnel || isLoadingTopJobs || !dateRange?.from || !dateRange?.to}>
                    {(isLoadingMetrics || isLoadingTrend || isLoadingFunnel || isLoadingTopJobs) && dateRange?.from && dateRange?.to ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Filter className="mr-2 h-4 w-4"/> }
                    Apply Filter
                </Button>
                 <Button variant="outline" onClick={handleResetFilter} className="h-10" disabled={isLoadingMetrics || isLoadingTrend || isLoadingFunnel || isLoadingTopJobs}>
                    Reset to Last 30 Days
                </Button>
            </div>
        </Card>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">Key Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Changed to lg:grid-cols-4 */}
            <StatCard 
                title="Active Jobs" 
                metric={{ value: analyticsMetrics?.totalActiveJobs ?? "0", unit: "jobs"}} 
                icon={Briefcase} 
                color="text-blue-500" 
                bgColor="bg-blue-500/5" 
                description="Currently open positions"
                isLoading={isLoadingMetrics}
            />
            <StatCard 
                title="Total Jobs Posted" 
                metric={{ value: analyticsMetrics?.totalJobsEverPosted ?? "0", unit: "jobs"}} 
                icon={CheckSquare} 
                color="text-green-500" 
                bgColor="bg-green-500/5" 
                description="All jobs created"
                isLoading={isLoadingMetrics}
            />
            <StatCard 
                title="Total Applications Received" 
                metric={{ value: analyticsMetrics?.totalApplicationsEverReceived ?? "0", unit: "applications"}} 
                icon={Users} 
                color="text-indigo-500" 
                bgColor="bg-indigo-500/5" 
                description="All-time applications for your jobs"
                isLoading={isLoadingMetrics}
            />
            <StatCard 
                title="Applications (Period)" 
                metric={{ value: analyticsMetrics?.applicationsInPeriod ?? "0", unit: "applications" }} 
                icon={FileText} 
                color="text-teal-500" 
                bgColor="bg-teal-500/5" 
                description={dateRange ? `Received in selected period` : "Total in selected period"}
                isLoading={isLoadingMetrics}
            />
          </div>
        </section>
        
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 mt-6 flex items-center gap-2"><LineChartIcon className="h-5 w-5 text-accent"/>Applications Trend Over Time</h3>
           <Card className="p-4 pt-6 pb-2 shadow-md border-border rounded-xl">
            {isLoadingTrend ? (
                 <div className="flex justify-center items-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : applicationsTrendData.length === 0 && dateRange ? (
                <p className="text-center text-muted-foreground py-10">No application data for the selected period.</p>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationsTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={{stroke: 'hsl(var(--muted-foreground))'}} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} tickLine={false} axisLine={{stroke: 'hsl(var(--muted-foreground))'}} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
                    <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    itemStyle={{ color: 'hsl(var(--primary))'}}
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} name="Applications"/>
                </LineChart>
                </ResponsiveContainer>
            )}
          </Card>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4 mt-6">
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              {funnelChartType === 'bar' ? <BarChartIconLucide className="h-5 w-5 text-accent"/> : <PieChartIcon className="h-5 w-5 text-accent"/>}
              Application Funnel
            </h3>
            <div className="flex gap-1">
              <Button variant={funnelChartType === 'bar' ? 'default' : 'outline'} size="icon" onClick={() => setFunnelChartType('bar')} aria-label="Show Bar Chart" className="h-8 w-8">
                <BarChartIconLucide className="h-4 w-4" />
              </Button>
              <Button variant={funnelChartType === 'pie' ? 'default' : 'outline'} size="icon" onClick={() => setFunnelChartType('pie')} aria-label="Show Pie Chart" className="h-8 w-8">
                <PieChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Card className="p-4 pt-6 pb-2 shadow-md border-border rounded-xl">
            {isLoadingFunnel ? (
              <div className="flex justify-center items-center h-[300px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : applicationFunnelData.every(d => d.count === 0) && dateRange ? (
              <p className="text-center text-muted-foreground py-10">No application funnel data for the selected period.</p>
            ) : funnelChartType === 'bar' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationFunnelData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
                  <YAxis dataKey="stage" type="category" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" name="Candidates" radius={[0, 4, 4, 0]} barSize={20}>
                    {applicationFunnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || initialFunnelChartDataConfig[index]?.fill || 'hsl(var(--muted))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : ( // Pie Chart
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="count"
                        nameKey="stage"
                        stroke="hsl(var(--border))"
                        >
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill || initialFunnelChartDataConfig.find(c=>c.stage===entry.stage)?.fill || 'hsl(var(--muted))'} />
                        ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                    </PieChart>
                </ResponsiveContainer>
            )}
          </Card>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4 mt-6">Top Performing Jobs</h3>
          <Card className="shadow-md border-border rounded-xl overflow-hidden">
             {isLoadingTopJobs ? (
                <div className="flex justify-center items-center h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : topPerformingJobs.length === 0 && dateRange ? (
                <p className="text-center text-muted-foreground py-10">No job performance data for the selected period.</p>
            ) : topPerformingJobs.length === 0 && !dateRange ? (
                <p className="text-center text-muted-foreground py-10">No job performance data available. Consider applying date filters.</p>
            ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Title</TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Apps</TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Hired</TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">App-to-Hire Rate</TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformingJobs.map((job) => {
                  const appToHireRate = job.applications > 0 && job.hired > 0 ? ((job.hired / job.applications) * 100).toFixed(1) + '%' : (job.applications > 0 && job.hired === 0 ? '0%' : 'N/A');
                  return (
                  <TableRow key={job.id} className="hover:bg-muted/20">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{job.title}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-muted-foreground">{job.applications}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-muted-foreground">{job.hired}</TableCell>
                    <TableCell className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{appToHireRate}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                       <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className={cn(job.status === 'active' ? 'bg-green-500/10 text-green-700 border-green-500/30' : job.status === 'closed' ? 'bg-red-500/10 text-red-700 border-red-500/30' : 'bg-gray-500/10 text-gray-700 border-gray-500/30', "text-xs")}>
                        {job.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            )}
          </Card>
        </section>

      </CardContent>
    </Card>
  );
}

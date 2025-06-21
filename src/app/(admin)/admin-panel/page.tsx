
// src/app/(admin)/admin-panel/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Users, Briefcase, Activity, CalendarIcon, Loader2, AlertCircle, FileText, Bookmark, CheckSquare } from 'lucide-react';
import { getAdminDashboardStats } from './actions'; 
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Label } from '@/components/ui/label'; // Import Label
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = 'text-primary', bgColor = 'bg-primary/5', description }) => (
  <Card className={`shadow-md hover:shadow-lg transition-shadow border ${bgColor} dark:${bgColor.replace('bg-', 'dark:bg-')}/30 rounded-xl`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
      <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent className="px-4 pb-4">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

type PeriodMetricKey = 'usersRegisteredInPeriod' | 'jobsPostedInPeriod' | 'applicationsReceivedInPeriod' | 'savedJobsInPeriod';

interface SelectablePeriodStat {
  key: PeriodMetricKey;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const selectablePeriodStatsConfig: SelectablePeriodStat[] = [
  { key: 'usersRegisteredInPeriod', label: 'Users Registered This Period', icon: Users, color: 'text-teal-500', bgColor: 'bg-teal-500/5' },
  { key: 'jobsPostedInPeriod', label: 'Jobs Posted This Period', icon: Briefcase, color: 'text-indigo-500', bgColor: 'bg-indigo-500/5' },
  { key: 'applicationsReceivedInPeriod', label: 'Applications This Period', icon: FileText, color: 'text-lime-500', bgColor: 'bg-lime-500/5' },
  { key: 'savedJobsInPeriod', label: 'Saved Jobs This Period', icon: Bookmark, color: 'text-rose-500', bgColor: 'bg-rose-500/5' },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPeriodMetrics, setSelectedPeriodMetrics] = useState<PeriodMetricKey[]>([]);

  const fetchStats = useCallback(async (currentDateRange?: DateRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboardStats(currentDateRange);
      setStats(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to load dashboard statistics.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(dateRange);
  }, [fetchStats, dateRange]);

  const handleMetricSelectionChange = (metricKey: PeriodMetricKey, checked: boolean) => {
    setSelectedPeriodMetrics(prev => 
      checked ? [...prev, metricKey] : prev.filter(key => key !== metricKey)
    );
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-border rounded-xl overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/20 p-6">
          <CardTitle className="text-2xl text-primary">Admin Dashboard Overview</CardTitle>
          <CardDescription>Key metrics and activity summary for the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 p-4 border border-border rounded-lg bg-card shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Filter Activity by Date Range</h3>
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="grid gap-2 w-full sm:max-w-sm">
                  <Label htmlFor="date-range-picker" className="text-sm font-medium text-muted-foreground">Date range</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          id="date-range-picker"
                          variant={"outline"}
                          className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !dateRange && "text-muted-foreground"
                          )}
                      >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                      <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                      />
                      </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={() => fetchStats(dateRange)} disabled={isLoading || !dateRange?.from || !dateRange?.to} className="h-10">
                  {isLoading && dateRange?.from && dateRange?.to ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Apply Filter
                </Button>
                <Button variant="outline" onClick={() => { setDateRange(undefined); fetchStats(undefined); setSelectedPeriodMetrics([]);}} disabled={isLoading || !dateRange} className="h-10">
                  Clear Filter
                </Button>
              </div>
            </div>

            {dateRange?.from && dateRange?.to && (
              <div>
                <h4 className="text-md font-semibold text-foreground mb-2 mt-3">Select Period Metrics to Display:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                  {selectablePeriodStatsConfig.map(metric => (
                    <div key={metric.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.key}
                        checked={selectedPeriodMetrics.includes(metric.key)}
                        onCheckedChange={(checked) => handleMetricSelectionChange(metric.key, !!checked)}
                      />
                      <Label htmlFor={metric.key} className="text-sm font-normal text-muted-foreground cursor-pointer">
                        {metric.label.replace(' This Period', '')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isLoading && !stats && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-10 text-destructive flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              <p>Error loading dashboard: {error}</p>
              <Button onClick={() => fetchStats(dateRange)} variant="outline">Try Again</Button>
            </div>
          )}

          {stats && !isLoading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="text-blue-500" bgColor="bg-blue-500/5" />
                <StatCard title="Total Employers" value={stats.totalEmployers} icon={Briefcase} color="text-green-500" bgColor="bg-green-500/5" />
                <StatCard title="Total Job Seekers" value={stats.totalJobSeekers} icon={Users} color="text-purple-500" bgColor="bg-purple-500/5" />
                <StatCard title="Active Job Postings" value={stats.activeJobPostings} icon={Activity} color="text-orange-500" bgColor="bg-orange-500/5" />
                <StatCard title="Total Applications" value={stats.totalApplicationsReceived} icon={FileText} color="text-cyan-500" bgColor="bg-cyan-500/5" />
                <StatCard title="Total Saved Jobs" value={stats.totalSavedJobs} icon={Bookmark} color="text-pink-500" bgColor="bg-pink-500/5" />

                {selectablePeriodStatsConfig.map(metricConfig => (
                  dateRange && stats[metricConfig.key] !== undefined && selectedPeriodMetrics.includes(metricConfig.key) && (
                    <StatCard
                      key={metricConfig.key}
                      title={metricConfig.label}
                      value={stats[metricConfig.key]}
                      icon={metricConfig.icon}
                      color={metricConfig.color}
                      bgColor={metricConfig.bgColor}
                      description={`From ${format(dateRange.from!, "MMM d")} to ${format(dateRange.to!, "MMM d, yyyy")}`}
                    />
                  )
                ))}
              </div>
              
              <div className="mt-8 p-6 border rounded-lg bg-card">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Further Activity Overview
                </h3>
                <div className="h-40 flex items-center justify-center text-muted-foreground italic">
                  Additional charts and detailed activity logs will be displayed here.
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


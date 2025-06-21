// src/app/(roles)/employer/control/sections/account-settings-section.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bell, ShieldCheck, Palette, Trash2, Link as LinkIcon, QrCode, Database, KeyRound } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";


export default function AccountSettingsSection() {
  const { toast } = useToast();

  const handleSettingChange = (settingName: string, value: any) => {
    // Placeholder for actual setting change logic
    toast({
      title: 'Setting Updated (Demo)',
      description: `${settingName} changed to ${value}. This is a demo and not saved.`,
      variant: 'default'
    });
  };
  
  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <Settings className="h-7 w-7" /> Account Settings
        </CardTitle>
        <CardDescription>Manage your general account settings, security, and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-10">
        
        <section aria-labelledby="general-settings">
          <h3 id="general-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent"/> General Site Settings
          </h3>
          <div className="space-y-6">
            <Card className="p-6 border-border bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Site Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Temporarily take the site offline for maintenance.</p>
                </div>
                <Switch 
                  id="maintenance-mode" 
                  onCheckedChange={(checked) => handleSettingChange('Maintenance Mode', checked)}
                  aria-label="Toggle maintenance mode"
                />
              </div>
            </Card>
            <Card className="p-6 border-border bg-card shadow-sm">
                <Label htmlFor="site-name" className="font-medium text-foreground block mb-1.5">Site Name / Title</Label>
                <Input id="site-name" defaultValue="JobsAI" className="max-w-sm" onChange={(e) => handleSettingChange('Site Name', e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">This appears in browser tabs and SEO.</p>
            </Card>
          </div>
        </section>
        
        <Separator />

        <section aria-labelledby="notifications-settings">
          <h3 id="notifications-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent"/> Notifications
          </h3>
           <div className="space-y-6">
              <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">New Job Application Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new applications to your jobs.</p>
                  </div>
                  <Switch 
                    id="new-application-alerts" 
                    onCheckedChange={(checked) => handleSettingChange('New Application Alerts', checked)}
                    aria-label="Toggle new application alerts"
                    defaultChecked
                  />
                </div>
              </Card>
              <Card className="p-6 border-border bg-card shadow-sm">
                <Label htmlFor="notification-email" className="font-medium text-foreground block mb-1.5">Primary Email for Notifications</Label>
                <Input id="notification-email" type="email" placeholder="hr@company.com" className="max-w-sm" onChange={(e) => handleSettingChange('Notification Email', e.target.value)}/>
              </Card>
           </div>
        </section>

        <Separator />

        <section aria-labelledby="security-settings">
          <h3 id="security-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent"/> Security
          </h3>
           <div className="space-y-6">
              <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your account password regularly for security.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Change Password</Button>
                </div>
              </Card>
               <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                  </div>
                   <Button variant="outline" size="sm" disabled>Set Up 2FA</Button>
                </div>
              </Card>
           </div>
        </section>

        <Separator />
        
        <section aria-labelledby="api-keys-integrations">
          <h3 id="api-keys-integrations" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent"/> API Keys & Integrations
          </h3>
           <Card className="p-6 border-border bg-card shadow-sm">
              <Label htmlFor="genai-api-key" className="font-medium text-foreground block mb-1.5">Google Generative AI API Key</Label>
              <Input id="genai-api-key" type="password" placeholder="Enter your API key" onChange={(e) => handleSettingChange('GenAI API Key', '********')}/>
              <p className="text-xs text-muted-foreground mt-1">Key for AI features like job description generation and smart parsing.</p>
           </Card>
        </section>

        <Separator />

        <section aria-labelledby="appearance-settings">
          <h3 id="appearance-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent"/> Appearance
          </h3>
           <Card className="p-6 border-border bg-card shadow-sm">
              <p className="font-medium text-foreground">Theme Preferences</p>
              <p className="text-sm text-muted-foreground mt-1 mb-3">Customize the look and feel. (Dark/Light Mode - Placeholder)</p>
              <Button variant="outline" size="sm" disabled>Change Theme</Button>
           </Card>
        </section>
        
        <Separator />

        <section aria-labelledby="account-deletion-settings">
          <h3 id="account-deletion-settings" className="text-xl font-semibold text-destructive mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5"/> Account Deletion
          </h3>
           <Card className="p-6 border-destructive/30 bg-destructive/5">
              <p className="font-medium text-destructive/90">Delete Your Employer Account</p>
              <p className="text-sm text-destructive/80 mt-1 mb-3">Permanently delete your account and all associated data (company profile, job postings, applications). This action cannot be undone.</p>
              <Button variant="destructive" size="sm" disabled>Request Account Deletion</Button>
           </Card>
        </section>

      </CardContent>
    </Card>
  );
}

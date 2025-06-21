
// src/app/(admin)/admin-panel/settings/page.tsx
'use client';

import React from 'react'; // Added React import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings as SettingsIcon, Shield, Bell, Database, KeyRound, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
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
    <Card className="shadow-lg border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary">
          <SettingsIcon className="h-7 w-7" /> Admin Panel Settings
        </CardTitle>
        <CardDescription>Configure site-wide settings, security, and administrative preferences.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-10">
        
        <section aria-labelledby="general-settings">
          <h3 id="general-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-accent"/> General Site Settings
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

        <section aria-labelledby="security-settings-admin">
          <h3 id="security-settings-admin" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent"/> Security & Access
          </h3>
           <div className="space-y-6">
              <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Admin Password Policy</p>
                    <p className="text-sm text-muted-foreground">Configure password complexity and expiration for admin accounts.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Configure Policy</Button>
                </div>
              </Card>
               <Card className="p-6 border-border bg-card shadow-sm">
                  <Label htmlFor="ip-whitelist" className="font-medium text-foreground block mb-1.5">IP Whitelisting for Admin Panel</Label>
                  <Textarea id="ip-whitelist" placeholder="Enter IPs, one per line (e.g., 192.168.1.100)" rows={3} className="text-sm" onChange={(e) => handleSettingChange('IP Whitelist', e.target.value)}/>
                  <p className="text-xs text-muted-foreground mt-1">Restrict admin panel access to specific IP addresses. Leave blank to allow all.</p>
              </Card>
           </div>
        </section>
        
        <section aria-labelledby="notification-settings-admin">
          <h3 id="notification-settings-admin" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent"/> Admin Notifications
          </h3>
           <div className="space-y-6">
              <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">New User Registration Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive email notifications for new user sign-ups.</p>
                  </div>
                  <Switch 
                    id="new-user-alerts" 
                    onCheckedChange={(checked) => handleSettingChange('New User Alerts', checked)}
                    aria-label="Toggle new user registration alerts"
                    defaultChecked
                  />
                </div>
              </Card>
              <Card className="p-6 border-border bg-card shadow-sm">
                <Label htmlFor="admin-email" className="font-medium text-foreground block mb-1.5">Primary Admin Email for Notifications</Label>
                <Input id="admin-email" type="email" placeholder="admin@jobsai.com" className="max-w-sm" onChange={(e) => handleSettingChange('Admin Email', e.target.value)}/>
              </Card>
           </div>
        </section>

        <section aria-labelledby="database-management">
          <h3 id="database-management" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-accent"/> Database Management
          </h3>
           <div className="space-y-6">
              <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Backup Database</p>
                    <p className="text-sm text-muted-foreground">Create a backup of the current application database.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Create Backup</Button>
                </div>
              </Card>
              <Card className="p-6 border-border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">Reset Database (Development Only)</p>
                    <p className="text-sm text-destructive/80">Warning: This will erase all data. Use with extreme caution.</p>
                  </div>
                  <Button variant="destructive" size="sm" disabled>Reset Database</Button>
                </div>
              </Card>
           </div>
        </section>
        
        <section aria-labelledby="api-keys">
          <h3 id="api-keys" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent"/> API Keys & Integrations
          </h3>
           <Card className="p-6 border-border bg-card shadow-sm">
              <Label htmlFor="genai-api-key" className="font-medium text-foreground block mb-1.5">Google Generative AI API Key</Label>
              <Input id="genai-api-key" type="password" placeholder="Enter your API key" onChange={(e) => handleSettingChange('GenAI API Key', '********')}/>
              <p className="text-xs text-muted-foreground mt-1">Key for AI features like job description generation.</p>
           </Card>
        </section>

      </CardContent>
    </Card>
  );
}

// Dummy Textarea for settings page until actual is added to ShadCN components if needed by other features
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


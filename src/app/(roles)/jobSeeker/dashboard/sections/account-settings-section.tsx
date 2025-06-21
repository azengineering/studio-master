// src/app/(roles)/jobSeeker/dashboard/sections/account-settings-section.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, ShieldCheck, Palette, Trash2, Link as LinkIcon } from 'lucide-react';

export default function AccountSettingsSection() {
  return (
    <Card className="shadow-xl border-border rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 p-6">
        <CardTitle className="text-2xl flex items-center gap-3 text-primary"><Settings className="h-7 w-7" /> Account Settings</CardTitle>
        <CardDescription>Manage your general account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-10">

        <section aria-labelledby="notifications-settings">
          <h3 id="notifications-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-accent"/> Notifications</h3>
          <div className="space-y-4">
            <Card className="p-4 border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">New Job Match Alerts</p>
                  <p className="text-sm text-muted-foreground">Receive email notifications for new relevant job postings.</p>
                </div>
                <Button variant="outline" size="sm" disabled>Toggle</Button>
              </div>
            </Card>
            <Card className="p-4 border-border bg-card">
               <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Application Status Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when employers view or update your application.</p>
                </div>
                <Button variant="outline" size="sm" disabled>Toggle</Button>
              </div>
            </Card>
          </div>
        </section>

        <section aria-labelledby="security-settings">
          <h3 id="security-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent"/> Security</h3>
           <div className="space-y-4">
              <Card className="p-4 border-border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your account password regularly.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Change</Button>
                </div>
              </Card>
               <Card className="p-4 border-border bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Set Up</Button>
                </div>
              </Card>
           </div>
        </section>

        <section aria-labelledby="appearance-settings">
          <h3 id="appearance-settings" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2"><Palette className="h-5 w-5 text-accent"/> Appearance</h3>
           <Card className="p-4 border-border bg-card">
              <p className="font-medium text-foreground">Theme Preferences</p>
              <p className="text-sm text-muted-foreground mt-1 mb-3">Customize the look and feel. (Dark/Light Mode - Coming Soon)</p>
              <Button variant="outline" size="sm" disabled>Change Theme</Button>
           </Card>
        </section>

         <section aria-labelledby="account-deletion-settings">
          <h3 id="account-deletion-settings" className="text-xl font-semibold text-destructive mb-4 flex items-center gap-2"><Trash2 className="h-5 w-5"/> Account Deletion</h3>
           <Card className="p-4 border-destructive/30 bg-destructive/5">
              <p className="font-medium text-destructive/90">Delete Your Account</p>
              <p className="text-sm text-destructive/80 mt-1 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <Button variant="destructive" size="sm" disabled>Request Account Deletion</Button>
           </Card>
        </section>
      </CardContent>
    </Card>
  );
}

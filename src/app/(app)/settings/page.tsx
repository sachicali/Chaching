"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Globe, UploadCloud, Link2, BadgePercent, Palette, FileOutput } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-primary" />
            Application Settings
          </CardTitle>
          <CardDescription>Manage your Chaching application preferences and configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-medium flex items-center mb-2"><Globe className="mr-2 h-4 w-4 text-muted-foreground"/>Multi-Currency Support</h3>
            <p className="text-sm text-muted-foreground">Configure supported currencies (USD, EUR, PHP, etc.). Feature coming soon!</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium flex items-center mb-2"><UploadCloud className="mr-2 h-4 w-4 text-muted-foreground"/>Bank Import / CSV Upload</h3>
            <p className="text-sm text-muted-foreground">Import data from bank statements or accounting tools. Feature coming soon!</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium flex items-center mb-2"><Link2 className="mr-2 h-4 w-4 text-muted-foreground"/>Integrations</h3>
            <p className="text-sm text-muted-foreground">Connect with Google Calendar, Zapier, Make.com, etc. Feature coming soon!</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium flex items-center mb-2"><BadgePercent className="mr-2 h-4 w-4 text-muted-foreground"/>Subscription & Billing</h3>
            <p className="text-sm text-muted-foreground">Manage your Freemium/Premium plan. Feature coming soon!</p>
          </div>
           <Separator />
          <div>
            <h3 className="text-lg font-medium flex items-center mb-2"><FileOutput className="mr-2 h-4 w-4 text-muted-foreground"/>Export Reports</h3>
            <p className="text-sm text-muted-foreground">Export your financial data in PDF/CSV formats. Feature coming soon!</p>
          </div>
          <Separator />
           <div>
            <h3 className="text-lg font-medium flex items-center mb-2"><Palette className="mr-2 h-4 w-4 text-muted-foreground"/>Appearance</h3>
            <p className="text-sm text-muted-foreground">Colorblind accessibility mode options will be here. Feature coming soon!</p>
            <p className="text-sm text-muted-foreground">White label options for agencies. Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Client Portal</CardTitle>
          <CardDescription>Settings for client portal access and features.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Let clients log in to view and download their invoices or update their contact details securely. Feature coming soon!</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Payment Integrations</CardTitle>
          <CardDescription>Connect Stripe, PayPal, GCash, etc.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Allow clients to pay directly from invoices. Feature coming soon!</p>
        </CardContent>
      </Card>


    </div>
  );
}


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice Generation</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            Manage Invoices
          </CardTitle>
          <CardDescription>Create, send, and track invoices for your clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Invoice generation and tracking tools will be available here.</p>
            <p className="text-sm">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

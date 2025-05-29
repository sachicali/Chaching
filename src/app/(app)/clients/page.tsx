
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Client Management</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Your Clients
          </CardTitle>
          <CardDescription>Manage your client database, contacts, and details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <p>Client list and management tools will be available here.</p>
            <p className="text-sm">Feature coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

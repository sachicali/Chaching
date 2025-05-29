
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Users, MoreHorizontal, Edit, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useClients, type Client } from "@/contexts/ClientContext";

const EXCHANGE_RATE_USD_TO_PHP = 58.75; // Example rate, fetch from API in a real app

const formatUSD = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatPHP = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
};

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient: deleteClientFromContext } = useClients();
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state for adding a new client
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientMonthlyEarnings, setNewClientMonthlyEarnings] = useState<string>("");


  // Form state for editing an existing client
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientCompany, setEditClientCompany] = useState("");
  const [editClientMonthlyEarnings, setEditClientMonthlyEarnings] = useState<string>("");


  const { toast } = useToast();

  const totalClientEarningsUSD = useMemo(() => {
    return clients.reduce((sum, client) => sum + (client.monthlyEarnings || 0), 0);
  }, [clients]);

  const totalClientEarningsPHP = useMemo(() => {
    return totalClientEarningsUSD * EXCHANGE_RATE_USD_TO_PHP;
  }, [totalClientEarningsUSD]);

  const resetAddClientForm = () => {
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientCompany("");
    setNewClientMonthlyEarnings("");
  };

  const handleAddClient = () => {
    if (!newClientName.trim() || !newClientEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Client Name and Email are required.",
        variant: "destructive",
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newClientEmail)) {
        toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive",
        });
        return;
    }
    const earnings = newClientMonthlyEarnings ? parseFloat(newClientMonthlyEarnings) : undefined;
    if (newClientMonthlyEarnings && (isNaN(earnings!) || earnings! < 0)) {
        toast({
            title: "Invalid Earnings",
            description: "Monthly Earnings (USD) must be a valid positive number.",
            variant: "destructive",
        });
        return;
    }

    addClient({
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      phone: newClientPhone.trim() || undefined,
      company: newClientCompany.trim() || undefined,
      monthlyEarnings: earnings,
    });
    
    resetAddClientForm();
    setIsAddClientDialogOpen(false);
  };

  const handleOpenEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditClientName(client.name);
    setEditClientEmail(client.email);
    setEditClientPhone(client.phone || "");
    setEditClientCompany(client.company || "");
    setEditClientMonthlyEarnings(client.monthlyEarnings?.toString() || "");
    setIsEditClientDialogOpen(true);
  };

  const handleSaveClientChanges = () => {
    if (!editingClient) return;

    if (!editClientName.trim() || !editClientEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Client Name and Email are required.",
        variant: "destructive",
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(editClientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    const earnings = editClientMonthlyEarnings ? parseFloat(editClientMonthlyEarnings) : undefined;
     if (editClientMonthlyEarnings && (isNaN(earnings!) || earnings! < 0)) {
        toast({
            title: "Invalid Earnings",
            description: "Monthly Earnings (USD) must be a valid positive number.",
            variant: "destructive",
        });
        return;
    }

    updateClient({
      id: editingClient.id,
      name: editClientName.trim(),
      email: editClientEmail.trim(),
      phone: editClientPhone.trim() || undefined,
      company: editClientCompany.trim() || undefined,
      monthlyEarnings: earnings,
    });

    setIsEditClientDialogOpen(false);
    setEditingClient(null); 
  };


  const handleDeleteClient = (clientId: string) => {
    deleteClientFromContext(clientId);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Client Management</h1>
        <Dialog open={isAddClientDialogOpen} onOpenChange={(isOpen) => {
            setIsAddClientDialogOpen(isOpen);
            if (!isOpen) {
                resetAddClientForm();
            }
        }}>
          <DialogTrigger asChild>
            <Button variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the details for your new client. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="add-name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-email" className="text-right">
                  Email*
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. john.doe@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="add-phone"
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="col-span-3"
                  placeholder="(Optional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="add-company"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. Acme Corp (Optional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-monthly-earnings" className="text-right">
                  Monthly Earnings (USD)
                </Label>
                <Input
                  id="add-monthly-earnings"
                  type="number"
                  value={newClientMonthlyEarnings}
                  onChange={(e) => setNewClientMonthlyEarnings(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. 5000 (Optional)"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                  setIsAddClientDialogOpen(false);
                  resetAddClientForm();
              }}>Cancel</Button>
              <Button type="button" variant="default" onClick={handleAddClient}>Save Client</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Projected Monthly Earnings Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary" />
            Total Projected Monthly Earnings
          </CardTitle>
          <CardDescription>
            Estimated total monthly income (USD and PHP) based on all clients.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-positive">
            {formatUSD(totalClientEarningsUSD)}
          </div>
          <div className="text-xl font-medium text-muted-foreground mt-1">
            (approx. {formatPHP(totalClientEarningsPHP)})
          </div>
          {clients.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Add clients with monthly earnings to see a projection here.
            </p>
          )}
        </CardContent>
      </Card>


      {/* Edit Client Dialog */}
      <Dialog open={isEditClientDialogOpen} onOpenChange={(isOpen) => {
          setIsEditClientDialogOpen(isOpen);
          if (!isOpen) {
            setEditingClient(null); // Clear editing client if dialog is closed without saving
          }
        }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client's details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name*
              </Label>
              <Input
                id="edit-name"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email*
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editClientEmail}
                onChange={(e) => setEditClientEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editClientPhone}
                onChange={(e) => setEditClientPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-company" className="text-right">
                Company
              </Label>
              <Input
                id="edit-company"
                value={editClientCompany}
                onChange={(e) => setEditClientCompany(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-monthly-earnings" className="text-right">
                  Monthly Earnings (USD)
                </Label>
                <Input
                  id="edit-monthly-earnings"
                  type="number"
                  value={editClientMonthlyEarnings}
                  onChange={(e) => setEditClientMonthlyEarnings(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. 5000 (Optional)"
                  min="0"
                />
              </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
                setIsEditClientDialogOpen(false);
                setEditingClient(null);
            }}>Cancel</Button>
            <Button type="button" variant="default" onClick={handleSaveClientChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Your Clients
          </CardTitle>
          <CardDescription>
            View, manage, and organize your client database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Monthly Earnings (USD)</TableHead>
                  <TableHead>Monthly Earnings (PHP)</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.company || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>{formatUSD(client.monthlyEarnings)}</TableCell>
                    <TableCell>{formatPHP(client.monthlyEarnings ? client.monthlyEarnings * EXCHANGE_RATE_USD_TO_PHP : undefined)}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Client Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEditDialog(client)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 text-primary/50" />
              <p className="text-lg font-medium">No clients yet.</p>
              <p className="text-sm">
                Click "Add New Client" to start building your client list.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

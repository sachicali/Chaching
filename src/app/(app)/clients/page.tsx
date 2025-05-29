
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Users, MoreHorizontal, Edit, DollarSign, Building, Mail, PhoneIcon, MapPin, CreditCard, Activity } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useClients, type Client } from "@/contexts/ClientContext";

const EXCHANGE_RATE_USD_TO_PHP = 58.75; 

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
  const [newClientTotalEarningsUSD, setNewClientTotalEarningsUSD] = useState<string>("");
  const [newClientPaymentMedium, setNewClientPaymentMedium] = useState("");
  const [newClientStatus, setNewClientStatus] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");


  // Form state for editing an existing client
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientCompany, setEditClientCompany] = useState("");
  const [editClientMonthlyEarnings, setEditClientMonthlyEarnings] = useState<string>("");
  const [editClientTotalEarningsUSD, setEditClientTotalEarningsUSD] = useState<string>("");
  const [editClientPaymentMedium, setEditClientPaymentMedium] = useState("");
  const [editClientStatus, setEditClientStatus] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");


  const { toast } = useToast();

  const totalProjectedMonthlyEarningsUSD = useMemo(() => {
    return clients.reduce((sum, client) => sum + (client.monthlyEarnings || 0), 0);
  }, [clients]);

  const totalProjectedMonthlyEarningsPHP = useMemo(() => {
    return totalProjectedMonthlyEarningsUSD * EXCHANGE_RATE_USD_TO_PHP;
  }, [totalProjectedMonthlyEarningsUSD]);

  const resetAddClientForm = () => {
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientCompany("");
    setNewClientMonthlyEarnings("");
    setNewClientTotalEarningsUSD("");
    setNewClientPaymentMedium("");
    setNewClientStatus("");
    setNewClientAddress("");
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
    const monthlyEarnings = newClientMonthlyEarnings ? parseFloat(newClientMonthlyEarnings) : undefined;
    if (newClientMonthlyEarnings && (isNaN(monthlyEarnings!) || monthlyEarnings! < 0)) {
        toast({
            title: "Invalid Monthly Earnings",
            description: "Monthly Earnings (USD) must be a valid positive number.",
            variant: "destructive",
        });
        return;
    }
    const totalEarnings = newClientTotalEarningsUSD ? parseFloat(newClientTotalEarningsUSD) : undefined;
    if (newClientTotalEarningsUSD && (isNaN(totalEarnings!) || totalEarnings! < 0)) {
        toast({
            title: "Invalid Total Earnings",
            description: "Total Earnings (USD) must be a valid positive number.",
            variant: "destructive",
        });
        return;
    }

    addClient({
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      phone: newClientPhone.trim() || undefined,
      company: newClientCompany.trim() || undefined,
      monthlyEarnings: monthlyEarnings,
      totalEarningsUSD: totalEarnings,
      paymentMedium: newClientPaymentMedium.trim() || undefined,
      status: newClientStatus.trim() || undefined,
      address: newClientAddress.trim() || undefined,
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
    setEditClientTotalEarningsUSD(client.totalEarningsUSD?.toString() || "");
    setEditClientPaymentMedium(client.paymentMedium || "");
    setEditClientStatus(client.status || "");
    setEditClientAddress(client.address || "");
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
    const monthlyEarnings = editClientMonthlyEarnings ? parseFloat(editClientMonthlyEarnings) : undefined;
     if (editClientMonthlyEarnings && (isNaN(monthlyEarnings!) || monthlyEarnings! < 0)) {
        toast({
            title: "Invalid Monthly Earnings",
            description: "Monthly Earnings (USD) must be a valid positive number.",
            variant: "destructive",
        });
        return;
    }
    const totalEarnings = editClientTotalEarningsUSD ? parseFloat(editClientTotalEarningsUSD) : undefined;
    if (editClientTotalEarningsUSD && (isNaN(totalEarnings!) || totalEarnings! < 0)) {
        toast({
            title: "Invalid Total Earnings",
            description: "Total Earnings (USD) must be a valid positive number.",
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
      monthlyEarnings: monthlyEarnings,
      totalEarningsUSD: totalEarnings,
      paymentMedium: editClientPaymentMedium.trim() || undefined,
      status: editClientStatus.trim() || undefined,
      address: editClientAddress.trim() || undefined,
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Enter the details for your new client. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
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
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-total-earnings" className="text-right">
                  Total Earnings (USD)
                </Label>
                <Input
                  id="add-total-earnings"
                  type="number"
                  value={newClientTotalEarningsUSD}
                  onChange={(e) => setNewClientTotalEarningsUSD(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. 25000 (Optional)"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-payment-medium" className="text-right">
                  Payment Medium
                </Label>
                <Input
                  id="add-payment-medium"
                  value={newClientPaymentMedium}
                  onChange={(e) => setNewClientPaymentMedium(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. Bank Transfer (Optional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-status" className="text-right">
                  Status
                </Label>
                <Input
                  id="add-status"
                  value={newClientStatus}
                  onChange={(e) => setNewClientStatus(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. On Roster (Optional)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-address" className="text-right">
                  Address
                </Label>
                <Input
                  id="add-address"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  className="col-span-3"
                  placeholder="(Optional)"
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
            {formatUSD(totalProjectedMonthlyEarningsUSD)}
          </div>
          <div className="text-xl font-medium text-muted-foreground mt-1">
            (approx. {formatPHP(totalProjectedMonthlyEarningsPHP)})
          </div>
          {clients.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Add clients with monthly earnings to see a projection here.
            </p>
          )}
        </CardContent>
      </Card>


      <Dialog open={isEditClientDialogOpen} onOpenChange={(isOpen) => {
          setIsEditClientDialogOpen(isOpen);
          if (!isOpen) {
            setEditingClient(null);
          }
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client's details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-total-earnings" className="text-right">
                  Total Earnings (USD)
                </Label>
                <Input
                  id="edit-total-earnings"
                  type="number"
                  value={editClientTotalEarningsUSD}
                  onChange={(e) => setEditClientTotalEarningsUSD(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g. 25000 (Optional)"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-payment-medium" className="text-right">
                  Payment Medium
                </Label>
                <Input
                  id="edit-payment-medium"
                  value={editClientPaymentMedium}
                  onChange={(e) => setEditClientPaymentMedium(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Input
                  id="edit-status"
                  value={editClientStatus}
                  onChange={(e) => setEditClientStatus(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">
                  Address
                </Label>
                <Input
                  id="edit-address"
                  value={editClientAddress}
                  onChange={(e) => setEditClientAddress(e.target.value)}
                  className="col-span-3"
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
                  <TableHead><Users className="inline-block mr-1 h-4 w-4"/>Name</TableHead>
                  <TableHead><Mail className="inline-block mr-1 h-4 w-4"/>Email</TableHead>
                  <TableHead><Building className="inline-block mr-1 h-4 w-4"/>Company</TableHead>
                  <TableHead><PhoneIcon className="inline-block mr-1 h-4 w-4"/>Phone</TableHead>
                  <TableHead><DollarSign className="inline-block mr-1 h-4 w-4"/>Monthly (USD)</TableHead>
                  <TableHead><DollarSign className="inline-block mr-1 h-4 w-4"/>Monthly (PHP)</TableHead>
                  <TableHead><DollarSign className="inline-block mr-1 h-4 w-4"/>Total (USD)</TableHead>
                  <TableHead><DollarSign className="inline-block mr-1 h-4 w-4"/>Total (PHP)</TableHead>
                  <TableHead><CreditCard className="inline-block mr-1 h-4 w-4"/>Payment Medium</TableHead>
                  <TableHead><Activity className="inline-block mr-1 h-4 w-4"/>Status</TableHead>
                  <TableHead><MapPin className="inline-block mr-1 h-4 w-4"/>Address</TableHead>
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
                    <TableCell>{formatUSD(client.totalEarningsUSD)}</TableCell>
                    <TableCell>{formatPHP(client.totalEarningsUSD ? client.totalEarningsUSD * EXCHANGE_RATE_USD_TO_PHP : undefined)}</TableCell>
                    <TableCell>{client.paymentMedium || "-"}</TableCell>
                    <TableCell>
                      {client.status ? (
                        <Badge variant={client.status.toLowerCase() === 'on roster' ? 'default' : 'secondary'} 
                               className={client.status.toLowerCase() === 'on roster' ? 'bg-positive text-positive-foreground hover:bg-positive/90' : ''}>
                          {client.status}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{client.address || "-"}</TableCell>
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

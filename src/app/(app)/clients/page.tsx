
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Users, MoreHorizontal, Edit, Trash2, Search, Briefcase, Mail, Phone, MapPin, FileTextIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClients, type Client } from "@/contexts/ClientContext";
import { cn } from "@/lib/utils";


const clientStatusOptions = ["Active", "On Roster", "Prospect", "Former Client", "On Hold", "Inactive", "Payment Pending"];

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient: deleteClientFromContext } = useClients();
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isEditClientDialogOpen, setIsEditClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Add form state
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientMonthlyEarnings, setNewClientMonthlyEarnings] = useState<string>("");
  const [newClientTotalEarningsUSD, setNewClientTotalEarningsUSD] = useState<string>("");
  const [newClientPaymentMedium, setNewClientPaymentMedium] = useState("");
  const [newClientStatus, setNewClientStatus] = useState(clientStatusOptions[0]);
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");

  // Edit form state
  const [editClientName, setEditClientName] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientCompany, setEditClientCompany] = useState("");
  const [editClientMonthlyEarnings, setEditClientMonthlyEarnings] = useState<string>("");
  const [editClientTotalEarningsUSD, setEditClientTotalEarningsUSD] = useState<string>("");
  const [editClientPaymentMedium, setEditClientPaymentMedium] = useState("");
  const [editClientStatus, setEditClientStatus] = useState("");
  const [editClientAddress, setEditClientAddress] = useState("");
  const [editClientNotes, setEditClientNotes] = useState("");

  const { toast } = useToast();

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(client => client.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Auto-select the first client if none is selected and clients list is not empty
  useEffect(() => {
    if (!selectedClientId && filteredClients.length > 0) {
      setSelectedClientId(filteredClients[0].id);
    } else if (filteredClients.length === 0) {
      setSelectedClientId(null);
    }
  }, [filteredClients, selectedClientId]);


  const resetAddClientForm = () => {
    setNewClientName(""); setNewClientEmail(""); setNewClientPhone(""); setNewClientCompany("");
    setNewClientMonthlyEarnings(""); setNewClientTotalEarningsUSD(""); setNewClientPaymentMedium("");
    setNewClientStatus(clientStatusOptions[0]); setNewClientAddress(""); setNewClientNotes("");
  };

  const validateClientForm = (name: string, email: string, monthlyEarningsStr: string, totalEarningsStr: string) => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Missing Information", description: "Client Name and Email are required.", variant: "destructive" });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    const monthlyEarnings = monthlyEarningsStr ? parseFloat(monthlyEarningsStr) : undefined;
    if (monthlyEarningsStr && (isNaN(monthlyEarnings!) || monthlyEarnings! < 0)) {
      toast({ title: "Invalid Monthly Earnings", description: "Monthly Earnings (USD) must be a valid positive number.", variant: "destructive" });
      return false;
    }
    const totalEarnings = totalEarningsStr ? parseFloat(totalEarningsStr) : undefined;
    if (totalEarningsStr && (isNaN(totalEarnings!) || totalEarnings! < 0)) {
      toast({ title: "Invalid Total Earnings", description: "Total Earnings (USD) must be a valid positive number.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAddClient = () => {
    if (!validateClientForm(newClientName, newClientEmail, newClientMonthlyEarnings, newClientTotalEarningsUSD)) return;
    
    addClient({
      name: newClientName.trim(), email: newClientEmail.trim(),
      phone: newClientPhone.trim() || undefined, company: newClientCompany.trim() || undefined,
      monthlyEarnings: newClientMonthlyEarnings ? parseFloat(newClientMonthlyEarnings) : undefined,
      totalEarningsUSD: newClientTotalEarningsUSD ? parseFloat(newClientTotalEarningsUSD) : undefined,
      paymentMedium: newClientPaymentMedium.trim() || undefined, status: newClientStatus || undefined,
      address: newClientAddress.trim() || undefined, notes: newClientNotes.trim() || undefined,
    });
    
    resetAddClientForm();
    setIsAddClientDialogOpen(false);
  };

  const handleOpenEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditClientName(client.name); setEditClientEmail(client.email);
    setEditClientPhone(client.phone || ""); setEditClientCompany(client.company || "");
    setEditClientMonthlyEarnings(client.monthlyEarnings?.toString() || "");
    setEditClientTotalEarningsUSD(client.totalEarningsUSD?.toString() || "");
    setEditClientPaymentMedium(client.paymentMedium || ""); setEditClientStatus(client.status || clientStatusOptions[0]);
    setEditClientAddress(client.address || ""); setEditClientNotes(client.notes || "");
    setIsEditClientDialogOpen(true);
  };

  const handleSaveClientChanges = () => {
    if (!editingClient) return;
    if (!validateClientForm(editClientName, editClientEmail, editClientMonthlyEarnings, editClientTotalEarningsUSD)) return;

    updateClient({
      id: editingClient.id, name: editClientName.trim(), email: editClientEmail.trim(),
      phone: editClientPhone.trim() || undefined, company: editClientCompany.trim() || undefined,
      monthlyEarnings: editClientMonthlyEarnings ? parseFloat(editClientMonthlyEarnings) : undefined,
      totalEarningsUSD: editClientTotalEarningsUSD ? parseFloat(editClientTotalEarningsUSD) : undefined,
      paymentMedium: editClientPaymentMedium.trim() || undefined, status: editClientStatus || undefined,
      address: editClientAddress.trim() || undefined, notes: editClientNotes.trim() || undefined,
      avatarUrl: editingClient.avatarUrl // Preserve existing avatar
    });

    setIsEditClientDialogOpen(false);
    setEditingClient(null); 
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientFromContext(clientId);
    if (selectedClientId === clientId) {
      setSelectedClientId(filteredClients.length > 0 ? filteredClients[0].id : null);
    }
  };
  
  const ClientDetailRow = ({ label, value, icon }: { label: string, value?: string, icon?: React.ElementType }) => {
    const IconComponent = icon;
    if (!value) return null;
    return (
      <div className="grid grid-cols-[auto,1fr] items-start gap-x-4 gap-y-1 py-2">
        <div className="text-sm text-muted-foreground font-medium flex items-center">
          {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
          {label}
        </div>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    );
  };


  return (
    <div className="flex h-full flex-1">
      {/* Left Pane: Client List */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-border flex flex-col bg-card/50">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" onClick={() => setIsAddClientDialogOpen(true)}>New client</Button>
            </DialogTrigger>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-md text-left hover:bg-muted transition-colors focus:outline-none focus:bg-muted",
                    selectedClientId === client.id && "bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatarUrl || `https://placehold.co/60x60.png?text=${client.name.charAt(0)}`} alt={client.name} data-ai-hint="avatar" />
                    <AvatarFallback>{client.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.company || "Individual"}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEditDialog(client)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 text-primary/50" />
                <p>No clients found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Pane: Client Details */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {selectedClient ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{selectedClient.name}</h2>
              <p className="text-md text-muted-foreground">{selectedClient.company || "Individual"}</p>
            </div>
            <Separator />
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="rounded-lg border border-border p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Client details</h3>
                  <ClientDetailRow label="Email" value={selectedClient.email} icon={Mail} />
                  <ClientDetailRow label="Phone" value={selectedClient.phone} icon={Phone} />
                  <ClientDetailRow label="Address" value={selectedClient.address} icon={MapPin} />
                  {selectedClient.notes && (
                    <div className="grid grid-cols-[auto,1fr] items-start gap-x-4 gap-y-1 py-2">
                       <div className="text-sm text-muted-foreground font-medium flex items-start pt-0.5">
                        <FileTextIcon className="mr-2 h-4 w-4 mt-0.5" /> Notes
                       </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap">{selectedClient.notes}</div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-border p-6">
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Invoices</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Placeholder for invoices - map actual invoice data here */}
                       <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                          No invoices to display for this client yet.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="invoices" className="mt-6">
                <div className="rounded-lg border border-border p-6 text-center text-muted-foreground h-48 flex items-center justify-center">
                  Invoice history will be displayed here.
                </div>
              </TabsContent>
              <TabsContent value="activity" className="mt-6">
                 <div className="rounded-lg border border-border p-6 text-center text-muted-foreground h-48 flex items-center justify-center">
                  Client activity log will be displayed here.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="h-16 w-16 mb-4 text-primary/30" />
            <p className="text-xl">Select a client to view their details</p>
            <p className="text-sm">or create a new client to get started.</p>
             <DialogTrigger asChild>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddClientDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
                </Button>
            </DialogTrigger>
          </div>
        )}
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={(isOpen) => { setIsAddClientDialogOpen(isOpen); if (!isOpen) resetAddClientForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle><DialogDescription>Enter the details for your new client.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-name" className="text-right">Name*</Label><Input id="add-name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-email" className="text-right">Email*</Label><Input id="add-email" type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-phone" className="text-right">Phone</Label><Input id="add-phone" type="tel" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-company" className="text-right">Company</Label><Input id="add-company" value={newClientCompany} onChange={(e) => setNewClientCompany(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-monthly-earnings" className="text-right">Monthly (USD)</Label><Input id="add-monthly-earnings" type="number" value={newClientMonthlyEarnings} onChange={(e) => setNewClientMonthlyEarnings(e.target.value)} className="col-span-3" min="0"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-total-earnings" className="text-right">Total (USD)</Label><Input id="add-total-earnings" type="number" value={newClientTotalEarningsUSD} onChange={(e) => setNewClientTotalEarningsUSD(e.target.value)} className="col-span-3" min="0"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-payment-medium" className="text-right">Payment Via</Label><Input id="add-payment-medium" value={newClientPaymentMedium} onChange={(e) => setNewClientPaymentMedium(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-status" className="text-right">Status</Label><Select value={newClientStatus} onValueChange={setNewClientStatus}><SelectTrigger className="col-span-3" id="add-status"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{clientStatusOptions.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-address" className="text-right">Address</Label><Input id="add-address" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="add-notes" className="text-right pt-2">Notes</Label><Textarea id="add-notes" value={newClientNotes} onChange={(e) => setNewClientNotes(e.target.value)} className="col-span-3" rows={3}/></div>
            </div>
          </ScrollArea>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleAddClient}>Save Client</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientDialogOpen} onOpenChange={(isOpen) => { setIsEditClientDialogOpen(isOpen); if (!isOpen) setEditingClient(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Client: {editingClient?.name}</DialogTitle><DialogDescription>Update client details.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-name" className="text-right">Name*</Label><Input id="edit-name" value={editClientName} onChange={(e) => setEditClientName(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-email" className="text-right">Email*</Label><Input id="edit-email" type="email" value={editClientEmail} onChange={(e) => setEditClientEmail(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-phone" className="text-right">Phone</Label><Input id="edit-phone" type="tel" value={editClientPhone} onChange={(e) => setEditClientPhone(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-company" className="text-right">Company</Label><Input id="edit-company" value={editClientCompany} onChange={(e) => setEditClientCompany(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-monthly-earnings" className="text-right">Monthly (USD)</Label><Input id="edit-monthly-earnings" type="number" value={editClientMonthlyEarnings} onChange={(e) => setEditClientMonthlyEarnings(e.target.value)} className="col-span-3" min="0"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-total-earnings" className="text-right">Total (USD)</Label><Input id="edit-total-earnings" type="number" value={editClientTotalEarningsUSD} onChange={(e) => setEditClientTotalEarningsUSD(e.target.value)} className="col-span-3" min="0"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-payment-medium" className="text-right">Payment Via</Label><Input id="edit-payment-medium" value={editClientPaymentMedium} onChange={(e) => setEditClientPaymentMedium(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-status" className="text-right">Status</Label><Select value={editClientStatus} onValueChange={setEditClientStatus}><SelectTrigger className="col-span-3" id="edit-status"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{clientStatusOptions.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-address" className="text-right">Address</Label><Input id="edit-address" value={editClientAddress} onChange={(e) => setEditClientAddress(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="edit-notes" className="text-right pt-2">Notes</Label><Textarea id="edit-notes" value={editClientNotes} onChange={(e) => setEditClientNotes(e.target.value)} className="col-span-3" rows={3}/></div>
            </div>
          </ScrollArea>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditClientDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveClientChanges}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

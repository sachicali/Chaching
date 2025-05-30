
"use client";

import type { ReactNode } from 'react';
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Users, MoreHorizontal, Edit, Trash2, Search, Mail, Phone, MapPin, FileTextIcon, BriefcaseBusiness, DollarSign, PiggyBank, Contact, Landmark, PackageSearch, Users2 } from "lucide-react";
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

const EXCHANGE_RATE_USD_TO_PHP = 58.75;

const formatUSD = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatPHP = (value?: number) => {
  if (value === undefined || value === null || isNaN(value)) return "₱0.00";
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
};

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
  const [newClientAvatarUrl, setNewClientAvatarUrl] = useState("");


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
  const [editClientAvatarUrl, setEditClientAvatarUrl] = useState("");


  const { toast } = useToast();

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(client => client.id === selectedClientId);
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (selectedClientId && !filteredClients.find(c => c.id === selectedClientId)) {
        setSelectedClientId(null);
    }
  }, [filteredClients, selectedClientId]);


  const resetAddClientForm = () => {
    setNewClientName(""); setNewClientEmail(""); setNewClientPhone(""); setNewClientCompany("");
    setNewClientMonthlyEarnings(""); setNewClientTotalEarningsUSD(""); setNewClientPaymentMedium("");
    setNewClientStatus(clientStatusOptions[0]); setNewClientAddress(""); setNewClientNotes("");
    setNewClientAvatarUrl("");
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
      paymentMedium: newClientPaymentMedium.trim() || undefined, status: newClientStatus || clientStatusOptions[0],
      address: newClientAddress.trim() || undefined, notes: newClientNotes.trim() || undefined,
      avatarUrl: newClientAvatarUrl.trim() || undefined,
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
    setEditClientAvatarUrl(client.avatarUrl || "");
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
      paymentMedium: editClientPaymentMedium.trim() || undefined, status: editClientStatus || clientStatusOptions[0],
      address: editClientAddress.trim() || undefined, notes: editClientNotes.trim() || undefined,
      avatarUrl: editClientAvatarUrl.trim() || editingClient.avatarUrl,
    });

    setIsEditClientDialogOpen(false);
    setEditingClient(null); 
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClientFromContext(clientId);
    if (selectedClientId === clientId) {
      setSelectedClientId(null); 
    }
  };
  
  const ClientDetailItem = ({ label, value, icon: Icon }: { label: string, value?: string | ReactNode, icon?: React.ElementType }) => {
    if (value === undefined || value === null || value === "") return null;
    return (
      <div className="py-3">
        <div className="text-xs text-muted-foreground flex items-center mb-1">
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          {label}
        </div>
        <div className="text-sm text-foreground whitespace-pre-wrap">{value}</div>
         <Separator className="mt-3" />
      </div>
    );
  };


  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "secondary";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("active") || lowerStatus.includes("on roster")) return "default"; 
    if (lowerStatus.includes("prospect")) return "outline"; 
    if (lowerStatus.includes("former") || lowerStatus.includes("inactive")) return "destructive";
    if (lowerStatus.includes("on hold") || lowerStatus.includes("payment pending")) return "secondary"; 
    return "secondary";
  };
  
  const getInvoiceStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "secondary";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "paid") return "default"; 
    if (lowerStatus === "sent") return "outline";
    if (lowerStatus === "draft") return "secondary";
    return "secondary";
  };


  const handleClientListItemKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, clientId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
      } else {
        setSelectedClientId(clientId);
      }
    }
  };

  const handleClientSelect = (clientId: string) => {
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    } else {
      setSelectedClientId(clientId);
    }
  };

  return (
    <div className="flex h-screen"> {/* Root of ClientsPage */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-border flex flex-col bg-card/50 h-full">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
             <Button variant="default" size="sm" onClick={() => setIsAddClientDialogOpen(true)}>New client</Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="pl-10 bg-background border-border focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0 overflow-y-auto"> {/* ScrollArea for client list */}
          <div className="p-4 space-y-2 h-full flex flex-col"> {/* Inner container for items or placeholder */}
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleClientSelect(client.id)}
                  onKeyDown={(e) => handleClientListItemKeyDown(e, client.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-md text-left hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:bg-muted cursor-pointer",
                    selectedClientId === client.id && "bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="avatar person"/>
                    <AvatarFallback>{client.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0"> 
                    <div className="font-semibold text-foreground truncate">{client.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{client.company || "Individual"}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()} >
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(client); }}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                <PackageSearch className="mx-auto h-12 w-12 mb-4 text-primary/50" />
                <p>No clients found {searchTerm && "matching your search"}.</p>
                {!searchTerm && <p className="text-sm">Click "New client" to add your first one.</p>}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto h-full"> {/* Right pane */}
        {selectedClient ? (
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">{selectedClient.name}</h2>
                    <p className="text-md text-muted-foreground flex items-center">
                        <BriefcaseBusiness className="mr-2 h-4 w-4" /> {selectedClient.company || "Individual"}
                    </p>
                </div>
                {selectedClient.status && (
                    <Badge variant={getStatusBadgeVariant(selectedClient.status)} className="text-sm px-3 py-1">
                        {selectedClient.status}
                    </Badge>
                )}
            </div>
            <Separator />
            <Tabs defaultValue="overview" className="w-full flex-1 flex flex-col">
              <TabsList className="bg-transparent p-0 border-b border-border rounded-none justify-start">
                <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2 text-muted-foreground hover:text-foreground">Overview</TabsTrigger>
                <TabsTrigger value="financials" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2 text-muted-foreground hover:text-foreground">Financials</TabsTrigger>
                <TabsTrigger value="invoices" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2 text-muted-foreground hover:text-foreground">Invoices</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2 text-muted-foreground hover:text-foreground">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 flex-1">
                 <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center"><Contact className="mr-3 h-5 w-5 text-primary/70"/>Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <ClientDetailItem label="Email" value={selectedClient.email} icon={Mail} />
                        <ClientDetailItem label="Phone" value={selectedClient.phone} icon={Phone} />
                        <ClientDetailItem label="Address" value={selectedClient.address} icon={MapPin} />
                        <ClientDetailItem label="Notes" value={selectedClient.notes} icon={FileTextIcon} />
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="financials" className="mt-6 flex-1">
                 <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                         <CardTitle className="text-xl font-semibold text-foreground flex items-center"><DollarSign className="mr-3 h-5 w-5 text-primary/70"/>Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        <ClientDetailItem label="Monthly Earnings (USD)" value={selectedClient.monthlyEarnings ? formatUSD(selectedClient.monthlyEarnings) : "Not set"} icon={DollarSign} />
                        <ClientDetailItem label="Monthly Earnings (PHP)" value={selectedClient.monthlyEarnings ? formatPHP(selectedClient.monthlyEarnings * EXCHANGE_RATE_USD_TO_PHP) : "Not set"} icon={PiggyBank} />
                        <ClientDetailItem label="Total Earnings (USD)" value={selectedClient.totalEarningsUSD ? formatUSD(selectedClient.totalEarningsUSD) : "Not set"} icon={DollarSign} />
                        <ClientDetailItem label="Total Earnings (PHP)" value={selectedClient.totalEarningsUSD ? formatPHP(selectedClient.totalEarningsUSD * EXCHANGE_RATE_USD_TO_PHP) : "Not set"} icon={PiggyBank} />
                        <ClientDetailItem label="Payment Medium" value={selectedClient.paymentMedium} icon={Landmark} />
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="invoices" className="mt-6 flex-1">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center"><FileTextIcon className="mr-3 h-5 w-5 text-primary/70"/>Invoices</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
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
                        <TableRow>
                            <TableCell>INV-2023-001</TableCell>
                            <TableCell>2023-01-15</TableCell>
                            <TableCell><Badge variant={getInvoiceStatusBadgeVariant("Paid")}>Paid</Badge></TableCell>
                            <TableCell className="text-right">{formatUSD(1500)}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>INV-2023-002</TableCell>
                            <TableCell>2023-02-20</TableCell>
                            <TableCell><Badge variant={getInvoiceStatusBadgeVariant("Sent")}>Sent</Badge></TableCell>
                            <TableCell className="text-right">{formatUSD(2000)}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>INV-2023-003</TableCell>
                            <TableCell>2023-03-25</TableCell>
                            <TableCell><Badge variant={getInvoiceStatusBadgeVariant("Draft")}>Draft</Badge></TableCell>
                            <TableCell className="text-right">{formatUSD(2500)}</TableCell>
                        </TableRow>
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="activity" className="mt-6 flex-1">
                 <div className="rounded-lg border border-border p-6 text-center text-muted-foreground h-48 flex items-center justify-center">
                    Client activity log will be displayed here. (Coming soon)
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : filteredClients.length > 0 ? (
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                        <Users2 className="mr-3 h-6 w-6 text-primary" /> 
                        Client Overview
                    </CardTitle>
                    <CardDescription>Select a client from the list on the left to view their details, or browse all clients below.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Monthly (USD)</TableHead>
                                <TableHead>Monthly (PHP)</TableHead>
                                <TableHead>Total (USD)</TableHead>
                                <TableHead>Total (PHP)</TableHead>
                                <TableHead>Payment Via</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => (
                                <TableRow key={client.id} onClick={() => handleClientSelect(client.id)} className="cursor-pointer hover:bg-muted">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="avatar person"/>
                                                <AvatarFallback>{client.name.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">{client.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{client.company || "N/A"}</TableCell>
                                    <TableCell className="text-muted-foreground">{client.email}</TableCell>
                                    <TableCell>
                                        {client.status && <Badge variant={getStatusBadgeVariant(client.status)}>{client.status}</Badge>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {client.monthlyEarnings ? formatUSD(client.monthlyEarnings) : "-"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {client.monthlyEarnings ? formatPHP(client.monthlyEarnings * EXCHANGE_RATE_USD_TO_PHP) : "-"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {client.totalEarningsUSD ? formatUSD(client.totalEarningsUSD) : "-"}
                                    </TableCell>
                                     <TableCell className="text-muted-foreground">
                                        {client.totalEarningsUSD ? formatPHP(client.totalEarningsUSD * EXCHANGE_RATE_USD_TO_PHP) : "-"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{client.paymentMedium || "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground flex-1">
            <PackageSearch className="h-16 w-16 mb-4 text-primary/30" />
            <p className="text-xl">No clients found.</p>
            <p className="text-sm">Click "New client" in the sidebar to add your first one.</p>
             <Button variant="outline" className="mt-4" onClick={() => setIsAddClientDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isAddClientDialogOpen} onOpenChange={(isOpen) => { setIsAddClientDialogOpen(isOpen); if (!isOpen) resetAddClientForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add New Client</DialogTitle><DialogDescription>Enter the details for your new client.</DialogDescription></DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-name" className="text-right">Name*</Label><Input id="add-name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-email" className="text-right">Email*</Label><Input id="add-email" type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-phone" className="text-right">Phone</Label><Input id="add-phone" type="tel" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-company" className="text-right">Company</Label><Input id="add-company" value={newClientCompany} onChange={(e) => setNewClientCompany(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-monthly-earnings" className="text-right">Monthly (USD)</Label><Input id="add-monthly-earnings" type="number" placeholder="e.g., 1500" value={newClientMonthlyEarnings} onChange={(e) => setNewClientMonthlyEarnings(e.target.value)} className="col-span-3" min="0"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-total-earnings" className="text-right">Total (USD)</Label><Input id="add-total-earnings" type="number" placeholder="e.g., 10000" value={newClientTotalEarningsUSD} onChange={(e) => setNewClientTotalEarningsUSD(e.target.value)} className="col-span-3" min="0"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-payment-medium" className="text-right">Payment Via</Label><Input id="add-payment-medium" placeholder="e.g., Bank Transfer, PayPal" value={newClientPaymentMedium} onChange={(e) => setNewClientPaymentMedium(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-status" className="text-right">Status</Label><Select value={newClientStatus} onValueChange={setNewClientStatus}><SelectTrigger className="col-span-3" id="add-status"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent>{clientStatusOptions.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-address" className="text-right">Address</Label><Input id="add-address" placeholder="Client's address" value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="add-notes" className="text-right pt-2">Notes</Label><Textarea id="add-notes" placeholder="Any relevant notes about the client..." value={newClientNotes} onChange={(e) => setNewClientNotes(e.target.value)} className="col-span-3" rows={3}/></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="add-avatar" className="text-right">Avatar URL</Label><Input id="add-avatar" placeholder="https://placehold.co/100x100.png" value={newClientAvatarUrl} onChange={(e) => setNewClientAvatarUrl(e.target.value)} className="col-span-3"/></div>
            </div>
          </ScrollArea>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setIsAddClientDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleAddClient}>Save Client</Button></DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="edit-avatar" className="text-right">Avatar URL</Label><Input id="edit-avatar" placeholder="https://placehold.co/100x100.png" value={editClientAvatarUrl} onChange={(e) => setEditClientAvatarUrl(e.target.value)} className="col-span-3"/></div>
            </div>
          </ScrollArea>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setIsEditClientDialogOpen(false)}>Cancel</Button><Button type="button" onClick={handleSaveClientChanges}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


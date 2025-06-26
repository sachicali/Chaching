
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { clientService, type ClientCreateData, type ClientUpdateData } from '@/services/client.service';
import type { Client as DatabaseClient } from '@/types/database.types';

// Legacy interface for backward compatibility with existing UI
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  monthlyEarnings?: number; // Legacy field - maps to monthlyAverage
  totalEarningsUSD?: number; // Legacy field - maps to totalEarned
  paymentMedium?: string; // Legacy field - maps to preferredPaymentMethod
  status?: string;
  address?: string;
  notes?: string;
  avatarUrl?: string;
}

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (updatedClient: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Convert database client to legacy client format
  const mapDatabaseClientToLegacy = useCallback((dbClient: DatabaseClient): Client => {
    return {
      id: dbClient.id,
      name: dbClient.name,
      email: dbClient.email || '',
      phone: dbClient.phone,
      company: dbClient.company,
      monthlyEarnings: dbClient.monthlyAverage || undefined,
      totalEarningsUSD: dbClient.totalEarned || undefined,
      paymentMedium: dbClient.preferredPaymentMethod,
      status: dbClient.status,
      address: dbClient.address,
      notes: dbClient.notes,
      avatarUrl: dbClient.avatarUrl || `https://placehold.co/60x60.png?text=${dbClient.name.charAt(0)}`
    };
  }, []);

  // Convert legacy client to database client format
  const mapLegacyClientToDatabase = useCallback((legacyClient: Omit<Client, 'id'>): ClientCreateData => {
    return {
      name: legacyClient.name,
      email: legacyClient.email || undefined,
      phone: legacyClient.phone,
      company: legacyClient.company,
      address: legacyClient.address,
      status: (legacyClient.status as any) || 'prospect',
      avatarUrl: legacyClient.avatarUrl,
      notes: legacyClient.notes,
      preferredPaymentMethod: (legacyClient.paymentMedium as any),
      type: 'individual' // Default type
    };
  }, []);

  // Load clients from Firestore
  const loadClients = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await clientService.getClients(user.uid);
      if (result.success) {
        const legacyClients = result.clients.map(mapDatabaseClientToLegacy);
        setClients(legacyClients);
      } else {
        setError(result.error || 'Failed to load clients');
        toast({
          title: "Error Loading Clients",
          description: result.error || 'Failed to load clients',
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = 'Failed to load clients';
      setError(errorMessage);
      toast({
        title: "Error Loading Clients",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, mapDatabaseClientToLegacy, toast]);

  // Initialize clients when user is available
  useEffect(() => {
    if (user?.uid) {
      loadClients();
    } else {
      setClients([]);
      setError(null);
    }
  }, [user?.uid, loadClients]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = clientService.subscribeToClients(
      user.uid,
      (dbClients) => {
        const legacyClients = dbClients.map(mapDatabaseClientToLegacy);
        setClients(legacyClients);
        setError(null);
      },
      (error) => {
        setError(error);
        toast({
          title: "Connection Error",
          description: error,
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  }, [user?.uid, mapDatabaseClientToLegacy, toast]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id'>) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add clients.",
        variant: "destructive",
      });
      return;
    }

    try {
      const dbClientData = mapLegacyClientToDatabase(clientData);
      const result = await clientService.createClient(user.uid, dbClientData);
      
      if (result.success) {
        toast({
          title: "Client Added",
          description: `${clientData.name} has been added.`,
        });
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Adding Client",
          description: result.error || 'Failed to add client',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Adding Client",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, mapLegacyClientToDatabase, toast]);

  const updateClient = useCallback(async (updatedClient: Client) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update clients.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData: ClientUpdateData = {
        id: updatedClient.id,
        name: updatedClient.name,
        email: updatedClient.email || undefined,
        phone: updatedClient.phone,
        company: updatedClient.company,
        address: updatedClient.address,
        status: (updatedClient.status as any) || 'prospect',
        avatarUrl: updatedClient.avatarUrl,
        notes: updatedClient.notes,
        preferredPaymentMethod: (updatedClient.paymentMedium as any)
      };

      const result = await clientService.updateClient(user.uid, updateData);
      
      if (result.success) {
        toast({
          title: "Client Updated",
          description: `${updatedClient.name}'s details have been updated.`,
        });
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Updating Client",
          description: result.error || 'Failed to update client',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Updating Client",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, toast]);

  const deleteClient = useCallback(async (clientId: string) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete clients.",
        variant: "destructive",
      });
      return;
    }

    try {
      const clientToDelete = clients.find(c => c.id === clientId);
      const result = await clientService.deleteClient(user.uid, clientId);
      
      if (result.success) {
        if (clientToDelete) {
          toast({
            title: "Client Deleted",
            description: `${clientToDelete.name} has been removed.`,
            variant: "destructive",
          });
        }
        // Real-time subscription will update the state
      } else {
        toast({
          title: "Error Deleting Client",
          description: result.error || 'Failed to delete client',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error Deleting Client",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.uid, clients, toast]);

  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const refreshClients = useCallback(async () => {
    await loadClients();
  }, [loadClients]);

  return (
    <ClientContext.Provider value={{
      clients,
      loading,
      error,
      addClient,
      updateClient,
      deleteClient,
      getClientById,
      refreshClients
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};


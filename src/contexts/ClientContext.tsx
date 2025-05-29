
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  monthlyEarnings?: number;
}

interface ClientContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (updatedClient: Client) => void;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Client | undefined;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  const addClient = useCallback((clientData: Omit<Client, 'id'>) => {
    const newClient = { ...clientData, id: Date.now().toString() };
    setClients(prev => [...prev, newClient]);
    toast({
      title: "Client Added",
      description: `${newClient.name} has been added.`,
    });
  }, [toast]);

  const updateClient = useCallback((updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    toast({
      title: "Client Updated",
      description: `${updatedClient.name}'s details have been updated.`,
    });
  }, [toast]);

  const deleteClient = useCallback((clientId: string) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    if (clientToDelete) {
      toast({
        title: "Client Deleted",
        description: `${clientToDelete.name} has been removed.`,
      });
    }
  }, [clients, toast]);

  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  return (
    <ClientContext.Provider value={{ clients, addClient, updateClient, deleteClient, getClientById }}>
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

/**
 * Client Service for Chaching Financial Management Platform
 * 
 * Provides comprehensive Firebase Firestore operations for client management.
 * Handles CRUD operations with user-scoped data access and real-time synchronization.
 * 
 * User Stories: US-001 (User Registration completion), US-004 (Transaction Management)
 * Dependencies: Firebase Firestore, authentication context, database types
 * Architecture: Service layer pattern with comprehensive error handling
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserClientsRef, getClientRef, getCurrentTimestamp } from '@/lib/firestore-schema';
import type { 
  Client, 
  CreateClientData, 
  UpdateClientData,
  ClientStatus,
  ClientType,
  PaymentMethod
} from '@/types/database.types';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ClientServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ClientListResult {
  success: boolean;
  clients: Client[];
  error?: string;
}

export interface ClientCreateData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  type?: ClientType;
  status?: ClientStatus;
  avatarUrl?: string;
  notes?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: PaymentMethod;
}

export interface ClientUpdateData extends Partial<ClientCreateData> {
  id: string;
}

export interface ClientFilters {
  status?: ClientStatus;
  type?: ClientType;
  search?: string;
}

// ============================================================================
// CLIENT SERVICE CLASS
// ============================================================================

class ClientService {
  private activeSubscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Create a new client for the authenticated user
   */
  async createClient(userId: string, clientData: ClientCreateData): Promise<ClientServiceResult<Client>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Validate required fields
      if (!clientData.name?.trim()) {
        return { success: false, error: 'Client name is required' };
      }

      if (clientData.email && !this.isValidEmail(clientData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      const timestamp = getCurrentTimestamp();
      const clientsRef = getUserClientsRef(userId);

      // Prepare client data for Firestore
      const firestoreData: Omit<Client, 'id'> = {
        userId,
        name: clientData.name.trim(),
        email: clientData.email?.trim() || undefined,
        phone: clientData.phone?.trim() || undefined,
        company: clientData.company?.trim() || undefined,
        address: clientData.address?.trim() || undefined,
        type: clientData.type || 'individual',
        status: clientData.status || 'prospect',
        avatarUrl: clientData.avatarUrl?.trim() || undefined,
        notes: clientData.notes?.trim() || undefined,
        paymentTerms: clientData.paymentTerms?.trim() || undefined,
        preferredPaymentMethod: clientData.preferredPaymentMethod,
        // Financial summary fields (initialized to zero)
        totalEarned: 0,
        totalOwed: 0,
        monthlyAverage: 0,
        lastPaymentDate: undefined,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const docRef = await addDoc(clientsRef, firestoreData);
      
      const newClient: Client = {
        id: docRef.id,
        ...firestoreData
      };

      return { success: true, data: newClient };

    } catch (error) {
      console.error('Error creating client:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get a specific client by ID
   */
  async getClient(userId: string, clientId: string): Promise<ClientServiceResult<Client>> {
    try {
      if (!userId || !clientId) {
        return { success: false, error: 'User ID and Client ID are required' };
      }

      const clientRef = getClientRef(userId, clientId);
      const clientSnap = await getDoc(clientRef);

      if (!clientSnap.exists()) {
        return { success: false, error: 'Client not found' };
      }

      const client: Client = {
        id: clientSnap.id,
        ...clientSnap.data()
      } as Client;

      return { success: true, data: client };

    } catch (error) {
      console.error('Error fetching client:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Get all clients for the authenticated user
   */
  async getClients(userId: string, filters?: ClientFilters): Promise<ClientListResult> {
    try {
      if (!userId) {
        return { success: false, clients: [], error: 'User ID is required' };
      }

      let clientQuery = query(
        getUserClientsRef(userId),
        orderBy('name', 'asc')
      );

      // Apply filters if provided
      if (filters?.status) {
        clientQuery = query(clientQuery, where('status', '==', filters.status));
      }

      if (filters?.type) {
        clientQuery = query(clientQuery, where('type', '==', filters.type));
      }

      const querySnapshot = await getDocs(clientQuery);
      let clients: Client[] = [];

      querySnapshot.forEach((doc) => {
        const clientData = doc.data() as Omit<Client, 'id'>;
        clients.push({
          id: doc.id,
          ...clientData
        });
      });

      // Apply search filter client-side (Firestore doesn't support full-text search)
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        clients = clients.filter(client => 
          client.name.toLowerCase().includes(searchTerm) ||
          (client.company && client.company.toLowerCase().includes(searchTerm)) ||
          (client.email && client.email.toLowerCase().includes(searchTerm))
        );
      }

      return { success: true, clients };

    } catch (error) {
      console.error('Error fetching clients:', error);
      return { 
        success: false, 
        clients: [], 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Update an existing client
   */
  async updateClient(userId: string, clientData: ClientUpdateData): Promise<ClientServiceResult<Client>> {
    try {
      if (!userId || !clientData.id) {
        return { success: false, error: 'User ID and Client ID are required' };
      }

      // Validate data if provided
      if (clientData.name !== undefined && !clientData.name.trim()) {
        return { success: false, error: 'Client name cannot be empty' };
      }

      if (clientData.email && !this.isValidEmail(clientData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      const clientRef = getClientRef(userId, clientData.id);
      
      // Check if client exists
      const clientSnap = await getDoc(clientRef);
      if (!clientSnap.exists()) {
        return { success: false, error: 'Client not found' };
      }

      // Prepare update data
      const updateData: Partial<Client> = {
        updatedAt: getCurrentTimestamp()
      };

      // Only include changed fields
      if (clientData.name !== undefined) updateData.name = clientData.name.trim();
      if (clientData.email !== undefined) updateData.email = clientData.email?.trim() || undefined;
      if (clientData.phone !== undefined) updateData.phone = clientData.phone?.trim() || undefined;
      if (clientData.company !== undefined) updateData.company = clientData.company?.trim() || undefined;
      if (clientData.address !== undefined) updateData.address = clientData.address?.trim() || undefined;
      if (clientData.type !== undefined) updateData.type = clientData.type;
      if (clientData.status !== undefined) updateData.status = clientData.status;
      if (clientData.avatarUrl !== undefined) updateData.avatarUrl = clientData.avatarUrl?.trim() || undefined;
      if (clientData.notes !== undefined) updateData.notes = clientData.notes?.trim() || undefined;
      if (clientData.paymentTerms !== undefined) updateData.paymentTerms = clientData.paymentTerms?.trim() || undefined;
      if (clientData.preferredPaymentMethod !== undefined) updateData.preferredPaymentMethod = clientData.preferredPaymentMethod;

      await updateDoc(clientRef, updateData);

      // Fetch updated client
      const updatedSnap = await getDoc(clientRef);
      const updatedClient: Client = {
        id: updatedSnap.id,
        ...updatedSnap.data()
      } as Client;

      return { success: true, data: updatedClient };

    } catch (error) {
      console.error('Error updating client:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Delete a client
   */
  async deleteClient(userId: string, clientId: string): Promise<ClientServiceResult<void>> {
    try {
      if (!userId || !clientId) {
        return { success: false, error: 'User ID and Client ID are required' };
      }

      const clientRef = getClientRef(userId, clientId);
      
      // Check if client exists
      const clientSnap = await getDoc(clientRef);
      if (!clientSnap.exists()) {
        return { success: false, error: 'Client not found' };
      }

      await deleteDoc(clientRef);
      return { success: true };

    } catch (error) {
      console.error('Error deleting client:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Subscribe to real-time client updates
   */
  subscribeToClients(
    userId: string, 
    callback: (clients: Client[]) => void,
    onError?: (error: string) => void
  ): Unsubscribe {
    if (!userId) {
      onError?.('User ID is required');
      return () => {};
    }

    const clientsQuery = query(
      getUserClientsRef(userId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      clientsQuery,
      (querySnapshot) => {
        const clients: Client[] = [];
        querySnapshot.forEach((doc) => {
          const clientData = doc.data() as Omit<Client, 'id'>;
          clients.push({
            id: doc.id,
            ...clientData
          });
        });
        callback(clients);
      },
      (error) => {
        console.error('Error in clients subscription:', error);
        onError?.(this.handleFirestoreError(error));
      }
    );

    // Store subscription for cleanup
    this.activeSubscriptions.set(userId, unsubscribe);
    
    return unsubscribe;
  }

  /**
   * Subscribe to a specific client's updates
   */
  subscribeToClient(
    userId: string,
    clientId: string,
    callback: (client: Client | null) => void,
    onError?: (error: string) => void
  ): Unsubscribe {
    if (!userId || !clientId) {
      onError?.('User ID and Client ID are required');
      return () => {};
    }

    const clientRef = getClientRef(userId, clientId);

    const unsubscribe = onSnapshot(
      clientRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const client: Client = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as Client;
          callback(client);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in client subscription:', error);
        onError?.(this.handleFirestoreError(error));
      }
    );

    return unsubscribe;
  }

  /**
   * Update client financial summary (typically called after transaction changes)
   */
  async updateClientFinancials(
    userId: string, 
    clientId: string, 
    financialData: {
      totalEarned?: number;
      totalOwed?: number;
      monthlyAverage?: number;
      lastPaymentDate?: Timestamp;
    }
  ): Promise<ClientServiceResult<void>> {
    try {
      if (!userId || !clientId) {
        return { success: false, error: 'User ID and Client ID are required' };
      }

      const clientRef = getClientRef(userId, clientId);
      
      const updateData: Partial<Client> = {
        ...financialData,
        updatedAt: getCurrentTimestamp()
      };

      await updateDoc(clientRef, updateData);
      return { success: true };

    } catch (error) {
      console.error('Error updating client financials:', error);
      return { 
        success: false, 
        error: this.handleFirestoreError(error) 
      };
    }
  }

  /**
   * Cleanup all active subscriptions
   */
  cleanup(): void {
    this.activeSubscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeSubscriptions.clear();
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Handle Firestore errors with user-friendly messages
   */
  private handleFirestoreError(error: unknown): string {
    if (error instanceof Error) {
      // Check for common Firestore error codes
      const errorCode = (error as any).code;
      
      switch (errorCode) {
        case 'permission-denied':
          return 'You do not have permission to perform this action';
        case 'not-found':
          return 'The requested resource was not found';
        case 'already-exists':
          return 'A resource with this identifier already exists';
        case 'resource-exhausted':
          return 'Request limit exceeded. Please try again later';
        case 'unauthenticated':
          return 'Authentication required. Please sign in again';
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again';
        case 'deadline-exceeded':
          return 'Request timed out. Please try again';
        default:
          console.error('Firestore error:', error);
          return 'An unexpected error occurred. Please try again';
      }
    }

    console.error('Unknown error:', error);
    return 'An unknown error occurred. Please try again';
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const clientService = new ClientService();

/**
 * Usage Examples:
 * 
 * // Create new client
 * const result = await clientService.createClient(userId, {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   company: 'Doe Consulting',
 *   status: 'active'
 * });
 * 
 * // Get all clients
 * const clientsResult = await clientService.getClients(userId);
 * 
 * // Subscribe to real-time updates
 * const unsubscribe = clientService.subscribeToClients(
 *   userId,
 *   (clients) => setClients(clients),
 *   (error) => console.error('Subscription error:', error)
 * );
 * 
 * // Update client
 * await clientService.updateClient(userId, {
 *   id: clientId,
 *   name: 'Updated Name',
 *   status: 'active'
 * });
 * 
 * // Delete client
 * await clientService.deleteClient(userId, clientId);
 */
"use client";

import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ClientProvider } from '@/contexts/ClientContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const inter = Inter({ subsets: ['latin'] });

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <ProtectedRoute>
        <ClientProvider>
          <TransactionProvider>
            <div className="min-h-screen bg-background">
              <main className="container mx-auto p-6">
                {children}
              </main>
            </div>
            <Toaster />
          </TransactionProvider>
        </ClientProvider>
      </ProtectedRoute>
    </div>
  );
}

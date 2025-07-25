"use client";

import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ClientProvider } from '@/contexts/ClientContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { EmailProvider } from '@/contexts/EmailContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { QuickAddButton } from '@/components/layout/quick-add-button';

const inter = Inter({ subsets: ['latin'] });

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Development mode: Bypass authentication for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const content = (
    <div className={inter.className}>
      <ClientProvider>
        <TransactionProvider>
          <EmailProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-end border-b bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl shadow-sm">
                  <div className="absolute inset-0 bg-background/50" />
                  <div className="relative flex items-center gap-4 px-6">
                    <ThemeToggle />
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 pt-0">
                  {children}
                </div>
              </SidebarInset>
              <QuickAddButton />
              <Toaster />
            </SidebarProvider>
          </EmailProvider>
        </TransactionProvider>
      </ClientProvider>
    </div>
  );
  
  if (isDevelopment) {
    // In development, show content directly for testing
    return content;
  }
  
  return (
    <div className={inter.className}>
      <ProtectedRoute>
          <ClientProvider>
            <TransactionProvider>
              <EmailProvider>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset>
                    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-end border-b bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl shadow-sm">
                      <div className="absolute inset-0 bg-background/50" />
                      <div className="relative flex items-center gap-4 px-6">
                        <ThemeToggle />
                      </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 pt-0">
                      {children}
                    </div>
                  </SidebarInset>
                  <QuickAddButton />
                  <Toaster />
                </SidebarProvider>
              </EmailProvider>
            </TransactionProvider>
          </ClientProvider>
        </ProtectedRoute>
      </div>
    );
  }

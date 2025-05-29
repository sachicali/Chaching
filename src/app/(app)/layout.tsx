
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { Button } from "@/components/ui/button"; // For the mobile trigger
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientProvider } from "@/contexts/ClientContext";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
      <SidebarProvider defaultOpen>
        <div className="flex flex-1 min-h-0"> {/* Ensures this container grows and respects flex parent */}
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 w-full">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
              <SidebarTrigger asChild>
                 <Button variant="outline" size="icon" className="md:hidden">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                 </Button>
              </SidebarTrigger>
              <h1 className="text-lg font-semibold text-primary">Chaching</h1>
            </header>
            <ScrollArea className="flex-1 w-full lg:p-6 p-4">
              {children}
            </ScrollArea>
          </SidebarInset>
        </div>
        <QuickAddButton />
      </SidebarProvider>
    </ClientProvider>
  );
}

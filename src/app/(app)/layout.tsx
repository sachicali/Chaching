
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { QuickAddButton } from "@/components/layout/quick-add-button";
import { Button } from "@/components/ui/button"; // For the mobile trigger
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 w-full"> {/* Added w-full */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
            {/* Mobile sidebar trigger */}
            <SidebarTrigger asChild>
               <Button variant="outline" size="icon" className="md:hidden">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
               </Button>
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-primary">Chaching</h1>
          </header>
          {/* Apply padding directly to ScrollArea. The viewport within ScrollArea will be full width of this padded area. */}
          <ScrollArea className="flex-1 w-full p-4 md:p-6 lg:py-8 lg:px-0">
            {children}
          </ScrollArea>
        </SidebarInset>
      </div>
      <QuickAddButton />
    </SidebarProvider>
  );
}

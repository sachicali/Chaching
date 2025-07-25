"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Repeat,
  Target,
  Calculator,
  FolderArchive,
  BarChartHorizontalBig,
  Sparkles,
  Settings,
  Newspaper,
  AlertTriangle,
  Brain,
  LogOut,
  Mail,
  Send,
  Clock,
  BarChart3,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clients", tooltip: "Client Management" },
  { href: "/invoices", icon: FileText, label: "Invoices", tooltip: "Invoice Generation" },
  { href: "/income", icon: TrendingUp, label: "Income", tooltip: "Income Tracking" },
  { href: "/expenses", icon: TrendingDown, label: "Expenses", tooltip: "Expense Tracking" },
  { href: "/recurring", icon: Repeat, label: "Recurring", tooltip: "Recurring Transactions" },
  { href: "/goals", icon: Target, label: "Goals", tooltip: "Savings Goals" },
  { href: "/taxes", icon: Calculator, label: "Taxes", tooltip: "Tax Estimation" },
  { href: "/documents", icon: FolderArchive, label: "Documents", tooltip: "Document Vault" },
  { href: "/cashflow", icon: BarChartHorizontalBig, label: "Cash Flow", tooltip: "Cash Flow Forecast" },
  { href: "/reports", icon: BarChart3, label: "Reports", tooltip: "Financial Reports" },
];

const emailNavItems = [
  { href: "/emails", icon: Mail, label: "Email Hub", tooltip: "Email Management Dashboard" },
  { href: "/email-templates", icon: FileText, label: "Templates", tooltip: "Email Templates" },
];

const aiToolsNavItems = [
  { href: "/insights", icon: Sparkles, label: "Insights", tooltip: "Financial Insights" },
  { href: "/digest", icon: Newspaper, label: "Digest", tooltip: "Weekly Digest" },
  { href: "/predictions", icon: Brain, label: "Predictions", tooltip: "Income Predictions" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, open } = useSidebar();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} className="border-r border-border/40 bg-gradient-to-b from-sidebar-background to-sidebar-background/95 shadow-xl">
      {/* Toggle Button - Outside and above the header */}
      <div className="p-3 border-b border-border/40">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className="h-9 w-full rounded-lg bg-muted/50 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all duration-200 flex items-center justify-center gap-2 group">
              <div className="relative w-4 h-4">
                <ChevronLeft className={cn(
                  "absolute inset-0 h-4 w-4 transition-all duration-300 text-muted-foreground group-hover:text-primary",
                  open ? "opacity-100 rotate-0" : "opacity-0 -rotate-180"
                )} />
                <ChevronRight className={cn(
                  "absolute inset-0 h-4 w-4 transition-all duration-300 text-muted-foreground group-hover:text-primary",
                  !open ? "opacity-100 rotate-0" : "opacity-0 rotate-180"
                )} />
              </div>
              <span className={cn(
                "text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors",
                !open && "hidden"
              )}>
                Collapse Menu
              </span>
            </SidebarTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className={!open ? "flex" : "hidden"}>
            {open ? "Collapse sidebar" : "Expand sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>

      <SidebarHeader>
        {/* Logo Section */}
        <div className="p-6 pb-4">
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300",
            !open && "justify-center"
          )}>
            {/* Logo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex-shrink-0 cursor-pointer group">
                  <div className={cn(
                    "rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-0.5 shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105",
                    open ? "w-12 h-12" : "w-10 h-10"
                  )}>
                    <div className="w-full h-full rounded-2xl bg-background/90 flex items-center justify-center">
                      <DollarSign className={cn(
                        "text-primary transition-all duration-300",
                        open ? "h-6 w-6" : "h-5 w-5"
                      )} />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className={!open ? "flex" : "hidden"}>
                <div className="font-semibold">Chaching</div>
                <div className="text-xs text-muted-foreground">Financial Management</div>
              </TooltipContent>
            </Tooltip>

            {/* Text - Hidden when collapsed */}
            <div className={cn(
              "flex flex-col transition-all duration-300",
              !open && "hidden"
            )}>
              <h1 className="text-xl font-bold text-foreground">Chaching</h1>
              <p className="text-xs text-muted-foreground">Financial Management</p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <Separator className="opacity-20" />
      <SidebarContent className="px-3 py-4">
        {/* Navigation */}
        <div className="space-y-1">
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "relative h-11 rounded-lg transition-all duration-200 group",
                          "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-sm",
                          isActive && "bg-gradient-to-r from-primary/10 to-primary/15 shadow-sm text-primary"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 px-3">
                          <item.icon className={cn(
                            "h-5 w-5 transition-all duration-200",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                          )} />
                          <span className={cn(
                            "font-medium transition-all duration-200",
                            isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                            "group-data-[collapsible=icon]:sr-only"
                          )}>
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="group-data-[collapsible=icon]:flex hidden">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>

        {/* Email Section */}
        <div className="mt-8">
          <div className="mb-3 px-3 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
              Email Automation
            </p>
          </div>
          <div className="space-y-1">
            <SidebarMenu>
              {emailNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/emails" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.tooltip}
                      className={cn(
                        "relative h-11 rounded-lg transition-all duration-200 group",
                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-sm",
                        isActive && "bg-gradient-to-r from-primary/10 to-primary/15 shadow-sm text-primary"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3 px-3">
                        <item.icon className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                        )} />
                        <span className={cn(
                          "font-medium transition-colors duration-200",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        </div>

        {/* AI Tools Section */}
        <div className="mt-8">
          <div className="mb-3 px-3 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
              AI Intelligence
            </p>
          </div>
          <div className="space-y-1">
            <SidebarMenu>
              {aiToolsNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.tooltip}
                      className={cn(
                        "relative h-11 rounded-lg transition-all duration-200 group",
                        "hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-sm",
                        isActive && "bg-gradient-to-r from-primary/10 to-primary/15 shadow-sm text-primary"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3 px-3">
                        <item.icon className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                        )} />
                        <span className={cn(
                          "font-medium transition-colors duration-200",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    "h-16 rounded-xl transition-all duration-300",
                    "hover:bg-sidebar-accent",
                    "data-[state=open]:bg-sidebar-accent"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-11 w-11 rounded-xl border border-border">
                      <AvatarImage 
                        src={user?.photoURL || undefined} 
                        alt={user?.displayName || user?.email || 'User'} 
                        className="rounded-xl"
                      />
                      <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
                  </div>
                  <div className="grid flex-1 text-left">
                    <span className="truncate font-semibold text-foreground">
                      {user?.displayName || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className={cn(
                  "w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl",
                  "border shadow-lg"
                )}
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Avatar className="h-10 w-10 rounded-xl border border-border">
                      <AvatarImage 
                        src={user?.photoURL || undefined} 
                        alt={user?.displayName || user?.email || 'User'}
                        className="rounded-xl"
                      />
                      <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left">
                      <span className="truncate font-bold text-foreground">
                        {user?.displayName || 'User'}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <div className="p-2">
                  <DropdownMenuItem asChild className="rounded-lg h-11 transition-all duration-200">
                    <Link href="/settings" className="flex items-center gap-3 px-3">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="rounded-lg h-11 transition-all duration-200 text-destructive hover:text-destructive"
                  >
                    <div className="flex items-center gap-3 px-3">
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign out</span>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </TooltipProvider>
  );
}


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  // SidebarTrigger, // Not used directly here anymore if mobile trigger is in AppLayout
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DollarSign, // Keep DollarSign
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
];

const aiToolsNavItems = [
  { href: "/insights", icon: Sparkles, label: "Insights", tooltip: "Financial Insights" },
  { href: "/digest", icon: Newspaper, label: "Digest", tooltip: "Weekly Digest" },
  { href: "/anomalies", icon: AlertTriangle, label: "Anomalies", tooltip: "Anomaly Alerts" },
  { href: "/predictions", icon: Brain, label: "Predictions", tooltip: "Income Predictions" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}>
      <SidebarHeader className="p-4 flex items-center gap-2">
        {/* Use a simple SVG or a themed icon if DollarSign with text-primary looks off */}
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent rounded-full">
          {/* Simple Triangle/Logo Placeholder, matching foreground color */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-current">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </Button>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <h1 className="text-xl font-semibold text-sidebar-foreground">Chaching</h1>
          <p className="text-xs text-muted-foreground">Freelancer Finance</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={item.tooltip}
                  className={cn(pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground")}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-4 p-2 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-medium text-sidebar-foreground/70">AI Tools</p>
        </div>
         <SidebarMenu>
          {aiToolsNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.tooltip}
                   className={cn(pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground")}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
           <SidebarMenuItem>
             <Link href="/settings" passHref legacyBehavior>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/settings")} tooltip="Settings" className={cn(pathname.startsWith("/settings") && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                  <a><Settings /><span>Settings</span></a>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
         <div className="mt-4 flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-sidebar-foreground">User Name</p>
              <p className="text-xs text-muted-foreground">user@example.com</p>
            </div>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}

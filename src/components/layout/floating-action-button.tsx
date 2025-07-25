"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChachiChatModal } from "@/components/ai/chachi-chat-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Plus, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();

  const actions: FABAction[] = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      label: "Chat with Chachi",
      onClick: () => {
        setIsChatOpen(true);
        setIsOpen(false);
      },
      color: "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-primary/30"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Add Income",
      onClick: () => {
        router.push('/income');
        setIsOpen(false);
      },
      color: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/30"
    },
    {
      icon: <TrendingDown className="h-5 w-5" />,
      label: "Add Expense",
      onClick: () => {
        router.push('/expenses');
        setIsOpen(false);
      },
      color: "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Create Invoice",
      onClick: () => {
        router.push('/invoices/new');
        setIsOpen(false);
      },
      color: "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30"
    }
  ];

  return (
    <>
      {/* Chachi Chat Modal */}
      <ChachiChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Action Buttons */}
        <div className={cn(
          "absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          {actions.map((action, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 transition-all duration-300",
                isOpen ? "translate-x-0" : "translate-x-4"
              )}
              style={{ transitionDelay: isOpen ? `${index * 50}ms` : '0ms' }}
            >
              {/* Label */}
              <span className={cn(
                "px-4 py-2.5 rounded-xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl text-sm font-medium whitespace-nowrap transition-all duration-300",
                isOpen ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-2 scale-95"
              )}>
                {action.label}
              </span>

              {/* Action Button */}
              <Button
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-3",
                  action.color || "bg-primary",
                  "hover:shadow-2xl text-white relative overflow-hidden group/btn"
                )}
                onClick={action.onClick}
              >
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                <span className="relative">{action.icon}</span>
              </Button>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 relative overflow-hidden group/main",
                  isOpen 
                    ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rotate-45 scale-90" 
                    : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:scale-110",
                  "shadow-primary/40 hover:shadow-primary/50"
                )}
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className={cn(
                  "absolute inset-0 bg-white/10 transition-opacity duration-300",
                  isOpen ? "opacity-0" : "opacity-100 group-hover/main:opacity-0"
                )} />
                {!isOpen && (
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/main:opacity-100 transition-opacity duration-300" />
                {isOpen ? (
                  <X className="h-6 w-6 relative z-10" />
                ) : (
                  <Plus className="h-6 w-6 relative z-10" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={10}>
              {isOpen ? "Close" : "Quick Actions"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Sparkles, 
  Loader2,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChachiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChachiChatModal({ isOpen, onClose }: ChachiChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm Chachi, your AI financial assistant. I can help you analyze your finances, track expenses, predict income, and provide insights. How can I help you today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual AI service call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(input),
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('expense') || input.includes('spending')) {
      return "Based on your spending patterns, I've noticed you've spent ₱12,450 this month. Your largest expense category is 'Food & Dining' at ₱4,200. Would you like me to show you a breakdown or suggest ways to optimize your spending?";
    }
    
    if (input.includes('income') || input.includes('revenue')) {
      return "Your income is trending upward! You've earned ₱45,000 this month, which is 15% higher than last month. Your most profitable client is 'Tech Corp' contributing 40% of your revenue. Would you like income predictions for next month?";
    }
    
    if (input.includes('save') || input.includes('saving')) {
      return "Great question about savings! Based on your current income and expenses, you could potentially save ₱8,000-10,000 per month. I recommend setting up automatic transfers to a savings account. Would you like me to help you create a savings goal?";
    }
    
    if (input.includes('invoice')) {
      return "You have 3 pending invoices totaling ₱25,000. The oldest one from 'Design Studio' is 15 days overdue. Would you like me to draft a friendly payment reminder email?";
    }
    
    return "I understand you're asking about " + userInput + ". Let me analyze your financial data to provide you with actionable insights. Is there a specific aspect of your finances you'd like me to focus on?";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <DollarSign className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">Chachi AI Assistant</DialogTitle>
              <p className="text-sm text-muted-foreground">Your personal finance advisor</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' && "justify-end"
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.role === 'user' 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-muted">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInput("How can I reduce my expenses?")}
            >
              💰 Reduce expenses
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInput("What's my income trend?")}
            >
              📈 Income trends
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInput("Show pending invoices")}
            >
              📄 Pending invoices
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
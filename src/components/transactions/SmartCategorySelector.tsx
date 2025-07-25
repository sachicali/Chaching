"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Sparkles, RefreshCw, Check, X } from "lucide-react";
import AICategorizationService, { type CategorySuggestion } from "@/services/ai-categorization.service";
import { useToast } from "@/hooks/use-toast";
import type { TransactionType } from "@/types/database.types";

interface SmartCategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  description: string;
  amount: number;
  type: TransactionType;
  vendor?: string;
  userId: string;
  categories: string[];
  placeholder?: string;
}

export function SmartCategorySelector({
  value,
  onValueChange,
  description,
  amount,
  type,
  vendor,
  userId,
  categories,
  placeholder = "Select category"
}: SmartCategorySelectorProps) {
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const { toast } = useToast();

  const getSuggestion = useCallback(async () => {
    if (!description.trim() || !amount || amount <= 0) {
      setSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    try {
      setIsLoadingSuggestion(true);
      const categorizationService = new AICategorizationService(userId);
      const suggestion = await categorizationService.suggestCategory(
        description,
        amount,
        type,
        vendor
      );

      setSuggestion(suggestion);
      
      // Only show suggestion if it's different from current value and has reasonable confidence
      if (suggestion.category !== value && suggestion.confidence > 0.3) {
        setShowSuggestion(true);
      }

    } catch (error) {
      console.error('Error getting category suggestion:', error);
      // Fail silently for better UX
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [description, amount, type, vendor, userId, value]);

  // Debounced suggestion loading
  useEffect(() => {
    const timer = setTimeout(() => {
      getSuggestion();
    }, 1000); // Wait 1 second after description changes

    return () => clearTimeout(timer);
  }, [getSuggestion]);

  const handleAcceptSuggestion = async () => {
    if (!suggestion) return;

    onValueChange(suggestion.category);
    setShowSuggestion(false);

    // Record the feedback as accepted
    try {
      const categorizationService = new AICategorizationService(userId);
      // We'll record feedback after the transaction is created
      // For now, just show success
      toast({
        title: "Category Applied",
        description: `AI suggested "${suggestion.category}" with ${Math.round(suggestion.confidence * 100)}% confidence.`,
      });
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  const handleRejectSuggestion = () => {
    setShowSuggestion(false);
    // Note: We'll record rejection feedback when user selects a different category
  };

  const handleManualSelection = (selectedCategory: string) => {
    onValueChange(selectedCategory);
    
    // Record feedback if we had a suggestion
    if (suggestion && showSuggestion && selectedCategory !== suggestion.category) {
      try {
        const categorizationService = new AICategorizationService(userId);
        // Record that the user rejected our suggestion
        // This would be implemented in a real transaction ID context
        console.log('User rejected suggestion:', {
          suggested: suggestion.category,
          chosen: selectedCategory,
          confidence: suggestion.confidence
        });
      } catch (error) {
        console.error('Error recording rejection feedback:', error);
      }
    }
    
    setShowSuggestion(false);
  };

  return (
    <FormItem>
      <FormLabel className="flex items-center space-x-2">
        <span>Category *</span>
        {isLoadingSuggestion && (
          <Sparkles className="h-3 w-3 animate-pulse text-primary" />
        )}
      </FormLabel>
      
      {/* AI Suggestion Banner */}
      {showSuggestion && suggestion && (
        <div className="bg-muted/50 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Suggestion</span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(suggestion.confidence * 100)}% confident
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAcceptSuggestion}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRejectSuggestion}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">Suggested:</span> {suggestion.category}
              {suggestion.isNewCategory && (
                <Badge variant="outline" className="ml-2 text-xs">New</Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            
            {suggestion.alternativeCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-muted-foreground">Alternatives:</span>
                {suggestion.alternativeCategories.slice(0, 3).map((alt, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleManualSelection(alt)}
                    className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {alt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Selector */}
      <Select onValueChange={handleManualSelection} value={value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {/* Show AI suggestion at the top if available and different from current */}
          {suggestion && suggestion.category !== value && !categories.includes(suggestion.category) && (
            <>
              <SelectItem value={suggestion.category} className="border-b border-muted">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>{suggestion.category}</span>
                  <Badge variant="secondary" className="text-xs">
                    AI - {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
              </SelectItem>
            </>
          )}
          
          {/* Regular categories */}
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <FormMessage />
    </FormItem>
  );
}
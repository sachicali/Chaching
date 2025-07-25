
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

type QuickAddItemType = "Income" | "Expense" | "Note";

export function QuickAddButton() {
  const [itemType, setItemType] = useState<QuickAddItemType>("Income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    // TODO: Implement actual save logic
    console.log("Quick Add:", { type: itemType, amount, description });
    // Reset form and close dialog
    setItemType("Income");
    setAmount("");
    setDescription("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110 group"
          aria-label="Quick Add"
        >
          <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Quickly add income, expense, or a note to your records
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="type">
              Transaction Type
            </Label>
            <Select value={itemType} onValueChange={(value) => setItemType(value as QuickAddItemType)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Income">Income</SelectItem>
                <SelectItem value="Expense">Expense</SelectItem>
                <SelectItem value="Note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="amount">
              Amount (PHP)
            </Label>
            <Input 
              id="amount" 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={itemType === "Note"}
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="description">
              Description
            </Label>
            <Input 
              id="description" 
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
          >
            Save Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
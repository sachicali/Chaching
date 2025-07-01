"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Plus, 
  Search, 
  User, 
  FileText, 
  DollarSign, 
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Hash,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMAIL_TEMPLATE_VARIABLES, type TemplateVariable } from '@/schemas/template.schema';

interface VariableInserterProps {
  onVariableInsert: (variable: string) => void;
  className?: string;
  customVariables?: TemplateVariable[];
  compact?: boolean;
}

// Group variables by category for better organization
const groupVariablesByCategory = (variables: TemplateVariable[]) => {
  const groups = {
    client: [] as TemplateVariable[],
    invoice: [] as TemplateVariable[],
    business: [] as TemplateVariable[],
    system: [] as TemplateVariable[],
  };

  variables.forEach(variable => {
    if (variable.key.startsWith('client')) {
      groups.client.push(variable);
    } else if (variable.key.startsWith('invoice')) {
      groups.invoice.push(variable);
    } else if (variable.key.startsWith('business')) {
      groups.business.push(variable);
    } else {
      groups.system.push(variable);
    }
  });

  return groups;
};

// Get icon for variable type
const getVariableIcon = (type: string, key: string) => {
  if (key.includes('email')) return Mail;
  if (key.includes('phone')) return Phone;
  if (key.includes('address')) return MapPin;
  if (key.includes('company') || key.includes('business')) return Building;
  if (key.includes('invoice')) return FileText;
  if (key.includes('amount') || key.includes('currency')) return DollarSign;
  if (key.includes('date')) return Calendar;
  if (key.includes('number')) return Hash;
  if (key.includes('name')) return User;
  
  // Default icon based on type
  switch (type) {
    case 'currency': return DollarSign;
    case 'date': return Calendar;
    case 'number': return Hash;
    default: return FileText;
  }
};

// Category information
const categoryInfo = {
  client: {
    title: 'Client Information',
    description: 'Variables related to client details',
    icon: User,
    color: 'bg-blue-500',
  },
  invoice: {
    title: 'Invoice Details',
    description: 'Invoice-specific information',
    icon: FileText,
    color: 'bg-green-500',
  },
  business: {
    title: 'Your Business',
    description: 'Your business information',
    icon: Building,
    color: 'bg-purple-500',
  },
  system: {
    title: 'System Variables',
    description: 'Dynamic system-generated values',
    icon: Hash,
    color: 'bg-orange-500',
  },
};

export function VariableInserter({ 
  onVariableInsert, 
  className, 
  customVariables = [],
  compact = false 
}: VariableInserterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Combine default and custom variables
  const allVariables = [...EMAIL_TEMPLATE_VARIABLES, ...customVariables];
  
  // Filter variables based on search and category
  const filteredVariables = allVariables.filter(variable => {
    const matchesSearch = variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (variable.description && variable.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (selectedCategory === 'all') return matchesSearch;
    
    // Category filtering logic
    if (selectedCategory === 'client' && variable.key.startsWith('client')) return matchesSearch;
    if (selectedCategory === 'invoice' && variable.key.startsWith('invoice')) return matchesSearch;
    if (selectedCategory === 'business' && variable.key.startsWith('business')) return matchesSearch;
    if (selectedCategory === 'system' && !variable.key.startsWith('client') && 
        !variable.key.startsWith('invoice') && !variable.key.startsWith('business')) return matchesSearch;
    
    return false;
  });

  // Group filtered variables
  const groupedVariables = groupVariablesByCategory(filteredVariables);

  // Handle variable insertion
  const handleVariableClick = (variable: TemplateVariable) => {
    const variableText = `{{${variable.key}}}`;
    onVariableInsert(variableText);
  };

  // Render variable button
  const renderVariableButton = (variable: TemplateVariable) => {
    const Icon = getVariableIcon(variable.type, variable.key);
    
    return (
      <TooltipProvider key={variable.key}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              className={cn(
                "w-full justify-start text-left h-auto p-3",
                compact && "p-2 text-sm"
              )}
              onClick={() => handleVariableClick(variable)}
            >
              <div className="flex items-start space-x-2 w-full">
                <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", compact && "h-3 w-3")} />
                <div className="flex-1 min-w-0">
                  <div className={cn("font-medium truncate", compact && "text-xs")}>
                    {variable.label}
                  </div>
                  {!compact && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {`{{${variable.key}}}`}
                    </div>
                  )}
                  {variable.required && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div>
              <div className="font-medium">{variable.label}</div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                {`{{${variable.key}}}`}
              </div>
              {variable.description && (
                <div className="text-sm mt-2">{variable.description}</div>
              )}
              <div className="text-xs mt-2">
                <span className="text-muted-foreground">Type: </span>
                <span className="capitalize">{variable.type}</span>
                {variable.required && (
                  <span className="ml-2 text-orange-500">Required</span>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Render category section
  const renderCategorySection = (categoryKey: string, variables: TemplateVariable[]) => {
    if (variables.length === 0) return null;
    
    const category = categoryInfo[categoryKey as keyof typeof categoryInfo];
    if (!category) return null;

    const CategoryIcon = category.icon;

    return (
      <div key={categoryKey} className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={cn("w-2 h-2 rounded-full", category.color)} />
          <h4 className="text-sm font-medium text-muted-foreground">
            {category.title}
          </h4>
          <Badge variant="secondary" className="text-xs">
            {variables.length}
          </Badge>
        </div>
        <div className="grid gap-2">
          {variables.map(renderVariableButton)}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 text-sm h-8"
            />
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(groupedVariables).map(([category, variables]) =>
              renderCategorySection(category, variables)
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Template Variables</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click any variable to insert it into your template content.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="client">Client Information</SelectItem>
              <SelectItem value="invoice">Invoice Details</SelectItem>
              <SelectItem value="business">Your Business</SelectItem>
              <SelectItem value="system">System Variables</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Variables by Category */}
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {selectedCategory === 'all' ? (
            Object.entries(groupedVariables).map(([category, variables]) =>
              renderCategorySection(category, variables)
            )
          ) : (
            <div className="grid gap-2">
              {filteredVariables.map(renderVariableButton)}
            </div>
          )}
          
          {filteredVariables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>No variables found matching your search.</p>
              <p className="text-sm">Try a different search term or category.</p>
            </div>
          )}
        </div>

        {/* Usage Help */}
        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Usage:</strong> Variables use double curly braces like <code>{'{{clientName}}'}</code></p>
          <p><strong>Tip:</strong> Required variables must be available when sending emails</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default VariableInserter;
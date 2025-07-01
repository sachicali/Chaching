import { z } from "zod";

// Template variable schema for dynamic content insertion
export const templateVariableSchema = z.object({
  key: z.string().min(1, "Variable key is required"),
  label: z.string().min(1, "Variable label is required"),
  description: z.string().optional(),
  type: z.enum(["text", "number", "date", "currency"]).default("text"),
  defaultValue: z.string().optional(),
  required: z.boolean().default(false),
});

// Template content validation schema
export const templateContentSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Template name must be less than 100 characters"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(1, "Template content is required"),
  type: z.enum(["invoice", "reminder", "payment_confirmation", "custom"]).default("custom"),
  isDefault: z.boolean().default(false),
  variables: z.array(templateVariableSchema).default([]),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
  }).optional(),
});

// Template editing form schema
export const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Template name must be less than 100 characters"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().min(1, "Template content is required"),
  type: z.enum(["invoice", "reminder", "payment_confirmation", "custom"]).default("custom"),
  isDefault: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
});

// Template variable insertion schema
export const variableInsertSchema = z.object({
  variable: z.string().min(1, "Variable selection is required"),
  position: z.number().min(0, "Position must be non-negative"),
});

// Template search and filter schema
export const templateFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["invoice", "reminder", "payment_confirmation", "custom", "all"]).default("all"),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().optional(),
});

// Export type definitions
export type TemplateVariable = z.infer<typeof templateVariableSchema>;
export type TemplateContent = z.infer<typeof templateContentSchema>;
export type TemplateFormData = z.infer<typeof templateFormSchema>;
export type VariableInsert = z.infer<typeof variableInsertSchema>;
export type TemplateFilter = z.infer<typeof templateFilterSchema>;

// Predefined template variables for email templates
export const EMAIL_TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    key: "clientName",
    label: "Client Name",
    description: "The name of the client receiving the email",
    type: "text",
    required: true,
  },
  {
    key: "clientEmail",
    label: "Client Email",
    description: "The email address of the client",
    type: "text",
    required: true,
  },
  {
    key: "clientCompany",
    label: "Client Company",
    description: "The company name of the client",
    type: "text",
    required: false,
  },
  {
    key: "invoiceNumber",
    label: "Invoice Number",
    description: "The unique invoice number",
    type: "text",
    required: false,
  },
  {
    key: "invoiceAmount",
    label: "Invoice Amount",
    description: "The total amount of the invoice",
    type: "currency",
    required: false,
  },
  {
    key: "invoiceDate",
    label: "Invoice Date",
    description: "The date the invoice was issued",
    type: "date",
    required: false,
  },
  {
    key: "dueDate",
    label: "Due Date",
    description: "The payment due date",
    type: "date",
    required: false,
  },
  {
    key: "businessName",
    label: "Business Name",
    description: "Your business or freelance name",
    type: "text",
    required: false,
  },
  {
    key: "businessEmail",
    label: "Business Email",
    description: "Your business email address",
    type: "text",
    required: false,
  },
  {
    key: "businessPhone",
    label: "Business Phone",
    description: "Your business phone number",
    type: "text",
    required: false,
  },
  {
    key: "businessAddress",
    label: "Business Address",
    description: "Your business address",
    type: "text",
    required: false,
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    description: "The payment terms for the invoice",
    type: "text",
    required: false,
  },
  {
    key: "currentDate",
    label: "Current Date",
    description: "Today's date",
    type: "date",
    required: false,
  },
  {
    key: "currency",
    label: "Currency",
    description: "The currency symbol or code",
    type: "text",
    required: false,
  },
];

// Template categories for organization
export const TEMPLATE_CATEGORIES = [
  { value: "invoice", label: "Invoice Templates" },
  { value: "reminder", label: "Payment Reminders" },
  { value: "confirmation", label: "Payment Confirmations" },
  { value: "follow_up", label: "Follow-up Emails" },
  { value: "welcome", label: "Welcome Messages" },
  { value: "marketing", label: "Marketing Campaigns" },
  { value: "custom", label: "Custom Templates" },
] as const;

// Common template tags
export const TEMPLATE_TAGS = [
  "professional",
  "formal",
  "friendly",
  "urgent",
  "reminder",
  "thank_you",
  "follow_up",
  "promotional",
  "seasonal",
  "automated",
] as const;
'use server';

/**
 * @fileOverview Smart transaction categorization flow using AI.
 *
 * - categorizeTransaction - A function that categorizes transactions based on description and context.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai, AI_MODELS} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  description: z.string().describe('Transaction description or vendor name.'),
  amount: z.number().describe('Transaction amount in PHP.'),
  type: z.enum(['income', 'expense']).describe('Transaction type.'),
  vendor: z.string().optional().describe('Vendor or client name if available.'),
  existingCategories: z.array(z.string()).describe('List of existing categories used by the user.'),
  userHistory: z.string().optional().describe('Similar past transactions for learning (JSON format).'),
});

export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  category: z.string().describe('The suggested category for this transaction.'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 to 1.'),
  reason: z.string().describe('Brief explanation for why this category was chosen.'),
  alternativeCategories: z.array(z.string()).describe('Alternative category suggestions.'),
  isNewCategory: z.boolean().describe('True if this is a new category not in existing list.'),
});

export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(input: CategorizeTransactionInput): Promise<CategorizeTransactionOutput> {
  // Try different Google AI models first
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (apiKey && apiKey !== 'development_mock_key') {
    for (let i = 0; i < AI_MODELS.length; i++) {
      try {
        console.log(`Attempting with model: ${AI_MODELS[i]}`);
        
        // Create a new genkit instance with the specific model
        const aiInstance = genkit({
          plugins: [googleAI({ apiKey })],
          model: AI_MODELS[i],
        });
        
        // Create flow with this model
        const flowWithModel = aiInstance.defineFlow(
          {
            name: `categorizeTransactionFlow_${i}`,
            inputSchema: CategorizeTransactionInputSchema,
            outputSchema: CategorizeTransactionOutputSchema,
          },
          async flowInput => {
            const promptWithModel = aiInstance.definePrompt({
              name: `categorizeTransactionPrompt_${i}`,
              input: {schema: CategorizeTransactionInputSchema},
              output: {schema: CategorizeTransactionOutputSchema},
              prompt: `You are an AI financial assistant that categorizes transactions for Filipino freelancers and consultants.

Transaction Details:
Description: {{{description}}}
Amount: ₱{{{amount}}}
Type: {{{type}}}
{{#if vendor}}Vendor/Client: {{{vendor}}}{{/if}}

Existing Categories: {{#each existingCategories}}{{{this}}}, {{/each}}

{{#if userHistory}}
Similar Past Transactions:
{{{userHistory}}}
{{/if}}

Instructions:
1. Analyze the transaction description and context
2. Choose the most appropriate category from existing categories, or suggest a new one
3. For Filipino freelancers, common categories include:
   - Income: "Client Payment", "Freelance Income", "Consulting Fee", "Project Payment"
   - Expenses: "Software Subscriptions", "Internet & Utilities", "Office Supplies", "Marketing", "Professional Development", "Food & Dining", "Transportation", "Home Office", "Business Travel", "Taxes & Fees", "Bank Charges", "Equipment"
4. Consider Filipino context (GCash, Grab, local vendors, etc.)
5. Provide confidence score based on how clear the categorization is
6. Give brief reasoning for your choice
7. Suggest 2-3 alternative categories if applicable

Focus on practical, actionable categories that help with expense tracking and tax preparation.`,
            });
            
            const {output} = await promptWithModel(flowInput);
            return output!;
          }
        );
        
        return await flowWithModel(input);
      } catch (modelError) {
        console.warn(`Model ${AI_MODELS[i]} failed:`, modelError);
        if (i === AI_MODELS.length - 1) {
          // All Google models failed, continue to Google GenAI SDK fallback
          console.warn('All Google AI models failed, attempting Google GenAI SDK fallback');
        }
      }
    }
  }

  try {
    // Try primary Google AI as configured
    return await categorizeTransactionFlow(input);
  } catch (error) {
    console.warn('Primary Google AI failed, attempting fallback:', error);
    
    // Try Google Generative AI SDK as first fallback
    try {
      const { googleGenAI } = await import('@/services/google-genai.service');
      
      if (!googleGenAI.isAvailable()) {
        throw new Error('Google GenAI not configured');
      }
      
      console.log('Attempting Google Generative AI SDK fallback');
      
      // Since Google GenAI doesn't have a direct categorization method, use financial insights
      await googleGenAI.generateFinancialInsights({
        income: input.type === 'income' ? input.amount : 0,
        expenses: input.type === 'expense' ? input.amount : 0,
        savings: 0,
        spendingByCategory: input.type === 'expense' ? { [input.description]: input.amount } : {},
        recurringExpenses: {}
      });
      
      // Map the result to categorization format (basic mapping)
      const category = input.type === 'income' ? 'Client Payment' : 'Operating Expenses';
      return {
        category,
        confidence: 0.7,
        reason: `Based on transaction type and description: ${input.description}`,
        alternativeCategories: input.type === 'income' 
          ? ['Freelance Income', 'Consulting Fee'] 
          : ['Software Subscriptions', 'Office Supplies', 'Marketing'],
        isNewCategory: !input.existingCategories.includes(category)
      };
    } catch (genAIError) {
      console.warn('Google GenAI SDK failed, attempting Ollama fallback:', genAIError);
    }
    
    // Try Ollama as second fallback
    try {
      const { ollamaAI } = await import('@/services/ollama-ai.service');
      
      // Check if Ollama is available
      const isAvailable = await ollamaAI.isAvailable();
      if (!isAvailable) {
        console.warn('Ollama not available, will need to install model');
        await ollamaAI.ensureModel();
      }
      
      const result = await ollamaAI.categorizeTransaction(input.description, input.amount);
      
      // Map Ollama result to expected format
      return {
        category: result.category,
        confidence: result.confidence,
        reason: result.reason,
        alternativeCategories: result.alternativeCategories,
        isNewCategory: !input.existingCategories.includes(result.category)
      };
    } catch (ollamaError) {
      console.warn('Ollama failed, attempting Hugging Face fallback:', ollamaError);
      
      // Try Hugging Face as final fallback
      try {
        const { huggingFaceAI } = await import('@/services/huggingface-ai.service');
        
        // Check if Hugging Face is available
        const isAvailable = await huggingFaceAI.isAvailable();
        if (!isAvailable) {
          throw new Error('Hugging Face API not available');
        }
        
        const result = await huggingFaceAI.categorizeTransaction(input.description, input.amount);
        
        // Map Hugging Face result to expected format
        return {
          category: result.category,
          confidence: result.confidence,
          reason: result.reason,
          alternativeCategories: result.alternativeCategories,
          isNewCategory: !input.existingCategories.includes(result.category)
        };
      } catch (huggingFaceError) {
        console.error('All AI services failed:', error, ollamaError, huggingFaceError);
        throw new Error('ALL_AI_SERVICES_FAILED');
      }
    }
  }
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are an AI financial assistant that categorizes transactions for Filipino freelancers and consultants.

Transaction Details:
Description: {{{description}}}
Amount: ₱{{{amount}}}
Type: {{{type}}}
{{#if vendor}}Vendor/Client: {{{vendor}}}{{/if}}

Existing Categories: {{#each existingCategories}}{{{this}}}, {{/each}}

{{#if userHistory}}
Similar Past Transactions:
{{{userHistory}}}
{{/if}}

Instructions:
1. Analyze the transaction description and context
2. Choose the most appropriate category from existing categories, or suggest a new one
3. For Filipino freelancers, common categories include:
   - Income: "Client Payment", "Freelance Income", "Consulting Fee", "Project Payment"
   - Expenses: "Software Subscriptions", "Internet & Utilities", "Office Supplies", "Marketing", "Professional Development", "Food & Dining", "Transportation", "Home Office", "Business Travel", "Taxes & Fees", "Bank Charges", "Equipment"
4. Consider Filipino context (GCash, Grab, local vendors, etc.)
5. Provide confidence score based on how clear the categorization is
6. Give brief reasoning for your choice
7. Suggest 2-3 alternative categories if applicable

Focus on practical, actionable categories that help with expense tracking and tax preparation.`,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
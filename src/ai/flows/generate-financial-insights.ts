'use server';

/**
 * @fileOverview AI-powered financial insights flow.
 *
 * - generateFinancialInsights - A function that generates financial insights based on user data.
 * - FinancialInsightsInput - The input type for the generateFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the generateFinancialInsights function.
 */

import {ai, AI_MODELS} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

const FinancialInsightsInputSchema = z.object({
  income: z
    .number()
    .describe('Total income for the period.'),
  expenses: z
    .number()
    .describe('Total expenses for the period.'),
  savings: z
    .number()
    .describe('Total savings for the period.'),
  spendingByCategory: z.record(z.number()).describe('Spending by category (e.g., { Food: 100, Entertainment: 50 }).'),
  recurringExpenses: z.record(z.number()).describe('Recurring expenses (e.g., { Rent: 1000, Netflix: 15 }).'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the financial insights.'),
  savingsOpportunities: z.array(z.string()).describe('Potential saving opportunities.'),
  spendingHabits: z.string().describe('Analysis of spending habits.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generateFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  // Check if there's any meaningful data
  const hasData = input.income > 0 || input.expenses > 0 || Object.keys(input.spendingByCategory).length > 0;
  
  if (!hasData) {
    throw new Error('NO_DATA_AVAILABLE');
  }

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
            name: `generateFinancialInsightsFlow_${i}`,
            inputSchema: FinancialInsightsInputSchema,
            outputSchema: FinancialInsightsOutputSchema,
          },
          async flowInput => {
            const promptWithModel = aiInstance.definePrompt({
              name: `financialInsightsPrompt_${i}`,
              input: {schema: FinancialInsightsInputSchema},
              output: {schema: FinancialInsightsOutputSchema},
              prompt: `You are a personal finance advisor. Analyze the user's financial data and provide insights and advice.

  Income: {{{income}}}
  Expenses: {{{expenses}}}
  Savings: {{{savings}}}
  Spending by Category: {{#each (kv spendingByCategory)}}{{{@key}}}: {{{this}}}, {{/each}}
  Recurring Expenses: {{#each (kv recurringExpenses)}}{{{@key}}}: {{{this}}}, {{/each}}

  Provide a summary of their financial situation, identify potential saving opportunities, and analyze their spending habits.
  Be concise and actionable.
  Format the response as a JSON object that satisfies the FinancialInsightsOutputSchema. Be sure to populate all of the fields.`,
            });
            
            const {output} = await promptWithModel(flowInput);
            return output!;
          }
        );
        
        return await flowWithModel(input);
      } catch (modelError) {
        console.warn(`Model ${AI_MODELS[i]} failed:`, modelError);
        if (i === AI_MODELS.length - 1) {
          // All Google models failed, continue to Ollama fallback
          console.warn('All Google AI models failed, attempting Ollama fallback');
        }
      }
    }
  }

  try {
    // Try primary Google AI as configured
    return await generateFinancialInsightsFlow(input);
  } catch (error) {
    console.warn('Primary Google AI failed, attempting fallback:', error);
    
    // Try Google Generative AI SDK as first fallback
    try {
      const { googleGenAI } = await import('@/services/google-genai.service');
      
      if (!googleGenAI.isAvailable()) {
        throw new Error('Google GenAI not configured');
      }
      
      console.log('Attempting Google Generative AI SDK fallback');
      const result = await googleGenAI.generateFinancialInsights({
        income: input.income,
        expenses: input.expenses,
        savings: input.savings,
        spendingByCategory: input.spendingByCategory,
        recurringExpenses: input.recurringExpenses
      });
      
      return result;
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
      
      const result = await ollamaAI.generateFinancialInsights({
        income: input.income,
        expenses: input.expenses,
        categories: input.spendingByCategory
      });
      
      return result;
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
        
        const result = await huggingFaceAI.generateFinancialInsights({
          income: input.income,
          expenses: input.expenses,
          categories: input.spendingByCategory
        });
        
        return result;
      } catch (huggingFaceError) {
        console.error('All AI services failed:', error, ollamaError, huggingFaceError);
        throw new Error('ALL_AI_SERVICES_FAILED');
      }
    }
  }
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's financial data and provide insights and advice.

  Income: {{{income}}}
  Expenses: {{{expenses}}}
  Savings: {{{savings}}}
  Spending by Category: {{#each (kv spendingByCategory)}}{{{@key}}}: {{{this}}}, {{/each}}
  Recurring Expenses: {{#each (kv recurringExpenses)}}{{{@key}}}: {{{this}}}, {{/each}}

  Provide a summary of their financial situation, identify potential saving opportunities, and analyze their spending habits.
  Be concise and actionable.
  Format the response as a JSON object that satisfies the FinancialInsightsOutputSchema. Be sure to populate all of the fields.
  `,
});

const generateFinancialInsightsFlow = ai.defineFlow(
  {
    name: 'generateFinancialInsightsFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

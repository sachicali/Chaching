'use server';

/**
 * @fileOverview AI-powered financial insights flow.
 *
 * - generateFinancialInsights - A function that generates financial insights based on user data.
 * - FinancialInsightsInput - The input type for the generateFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the generateFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return generateFinancialInsightsFlow(input);
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

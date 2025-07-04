// This is an autogenerated file from Firebase Studio.

'use server';

/**
 * @fileOverview Generates a weekly summary of financial activity, highlighting key trends and saving opportunities.
 *
 * - generateWeeklySummary - A function that generates the weekly summary.
 * - GenerateWeeklySummaryInput - The input type for the generateWeeklySummary function.
 * - GenerateWeeklySummaryOutput - The return type for the generateWeeklySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeeklySummaryInputSchema = z.object({
  income: z.number().describe('Total income for the week.'),
  expenses: z.number().describe('Total expenses for the week.'),
  savings: z.number().describe('Total savings for the week.'),
  spendingByCategory: z
    .record(z.string(), z.number())
    .describe('Spending amounts for each category.'),
  previousWeekIncome: z.number().describe('Total income for the previous week.'),
  previousWeekExpenses: z
    .number()
    .describe('Total expenses for the previous week.'),
  previousWeekSavings: z.number().describe('Total savings for the previous week.'),
});
export type GenerateWeeklySummaryInput = z.infer<
  typeof GenerateWeeklySummaryInputSchema
>;

const GenerateWeeklySummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the financial activity for the week.'),
  trends: z.string().describe('Key trends in income, expenses, and savings.'),
  opportunities: z
    .string()
    .describe('Potential saving opportunities based on the week\'s data.'),
});
export type GenerateWeeklySummaryOutput = z.infer<
  typeof GenerateWeeklySummaryOutputSchema
>;

export async function generateWeeklySummary(
  input: GenerateWeeklySummaryInput
): Promise<GenerateWeeklySummaryOutput> {
  return generateWeeklySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWeeklySummaryPrompt',
  input: {schema: GenerateWeeklySummaryInputSchema},
  output: {schema: GenerateWeeklySummaryOutputSchema},
  prompt: `You are a financial advisor providing a weekly summary to a user based on their financial data.

  Income: {{{income}}}
  Expenses: {{{expenses}}}
  Savings: {{{savings}}}
  Spending by Category: {{#each (keys spendingByCategory)}}{{{this}}}: {{{../spendingByCategory.[this]}}} {{/each}}

  Previous Week Income: {{{previousWeekIncome}}}
  Previous Week Expenses: {{{previousWeekExpenses}}}
  Previous Week Savings: {{{previousWeekSavings}}}

  Provide a summary of the user's financial activity, key trends, and potential saving opportunities.
  Be concise and actionable.
  `,
});

const generateWeeklySummaryFlow = ai.defineFlow(
  {
    name: 'generateWeeklySummaryFlow',
    inputSchema: GenerateWeeklySummaryInputSchema,
    outputSchema: GenerateWeeklySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

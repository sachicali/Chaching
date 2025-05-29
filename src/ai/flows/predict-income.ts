//PredictIncome
'use server';
/**
 * @fileOverview Predicts the user's income based on historical data.
 *
 * - predictIncome - A function that predicts the user's income.
 * - PredictIncomeInput - The input type for the predictIncome function.
 * - PredictIncomeOutput - The return type for the predictIncome function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictIncomeInputSchema = z.object({
  historicalIncomeData: z
    .string()
    .describe(
      'Historical income data, provided as a string in JSON format.  Each object should have a date and income field.'
    ),
  seasonality: z
    .string()
    .optional()
    .describe(
      'Optional seasonality information.  Describe any seasonal variations in income, e.g. "Income is higher in the summer months"'
    ),
});

export type PredictIncomeInput = z.infer<typeof PredictIncomeInputSchema>;

const PredictIncomeOutputSchema = z.object({
  predictedIncome: z
    .number()
    .describe('The predicted income for the next month, in the same currency as the historical data.'),
  confidenceInterval: z
    .string()
    .describe(
      'A description of the confidence interval for the prediction, e.g. "95% confidence interval is +/- $1000".'
    ),
  factors: z
    .string()
    .describe(
      'A description of the factors that influenced the prediction, including seasonality, trends, and anomalies.'
    ),
});

export type PredictIncomeOutput = z.infer<typeof PredictIncomeOutputSchema>;

export async function predictIncome(input: PredictIncomeInput): Promise<PredictIncomeOutput> {
  return predictIncomeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictIncomePrompt',
  input: {schema: PredictIncomeInputSchema},
  output: {schema: PredictIncomeOutputSchema},
  prompt: `You are an expert financial analyst.  You will be provided with historical income data and any relevant seasonality information.
  Your task is to predict the user's income for the next month, and provide a confidence interval for the prediction.
  You should also describe the factors that influenced the prediction, including seasonality, trends, and anomalies.

  Historical Income Data:
  {{historicalIncomeData}}

  Seasonality:
  {{seasonality}}
  `,
});

const predictIncomeFlow = ai.defineFlow(
  {
    name: 'predictIncomeFlow',
    inputSchema: PredictIncomeInputSchema,
    outputSchema: PredictIncomeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

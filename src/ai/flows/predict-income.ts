//PredictIncome
'use server';
/**
 * @fileOverview Predicts the user's income based on historical data.
 *
 * - predictIncome - A function that predicts the user's income.
 * - PredictIncomeInput - The input type for the predictIncome function.
 * - PredictIncomeOutput - The return type for the predictIncome function.
 */

import {ai, AI_MODELS} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkit} from 'genkit';

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
  // Check if there's meaningful historical data
  const hasData = input.historicalIncomeData && input.historicalIncomeData !== '[]' && input.historicalIncomeData.length > 2;
  
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
            name: `predictIncomeFlow_${i}`,
            inputSchema: PredictIncomeInputSchema,
            outputSchema: PredictIncomeOutputSchema,
          },
          async flowInput => {
            const promptWithModel = aiInstance.definePrompt({
              name: `predictIncomePrompt_${i}`,
              input: {schema: PredictIncomeInputSchema},
              output: {schema: PredictIncomeOutputSchema},
              prompt: `You are an expert financial analyst.  You will be provided with historical income data and any relevant seasonality information.
  Your task is to predict the user's income for the next month, and provide a confidence interval for the prediction.
  You should also describe the factors that influenced the prediction, including seasonality, trends, and anomalies.

  Historical Income Data:
  {{historicalIncomeData}}

  Seasonality:
  {{seasonality}}`,
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
    return await predictIncomeFlow(input);
  } catch (error) {
    console.warn('Primary Google AI failed, attempting fallback:', error);
    
    // Try Google Generative AI SDK as first fallback
    try {
      const { googleGenAI } = await import('@/services/google-genai.service');
      
      if (!googleGenAI.isAvailable()) {
        throw new Error('Google GenAI not configured');
      }
      
      console.log('Attempting Google Generative AI SDK fallback');
      const historicalData = JSON.parse(input.historicalIncomeData);
      const result = await googleGenAI.predictIncome({
        historicalData: historicalData.map((item: {date?: string; income?: number}) => ({
          date: item.date || new Date().toISOString(),
          income: item.income || 0
        }))
      });
      
      return {
        predictedIncome: result.predictedIncome,
        confidenceInterval: `${Math.round(result.confidence * 100)}% confidence interval`,
        factors: result.insights || 'Based on historical trends'
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
      
      const historicalData = JSON.parse(input.historicalIncomeData);
      const result = await ollamaAI.predictIncome({
        monthlyIncomes: historicalData,
        seasonality: input.seasonality
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
        
        const historicalData = JSON.parse(input.historicalIncomeData);
        const result = await huggingFaceAI.predictIncome({
          monthlyIncomes: historicalData,
          seasonality: input.seasonality
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

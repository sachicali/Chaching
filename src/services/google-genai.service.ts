/**
 * Google Generative AI Service - Direct Gemini Model Access
 * 
 * Provides direct access to Google's Gemini models through the Generative AI SDK.
 * This service offers free tier access to various Gemini models with generous quotas.
 * 
 * Features:
 * - Direct Gemini model access (Flash models are free)
 * - Multiple model fallback support
 * - Structured JSON output support
 * - Automatic retry with different models
 * 
 * Free Tier Quotas (as of 2024):
 * - Gemini 1.5 Flash: 1,500 RPM (requests per minute)
 * - Gemini 1.5 Pro: 2 RPM
 * - Gemini 2.0 Flash: 10 RPM (experimental)
 */

import type { 
  FinancialInsightsOutput 
} from '@/ai/flows/generate-financial-insights';
import type { 
  PredictIncomeOutput 
} from '@/ai/flows/predict-income';
import type { 
  DetectSpendingAnomaliesOutput 
} from '@/ai/flows/detect-spending-anomalies';

// Define available Gemini models in order of preference
export const GEMINI_MODELS = [
  'gemini-1.5-flash',        // Primary: Highest free quota (1500 RPM)
  'gemini-1.5-flash-latest', // Latest flash version
  'gemini-2.0-flash-exp',    // Experimental 2.0 (10 RPM)
  'gemini-1.5-pro',          // Pro model (2 RPM free tier)
  'gemini-pro',              // Legacy Pro model
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];

interface GenerativeModelConfig {
  model: GeminiModel;
  apiKey: string;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export class GoogleGenAIService {
  private apiKey: string;
  private currentModel: GeminiModel;
  private isInitialized: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || '';
    this.currentModel = GEMINI_MODELS[0]; // Default to Flash
  }

  /**
   * Dynamically import and initialize the Google Generative AI SDK
   */
  private async initializeSDK() {
    if (!this.isInitialized) {
      try {
        // Dynamically import to avoid issues if package not installed
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        this.isInitialized = true;
        return GoogleGenerativeAI;
      } catch (error) {
        console.error('Failed to load Google Generative AI SDK:', error);
        throw new Error('Google Generative AI SDK not available');
      }
    }
  }

  /**
   * Check if the service is available (has API key)
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'development_mock_key';
  }

  /**
   * Try multiple Gemini models until one succeeds
   */
  private async tryModelsWithFallback<T>(
    generateFn: (model: any) => Promise<T>
  ): Promise<T> {
    const GoogleGenerativeAI = await this.initializeSDK();
    const genAI = new GoogleGenerativeAI(this.apiKey);

    for (let i = 0; i < GEMINI_MODELS.length; i++) {
      const modelName = GEMINI_MODELS[i];
      try {
        console.log(`Attempting with Gemini model: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "application/json", // Force JSON response
          },
        });

        const result = await generateFn(model);
        this.currentModel = modelName; // Remember successful model
        return result;
        
      } catch (error: any) {
        console.warn(`Gemini model ${modelName} failed:`, error?.message || error);
        
        // Check for quota errors
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
          console.log('Quota exceeded, trying next model...');
        }
        
        if (i === GEMINI_MODELS.length - 1) {
          throw new Error(`All Gemini models failed. Last error: ${error?.message || error}`);
        }
      }
    }
    
    throw new Error('All Gemini models failed');
  }

  /**
   * Generate financial insights using Gemini
   */
  async generateFinancialInsights(data: {
    income: number;
    expenses: number;
    savings: number;
    spendingByCategory: Record<string, number>;
    recurringExpenses: Record<string, number>;
  }): Promise<FinancialInsightsOutput> {
    if (!this.isAvailable()) {
      throw new Error('Google AI API key not configured');
    }

    const prompt = `You are a personal finance advisor. Analyze the following financial data and provide insights.

Financial Data:
- Income: $${data.income}
- Expenses: $${data.expenses}
- Savings: $${data.savings}
- Spending by Category: ${JSON.stringify(data.spendingByCategory)}
- Recurring Expenses: ${JSON.stringify(data.recurringExpenses)}

Provide your analysis in the following JSON format:
{
  "summary": "A 2-3 sentence summary of their financial health",
  "savingsOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "spendingHabits": "A 2-3 sentence analysis of their spending patterns"
}

Be concise, actionable, and focus on practical advice.`;

    return this.tryModelsWithFallback(async (model) => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Parse JSON response
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || 'Unable to generate summary',
          savingsOpportunities: parsed.savingsOpportunities || [],
          spendingHabits: parsed.spendingHabits || 'Unable to analyze spending habits'
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    });
  }

  /**
   * Predict income using Gemini
   */
  async predictIncome(data: {
    historicalData: Array<{ date: string; income: number }>;
  }): Promise<PredictIncomeOutput> {
    if (!this.isAvailable()) {
      throw new Error('Google AI API key not configured');
    }

    const prompt = `You are a financial analyst. Based on the following historical income data, predict the next month's income.

Historical Income Data:
${data.historicalData.map(d => `${d.date}: $${d.income}`).join('\n')}

Analyze the trend and provide your prediction in the following JSON format:
{
  "predictedIncome": <number>,
  "confidence": <number between 0 and 1>,
  "trend": "<increasing|decreasing|stable>",
  "insights": "Brief explanation of your prediction (1-2 sentences)"
}`;

    return this.tryModelsWithFallback(async (model) => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text);
        return {
          predictedIncome: parsed.predictedIncome || 0,
          confidence: parsed.confidence || 0.5,
          trend: parsed.trend || 'stable',
          insights: parsed.insights || 'Unable to generate insights'
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    });
  }

  /**
   * Detect spending anomalies using Gemini
   */
  async detectSpendingAnomalies(data: {
    transactions: Array<{
      category: string;
      amount: number;
      date: Date;
      description: string;
    }>;
    averageSpending: Record<string, number>;
  }): Promise<DetectSpendingAnomaliesOutput> {
    if (!this.isAvailable()) {
      throw new Error('Google AI API key not configured');
    }

    const prompt = `You are a financial analyst specializing in anomaly detection. Analyze the following transaction data for unusual spending patterns.

Recent Transactions:
${data.transactions.map(t => 
  `${t.date.toISOString().split('T')[0]} - ${t.category}: $${t.amount} (${t.description})`
).join('\n')}

Average Spending by Category:
${Object.entries(data.averageSpending).map(([cat, avg]) => `${cat}: $${avg}`).join('\n')}

Identify any spending anomalies and provide your analysis in the following JSON format:
{
  "anomalies": [
    {
      "category": "category name",
      "amount": <number>,
      "severity": "<high|medium|low>",
      "description": "Brief explanation of why this is anomalous"
    }
  ],
  "summary": "Overall summary of spending patterns (1-2 sentences)"
}

Focus on significant deviations from normal spending patterns.`;

    return this.tryModelsWithFallback(async (model) => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const parsed = JSON.parse(text);
        return {
          anomalies: parsed.anomalies || [],
          summary: parsed.summary || 'No significant anomalies detected'
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    });
  }

  /**
   * Get the current model being used
   */
  getCurrentModel(): GeminiModel {
    return this.currentModel;
  }

  /**
   * Get model information and quotas
   */
  getModelInfo(): Record<GeminiModel, { rpmQuota: number; description: string }> {
    return {
      'gemini-1.5-flash': {
        rpmQuota: 1500,
        description: 'Fast, efficient model with highest free quota'
      },
      'gemini-1.5-flash-latest': {
        rpmQuota: 1500,
        description: 'Latest Flash model with improvements'
      },
      'gemini-2.0-flash-exp': {
        rpmQuota: 10,
        description: 'Experimental next-gen model with limited quota'
      },
      'gemini-1.5-pro': {
        rpmQuota: 2,
        description: 'Advanced model for complex tasks'
      },
      'gemini-pro': {
        rpmQuota: 60,
        description: 'Legacy Pro model'
      }
    };
  }
}

// Export singleton instance
export const googleGenAI = new GoogleGenAIService();
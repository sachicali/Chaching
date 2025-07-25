/**
 * Hugging Face AI Service - Free Cloud AI Alternative
 * 
 * Provides AI capabilities using Hugging Face's free inference API with Gemma3.
 * Serves as a fallback when both Google Gemini API and Ollama are unavailable.
 * 
 * Features:
 * - Free Hugging Face inference API (rate limited)
 * - No local installation required
 * - Uses Google's Gemma3 model
 * - Optimized prompts for financial analysis
 */

import { HfInference } from '@huggingface/inference';

export interface HuggingFaceConfig {
  apiToken?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class HuggingFaceAIService {
  private hf: HfInference;
  private defaultModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: HuggingFaceConfig = {}) {
    // Use free inference API or provided token
    this.hf = new HfInference(config.apiToken);
    this.defaultModel = config.model || 'google/gemma-2-2b-it';
    this.maxTokens = config.maxTokens || 512;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Check if Hugging Face API is available (simple test)
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple inference to check if the service is available
      await this.hf.textGeneration({
        model: this.defaultModel,
        inputs: 'Hello',
        parameters: {
          max_new_tokens: 1,
          temperature: 0.1
        }
      });
      return true;
    } catch (error) {
      console.warn('Hugging Face not available:', error);
      return false;
    }
  }

  /**
   * Generate financial insights using Hugging Face Gemma3
   */
  async generateFinancialInsights(data: {
    income?: number;
    expenses?: number;
    categories?: Record<string, number>;
  }): Promise<{
    summary: string;
    savingsOpportunities: string[];
    spendingHabits: string;
  }> {
    const prompt = `As a Filipino financial advisor, analyze this financial data and provide insights:

Income: ₱${data.income?.toLocaleString() || 0}
Expenses: ₱${data.expenses?.toLocaleString() || 0}
Categories: ${JSON.stringify(data.categories || {})}

Provide insights in this format:
Summary: [Brief financial health summary (2-3 sentences)]
Opportunities: [3 specific savings opportunities]
Habits: [Analysis of spending patterns (2-3 sentences)]

Keep response concise and actionable.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.defaultModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: this.maxTokens,
          temperature: this.temperature,
          repetition_penalty: 1.1
        }
      });

      const text = response.generated_text || '';
      
      // Parse the structured response
      const summaryMatch = text.match(/Summary:\s*([\s\S]+?)(?=Opportunities:|$)/);
      const opportunitiesMatch = text.match(/Opportunities:\s*([\s\S]+?)(?=Habits:|$)/);
      const habitsMatch = text.match(/Habits:\s*([\s\S]+?)$/);

      const summary = summaryMatch?.[1]?.trim() || 
        "Your financial position shows steady income with controlled expenses. Focus on optimizing savings opportunities.";
      
      const opportunitiesText = opportunitiesMatch?.[1]?.trim() || 
        "1. Track recurring subscriptions 2. Set aside 20% for emergency fund 3. Consider low-risk investments";
      
      const habits = habitsMatch?.[1]?.trim() || 
        "You demonstrate consistent spending patterns with good expense control across categories.";

      // Parse opportunities into array
      const savingsOpportunities = opportunitiesText
        .split(/\d+\.|\n|-/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 3);

      return {
        summary,
        savingsOpportunities: savingsOpportunities.length > 0 ? savingsOpportunities : [
          "Track recurring subscriptions for potential savings",
          "Set aside 20% of income for emergency fund", 
          "Consider investing excess cash in low-risk options"
        ],
        spendingHabits: habits
      };
    } catch (error) {
      console.error('Hugging Face insights generation failed:', error);
      throw error;
    }
  }

  /**
   * Detect spending anomalies using Hugging Face Gemma3
   */
  async detectSpendingAnomalies(data: {
    expenses?: Record<string, number>;
    historicalAverages?: Record<string, number>;
  }): Promise<{
    anomalies: Array<{
      category: string;
      amount: number;
      deviation: string;
      reason: string;
    }>;
  }> {
    const prompt = `Analyze spending data for anomalies in a Filipino freelancer's expenses:

Recent expenses: ${JSON.stringify(data.expenses || {})}
Historical averages: ${JSON.stringify(data.historicalAverages || {})}

Identify spending anomalies (>20% deviation from normal). Format each anomaly as:
Category: [name] | Amount: [₱amount] | Deviation: [% higher/lower] | Reason: [explanation]

Only include significant deviations. If no anomalies, respond with "No anomalies detected."`;

    try {
      const response = await this.hf.textGeneration({
        model: this.defaultModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: this.maxTokens,
          temperature: 0.5,
          repetition_penalty: 1.1
        }
      });

      const text = response.generated_text || '';
      
      if (text.toLowerCase().includes('no anomalies')) {
        return { anomalies: [] };
      }

      // Parse anomalies from the response
      const anomalyLines = text.split('\n').filter(line => 
        line.includes('Category:') && line.includes('Amount:')
      );

      const anomalies = anomalyLines.slice(0, 3).map(line => {
        const categoryMatch = line.match(/Category:\s*([^|]+)/);
        const amountMatch = line.match(/Amount:\s*₱?([0-9,]+)/);
        const deviationMatch = line.match(/Deviation:\s*([^|]+)/);
        const reasonMatch = line.match(/Reason:\s*(.+)$/);

        return {
          category: categoryMatch?.[1]?.trim() || 'Unknown Category',
          amount: parseInt(amountMatch?.[1]?.replace(/,/g, '') || '0'),
          deviation: deviationMatch?.[1]?.trim() || 'Significant change detected',
          reason: reasonMatch?.[1]?.trim() || 'Unusual spending pattern detected for this category.'
        };
      }).filter(anomaly => anomaly.amount > 0);

      return { anomalies };
    } catch (error) {
      console.error('Hugging Face anomaly detection failed:', error);
      throw error;
    }
  }

  /**
   * Predict income using Hugging Face Gemma3
   */
  async predictIncome(data: {
    monthlyIncomes?: Array<{ date: string; income: number }>;
    seasonality?: string;
  }): Promise<{
    predictedIncome: number;
    confidenceInterval: string;
    factors: string;
  }> {
    const prompt = `As a financial analyst, predict next month's income for this Filipino freelancer:

Historical income: ${JSON.stringify(data.monthlyIncomes || [])}
Seasonality: ${data.seasonality || 'No seasonal data available'}

Provide prediction in this format:
Predicted: ₱[amount]
Confidence: [percentage]% confidence interval
Factors: [key factors affecting prediction]

Consider trends, seasonality, and freelancer income patterns.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.defaultModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: this.maxTokens,
          temperature: 0.3,
          repetition_penalty: 1.1
        }
      });

      const text = response.generated_text || '';
      
      // Parse the structured response
      const predictedMatch = text.match(/Predicted:\s*₱?([0-9,]+)/);
      const confidenceMatch = text.match(/Confidence:\s*([^%]+%[^F]*)/);
      const factorsMatch = text.match(/Factors:\s*([\s\S]+?)$/);

      const predictedIncome = parseInt(predictedMatch?.[1]?.replace(/,/g, '') || '45000');
      const confidenceInterval = confidenceMatch?.[1]?.trim() || '75% confidence interval';
      const factors = factorsMatch?.[1]?.trim() || 
        'Prediction based on historical income patterns and recent freelancer market trends.';

      return {
        predictedIncome,
        confidenceInterval,
        factors
      };
    } catch (error) {
      console.error('Hugging Face income prediction failed:', error);
      throw error;
    }
  }

  /**
   * Generate weekly financial summary using Hugging Face Gemma3
   */
  async generateWeeklySummary(data: {
    income?: number;
    expenses?: number;
    savings?: number;
    spendingByCategory?: Record<string, number>;
    previousWeekIncome?: number;
    previousWeekExpenses?: number;
    previousWeekSavings?: number;
  }): Promise<{
    summary: string;
    trends: string;
    opportunities: string;
  }> {
    const currentWeek = {
      income: data.income || 0,
      expenses: data.expenses || 0,
      savings: data.savings || 0
    };
    
    const previousWeek = {
      income: data.previousWeekIncome || 0,
      expenses: data.previousWeekExpenses || 0,
      savings: data.previousWeekSavings || 0
    };

    const prompt = `Generate a weekly financial summary for this Filipino freelancer:

This Week:
Income: ₱${currentWeek.income.toLocaleString()}
Expenses: ₱${currentWeek.expenses.toLocaleString()}
Savings: ₱${currentWeek.savings.toLocaleString()}
Spending by Category: ${JSON.stringify(data.spendingByCategory || {})}

Previous Week:
Income: ₱${previousWeek.income.toLocaleString()}
Expenses: ₱${previousWeek.expenses.toLocaleString()}
Savings: ₱${previousWeek.savings.toLocaleString()}

Provide analysis in this format:
Summary: [2-3 sentences about overall financial performance]
Trends: [Key changes compared to previous week]
Opportunities: [Specific recommendations for improvement]

Focus on actionable insights for a freelancer.`;

    try {
      const response = await this.hf.textGeneration({
        model: this.defaultModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: this.maxTokens,
          temperature: this.temperature,
          repetition_penalty: 1.1
        }
      });

      const text = response.generated_text || '';
      
      // Parse the structured response
      const summaryMatch = text.match(/Summary:\s*([\s\S]+?)(?=Trends:|$)/);
      const trendsMatch = text.match(/Trends:\s*([\s\S]+?)(?=Opportunities:|$)/);
      const opportunitiesMatch = text.match(/Opportunities:\s*([\s\S]+?)$/);

      const summary = summaryMatch?.[1]?.trim() || 
        "This week showed steady financial activity with controlled expense management.";
      
      const trends = trendsMatch?.[1]?.trim() || 
        "Income and expenses remained relatively stable compared to the previous week.";
      
      const opportunities = opportunitiesMatch?.[1]?.trim() || 
        "Continue monitoring expense categories and look for optimization opportunities.";

      return {
        summary,
        trends,
        opportunities
      };
    } catch (error) {
      console.error('Hugging Face weekly summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Categorize transaction using Hugging Face Gemma3
   */
  async categorizeTransaction(description: string, amount: number): Promise<{
    category: string;
    confidence: number;
    reason: string;
    alternativeCategories: string[];
  }> {
    const prompt = `Categorize this Filipino freelancer transaction:

Description: "${description}"
Amount: ₱${amount.toLocaleString()}

Common categories: Office Supplies, Software Subscriptions, Client Entertainment, 
Professional Services, Marketing, Transportation, Internet & Phone, Equipment

Format response as:
Category: [most likely category]
Confidence: [0-1 decimal]
Reason: [brief explanation]
Alternatives: [category1, category2]`;

    try {
      const response = await this.hf.textGeneration({
        model: this.defaultModel,
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.4,
          repetition_penalty: 1.1
        }
      });

      const text = response.generated_text || '';
      
      // Parse the structured response
      const categoryMatch = text.match(/Category:\s*([^\n]+)/);
      const confidenceMatch = text.match(/Confidence:\s*([0-9.]+)/);
      const reasonMatch = text.match(/Reason:\s*([^\n]+)/);
      const alternativesMatch = text.match(/Alternatives:\s*([^\n]+)/);

      const category = categoryMatch?.[1]?.trim() || 'Professional Services';
      const confidence = parseFloat(confidenceMatch?.[1] || '0.7');
      const reason = reasonMatch?.[1]?.trim() || 'Categorized based on transaction description and amount';
      const alternativesText = alternativesMatch?.[1]?.trim() || 'Office Supplies, Software Subscriptions';
      
      const alternativeCategories = alternativesText
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 2);

      return {
        category,
        confidence,
        reason,
        alternativeCategories: alternativeCategories.length > 0 ? alternativeCategories : ['Office Supplies', 'Software Subscriptions']
      };
    } catch (error) {
      console.error('Hugging Face categorization failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const huggingFaceAI = new HuggingFaceAIService();
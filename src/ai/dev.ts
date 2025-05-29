import { config } from 'dotenv';
config();

import '@/ai/flows/predict-income.ts';
import '@/ai/flows/generate-weekly-summary.ts';
import '@/ai/flows/generate-financial-insights.ts';
import '@/ai/flows/detect-spending-anomalies.ts';
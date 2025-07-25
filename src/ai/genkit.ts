import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Allow development mode without real API key
const isDevelopment = process.env.NODE_ENV === 'development';
const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey && !isDevelopment) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is required in production');
}

// Use a mock API key for development if none provided
const effectiveApiKey = apiKey || 'development_mock_key';

// List of models to try in order of preference
// Gemini Flash is free with generous quotas
const AVAILABLE_MODELS = [
  'googleai/gemini-2.0-flash-exp',     // Latest experimental flash model
  'googleai/gemini-2.0-flash',         // Stable flash model
  'googleai/gemini-1.5-flash',         // Previous generation (fallback)
  'googleai/gemini-pro',               // Free tier Gemini Pro
];

// Create primary AI instance with Gemini Flash
export const ai = genkit({
  plugins: [googleAI({
    apiKey: effectiveApiKey,
  })],
  model: AVAILABLE_MODELS[0], // Default to latest flash model
});

// Create a fallback AI instance with different model
export const aiFallback = genkit({
  plugins: [googleAI({
    apiKey: effectiveApiKey,
  })],
  model: AVAILABLE_MODELS[1], // Use stable flash as fallback
});

// Export model configuration
export const AI_MODELS = AVAILABLE_MODELS;
export const isDevMode = isDevelopment && (!apiKey || apiKey === 'development_placeholder_key');

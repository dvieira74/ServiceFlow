
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY, // Explicitly pass the API key
    }),
  ],
  // Removed model from top-level, as it's now configured within the googleAI plugin
});

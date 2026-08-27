import { describe, it, expect } from 'vitest';
import { ExtractionEngine } from './ExtractionEngine.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';

describe('AI Provider Abstraction', () => {
  it('should instantiate and extract using OpenAI provider', async () => {
    const engine = new ExtractionEngine('openai');
    const result = await engine.extract('Looking to rent a 2BHK in Downtown for $2500');
    expect(result.providerName).toBe('OpenAI');
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.requirement?.intent).toBe('RENT');
  });

  it('should instantiate and extract using Gemini provider', async () => {
    const engine = new ExtractionEngine('gemini');
    const result = await engine.extract('Looking to buy a villa in Suburbs');
    expect(result.providerName).toBe('Gemini');
    expect(result.confidenceScore).toBeGreaterThan(0);
    expect(result.requirement?.intent).toBe('BUY');
  });

  it('should instantiate and extract using OpenRouter provider', async () => {
    const engine = new ExtractionEngine('openrouter');
    const result = await engine.extract('Need studio apartment near university');
    expect(result.providerName).toBe('OpenRouter');
    expect(result.confidenceScore).toBeGreaterThan(0);
  });
});

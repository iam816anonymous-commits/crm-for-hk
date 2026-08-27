import { AIProvider, ExtractionResult } from './types.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { OpenRouterProvider } from './OpenRouterProvider.js';

export type ProviderType = 'openai' | 'gemini' | 'openrouter';

export class ExtractionEngine {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: AIProvider;

  constructor(defaultProviderName: ProviderType = 'openai') {
    const openAI = new OpenAIProvider();
    const gemini = new GeminiProvider();
    const openRouter = new OpenRouterProvider();

    this.providers.set('openai', openAI);
    this.providers.set('gemini', gemini);
    this.providers.set('openrouter', openRouter);

    this.defaultProvider = this.providers.get(defaultProviderName) || openAI;
  }

  registerProvider(name: string, provider: AIProvider) {
    this.providers.set(name.toLowerCase(), provider);
  }

  getProvider(name?: string): AIProvider {
    if (!name) return this.defaultProvider;
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new Error(`AI Provider '${name}' is not registered.`);
    }
    return provider;
  }

  async extract(inputText: string, providerName?: string, mediaUrl?: string): Promise<ExtractionResult> {
    const provider = this.getProvider(providerName);
    return provider.extractEntities(inputText, mediaUrl);
  }
}

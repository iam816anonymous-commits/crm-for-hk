import { AIProvider, ExtractionResult } from './types.js';

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  readonly model: string;
  private apiKey: string;

  constructor(apiKey = process.env.OPENAI_API_KEY || 'mock-key', model = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractEntities(inputText: string, mediaUrl?: string): Promise<ExtractionResult> {
    // If no real API key is supplied, return structured deterministic fallback output
    if (!this.apiKey || this.apiKey === 'mock-key') {
      return this.parseTextFallback(inputText);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a real estate CRM intelligence agent. Extract customer details, property requirements (intent RENT/BUY, budget, bedrooms, locations), visit schedules, and summary into a JSON object with a confidenceScore (0.0 to 1.0).`,
            },
            {
              role: 'user',
              content: inputText,
            },
          ],
        }),
      });

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);

      return {
        providerName: this.name,
        modelName: this.model,
        confidenceScore: content.confidenceScore ?? 0.85,
        customer: content.customer,
        requirement: content.requirement,
        visit: content.visit,
        summary: content.summary || inputText,
        rawResponse: data,
      };
    } catch (error) {
      return this.parseTextFallback(inputText);
    }
  }

  private parseTextFallback(inputText: string): ExtractionResult {
    // Basic heuristics for fallback parsing
    const isRent = /rent|lease|monthly/i.test(inputText);
    const isBuy = /buy|purchase|sale/i.test(inputText);

    return {
      providerName: this.name,
      modelName: this.model,
      confidenceScore: 0.80,
      requirement: {
        intent: isRent ? 'RENT' : isBuy ? 'BUY' : 'RENT',
        notes: inputText,
      },
      summary: `Extracted inquiry: ${inputText}`,
      rawResponse: { fallback: true, input: inputText },
    };
  }
}

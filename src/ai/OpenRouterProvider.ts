import { AIProvider, ExtractionResult } from './types.js';

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';
  readonly model: string;
  private apiKey: string;

  constructor(apiKey = process.env.OPENROUTER_API_KEY || 'mock-key', model = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractEntities(inputText: string, mediaUrl?: string): Promise<ExtractionResult> {
    if (!this.apiKey || this.apiKey === 'mock-key') {
      return this.parseTextFallback(inputText);
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a real estate CRM entity extractor. Return JSON with customer, requirement, visit, summary, and confidenceScore.`,
            },
            {
              role: 'user',
              content: inputText,
            },
          ],
        }),
      });

      const data = await response.json();
      const contentStr = data.choices[0].message.content;
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      const content = JSON.parse(jsonMatch ? jsonMatch[0] : contentStr);

      return {
        providerName: this.name,
        modelName: this.model,
        confidenceScore: content.confidenceScore ?? 0.88,
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
    return {
      providerName: this.name,
      modelName: this.model,
      confidenceScore: 0.85,
      requirement: {
        intent: /buy/i.test(inputText) ? 'BUY' : 'RENT',
        notes: inputText,
      },
      summary: `Extracted inquiry: ${inputText}`,
      rawResponse: { fallback: true, input: inputText },
    };
  }
}

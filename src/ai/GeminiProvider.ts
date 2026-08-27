import { AIProvider, ExtractionResult } from './types.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini';
  readonly model: string;
  private apiKey: string;

  constructor(apiKey = process.env.GEMINI_API_KEY || 'mock-key', model = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractEntities(inputText: string, mediaUrl?: string): Promise<ExtractionResult> {
    if (!this.apiKey || this.apiKey === 'mock-key') {
      return this.parseTextFallback(inputText);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract structured real estate CRM entities (customer, requirement, visit, summary, confidenceScore 0.0-1.0) as valid JSON from: ${inputText}`
            }]
          }]
        }),
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const content = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

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
    return {
      providerName: this.name,
      modelName: this.model,
      confidenceScore: 0.82,
      requirement: {
        intent: /buy/i.test(inputText) ? 'BUY' : 'RENT',
        notes: inputText,
      },
      summary: `Extracted inquiry: ${inputText}`,
      rawResponse: { fallback: true, input: inputText },
    };
  }
}

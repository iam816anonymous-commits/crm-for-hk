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
    const isRent = /rent|lease|monthly|need/i.test(inputText);
    const isBuy = /buy|purchase|sale/i.test(inputText);

    const bhkMatch = inputText.match(/(\d+)\s*bhk/i);
    const bhk = bhkMatch ? parseInt(bhkMatch[1], 10) : undefined;

    const budgetMatch = inputText.match(/(?:below|under|budget|max|rs\.?|₹)\s*(\d+)\s*(k|\,000)?/i) || inputText.match(/(\d+)\s*(k|\,000)/i);
    let budget: number | undefined = undefined;
    if (budgetMatch) {
      const num = parseInt(budgetMatch[1], 10);
      if (budgetMatch[2]?.toLowerCase() === 'k' || inputText.toLowerCase().includes(`${num}k`)) {
        budget = num * 1000;
      } else if (num >= 1000) {
        budget = num;
      } else if (num < 100 && num !== bhk) {
        budget = num * 1000;
      }
    }

    const locations: string[] = [];
    if (/whitefield/i.test(inputText)) locations.push('Whitefield');
    if (/indiranagar/i.test(inputText)) locations.push('Indiranagar');
    if (/koramangala/i.test(inputText)) locations.push('Koramangala');
    if (/hbr/i.test(inputText)) locations.push('HBR Layout');

    return {
      providerName: this.name,
      modelName: this.model,
      confidenceScore: 0.90,
      requirement: {
        intent: isRent ? 'RENT' : isBuy ? 'BUY' : 'RENT',
        minBedrooms: bhk,
        maxBudget: budget,
        preferredLocations: locations.length > 0 ? locations : undefined,
        location: locations[0],
        notes: inputText,
      },
      summary: `Extracted inquiry: ${inputText}`,
      rawResponse: { fallback: true, input: inputText },
    };
  }
}

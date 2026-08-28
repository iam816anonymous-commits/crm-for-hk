import { FieldMetadata, StructuredPipelineResult, ClassificationType } from './types.js';
import { ExtractionEngine } from './ExtractionEngine.js';

export interface PipelineOptions {
  sourceIdentifier?: string;
  providerName?: string;
}

export class AIPipeline {
  private extractionEngine: ExtractionEngine;

  constructor(extractionEngine?: ExtractionEngine) {
    this.extractionEngine = extractionEngine || new ExtractionEngine();
  }

  /**
   * Run full 7-stage extraction pipeline on raw text or transcript
   * Stages: RAW INPUT -> CLASSIFICATION -> ENTITY EXTRACTION -> NORMALIZATION -> VALIDATION -> CONFIDENCE -> ACTION
   */
  async processInput(rawInput: string, options: PipelineOptions = {}): Promise<StructuredPipelineResult> {
    const sourceIdentifier = options.sourceIdentifier || `raw_input_${Date.now()}`;
    const extractionRunId = `run_${crypto.randomUUID()}`;

    // 1. RAW INPUT PREPARATION
    const cleanText = rawInput.trim();

    // 2. CLASSIFICATION
    const classification = this.classifyInput(cleanText);

    // 3. ENTITY EXTRACTION via ExtractionEngine / AI Provider
    const rawResult = await this.extractionEngine.extract(cleanText, options.providerName);

    // 4 & 5 & 6. NORMALIZATION, VALIDATION, AND CONFIDENCE SCORING
    const fields: StructuredPipelineResult['fields'] = {};
    const fieldConfidences: number[] = [];

    // Property Type
    const propType = rawResult.requirement?.propertyType || this.detectPropertyType(cleanText);
    if (propType) {
      fields.propertyType = {
        value: propType.toLowerCase(),
        confidence: 0.95,
        source: sourceIdentifier,
        extractionRunId,
        verified: false,
      };
      fieldConfidences.push(0.95);
    }

    // BHK / Bedrooms
    const bhkVal = rawResult.requirement?.minBedrooms ?? this.parseBhk(cleanText);
    if (bhkVal !== undefined && bhkVal > 0 && bhkVal <= 10) {
      fields.bhk = {
        value: bhkVal,
        confidence: 0.98,
        source: sourceIdentifier,
        extractionRunId,
        verified: false,
      };
      fieldConfidences.push(0.98);
    }

    // Location
    const locVal = rawResult.requirement?.preferredLocations?.[0] || this.parseLocation(cleanText);
    if (locVal) {
      fields.location = {
        value: locVal,
        confidence: 0.95,
        source: sourceIdentifier,
        extractionRunId,
        verified: false,
      };
      fieldConfidences.push(0.95);
    }

    // Max Rent / Budget
    const rentVal = rawResult.requirement?.maxBudget ?? this.parseMaxRent(cleanText);
    if (rentVal !== undefined && rentVal > 0) {
      fields.maxRent = {
        value: rentVal,
        confidence: 0.98,
        source: sourceIdentifier,
        extractionRunId,
        verified: false,
      };
      fieldConfidences.push(0.98);
    }

    // Occupancy (Family, Bachelor, Company)
    const occupancyVal = this.parseOccupancy(cleanText);
    if (occupancyVal) {
      fields.occupancy = {
        value: occupancyVal,
        confidence: 0.92,
        source: sourceIdentifier,
        extractionRunId,
        verified: false,
      };
      fieldConfidences.push(0.92);
    }

    // Move In Date (ISO YYYY-MM normalization)
    const moveInVal = rawResult.requirement?.moveInDate || this.parseMoveIn(cleanText);
    if (moveInVal) {
      fields.moveIn = {
        value: moveInVal,
        confidence: 0.90,
        source: sourceIdentifier,
        extractionRunId,
        verified: false,
      };
      fieldConfidences.push(0.90);
    }

    // Intent
    const intentVal = rawResult.requirement?.intent || 'RENT';
    fields.intent = {
      value: intentVal,
      confidence: 0.99,
      source: sourceIdentifier,
      extractionRunId,
      verified: false,
    };
    fieldConfidences.push(0.99);

    // Compute Overall Confidence Score
    const overallConfidence = fieldConfidences.length > 0
      ? Number((fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length).toFixed(2))
      : 0.50;

    // 7. ACTION SELECTION
    const actionRequired = overallConfidence >= 0.80 ? 'AUTO_COMMIT' : 'HUMAN_CONFIRMATION_REQUIRED';

    return {
      extractionRunId,
      sourceIdentifier,
      classification,
      fields,
      overallConfidence,
      actionRequired,
    };
  }

  private classifyInput(text: string): ClassificationType {
    const lower = text.toLowerCase();
    if (lower.includes('visit') || lower.includes('schedule') || lower.includes('showing')) {
      return 'VISIT_REQUEST';
    }
    if (lower.includes('available for rent') || lower.includes('owner') || lower.includes('my property')) {
      return 'PROPERTY_LISTING';
    }
    if (lower.includes('need') || lower.includes('looking for') || lower.includes('bhk') || lower.includes('rent')) {
      return 'RENTAL_REQUIREMENT';
    }
    return 'GENERAL_INQUIRY';
  }

  private detectPropertyType(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (lower.includes('bhk') || lower.includes('flat') || lower.includes('apartment')) return 'apartment';
    if (lower.includes('villa') || lower.includes('house')) return 'villa';
    if (lower.includes('studio')) return 'studio';
    return undefined;
  }

  private parseBhk(text: string): number | undefined {
    const match = text.match(/(\d+)\s*(?:bhk|bedroom|bed)/i);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private parseLocation(text: string): string | undefined {
    const match = text.match(/(?:near|in|at|around)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:under|below|for|moving|family)|[.,]|$)/);
    if (match) return match[1].trim();
    const commonLocations = ['Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Electronic City', 'Hebbal', 'Yelahanka', 'Marathahalli'];
    for (const loc of commonLocations) {
      if (text.toLowerCase().includes(loc.toLowerCase())) return loc;
    }
    return undefined;
  }

  private parseMaxRent(text: string): number | undefined {
    const kMatch = text.match(/(?:under|below|budget|max|rent)?\s*(\d+)\s*k/i);
    if (kMatch) return parseInt(kMatch[1], 10) * 1000;

    const numMatch = text.match(/(?:under|below|budget|max|rent)\s*(?:₹|rs\.?|inr)?\s*(\d{4,6})/i);
    if (numMatch) return parseInt(numMatch[1], 10);

    return undefined;
  }

  private parseOccupancy(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (lower.includes('family')) return 'family';
    if (lower.includes('bachelor') || lower.includes('single')) return 'bachelor';
    if (lower.includes('company') || lower.includes('corporate')) return 'company';
    return undefined;
  }

  private parseMoveIn(text: string): string | undefined {
    const lower = text.toLowerCase();
    const now = new Date();

    if (lower.includes('next month')) {
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const yyyy = nextMonthDate.getFullYear();
      const mm = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    }
    if (lower.includes('this month') || lower.includes('immediately')) {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    }
    const isoMatch = text.match(/\b(20\d\d-(?:0[1-9]|1[0-2]))\b/);
    if (isoMatch) return isoMatch[1];

    return undefined;
  }
}

import { describe, it, expect } from 'vitest';
import { AIPipeline } from './Pipeline.js';

describe('AIPipeline generic 7-stage extraction engine', () => {
  const pipeline = new AIPipeline();

  it('correctly processes user prompt example into field-level metadata output', async () => {
    const rawInput = `Need a 2bhk near Whitefield under 25k.
Family. Moving next month.`;

    const result = await pipeline.processInput(rawInput, {
      sourceIdentifier: 'whatsapp_message_1821',
    });

    expect(result.sourceIdentifier).toBe('whatsapp_message_1821');
    expect(result.classification).toBe('RENTAL_REQUIREMENT');
    expect(result.actionRequired).toBe('AUTO_COMMIT');
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0.80);

    // Verify field-level structure & metadata
    const fields = result.fields;

    // bhk
    expect(fields.bhk).toBeDefined();
    expect(fields.bhk?.value).toBe(2);
    expect(fields.bhk?.confidence).toBe(0.98);
    expect(fields.bhk?.source).toBe('whatsapp_message_1821');
    expect(fields.bhk?.verified).toBe(false);

    // location
    expect(fields.location).toBeDefined();
    expect(fields.location?.value).toBe('Whitefield');
    expect(fields.location?.confidence).toBe(0.95);
    expect(fields.location?.source).toBe('whatsapp_message_1821');

    // max_rent
    expect(fields.maxRent).toBeDefined();
    expect(fields.maxRent?.value).toBe(25000);
    expect(fields.maxRent?.confidence).toBe(0.98);
    expect(fields.maxRent?.source).toBe('whatsapp_message_1821');

    // occupancy
    expect(fields.occupancy).toBeDefined();
    expect(fields.occupancy?.value).toBe('family');
    expect(fields.occupancy?.confidence).toBe(0.92);

    // moveIn
    expect(fields.moveIn).toBeDefined();
    expect(typeof fields.moveIn?.value).toBe('string');
    expect(fields.moveIn?.value).toMatch(/^\d{4}-\d{2}$/);
  });
});

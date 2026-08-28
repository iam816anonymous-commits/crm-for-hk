import { describe, it, expect } from 'vitest';
import { MatchingEngine } from './MatchingEngine.js';

describe('Deterministic Property Matching Engine', () => {
  const engine = new MatchingEngine();

  it('1. Should calculate sample Ravi requirement vs P102 property score as ~94%', () => {
    // Ravi Requirement: 2BHK, Whitefield, ₹25,000, Semi-furnished, September
    const raviReq = {
      propertyType: 'APARTMENT',
      minBedrooms: 2,
      preferredLocations: 'Whitefield',
      maxBudget: 25000,
      furnishingStatus: 'SEMI_FURNISHED',
      moveInDate: '2026-09-01',
      specialRequirements: 'Parking gym balcony',
    };

    // P102 Property: 2BHK, Whitefield, ₹23,000, Semi-furnished, Sept 1
    const p102Property = {
      title: 'Prestige Shantiniketan P102',
      propertyType: 'APARTMENT',
      bedrooms: 2,
      city: 'Whitefield, Bangalore',
      address: 'Prestige Shantiniketan, Tower 4',
      monthlyRent: 23000,
      furnishingStatus: 'SEMI_FURNISHED',
      availableFrom: '2026-09-01',
      description: 'Spacious 2BHK with covered parking gym balcony view',
    };

    const result = engine.calculateMatchScore(raviReq, p102Property);

    expect(result.totalScorePercentage).toBeGreaterThanOrEqual(90);
    expect(result.totalScorePercentage).toBeLessThanOrEqual(100);
    expect(result.matchLevel).toBe('EXCELLENT');

    // Individual criteria check
    const locBreakdown = result.breakdown.find(b => b.criteriaName === 'Location Match');
    const bhkBreakdown = result.breakdown.find(b => b.criteriaName === 'BHK Match');
    const budgetBreakdown = result.breakdown.find(b => b.criteriaName === 'Budget Match');

    expect(locBreakdown?.earnedScorePercentage).toBe(100); // 30/30
    expect(bhkBreakdown?.earnedScorePercentage).toBe(100); // 20/20
    expect(budgetBreakdown?.earnedScorePercentage).toBe(100); // 20/20
  });

  it('2. Should penalize mismatch in location and budget correctly', () => {
    const req = {
      preferredLocations: 'Indiranagar',
      maxBudget: 20000,
      minBedrooms: 2,
    };

    const prop = {
      city: 'Whitefield',
      monthlyRent: 35000, // 75% over budget
      bedrooms: 2,
    };

    const result = engine.calculateMatchScore(req, prop);
    expect(result.totalScorePercentage).toBeLessThan(60);
    expect(result.breakdown.find(b => b.criteriaName === 'Location Match')?.earnedScorePercentage).toBe(0);
    expect(result.breakdown.find(b => b.criteriaName === 'Budget Match')?.earnedScorePercentage).toBe(0);
  });
});

export interface RequirementInput {
  propertyType?: string;
  minBedrooms?: number;
  preferredLocations?: string | string[];
  maxBudget?: number;
  furnishingStatus?: string;
  moveInDate?: string;
  specialRequirements?: string;
}

export interface PropertyInput {
  title?: string;
  propertyType?: string;
  bedrooms?: number;
  city?: string;
  address?: string;
  monthlyRent?: number;
  furnishingStatus?: string;
  availableFrom?: string;
  description?: string;
}

export interface MatchCriteriaBreakdown {
  criteriaName: string;
  weightPercentage: number; // e.g. 30 for 30%
  earnedScorePercentage: number; // 0 to 100
  weightedScore: number; // weightPercentage * (earnedScorePercentage / 100)
  details: string;
}

export interface MatchResult {
  totalScorePercentage: number; // Overall 0 to 100
  matchLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  breakdown: MatchCriteriaBreakdown[];
}

export class MatchingEngine {
  /**
   * Deterministic Matching Engine implementing explicit percentage weights:
   * Location Match       30%
   * BHK Match            20%
   * Budget Match         20%
   * Furnishing           10%
   * Availability         10%
   * Property Type         5%
   * Other Requirements    5%
   */
  public calculateMatchScore(req: RequirementInput, prop: PropertyInput): MatchResult {
    const breakdown: MatchCriteriaBreakdown[] = [];

    // 1. Location Match (30%)
    const locScore = this.scoreLocation(req.preferredLocations, prop.city, prop.address);
    breakdown.push({
      criteriaName: 'Location Match',
      weightPercentage: 30,
      earnedScorePercentage: locScore.score,
      weightedScore: 30 * (locScore.score / 100),
      details: locScore.details,
    });

    // 2. BHK Match (20%)
    const bhkScore = this.scoreBhk(req.minBedrooms, prop.bedrooms);
    breakdown.push({
      criteriaName: 'BHK Match',
      weightPercentage: 20,
      earnedScorePercentage: bhkScore.score,
      weightedScore: 20 * (bhkScore.score / 100),
      details: bhkScore.details,
    });

    // 3. Budget Match (20%)
    const budgetScore = this.scoreBudget(req.maxBudget, prop.monthlyRent);
    breakdown.push({
      criteriaName: 'Budget Match',
      weightPercentage: 20,
      earnedScorePercentage: budgetScore.score,
      weightedScore: 20 * (budgetScore.score / 100),
      details: budgetScore.details,
    });

    // 4. Furnishing Match (10%)
    const furnScore = this.scoreFurnishing(req.furnishingStatus, prop.furnishingStatus);
    breakdown.push({
      criteriaName: 'Furnishing Match',
      weightPercentage: 10,
      earnedScorePercentage: furnScore.score,
      weightedScore: 10 * (furnScore.score / 100),
      details: furnScore.details,
    });

    // 5. Availability Match (10%)
    const availScore = this.scoreAvailability(req.moveInDate, prop.availableFrom);
    breakdown.push({
      criteriaName: 'Availability Match',
      weightPercentage: 10,
      earnedScorePercentage: availScore.score,
      weightedScore: 10 * (availScore.score / 100),
      details: availScore.details,
    });

    // 6. Property Type Match (5%)
    const typeScore = this.scorePropertyType(req.propertyType, prop.propertyType);
    breakdown.push({
      criteriaName: 'Property Type Match',
      weightPercentage: 5,
      earnedScorePercentage: typeScore.score,
      weightedScore: 5 * (typeScore.score / 100),
      details: typeScore.details,
    });

    // 7. Other Requirements Match (5%)
    const otherScore = this.scoreOtherRequirements(req.specialRequirements, prop.description);
    breakdown.push({
      criteriaName: 'Other Requirements',
      weightPercentage: 5,
      earnedScorePercentage: otherScore.score,
      weightedScore: 5 * (otherScore.score / 100),
      details: otherScore.details,
    });

    // Total Score Calculation
    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + item.weightedScore, 0));

    let matchLevel: MatchResult['matchLevel'] = 'POOR';
    if (totalScore >= 85) matchLevel = 'EXCELLENT';
    else if (totalScore >= 70) matchLevel = 'GOOD';
    else if (totalScore >= 50) matchLevel = 'FAIR';

    return {
      totalScorePercentage: totalScore,
      matchLevel,
      breakdown,
    };
  }

  private scoreLocation(preferred: string | string[] | undefined, city?: string, address?: string) {
    if (!preferred) return { score: 100, details: 'No location constraint specified' };

    const locations = Array.isArray(preferred)
      ? preferred
      : (typeof preferred === 'string' && preferred.startsWith('[') ? JSON.parse(preferred) : [preferred]);

    const fullPropLoc = `${city || ''} ${address || ''}`.toLowerCase();

    for (const loc of locations) {
      if (loc && fullPropLoc.includes(loc.toLowerCase())) {
        return { score: 100, details: `Exact match for location '${loc}'` };
      }
    }

    return { score: 0, details: 'Location does not match preferred areas' };
  }

  private scoreBhk(reqBhk?: number, propBhk?: number) {
    if (!reqBhk || !propBhk) return { score: 100, details: 'BHK not specified' };
    if (reqBhk === propBhk) return { score: 100, details: `Exact BHK match (${propBhk} BHK)` };
    if (Math.abs(reqBhk - propBhk) === 1) return { score: 50, details: `Close BHK match (${propBhk} vs ${reqBhk} BHK)` };
    return { score: 0, details: `BHK mismatch (${propBhk} vs ${reqBhk} BHK)` };
  }

  private scoreBudget(maxBudget?: number, rent?: number) {
    if (!maxBudget || !rent) return { score: 100, details: 'Budget constraint not specified' };
    if (rent <= maxBudget) {
      return { score: 100, details: `Rent ₹${rent.toLocaleString('en-IN')} within max budget ₹${maxBudget.toLocaleString('en-IN')}` };
    }
    const overPercent = ((rent - maxBudget) / maxBudget) * 100;
    if (overPercent <= 10) {
      return { score: 70, details: `Slightly over budget by ${Math.round(overPercent)}%` };
    }
    return { score: 0, details: `Over budget by ${Math.round(overPercent)}%` };
  }

  private scoreFurnishing(reqFurn?: string, propFurn?: string) {
    if (!reqFurn || !propFurn) return { score: 100, details: 'Furnishing not specified' };
    const reqNorm = reqFurn.toUpperCase().replace('-', '_');
    const propNorm = propFurn.toUpperCase().replace('-', '_');

    if (reqNorm === propNorm) return { score: 100, details: `Exact furnishing match (${propNorm})` };
    if ((reqNorm.includes('SEMI') && propNorm.includes('FURNISHED')) || (reqNorm.includes('FURNISHED') && propNorm.includes('SEMI'))) {
      return { score: 70, details: `Compatible furnishing (${propNorm} vs ${reqNorm})` };
    }
    return { score: 20, details: `Furnishing mismatch (${propNorm} vs ${reqNorm})` };
  }

  private scoreAvailability(reqDateStr?: string, propDateStr?: string) {
    if (!reqDateStr || !propDateStr) return { score: 100, details: 'Date constraint flexible' };
    const reqDate = new Date(reqDateStr);
    const propDate = new Date(propDateStr);

    if (isNaN(reqDate.getTime()) || isNaN(propDate.getTime())) {
      return { score: 100, details: 'Date parsed as flexible' };
    }

    const diffDays = Math.round((propDate.getTime() - reqDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return { score: 100, details: 'Property available immediately / on time' };
    if (diffDays <= 30) return { score: 70, details: `Available within ${diffDays} days of move-in date` };
    return { score: 20, details: `Available ${diffDays} days after move-in date` };
  }

  private scorePropertyType(reqType?: string, propType?: string) {
    if (!reqType || !propType) return { score: 100, details: 'Type constraint open' };
    if (reqType.toUpperCase() === propType.toUpperCase()) {
      return { score: 100, details: `Exact property type match (${propType})` };
    }
    return { score: 0, details: `Type mismatch (${propType} vs ${reqType})` };
  }

  private scoreOtherRequirements(specialReqs?: string, propDesc?: string) {
    if (!specialReqs) return { score: 100, details: 'No special requirements specified' };
    if (!propDesc) return { score: 50, details: 'Property description blank' };

    const reqKeywords = specialReqs.toLowerCase().split(/\s+/).filter(k => k.length > 3);
    const descLower = propDesc.toLowerCase();

    let matches = 0;
    for (const kw of reqKeywords) {
      if (descLower.includes(kw)) matches++;
    }

    if (reqKeywords.length === 0) return { score: 100, details: 'General notes' };
    const matchRatio = matches / reqKeywords.length;
    const score = Math.round(matchRatio * 100);

    return { score: Math.max(score, 50), details: `Matched ${matches} special criteria keywords` };
  }
}

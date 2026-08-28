export interface FieldMetadata<T> {
  value: T;
  confidence: number;
  source: string;
  extractionRunId: string;
  verified: boolean;
}

export type ClassificationType = 'RENTAL_REQUIREMENT' | 'PROPERTY_LISTING' | 'VISIT_REQUEST' | 'GENERAL_INQUIRY';

export interface StructuredPipelineResult {
  extractionRunId: string;
  sourceIdentifier: string;
  classification: ClassificationType;
  fields: {
    intent?: FieldMetadata<'RENT' | 'BUY'>;
    propertyType?: FieldMetadata<string>;
    bhk?: FieldMetadata<number>;
    location?: FieldMetadata<string>;
    maxRent?: FieldMetadata<number>;
    occupancy?: FieldMetadata<string>;
    moveIn?: FieldMetadata<string>;
    [key: string]: FieldMetadata<any> | undefined;
  };
  overallConfidence: number;
  actionRequired: 'AUTO_COMMIT' | 'HUMAN_CONFIRMATION_REQUIRED';
}

export interface ExtractedRequirement {
  intent?: 'RENT' | 'BUY';
  propertyType?: string;
  minBedrooms?: number;
  minBathrooms?: number;
  preferredCities?: string[];
  preferredLocations?: string[];
  minBudget?: number;
  maxBudget?: number;
  furnishingStatus?: string;
  moveInDate?: string;
  notes?: string;
}

export interface ExtractedCustomerInfo {
  firstName?: string;
  lastName?: string;
  phoneRaw?: string;
  email?: string;
}

export interface ExtractedVisitInfo {
  propertyId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface ExtractionResult {
  providerName: string;
  modelName: string;
  confidenceScore: number;
  customer?: ExtractedCustomerInfo;
  requirement?: ExtractedRequirement;
  visit?: ExtractedVisitInfo;
  summary?: string;
  rawResponse: Record<string, any>;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  extractEntities(inputText: string, mediaUrl?: string): Promise<ExtractionResult>;
}

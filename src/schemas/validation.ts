import { z } from 'zod';

// Contact validation schema
export const CreateContactSchema = z.object({
  phoneRaw: z.string().min(5, 'Phone number is too short'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  isVerifiedManually: z.boolean().optional(),
});

// Customer role creation schema
export const CreateCustomerSchema = z.object({
  contactId: z.string().uuid().optional(),
  phoneRaw: z.string().min(5).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  customerType: z.enum(['TENANT', 'BUYER', 'BOTH']).default('TENANT'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED']).default('ACTIVE'),
  notes: z.string().optional(),
});

// Owner role creation schema
export const CreateOwnerSchema = z.object({
  contactId: z.string().uuid().optional(),
  phoneRaw: z.string().min(5).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
});

// Phase 3 Property creation schema
export const CreatePropertySchema = z.object({
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional(),
  ownerPhoneRaw: z.string().min(5).optional(),
  ownerName: z.string().optional(),
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  propertyType: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'COMMERCIAL', 'LAND']),
  listingType: z.enum(['RENT', 'SALE', 'BOTH']).default('RENT'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City/Location is required'),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(), // BHK
  bathrooms: z.number().min(0).optional(),
  squareFeet: z.number().positive().optional(),
  furnishingStatus: z.enum(['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']).optional(),
  monthlyRent: z.number().positive().optional(),
  salePrice: z.number().positive().optional(),
  depositAmount: z.number().min(0).optional(),
  maintenanceAmount: z.number().min(0).optional(), // Phase 3
  availableFrom: z.string().optional(), // Phase 3
  photos: z.array(z.string()).optional(), // Phase 3
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED']).default('AVAILABLE'),
  isVerifiedManually: z.boolean().optional(),
});

// Phase 3 Requirement creation schema
export const CreateRequirementSchema = z.object({
  customerId: z.string().uuid('Customer ID must be a valid UUID').optional(),
  customerPhoneRaw: z.string().min(5).optional(),
  customerName: z.string().optional(),
  intent: z.enum(['RENT', 'BUY']).default('RENT'),
  propertyType: z.enum(['APARTMENT', 'VILLA', 'STUDIO', 'COMMERCIAL']).optional(),
  minBedrooms: z.number().int().min(0).optional(), // BHK
  minBathrooms: z.number().min(0).optional(),
  preferredCities: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  furnishingStatus: z.enum(['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']).optional(),
  moveInDate: z.string().optional(),
  occupancyType: z.enum(['FAMILY', 'BACHELOR', 'COMPANY', 'ANY']).optional(), // Phase 3
  specialRequirements: z.string().optional(), // Phase 3
  notes: z.string().optional(),
  isVerifiedManually: z.boolean().optional(),
  sourceRecordId: z.string().uuid().optional(),
  extractionConfidence: z.number().min(0).max(1.0).optional(),
});

// Phase 3 Lead Stage Transition Schema
export const UpdateLeadStageSchema = z.object({
  stage: z.enum([
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPERTIES_SENT',
    'VISIT_SCHEDULED',
    'VISITED',
    'NEGOTIATION',
    'CLOSED',
    'LOST',
    'NOT_INTERESTED',
    'ON_HOLD'
  ]),
  lostReason: z.string().optional(),
});

// Interaction creation schema
export const CreateInteractionSchema = z.object({
  phoneRaw: z.string().min(5),
  channel: z.enum(['WHATSAPP', 'CALL', 'IN_PERSON', 'EMAIL', 'MANUAL_NOTE']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  summary: z.string().optional(),
  body: z.string().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  callStatus: z.string().optional(),
  senderPhone: z.string().optional(),
  recipientPhone: z.string().optional(),
});

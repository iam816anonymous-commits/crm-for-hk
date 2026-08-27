import { parsePhoneNumberWithError } from 'libphonenumber-js';

/**
 * Rule #2 & #3: Normalizes phone numbers to E.164 canonical format using libphonenumber-js.
 * Fallbacks to standard numeric cleaning if country code is omitted.
 */
export function normalizePhoneNumber(phoneInput: string, defaultCountry = 'US'): string {
  try {
    const phoneNumber = parsePhoneNumberWithError(phoneInput, defaultCountry as any);
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.format('E.164');
    }
  } catch (error) {
    // Fallback parsing if libphonenumber fails
  }

  // Basic fallback cleanup
  const cleaned = phoneInput.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return `+1${cleaned}`; // Default to US +1 if no country code provided
}

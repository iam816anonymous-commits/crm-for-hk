import { db } from '../db/index.js';
import { contacts, customers, owners } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { normalizePhoneNumber } from '../utils/phone.js';

export class ContactRepository {
  /**
   * Rule #1, #2, #3: Find existing canonical contact by normalized phone or create new contact.
   * Prevents duplicate contact creation.
   */
  findOrCreateContact(
    phoneRaw: string,
    data?: { firstName?: string; lastName?: string; email?: string; address?: string; notes?: string; isVerifiedManually?: boolean },
    dbTx = db
  ) {
    const phoneNormalized = normalizePhoneNumber(phoneRaw);

    const existing = dbTx.select().from(contacts).where(eq(contacts.phoneNormalized, phoneNormalized)).get();
    if (existing) {
      if (data && (data.firstName || data.lastName || data.email)) {
        if (!existing.isVerifiedManually) {
          dbTx.update(contacts)
            .set({
              firstName: data.firstName || existing.firstName,
              lastName: data.lastName || existing.lastName,
              email: data.email || existing.email,
              address: data.address || existing.address,
              notes: data.notes || existing.notes,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(contacts.id, existing.id))
            .run();
        }
      }
      const updated = dbTx.select().from(contacts).where(eq(contacts.id, existing.id)).get();
      if (!updated) throw new Error('Failed to retrieve contact record');
      return updated;
    }

    const [newContact] = dbTx.insert(contacts)
      .values({
        phoneRaw,
        phoneNormalized,
        firstName: data?.firstName,
        lastName: data?.lastName,
        email: data?.email,
        address: data?.address,
        notes: data?.notes,
        isVerifiedManually: data?.isVerifiedManually ?? false,
      })
      .returning()
      .all();

    if (!newContact) throw new Error('Failed to insert contact record');
    return newContact;
  }

  getOrCreateCustomerRole(contactId: string, customerType = 'TENANT', notes?: string, dbTx = db) {
    const existing = dbTx.select().from(customers).where(eq(customers.contactId, contactId)).get();
    if (existing) {
      return existing;
    }

    const [newCustomer] = dbTx.insert(customers)
      .values({
        contactId,
        customerType,
        notes,
      })
      .returning()
      .all();

    if (!newCustomer) throw new Error('Failed to insert customer role');
    return newCustomer;
  }

  getOrCreateOwnerRole(contactId: string, taxId?: string, companyName?: string, notes?: string, dbTx = db) {
    const existing = dbTx.select().from(owners).where(eq(owners.contactId, contactId)).get();
    if (existing) {
      return existing;
    }

    const [newOwner] = dbTx.insert(owners)
      .values({
        contactId,
        taxId,
        companyName,
        notes,
      })
      .returning()
      .all();

    if (!newOwner) throw new Error('Failed to insert owner role');
    return newOwner;
  }
}

import { db } from '../db/index.js';
import { contacts, customers, owners } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { normalizePhoneNumber } from '../utils/phone.js';

export class ContactRepository {
  findOrCreateContact(
    phoneRaw: string,
    data?: { firstName?: string; lastName?: string; email?: string; address?: string; notes?: string; isVerifiedManually?: boolean; organizationId?: string },
    dbTx = db
  ) {
    const phoneNormalized = normalizePhoneNumber(phoneRaw);
    const orgId = data?.organizationId || null;

    const query = orgId
      ? dbTx.select().from(contacts).where(and(eq(contacts.phoneNormalized, phoneNormalized), eq(contacts.organizationId, orgId))).get()
      : dbTx.select().from(contacts).where(eq(contacts.phoneNormalized, phoneNormalized)).get();

    if (query) {
      if (data && (data.firstName || data.lastName || data.email)) {
        if (!query.isVerifiedManually) {
          dbTx.update(contacts)
            .set({
              firstName: data.firstName || query.firstName,
              lastName: data.lastName || query.lastName,
              email: data.email || query.email,
              address: data.address || query.address,
              notes: data.notes || query.notes,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(contacts.id, query.id))
            .run();
        }
      }
      const updated = dbTx.select().from(contacts).where(eq(contacts.id, query.id)).get();
      if (!updated) throw new Error('Failed to retrieve contact record');
      return updated;
    }

    const valuesObj: any = {
      phoneRaw,
      phoneNormalized,
      firstName: data?.firstName || null,
      lastName: data?.lastName || null,
      email: data?.email || null,
      address: data?.address || null,
      notes: data?.notes || null,
      isVerifiedManually: data?.isVerifiedManually ?? false,
    };
    if (orgId) {
      valuesObj.organizationId = orgId;
    }

    const [newContact] = dbTx.insert(contacts)
      .values(valuesObj)
      .returning()
      .all();

    if (!newContact) throw new Error('Failed to insert contact record');
    return newContact;
  }

  getOrCreateCustomerRole(contactId: string, customerType = 'TENANT', notes?: string, organizationId?: string, dbTx = db) {
    const existing = dbTx.select().from(customers).where(eq(customers.contactId, contactId)).get();
    if (existing) {
      return existing;
    }

    const valuesObj: any = {
      contactId,
      customerType: customerType || 'TENANT',
      notes: notes || null,
    };
    if (organizationId) {
      valuesObj.organizationId = organizationId;
    }

    const [newCustomer] = dbTx.insert(customers)
      .values(valuesObj)
      .returning()
      .all();

    if (!newCustomer) throw new Error('Failed to insert customer role');
    return newCustomer;
  }

  getOrCreateOwnerRole(contactId: string, taxId?: string, companyName?: string, notes?: string, organizationId?: string, dbTx = db) {
    const existing = dbTx.select().from(owners).where(eq(owners.contactId, contactId)).get();
    if (existing) {
      return existing;
    }

    const valuesObj: any = {
      contactId,
      taxId: taxId || null,
      companyName: companyName || null,
      notes: notes || null,
    };
    if (organizationId) {
      valuesObj.organizationId = organizationId;
    }

    const [newOwner] = dbTx.insert(owners)
      .values(valuesObj)
      .returning()
      .all();

    if (!newOwner) throw new Error('Failed to insert owner role');
    return newOwner;
  }
}

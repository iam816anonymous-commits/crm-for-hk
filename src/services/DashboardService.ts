import { db } from '../db/index.js';
import { contacts, customers, owners, properties, requirements, leads, interactions, calls, messages, visits, followups } from '../db/schema.js';
import { eq, like, or, count, and } from 'drizzle-orm';
import { normalizePhoneNumber } from '../utils/phone.js';

export class DashboardService {
  async getStats(dbConn = db, organizationId?: string) {
    const totalProps = dbConn.select({ count: count() }).from(properties).where(organizationId ? eq(properties.organizationId, organizationId) : undefined).get()?.count || 0;
    const availableProps = dbConn.select({ count: count() }).from(properties).where(organizationId ? and(eq(properties.status, 'AVAILABLE'), eq(properties.organizationId, organizationId)) : eq(properties.status, 'AVAILABLE')).get()?.count || 0;
    const occupiedProps = dbConn.select({ count: count() }).from(properties).where(organizationId ? and(eq(properties.status, 'OCCUPIED'), eq(properties.organizationId, organizationId)) : eq(properties.status, 'OCCUPIED')).get()?.count || 0;

    const newLeads = dbConn.select({ count: count() }).from(leads).where(organizationId ? and(eq(leads.stage, 'NEW'), eq(leads.organizationId, organizationId)) : eq(leads.stage, 'NEW')).get()?.count || 0;
    const hotLeads = dbConn.select({ count: count() }).from(leads).where(organizationId ? and(eq(leads.priority, 'HIGH'), eq(leads.organizationId, organizationId)) : eq(leads.priority, 'HIGH')).get()?.count || 0;

    const pendingFollowups = dbConn.select({ count: count() }).from(followups).where(organizationId ? and(eq(followups.status, 'PENDING'), eq(followups.organizationId, organizationId)) : eq(followups.status, 'PENDING')).get()?.count || 0;
    const todayVisits = dbConn.select({ count: count() }).from(visits).where(organizationId ? and(eq(visits.status, 'SCHEDULED'), eq(visits.organizationId, organizationId)) : eq(visits.status, 'SCHEDULED')).get()?.count || 0;

    const recentCalls = dbConn.select().from(calls).limit(5).all();
    const recentWhatsApp = dbConn.select().from(messages).where(eq(messages.messageType, 'TEXT')).limit(5).all();

    return {
      totalProperties: totalProps,
      availableProperties: availableProps,
      occupiedProperties: occupiedProps,
      newLeads,
      hotLeads,
      pendingFollowups,
      todayVisits,
      recentCallsCount: recentCalls.length,
      recentWhatsAppCount: recentWhatsApp.length,
      recentCalls,
      recentWhatsApp,
    };
  }

  async searchContacts(query: string, dbConn = db, organizationId?: string) {
    const normalized = normalizePhoneNumber(query);

    let whereClause = or(
      like(contacts.phoneNormalized, `%${query.replace(/[^\d+]/g, '')}%`),
      like(contacts.phoneNormalized, `%${normalized}%`),
      like(contacts.firstName, `%${query}%`),
      like(contacts.lastName, `%${query}%`)
    );

    if (organizationId) {
      whereClause = and(whereClause, eq(contacts.organizationId, organizationId));
    }

    return dbConn.select()
      .from(contacts)
      .where(whereClause)
      .all();
  }

  async getContactDetailedProfile(contactIdOrPhone: string, dbConn = db, organizationId?: string) {
    let contact = organizationId
      ? dbConn.select().from(contacts).where(and(eq(contacts.id, contactIdOrPhone), eq(contacts.organizationId, organizationId))).get()
      : dbConn.select().from(contacts).where(eq(contacts.id, contactIdOrPhone)).get();

    if (!contact) {
      const normalized = normalizePhoneNumber(contactIdOrPhone);
      contact = organizationId
        ? dbConn.select().from(contacts).where(and(eq(contacts.phoneNormalized, normalized), eq(contacts.organizationId, organizationId))).get()
        : dbConn.select().from(contacts).where(eq(contacts.phoneNormalized, normalized)).get();
    }

    if (!contact) {
      return null;
    }

    // Determine roles
    const customerRole = dbConn.select().from(customers).where(eq(customers.contactId, contact.id)).get();
    const ownerRole = dbConn.select().from(owners).where(eq(owners.contactId, contact.id)).get();

    const roles: string[] = [];
    if (customerRole) roles.push(customerRole.customerType === 'BUYER' ? 'Buyer' : 'Tenant');
    if (ownerRole) roles.push('Owner');
    if (roles.length === 0) roles.push('Contact');

    // Requirements summary
    let requirementSummary = null;
    if (customerRole) {
      const req = dbConn.select().from(requirements).where(eq(requirements.customerId, customerRole.id)).get();
      if (req) {
        requirementSummary = {
          bhk: req.minBedrooms ? `${req.minBedrooms}BHK` : 'N/A',
          location: req.preferredLocations ? (JSON.parse(req.preferredLocations)[0] || 'N/A') : 'N/A',
          budget: req.maxBudget ? `₹${req.maxBudget.toLocaleString('en-IN')}` : 'N/A',
        };
      }
    }

    // Interaction counters
    const allInteractions = dbConn.select().from(interactions).where(eq(interactions.contactId, contact.id)).all();
    const whatsappCount = allInteractions.filter(i => i.channel === 'WHATSAPP').length;
    const callCount = allInteractions.filter(i => i.channel === 'CALL').length;

    let visitCount = 0;
    if (customerRole) {
      visitCount = dbConn.select({ count: count() }).from(visits).where(eq(visits.customerId, customerRole.id)).get()?.count || 0;
    }

    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phoneNormalized;

    return {
      contact,
      name: fullName,
      roles,
      phoneFormatted: contact.phoneNormalized,
      requirements: requirementSummary,
      interactionsCount: {
        whatsapp: whatsappCount,
        calls: callCount,
        visits: visitCount,
      },
      propertiesShown: visitCount,
      propertiesRejected: 0,
      lastContact: allInteractions.length > 0 ? 'Recently' : 'None',
      nextFollowUp: 'None',
    };
  }
}

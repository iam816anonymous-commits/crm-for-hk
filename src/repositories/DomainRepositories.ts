import { db } from '../db/index.js';
import { properties, requirements, leads, interactions, messages, calls } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class PropertyRepository {
  createProperty(data: any, dbTx = db) {
    const payload = {
      ...data,
      photos: Array.isArray(data.photos) ? JSON.stringify(data.photos) : (data.photos || '[]'),
    };
    const [newProperty] = dbTx.insert(properties).values(payload).returning().all();
    return newProperty;
  }

  getPropertyById(id: string, organizationId?: string, dbTx = db) {
    if (organizationId) {
      return dbTx.select().from(properties).where(and(eq(properties.id, id), eq(properties.organizationId, organizationId))).get() || null;
    }
    return dbTx.select().from(properties).where(eq(properties.id, id)).get() || null;
  }

  updateProperty(id: string, updates: Partial<typeof properties.$inferInsert>, organizationId?: string, dbTx = db) {
    const existing = this.getPropertyById(id, organizationId, dbTx);
    if (!existing) return null;

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
      photos: Array.isArray(updates.photos) ? JSON.stringify(updates.photos) : updates.photos,
    };

    const [updated] = dbTx.update(properties)
      .set(payload)
      .where(eq(properties.id, id))
      .returning()
      .all();

    return updated || null;
  }

  deleteProperty(id: string, organizationId?: string, dbTx = db) {
    const existing = this.getPropertyById(id, organizationId, dbTx);
    if (!existing) return false;

    dbTx.delete(properties).where(eq(properties.id, id)).run();
    return true;
  }

  listProperties(organizationId?: string, dbTx = db) {
    if (organizationId) {
      return dbTx.select().from(properties).where(eq(properties.organizationId, organizationId)).all();
    }
    return dbTx.select().from(properties).all();
  }
}

export class RequirementRepository {
  createRequirement(data: any, dbTx = db) {
    const payload = {
      ...data,
      preferredCities: Array.isArray(data.preferredCities) ? JSON.stringify(data.preferredCities) : data.preferredCities,
      preferredLocations: Array.isArray(data.preferredLocations) ? JSON.stringify(data.preferredLocations) : data.preferredLocations,
    };
    const [newRequirement] = dbTx.insert(requirements).values(payload).returning().all();
    return newRequirement;
  }

  getRequirementById(id: string, organizationId?: string, dbTx = db) {
    if (organizationId) {
      return dbTx.select().from(requirements).where(and(eq(requirements.id, id), eq(requirements.organizationId, organizationId))).get() || null;
    }
    return dbTx.select().from(requirements).where(eq(requirements.id, id)).get() || null;
  }

  updateRequirement(id: string, updates: Partial<typeof requirements.$inferInsert>, organizationId?: string, dbTx = db) {
    const existing = this.getRequirementById(id, organizationId, dbTx);
    if (!existing) return null;

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
      preferredCities: Array.isArray(updates.preferredCities) ? JSON.stringify(updates.preferredCities) : updates.preferredCities,
      preferredLocations: Array.isArray(updates.preferredLocations) ? JSON.stringify(updates.preferredLocations) : updates.preferredLocations,
    };

    const [updated] = dbTx.update(requirements)
      .set(payload)
      .where(eq(requirements.id, id))
      .returning()
      .all();

    return updated || null;
  }

  deleteRequirement(id: string, organizationId?: string, dbTx = db) {
    const existing = this.getRequirementById(id, organizationId, dbTx);
    if (!existing) return false;

    dbTx.delete(requirements).where(eq(requirements.id, id)).run();
    return true;
  }

  listRequirements(organizationId?: string, dbTx = db) {
    if (organizationId) {
      return dbTx.select().from(requirements).where(eq(requirements.organizationId, organizationId)).all();
    }
    return dbTx.select().from(requirements).all();
  }
}

export class LeadRepository {
  createLead(data: any, dbTx = db) {
    const [newLead] = dbTx.insert(leads).values(data).returning().all();
    return newLead;
  }

  getLeadById(id: string, organizationId?: string, dbTx = db) {
    if (organizationId) {
      return dbTx.select().from(leads).where(and(eq(leads.id, id), eq(leads.organizationId, organizationId))).get() || null;
    }
    return dbTx.select().from(leads).where(eq(leads.id, id)).get() || null;
  }

  updateLeadStage(id: string, stage: string, lostReason?: string, organizationId?: string, dbTx = db) {
    if (organizationId) {
      const existing = dbTx.select().from(leads).where(and(eq(leads.id, id), eq(leads.organizationId, organizationId))).get();
      if (!existing) return null;
    }

    dbTx.update(leads)
      .set({
        stage,
        lostReason: lostReason || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(leads.id, id))
      .run();

    return dbTx.select().from(leads).where(eq(leads.id, id)).get();
  }

  deleteLead(id: string, organizationId?: string, dbTx = db) {
    const existing = this.getLeadById(id, organizationId, dbTx);
    if (!existing) return false;

    dbTx.delete(leads).where(eq(leads.id, id)).run();
    return true;
  }

  listLeads(organizationId?: string, dbTx = db) {
    if (organizationId) {
      return dbTx.select().from(leads).where(eq(leads.organizationId, organizationId)).all();
    }
    return dbTx.select().from(leads).all();
  }
}

export class InteractionRepository {
  createInteraction(interactionData: any, detailData?: { type: 'message' | 'call'; payload: any }, dbTx = db) {
    const [newInteraction] = dbTx.insert(interactions).values(interactionData).returning().all();

    if (detailData?.type === 'message') {
      dbTx.insert(messages).values({
        interactionId: newInteraction.id,
        ...detailData.payload,
      }).run();
    } else if (detailData?.type === 'call') {
      dbTx.insert(calls).values({
        interactionId: newInteraction.id,
        ...detailData.payload,
      }).run();
    }

    return newInteraction;
  }
}

import { db } from '../db/index.js';
import { properties, requirements, leads, interactions, messages, calls, sourceRecords, extractionRuns, auditLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class PropertyRepository {
  createProperty(data: any, dbTx = db) {
    const payload = {
      ...data,
      photos: Array.isArray(data.photos) ? JSON.stringify(data.photos) : (data.photos || '[]'),
    };
    const [newProperty] = dbTx.insert(properties).values(payload).returning().all();
    return newProperty;
  }

  getPropertyById(id: string, dbTx = db) {
    return dbTx.select().from(properties).where(eq(properties.id, id)).get();
  }

  listProperties(dbTx = db) {
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

  getRequirementById(id: string, dbTx = db) {
    return dbTx.select().from(requirements).where(eq(requirements.id, id)).get();
  }

  listRequirements(dbTx = db) {
    return dbTx.select().from(requirements).all();
  }
}

export class LeadRepository {
  createLead(data: any, dbTx = db) {
    const [newLead] = dbTx.insert(leads).values(data).returning().all();
    return newLead;
  }

  updateLeadStage(id: string, stage: string, lostReason?: string, dbTx = db) {
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

  listLeads(dbTx = db) {
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

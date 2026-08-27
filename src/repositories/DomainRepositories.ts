import { db } from '../db/index.js';
import { properties, requirements, leads, interactions, messages, calls, sourceRecords, extractionRuns, auditLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class PropertyRepository {
  createProperty(data: any, dbTx = db) {
    const [newProperty] = dbTx.insert(properties).values(data).returning().all();
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

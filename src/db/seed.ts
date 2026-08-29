import { db } from '../db/index.js';
import { organizations, users, contacts, customers, owners, properties, requirements, leads, interactions, calls, messages, visits, followups, auditLogs } from '../db/schema.js';
import { hashPassword } from '../utils/auth.js';

export async function seedDatabase() {
  console.log('Seeding development database with sample organization, users, and CRM records...');

  const passHash = await hashPassword('Password123!');

  const result = db.transaction((tx: any) => {
    // 1. Create Sample Organization
    const [org] = tx.insert(organizations).values({
      name: 'Apex Realty Solutions',
    }).returning().all();

    // 2. Create Users
    const [adminUser] = tx.insert(users).values({
      organizationId: org.id,
      email: 'admin@apexrealty.com',
      passwordHash: passHash,
      fullName: 'Alex Admin',
      role: 'ADMIN',
      isActive: true,
    }).returning().all();

    const [brokerUser] = tx.insert(users).values({
      organizationId: org.id,
      email: 'broker@apexrealty.com',
      passwordHash: passHash,
      fullName: 'Brian Broker',
      role: 'BROKER',
      isActive: true,
    }).returning().all();

    // 3. Create Sample Contact & Customer
    const [contact1] = tx.insert(contacts).values({
      organizationId: org.id,
      phoneRaw: '+919876543210',
      phoneNormalized: '+919876543210',
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@example.com',
      isVerifiedManually: true,
    }).returning().all();

    const [customer1] = tx.insert(customers).values({
      organizationId: org.id,
      contactId: contact1.id,
      customerType: 'TENANT',
      status: 'ACTIVE',
    }).returning().all();

    // 4. Create Sample Owner & Property
    const [ownerContact] = tx.insert(contacts).values({
      organizationId: org.id,
      phoneRaw: '+919812345678',
      phoneNormalized: '+919812345678',
      firstName: 'Eleanor',
      lastName: 'Vance',
      email: 'eleanor.vance@example.com',
      isVerifiedManually: true,
    }).returning().all();

    const [owner1] = tx.insert(owners).values({
      organizationId: org.id,
      contactId: ownerContact.id,
      taxId: 'TAX998877',
      companyName: 'Vance Estates',
    }).returning().all();

    const [prop1] = tx.insert(properties).values({
      organizationId: org.id,
      ownerId: owner1.id,
      title: 'Modern 2BHK Apartment in Whitefield',
      propertyType: 'APARTMENT',
      listingType: 'RENT',
      address: 'Prestige Shantiniketan, Whitefield Main Rd',
      city: 'Bangalore',
      bedrooms: 2,
      bathrooms: 2,
      monthlyRent: 28000,
      depositAmount: 100000,
      maintenanceAmount: 2500,
      furnishingStatus: 'SEMI_FURNISHED',
      status: 'AVAILABLE',
      isVerifiedManually: true,
    }).returning().all();

    // 5. Create Sample Requirement & Lead
    const [req1] = tx.insert(requirements).values({
      organizationId: org.id,
      customerId: customer1.id,
      intent: 'RENT',
      propertyType: 'APARTMENT',
      minBedrooms: 2,
      preferredCities: JSON.stringify(['Bangalore']),
      preferredLocations: JSON.stringify(['Whitefield']),
      minBudget: 20000,
      maxBudget: 30000,
      furnishingStatus: 'SEMI_FURNISHED',
      moveInDate: '2026-09-01',
      isVerifiedManually: true,
    }).returning().all();

    const [lead1] = tx.insert(leads).values({
      organizationId: org.id,
      customerId: customer1.id,
      requirementId: req1.id,
      matchedPropertyId: prop1.id,
      assignedUserId: brokerUser.id,
      stage: 'QUALIFIED',
      priority: 'HIGH',
      score: 94,
    }).returning().all();

    return { org, adminUser, brokerUser, contact1, prop1, req1, lead1 };
  });

  console.log(`Database seeded successfully!
    Organization: ${result.org.name}
    Admin Email: ${result.adminUser.email}
    Broker Email: ${result.brokerUser.email}
    Password: Password123!`);
}

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
}

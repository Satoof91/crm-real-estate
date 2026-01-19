import { db } from "../db";

// Import from SQLite schema for local development
import {
  users,
  contacts,
  buildings,
  units,
  contracts,
  payments,
  type User,
  type InsertUser,
  type Contact,
  type InsertContact,
  type Building,
  type InsertBuilding,
  type Unit,
  type InsertUnit,
  type Contract,
  type InsertContract,
  type Payment,
  type InsertPayment,
} from "@shared/sqlite-schema";
import { eq, and, gte, lte, desc, asc, or, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(limit?: number, offset?: number): Promise<User[]>;
  getUsersCount(): Promise<number>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Contacts
  getContacts(userId: string, limit?: number, offset?: number): Promise<Contact[]>;
  getContactsCount(userId: string): Promise<number>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact & { userId: string }): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<void>;

  // Buildings
  getBuildings(userId: string): Promise<Building[]>;
  getBuilding(id: string): Promise<Building | undefined>;
  createBuilding(building: InsertBuilding & { userId: string }): Promise<Building>;
  updateBuilding(id: string, building: Partial<InsertBuilding>): Promise<Building | undefined>;
  deleteBuilding(id: string): Promise<void>;

  // Units
  getUnits(userId: string, buildingId?: string): Promise<Unit[]>;
  getUnit(id: string): Promise<Unit | undefined>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: string): Promise<void>;

  // Contracts
  getContracts(userId: string, limit?: number, offset?: number): Promise<Contract[]>;
  getContractsCount(userId: string): Promise<number>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<void>;

  // Payments
  getPayments(userId: string, contractId?: string, limit?: number, offset?: number): Promise<Payment[]>;
  getPaymentsCount(userId: string, contractId?: string): Promise<number>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<void>;
  getUpcomingPayments(userId: string, days: number): Promise<Payment[]>;
  getOverduePayments(userId: string): Promise<Payment[]>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUsers(limit?: number, offset?: number): Promise<User[]> {
    let query = db.select().from(users).orderBy(desc(users.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }
    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    return query;
  }

  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0].count;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Contacts
  async getContacts(userId: string, limit?: number, offset?: number): Promise<Contact[]> {
    let query = db.select().from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }
    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    return query;
  }

  async getContactsCount(userId: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(contacts)
      .where(eq(contacts.userId, userId));
    return result[0].count;
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id));
    return result[0];
  }

  async createContact(contact: InsertContact & { userId: string }): Promise<Contact> {
    const result = await db.insert(contacts).values(contact).returning();
    return result[0];
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Buildings
  async getBuildings(userId: string): Promise<Building[]> {
    return db.select().from(buildings)
      .where(eq(buildings.userId, userId))
      .orderBy(desc(buildings.createdAt));
  }

  async getBuilding(id: string): Promise<Building | undefined> {
    const result = await db.select().from(buildings).where(eq(buildings.id, id));
    return result[0];
  }

  async createBuilding(building: InsertBuilding & { userId: string }): Promise<Building> {
    const result = await db.insert(buildings).values(building).returning();
    return result[0];
  }

  async updateBuilding(id: string, building: Partial<InsertBuilding>): Promise<Building | undefined> {
    const result = await db.update(buildings).set(building).where(eq(buildings.id, id)).returning();
    return result[0];
  }

  async deleteBuilding(id: string): Promise<void> {
    await db.delete(buildings).where(eq(buildings.id, id));
  }

  // Units
  async getUnits(userId: string, buildingId?: string): Promise<Unit[]> {
    if (buildingId) {
      // Verify building belongs to user
      const building = await this.getBuilding(buildingId);
      if (!building || building.userId !== userId) {
        return [];
      }
      return db.select().from(units)
        .where(eq(units.buildingId, buildingId))
        .orderBy(asc(units.unitNumber));
    }

    // Join with buildings to filter by userId
    const result = await db.select({ unit: units })
      .from(units)
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(buildings.userId, userId))
      .orderBy(asc(units.unitNumber));

    return result.map(r => r.unit);
  }

  async getUnit(id: string): Promise<Unit | undefined> {
    const result = await db.select().from(units).where(eq(units.id, id));
    return result[0];
  }

  async createUnit(unit: InsertUnit): Promise<Unit> {
    const result = await db.insert(units).values(unit).returning();
    return result[0];
  }

  async updateUnit(id: string, unit: Partial<InsertUnit>): Promise<Unit | undefined> {
    const result = await db.update(units).set(unit).where(eq(units.id, id)).returning();
    return result[0];
  }

  async deleteUnit(id: string): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // Contracts
  async getContracts(userId: string, limit?: number, offset?: number): Promise<Contract[]> {
    let query = db.select({ contract: contracts })
      .from(contracts)
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(buildings.userId, userId))
      .orderBy(desc(contracts.createdAt));

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }
    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    const result = await query;
    return result.map(r => r.contract);
  }

  async getContractsCount(userId: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(contracts)
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(buildings.userId, userId));
    return result[0].count;
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const result = await db.select().from(contracts).where(eq(contracts.id, id));
    return result[0];
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const result = await db.insert(contracts).values(contract).returning();
    return result[0];
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const result = await db.update(contracts).set(contract).where(eq(contracts.id, id)).returning();
    return result[0];
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // Payments
  async getPayments(userId: string, contractId?: string, limit?: number, offset?: number): Promise<Payment[]> {
    let query = db.select({ payment: payments })
      .from(payments)
      .innerJoin(contracts, eq(payments.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(buildings.userId, userId));

    if (contractId) {
      query = query.where(eq(payments.contractId, contractId)) as any;
    }

    query = query.orderBy(asc(payments.dueDate)) as any;

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }
    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    const result = await query;
    return result.map(r => r.payment);
  }

  async getPaymentsCount(userId: string, contractId?: string): Promise<number> {
    let query = db.select({ count: count() })
      .from(payments)
      .innerJoin(contracts, eq(payments.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(eq(buildings.userId, userId));

    if (contractId) {
      query = query.where(eq(payments.contractId, contractId)) as any;
    }

    const result = await query;
    return result[0].count;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    return result[0];
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async getUpcomingPayments(userId: string, days: number): Promise<Payment[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    // Convert dates to ISO strings for SQLite TEXT comparison
    const nowISO = now.toISOString();
    const futureDateISO = futureDate.toISOString();

    const result = await db
      .select({ payment: payments })
      .from(payments)
      .innerJoin(contracts, eq(payments.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(
        and(
          eq(buildings.userId, userId),
          eq(payments.status, 'pending'),
          gte(payments.dueDate, nowISO),
          lte(payments.dueDate, futureDateISO)
        )
      )
      .orderBy(payments.dueDate);

    return result.map(r => r.payment);
  }

  async getOverduePayments(userId: string): Promise<Payment[]> {
    const now = new Date();
    // Convert date to ISO string for SQLite TEXT comparison
    const nowISO = now.toISOString();

    const result = await db
      .select({ payment: payments })
      .from(payments)
      .innerJoin(contracts, eq(payments.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(buildings, eq(units.buildingId, buildings.id))
      .where(
        and(
          eq(buildings.userId, userId),
          eq(payments.status, 'pending'),
          lte(payments.dueDate, nowISO)
        )
      )
      .orderBy(payments.dueDate);

    return result.map(r => r.payment);
  }
}

export const storage = new DbStorage();

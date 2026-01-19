import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { passport } from "./auth";
import { isAuthenticated, isManagerOrAdmin } from "./middleware";
import { storage } from "./storage";
import { upload } from "./upload";
import notificationRoutes from "./notification-routes";
import {
  insertUserSchema,
  insertContactSchema,
  insertBuildingSchema,
  insertUnitSchema,
  insertContractSchema,
  insertPaymentSchema,
  updateContactSchema,
  updateBuildingSchema,
  updateUnitSchema,
  updateContractSchema,
  updatePaymentSchema
} from "@shared/sqlite-schema";
import { addMonths, addDays } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register notification routes
  app.use(notificationRoutes);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: 'manager', // Default to manager so they can create buildings
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // File upload endpoint
  app.post("/api/upload/contract", isManagerOrAdmin, upload.single("document"), (req: Request, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the file path that can be used to access the file
      const fileUrl = `/uploads/contracts/${req.file.filename}`;

      res.status(201).json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contacts
  app.get("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const userId = (req.user as any).id;
      const contacts = await storage.getContacts(userId, limit, offset);
      const total = await storage.getContactsCount(userId);

      res.json({
        data: contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const userId = (req.user as any).id;
      const contact = await storage.createContact({ ...validatedData, userId });
      res.status(201).json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateContactSchema.parse(req.body);
      const contact = await storage.updateContact(req.params.id, validatedData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/contacts/:id", isManagerOrAdmin, async (req, res) => {
    try {
      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buildings
  app.get("/api/buildings", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const userId = (req.user as any).id;
      const buildings = await storage.getBuildings(userId);
      const total = buildings.length;

      res.json({
        data: buildings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/buildings/:id", isAuthenticated, async (req, res) => {
    try {
      const building = await storage.getBuilding(req.params.id);
      if (!building) {
        return res.status(404).json({ error: "Building not found" });
      }
      res.json(building);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/buildings", isManagerOrAdmin, async (req, res) => {
    try {
      const validatedData = insertBuildingSchema.parse(req.body);
      const userId = (req.user as any).id;
      const building = await storage.createBuilding({ ...validatedData, userId });
      res.status(201).json(building);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/buildings/:id", isManagerOrAdmin, async (req, res) => {
    try {
      const validatedData = updateBuildingSchema.parse(req.body);
      const building = await storage.updateBuilding(req.params.id, validatedData);
      if (!building) {
        return res.status(404).json({ error: "Building not found" });
      }
      res.json(building);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/buildings/:id", isManagerOrAdmin, async (req, res) => {
    try {
      await storage.deleteBuilding(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Units
  app.get("/api/units", isAuthenticated, async (req, res) => {
    try {
      // Update expired contracts before fetching units
      await updateExpiredContracts();

      const buildingId = req.query.buildingId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = (page - 1) * limit;

      const userId = (req.user as any).id;
      const units = await storage.getUnits(userId, buildingId);
      const total = units.length;

      res.json({
        data: units,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unit = await storage.getUnit(req.params.id);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/units", isManagerOrAdmin, async (req, res) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/units/:id", isManagerOrAdmin, async (req, res) => {
    try {
      const validatedData = updateUnitSchema.parse(req.body);
      const unit = await storage.updateUnit(req.params.id, validatedData);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/units/:id", isManagerOrAdmin, async (req, res) => {
    try {
      await storage.deleteUnit(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contracts
  app.get("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      // Update expired contracts before fetching
      await updateExpiredContracts();

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const userId = (req.user as any).id;
      const contracts = await storage.getContracts(userId, limit, offset);
      const total = await storage.getContractsCount(userId);

      // Fix dates for SQLite compatibility
      const fixedContracts = contracts.map(fixContractDates);

      res.json({
        data: fixedContracts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(fixContractDates(contract));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contracts", isManagerOrAdmin, async (req, res) => {
    try {
      console.log('Raw request body:', req.body);

      let validatedData: any;
      try {
        validatedData = insertContractSchema.parse(req.body);
      } catch (parseError: any) {
        console.error('Schema validation error:', parseError);
        console.error('Validation error details:', parseError.errors || parseError.message);
        return res.status(400).json({ error: `Schema validation failed: ${parseError.message}` });
      }

      // Debug logging
      console.log('Contract data after validation:', {
        startDate: validatedData.startDate,
        startDateType: typeof validatedData.startDate,
        startDateIsDate: validatedData.startDate instanceof Date,
        endDate: validatedData.endDate,
        endDateType: typeof validatedData.endDate,
        endDateIsDate: validatedData.endDate instanceof Date,
        rentAmount: validatedData.rentAmount,
        rentAmountType: typeof validatedData.rentAmount,
      });

      // The SQLite schema has already transformed dates to ISO strings and amounts to strings
      // No additional transformation needed
      const contractData = validatedData;

      console.log('Creating contract with data:', contractData);

      // Check if unit already has an active contract
      const userId = (req.user as any).id;
      const allContracts = await storage.getContracts(userId);
      const now = new Date();
      const activeContract = allContracts.find(c =>
        c.unitId === validatedData.unitId &&
        new Date(c.endDate) >= now
      );

      if (activeContract) {
        return res.status(400).json({
          error: "This unit already has an active contract that expires on " +
            new Date(activeContract.endDate).toLocaleDateString()
        });
      }

      // Create the contract
      const contract = await storage.createContract(contractData);

      console.log('Contract created:', contract);

      // Fix dates in the returned contract for consistent format
      const fixedContract = fixContractDates(contract);

      // Update unit status to occupied
      await storage.updateUnit(fixedContract.unitId, { status: 'occupied' });

      console.log('Unit status updated');

      // Generate payment schedule
      console.log('Generating payment schedule for contract:', fixedContract);

      try {
        const payments = generatePaymentSchedule(fixedContract);
        console.log(`Generated ${payments.length} payments:`, JSON.stringify(payments, null, 2));

        if (payments.length === 0) {
          console.warn('WARNING: No payments were generated for this contract!');
          console.warn('Contract details:', {
            id: fixedContract.id,
            startDate: fixedContract.startDate,
            endDate: fixedContract.endDate,
            paymentFrequency: fixedContract.paymentFrequency,
            rentAmount: fixedContract.rentAmount
          });
        }

        for (let i = 0; i < payments.length; i++) {
          const payment = payments[i];
          console.log(`Creating payment ${i + 1}/${payments.length}:`, payment);
          try {
            const createdPayment = await storage.createPayment(payment);
            console.log(`Payment ${i + 1} created successfully:`, createdPayment.id);
          } catch (paymentError: any) {
            console.error(`Error creating payment ${i + 1}:`, paymentError);
            throw new Error(`Failed to create payment ${i + 1}: ${paymentError.message}`);
          }
        }

        console.log('All payments created successfully');
      } catch (scheduleError: any) {
        console.error('Error in payment schedule generation:', scheduleError);
        console.error('Schedule error stack:', scheduleError.stack);
        // Don't fail the contract creation, but log the error
        console.error('Contract was created but payments failed. Manual payment creation may be needed.');
      }

      res.status(201).json(fixedContract);
    } catch (error: any) {
      console.error('Contract creation error:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/contracts/:id", isManagerOrAdmin, async (req, res) => {
    try {
      console.log('Raw update request body:', req.body);

      // Parse and validate the data - the schema already handles date and amount transformations
      const validatedData = updateContractSchema.parse(req.body);

      console.log('Validated data:', validatedData);

      // The schema has already transformed dates to ISO strings and amounts to strings for SQLite
      // No additional transformation needed
      const contract = await storage.updateContract(req.params.id, validatedData);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(fixContractDates(contract));
    } catch (error: any) {
      console.error('Contract update error:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/contracts/:id", isManagerOrAdmin, async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (contract) {
        // Update unit status back to vacant
        await storage.updateUnit(contract.unitId, { status: 'vacant' });
      }
      await storage.deleteContract(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Payments
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = (page - 1) * limit;
      const contractId = req.query.contractId as string | undefined;

      const userId = (req.user as any).id;
      const payments = await storage.getPayments(userId, contractId, limit, offset);
      const total = await storage.getPaymentsCount(userId, contractId);

      // Fix dates for SQLite compatibility
      const fixedPayments = payments.map(fixPaymentDates);

      res.json({
        data: fixedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.getPayment(req.params.id);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payments", isManagerOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updatePaymentSchema.parse(req.body);
      const payment = await storage.updatePayment(req.params.id, validatedData);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/payments/:id", isManagerOrAdmin, async (req, res) => {
    try {
      await storage.deletePayment(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      // Update expired contracts before calculating metrics
      await updateExpiredContracts();

      const userId = (req.user as any).id;
      const [allUnits, allPayments, allContracts] = await Promise.all([
        storage.getUnits(userId),
        storage.getPayments(userId),
        storage.getContracts(userId),
      ]);

      const totalUnits = allUnits.length;
      const occupiedUnits = allUnits.filter(u => u.status === 'occupied').length;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const pendingPayments = allPayments.filter(p => p.status === 'pending').length;

      // Contracts expiring in next 30 days
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const expiringContracts = allContracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate >= now && endDate <= in30Days;
      }).length;

      res.json({
        totalUnits,
        occupancyRate,
        pendingPayments,
        expiringContracts,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notifications endpoint
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications: any[] = [];

      // Payment reminders (7 days before due)
      const userId = (req.user as any).id;
      const upcomingPayments = await storage.getUpcomingPayments(userId, 7);
      for (const payment of upcomingPayments) {
        const contract = await storage.getContract(payment.contractId);
        if (contract) {
          const unit = await storage.getUnit(contract.unitId);
          const contact = await storage.getContact(contract.contactId);
          if (unit && contact) {
            const daysUntilDue = Math.ceil(
              (new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            notifications.push({
              id: `payment-reminder-${payment.id}`,
              type: 'payment',
              message: `Payment reminder for ${unit.unitNumber} (${contact.fullName}) is due in ${daysUntilDue} days`,
              time: 'upcoming',
              data: { paymentId: payment.id, unitNumber: unit.unitNumber, tenantName: contact.fullName },
            });
          }
        }
      }

      // Contract expirations (30 days before end)
      const allContracts = await storage.getContracts(userId);
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      for (const contract of allContracts) {
        const endDate = new Date(contract.endDate);
        if (endDate >= now && endDate <= in30Days) {
          const unit = await storage.getUnit(contract.unitId);
          const contact = await storage.getContact(contract.contactId);
          if (unit && contact) {
            const daysUntilExpiry = Math.ceil(
              (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            notifications.push({
              id: `contract-expiry-${contract.id}`,
              type: 'contract',
              message: `Contract for ${unit.unitNumber} (${contact.fullName}) expires in ${daysUntilExpiry} days`,
              time: 'upcoming',
              data: { contractId: contract.id, unitNumber: unit.unitNumber, tenantName: contact.fullName },
            });
          }
        }
      }

      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = req.user as any;
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const users = await storage.getUsers(limit, offset);
      const total = await storage.getUsersCount();

      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);

      res.json({
        data: usersWithoutPasswords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = req.user as any;
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const { role } = req.body;
      if (!role || !['user', 'manager', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = req.user as any;
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      // Prevent deleting yourself
      if (currentUser.id === req.params.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate payment schedule
function generatePaymentSchedule(contract: any) {
  console.log('=== generatePaymentSchedule called ===');
  console.log('Contract input:', {
    id: contract.id,
    startDate: contract.startDate,
    endDate: contract.endDate,
    rentAmount: contract.rentAmount,
    paymentFrequency: contract.paymentFrequency
  });

  const payments = [];
  const startDate = new Date(contract.startDate);
  const endDate = new Date(contract.endDate);
  const rentAmount = contract.rentAmount;

  console.log('Parsed dates:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateValid: !isNaN(startDate.getTime()),
    endDateValid: !isNaN(endDate.getTime())
  });

  let currentDate = new Date(startDate);

  // Determine payment interval based on frequency
  const getNextDate = (date: Date, frequency: string) => {
    console.log(`Getting next date from ${date.toISOString()} with frequency: ${frequency}`);
    switch (frequency.toLowerCase()) {
      case 'monthly':
        return addMonths(date, 1);
      case 'quarterly':
        return addMonths(date, 3);
      case 'semi-annually':
        return addMonths(date, 6);
      case 'yearly':
        return addMonths(date, 12);
      case 'weekly':
        return addDays(date, 7);
      default:
        console.warn(`Unknown frequency "${frequency}", defaulting to monthly`);
        return addMonths(date, 1); // Default to monthly
    }
  };

  // First pass: count how many payments will be generated
  let tempDate = new Date(startDate);
  let paymentCount = 0;
  const maxCountIterations = 1000;

  while (tempDate <= endDate && paymentCount < maxCountIterations) {
    paymentCount++;
    tempDate = getNextDate(tempDate, contract.paymentFrequency);
  }

  console.log(`Total payments to generate: ${paymentCount}`);

  // rentAmount is the ANNUAL rent. Divide by payments per year to get per-payment amount
  const annualRent = parseFloat(rentAmount);

  // Calculate payments per year based on frequency
  const getPaymentsPerYear = (frequency: string): number => {
    switch (frequency.toLowerCase()) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'semi-annually': return 2;
      case 'yearly': return 1;
      case 'weekly': return 52;
      default: return 12; // Default to monthly
    }
  };

  const paymentsPerYear = getPaymentsPerYear(contract.paymentFrequency);
  const amountPerPayment = (annualRent / paymentsPerYear).toFixed(2);

  console.log(`Annual rent: ${annualRent}, Payments/year: ${paymentsPerYear}, Amount per payment: ${amountPerPayment}`);

  let iterationCount = 0;
  const maxIterations = 1000; // Safety limit

  while (currentDate <= endDate && iterationCount < maxIterations) {
    iterationCount++;
    console.log(`Iteration ${iterationCount}: currentDate=${currentDate.toISOString()}, endDate=${endDate.toISOString()}`);

    payments.push({
      contractId: contract.id,
      // Convert to ISO string for SQLite TEXT storage
      dueDate: currentDate.toISOString(),
      amount: amountPerPayment, // Use the divided amount, not the total
      status: 'pending',
    });

    console.log(`Payment ${iterationCount} added for ${currentDate.toISOString()} with amount ${amountPerPayment}`);

    currentDate = getNextDate(currentDate, contract.paymentFrequency);
  }

  if (iterationCount >= maxIterations) {
    console.error('WARNING: Hit maximum iteration limit in payment generation!');
  }

  console.log(`=== Payment generation complete: ${payments.length} payments created ===`);
  return payments;
}

// Helper function to fix date fields from SQLite (stored as TEXT)
function fixContractDates(contract: any) {
  if (!contract) return contract;

  return {
    ...contract,
    startDate: contract.startDate ? new Date(contract.startDate) : null,
    endDate: contract.endDate ? new Date(contract.endDate) : null,
    createdAt: contract.createdAt ? new Date(contract.createdAt) : null,
  };
}

// Helper function to fix payment dates
function fixPaymentDates(payment: any) {
  if (!payment) return payment;

  return {
    ...payment,
    dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
    paidDate: payment.paidDate ? new Date(payment.paidDate) : null,
    createdAt: payment.createdAt ? new Date(payment.createdAt) : null,
  };
}

// Helper function to update units for expired contracts
async function updateExpiredContracts() {
  try {
    // TODO: Refactor this to be a system-wide background job
    // Currently disabled because getContracts requires userId
  } catch (error) {
    console.error('Error updating expired contracts:', error);
  }
}

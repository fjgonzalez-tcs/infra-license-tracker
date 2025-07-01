import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertServiceCategorySchema,
  insertProviderSchema,
  insertServiceSchema,
  insertInfraInvoiceSchema,
  insertLicensePlanSchema,
  insertUsageTopupSchema,
  insertUsageConsumptionSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard summary endpoint
  app.get('/api/summary', isAuthenticated, async (req, res) => {
    try {
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
      const monthlySpend = await storage.getMonthlySpend(Number(year), Number(month));
      
      const currentMonthTotal = monthlySpend.reduce((sum, category) => sum + Number(category.totalAmount), 0);
      const licensePlans = await storage.getLicensePlans();
      const activeLicenses = licensePlans.length;
      const lowBalanceAlerts = await storage.getLowBalanceAlerts(20);
      
      // Get expiring licenses (within next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringLicenses = await storage.getLicenseCommitments(thirtyDaysFromNow.toISOString().split('T')[0]);

      res.json({
        currentMonthTotal,
        activeLicenses,
        lowBalanceAlerts: lowBalanceAlerts.length,
        expiringLicenses: expiringLicenses.length,
        monthlySpend,
        recentInvoices: (await storage.getInfraInvoices()).slice(0, 5),
        alerts: {
          lowBalance: lowBalanceAlerts,
          expiring: expiringLicenses,
        }
      });
    } catch (error) {
      console.error("Error fetching summary:", error);
      res.status(500).json({ message: "Failed to fetch summary" });
    }
  });

  // Service category routes
  app.get('/api/service-categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  app.post('/api/service-categories', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating service category:", error);
        res.status(500).json({ message: "Failed to create service category" });
      }
    }
  });

  // Provider routes
  app.get('/api/providers', isAuthenticated, async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.post('/api/providers', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProviderSchema.parse(req.body);
      const provider = await storage.createProvider(validatedData);
      res.status(201).json(provider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating provider:", error);
        res.status(500).json({ message: "Failed to create provider" });
      }
    }
  });

  // Service routes
  app.get('/api/services', isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating service:", error);
        res.status(500).json({ message: "Failed to create service" });
      }
    }
  });

  app.put('/api/services/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, validatedData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error updating service:", error);
        res.status(500).json({ message: "Failed to update service" });
      }
    }
  });

  app.delete('/api/services/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Infrastructure invoice routes
  app.get('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const invoices = await storage.getInfraInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertInfraInvoiceSchema.parse(req.body);
      const invoice = await storage.createInfraInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  });

  // License plan routes
  app.get('/api/licenses', isAuthenticated, async (req, res) => {
    try {
      const licenses = await storage.getLicensePlans();
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  app.post('/api/licenses', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLicensePlanSchema.parse(req.body);
      const license = await storage.createLicensePlan(validatedData);
      res.status(201).json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating license:", error);
        res.status(500).json({ message: "Failed to create license" });
      }
    }
  });

  // Usage routes
  app.get('/api/usage/topups', isAuthenticated, async (req, res) => {
    try {
      const topups = await storage.getUsageTopups();
      res.json(topups);
    } catch (error) {
      console.error("Error fetching topups:", error);
      res.status(500).json({ message: "Failed to fetch topups" });
    }
  });

  app.post('/api/usage/topups', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertUsageTopupSchema.parse(req.body);
      const topup = await storage.createUsageTopup(validatedData);
      res.status(201).json(topup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating topup:", error);
        res.status(500).json({ message: "Failed to create topup" });
      }
    }
  });

  app.get('/api/usage/consumption', isAuthenticated, async (req, res) => {
    try {
      const consumption = await storage.getUsageConsumption();
      res.json(consumption);
    } catch (error) {
      console.error("Error fetching consumption:", error);
      res.status(500).json({ message: "Failed to fetch consumption" });
    }
  });

  app.post('/api/usage/consumption', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertUsageConsumptionSchema.parse(req.body);
      const consumption = await storage.createUsageConsumption(validatedData);
      res.status(201).json(consumption);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating consumption:", error);
        res.status(500).json({ message: "Failed to create consumption" });
      }
    }
  });

  app.get('/api/usage/balance/:serviceId', isAuthenticated, async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const balance = await storage.getUsageBalance(serviceId);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching usage balance:", error);
      res.status(500).json({ message: "Failed to fetch usage balance" });
    }
  });

  // Alert routes
  app.get('/api/alerts/commitments', isAuthenticated, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Number(days));
      const commitments = await storage.getLicenseCommitments(targetDate.toISOString().split('T')[0]);
      res.json(commitments);
    } catch (error) {
      console.error("Error fetching commitment alerts:", error);
      res.status(500).json({ message: "Failed to fetch commitment alerts" });
    }
  });

  app.get('/api/alerts/low-balance', isAuthenticated, async (req, res) => {
    try {
      const { threshold = 20 } = req.query;
      const alerts = await storage.getLowBalanceAlerts(Number(threshold));
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching low balance alerts:", error);
      res.status(500).json({ message: "Failed to fetch low balance alerts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

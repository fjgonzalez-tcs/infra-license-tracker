import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Authentication removed for intranet deployment
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
  // Dashboard summary endpoint
  app.get('/api/summary', async (req, res) => {
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

  // Monthly details endpoint for dashboard table
  app.get('/api/monthly-details/:year/:month', async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      const monthlyDetails = await storage.getMonthlyDetails(year, month);
      res.json(monthlyDetails);
    } catch (error) {
      console.error("Error fetching monthly details:", error);
      res.status(500).json({ message: "Failed to fetch monthly details" });
    }
  });

  // Service category routes
  app.get('/api/service-categories', async (req, res) => {
    try {
      const categories = await storage.getServiceCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  app.post('/api/service-categories', async (req, res) => {
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
  app.get('/api/providers', async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  app.post('/api/providers', async (req, res) => {
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
  app.get('/api/services', async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', async (req, res) => {
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

  app.put('/api/services/:id', async (req, res) => {
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

  app.delete('/api/services/:id', async (req, res) => {
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
  app.get('/api/invoices', async (req, res) => {
    try {
      const invoices = await storage.getInfraInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/invoices', async (req, res) => {
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
  app.get('/api/licenses', async (req, res) => {
    try {
      const licenses = await storage.getLicensePlans();
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  app.post('/api/licenses', async (req, res) => {
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
  app.get('/api/usage/topups', async (req, res) => {
    try {
      const topups = await storage.getUsageTopups();
      res.json(topups);
    } catch (error) {
      console.error("Error fetching topups:", error);
      res.status(500).json({ message: "Failed to fetch topups" });
    }
  });

  app.post('/api/usage/topups', async (req, res) => {
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

  app.post('/api/usage/topups/bulk', async (req, res) => {
    try {
      const { records } = req.body;
      
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "Invalid records array" });
      }

      // Validate each record
      const validatedRecords = records.map(record => {
        return insertUsageTopupSchema.parse(record);
      });

      // Create all topups
      const results = [];
      for (const recordData of validatedRecords) {
        const topup = await storage.createUsageTopup(recordData);
        results.push(topup);
      }

      res.status(201).json({ 
        message: `Successfully imported ${results.length} records`, 
        records: results 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error creating bulk topups:", error);
        res.status(500).json({ message: "Failed to create bulk topups" });
      }
    }
  });

  app.get('/api/usage/consumption', async (req, res) => {
    try {
      const consumption = await storage.getUsageConsumption();
      res.json(consumption);
    } catch (error) {
      console.error("Error fetching consumption:", error);
      res.status(500).json({ message: "Failed to fetch consumption" });
    }
  });

  app.post('/api/usage/consumption', async (req, res) => {
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

  app.get('/api/usage/balance/:serviceId', async (req, res) => {
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
  app.get('/api/alerts/commitments', async (req, res) => {
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

  app.get('/api/alerts/low-balance', async (req, res) => {
    try {
      const { threshold = 20 } = req.query;
      const alerts = await storage.getLowBalanceAlerts(Number(threshold));
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching low balance alerts:", error);
      res.status(500).json({ message: "Failed to fetch low balance alerts" });
    }
  });

  // Cost forecast endpoint
  app.get('/api/cost-forecast', async (req, res) => {
    try {
      const forecast = await storage.getCostForecast();
      res.json(forecast);
    } catch (error) {
      console.error("Error generating cost forecast:", error);
      res.status(500).json({ message: "Failed to generate cost forecast" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

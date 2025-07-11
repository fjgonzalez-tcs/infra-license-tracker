import {
  users,
  serviceCategory,
  provider,
  service,
  infraInvoice,
  licensePlan,
  usageTopup,
  usageConsumption,
  type User,
  type UpsertUser,
  type ServiceCategory,
  type InsertServiceCategory,
  type Provider,
  type InsertProvider,
  type Service,
  type InsertService,
  type InfraInvoice,
  type InsertInfraInvoice,
  type LicensePlan,
  type InsertLicensePlan,
  type UsageTopup,
  type InsertUsageTopup,
  type UsageConsumption,
  type InsertUsageConsumption,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, gte, lte, lt } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Service category operations
  getServiceCategories(): Promise<ServiceCategory[]>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;

  // Provider operations
  getProviders(): Promise<Provider[]>;
  createProvider(provider: InsertProvider): Promise<Provider>;

  // Service operations
  getServices(): Promise<any[]>;
  getServiceById(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;

  // Infrastructure invoice operations
  getInfraInvoices(): Promise<any[]>;
  createInfraInvoice(invoice: InsertInfraInvoice): Promise<InfraInvoice>;
  getMonthlySpend(year: number, month: number): Promise<any[]>;
  getMonthlyDetails(year: number, month: number): Promise<any[]>;

  // License plan operations
  getLicensePlans(): Promise<any[]>;
  createLicensePlan(plan: InsertLicensePlan): Promise<LicensePlan>;
  getLicenseCommitments(expiringBefore: string): Promise<any[]>;

  // Usage operations
  getUsageTopups(): Promise<any[]>;
  createUsageTopup(topup: InsertUsageTopup): Promise<UsageTopup>;
  getUsageConsumption(): Promise<any[]>;
  createUsageConsumption(consumption: InsertUsageConsumption): Promise<UsageConsumption>;
  getUsageBalance(serviceId: number): Promise<{ balance: number; totalPurchased: number; totalConsumed: number }>;
  getLowBalanceAlerts(thresholdPercent: number): Promise<any[]>;

  // Analytics operations
  getCostForecast(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Service category operations
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategory).orderBy(asc(serviceCategory.name));
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [newCategory] = await db.insert(serviceCategory).values(category).returning();
    return newCategory;
  }

  // Provider operations
  async getProviders(): Promise<Provider[]> {
    return await db.select().from(provider).orderBy(asc(provider.name));
  }

  async createProvider(providerData: InsertProvider): Promise<Provider> {
    const [newProvider] = await db.insert(provider).values(providerData).returning();
    return newProvider;
  }

  // Service operations
  async getServices(): Promise<any[]> {
    return await db
      .select({
        id: service.id,
        name: service.name,
        description: service.description,
        active: service.active,
        provider: {
          id: provider.id,
          name: provider.name,
        },
        category: {
          id: serviceCategory.id,
          name: serviceCategory.name,
        },
      })
      .from(service)
      .leftJoin(provider, eq(service.providerId, provider.id))
      .leftJoin(serviceCategory, eq(service.categoryId, serviceCategory.id))
      .orderBy(asc(service.name));
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    const [serviceData] = await db.select().from(service).where(eq(service.id, id));
    return serviceData;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [newService] = await db.insert(service).values(serviceData).returning();
    return newService;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(service)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(service.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.update(service).set({ active: false, updatedAt: new Date() }).where(eq(service.id, id));
  }

  // Infrastructure invoice operations
  async getInfraInvoices(): Promise<any[]> {
    return await db
      .select({
        id: infraInvoice.id,
        invoiceMonth: infraInvoice.invoiceMonth,
        amount: infraInvoice.amount,
        currency: infraInvoice.currency,
        service: {
          id: service.id,
          name: service.name,
        },
        provider: {
          id: provider.id,
          name: provider.name,
        },
      })
      .from(infraInvoice)
      .leftJoin(service, eq(infraInvoice.serviceId, service.id))
      .leftJoin(provider, eq(service.providerId, provider.id))
      .orderBy(desc(infraInvoice.invoiceMonth));
  }

  async createInfraInvoice(invoiceData: InsertInfraInvoice): Promise<InfraInvoice> {
    const [newInvoice] = await db.insert(infraInvoice).values(invoiceData).returning();
    return newInvoice;
  }

  async getMonthlySpend(year: number, month: number): Promise<any[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    return await db
      .select({
        categoryName: serviceCategory.name,
        totalAmount: sql<number>`COALESCE(SUM(CAST(${infraInvoice.amount} AS DECIMAL)), 0)`,
      })
      .from(serviceCategory)
      .leftJoin(service, eq(serviceCategory.id, service.categoryId))
      .leftJoin(
        infraInvoice,
        and(
          eq(service.id, infraInvoice.serviceId),
          gte(infraInvoice.invoiceMonth, startDate),
          lte(infraInvoice.invoiceMonth, endDate)
        )
      )
      .groupBy(serviceCategory.id, serviceCategory.name)
      .orderBy(asc(serviceCategory.name));
  }

  async getMonthlyDetails(year: number, month: number): Promise<any[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    // Get infrastructure costs
    const infraCosts = await db
      .select({
        serviceName: service.name,
        providerName: provider.name,
        category: serviceCategory.name,
        monthlyAmount: infraInvoice.amount,
        type: sql<string>`'infrastructure'`,
      })
      .from(infraInvoice)
      .innerJoin(service, eq(infraInvoice.serviceId, service.id))
      .innerJoin(provider, eq(service.providerId, provider.id))
      .innerJoin(serviceCategory, eq(service.categoryId, serviceCategory.id))
      .where(
        and(
          gte(infraInvoice.invoiceMonth, startDate),
          lt(infraInvoice.invoiceMonth, endDate)
        )
      );

    // Get license costs for active plans
    const licenseCosts = await db
      .select({
        serviceName: service.name,
        providerName: provider.name,
        category: serviceCategory.name,
        monthlyAmount: sql<number>`${licensePlan.monthlyUnitCost} * ${licensePlan.qty}`,
        type: sql<string>`'license'`,
      })
      .from(licensePlan)
      .innerJoin(service, eq(licensePlan.serviceId, service.id))
      .innerJoin(provider, eq(service.providerId, provider.id))
      .innerJoin(serviceCategory, eq(service.categoryId, serviceCategory.id))
      .where(
        and(
          lte(licensePlan.startMonth, endDate),
          gte(licensePlan.endMonth, startDate)
        )
      );

    // Combine all costs
    const allCosts = [...infraCosts, ...licenseCosts];
    
    // Sort by amount descending
    return allCosts.sort((a, b) => Number(b.monthlyAmount) - Number(a.monthlyAmount));
  }

  // License plan operations
  async getLicensePlans(): Promise<any[]> {
    return await db
      .select({
        id: licensePlan.id,
        monthlyUnitCost: licensePlan.monthlyUnitCost,
        qty: licensePlan.qty,
        startMonth: licensePlan.startMonth,
        endMonth: licensePlan.endMonth,
        annualCommitmentEnd: licensePlan.annualCommitmentEnd,
        service: {
          id: service.id,
          name: service.name,
        },
        provider: {
          id: provider.id,
          name: provider.name,
        },
      })
      .from(licensePlan)
      .leftJoin(service, eq(licensePlan.serviceId, service.id))
      .leftJoin(provider, eq(service.providerId, provider.id))
      .orderBy(asc(service.name));
  }

  async createLicensePlan(planData: InsertLicensePlan): Promise<LicensePlan> {
    const [newPlan] = await db.insert(licensePlan).values(planData).returning();
    return newPlan;
  }

  async getLicenseCommitments(expiringBefore: string): Promise<any[]> {
    return await db
      .select({
        id: licensePlan.id,
        annualCommitmentEnd: licensePlan.annualCommitmentEnd,
        service: {
          id: service.id,
          name: service.name,
        },
        provider: {
          id: provider.id,
          name: provider.name,
        },
      })
      .from(licensePlan)
      .leftJoin(service, eq(licensePlan.serviceId, service.id))
      .leftJoin(provider, eq(service.providerId, provider.id))
      .where(
        and(
          lte(licensePlan.annualCommitmentEnd, expiringBefore),
          gte(licensePlan.annualCommitmentEnd, new Date().toISOString().split('T')[0])
        )
      )
      .orderBy(asc(licensePlan.annualCommitmentEnd));
  }

  // Usage operations
  async getUsageTopups(): Promise<any[]> {
    return await db
      .select({
        id: usageTopup.id,
        topupDate: usageTopup.topupDate,
        amountPurchased: usageTopup.amountPurchased,
        currency: usageTopup.currency,
        service: {
          id: service.id,
          name: service.name,
        },
        provider: {
          id: provider.id,
          name: provider.name,
        },
      })
      .from(usageTopup)
      .leftJoin(service, eq(usageTopup.serviceId, service.id))
      .leftJoin(provider, eq(service.providerId, provider.id))
      .orderBy(desc(usageTopup.topupDate));
  }

  async createUsageTopup(topupData: InsertUsageTopup): Promise<UsageTopup> {
    const [newTopup] = await db.insert(usageTopup).values(topupData).returning();
    return newTopup;
  }

  async getUsageConsumption(): Promise<any[]> {
    return await db
      .select({
        id: usageConsumption.id,
        consumptionDate: usageConsumption.consumptionDate,
        amountConsumed: usageConsumption.amountConsumed,
        service: {
          id: service.id,
          name: service.name,
        },
        provider: {
          id: provider.id,
          name: provider.name,
        },
      })
      .from(usageConsumption)
      .leftJoin(service, eq(usageConsumption.serviceId, service.id))
      .leftJoin(provider, eq(service.providerId, provider.id))
      .orderBy(desc(usageConsumption.consumptionDate));
  }

  async createUsageConsumption(consumptionData: InsertUsageConsumption): Promise<UsageConsumption> {
    const [newConsumption] = await db.insert(usageConsumption).values(consumptionData).returning();
    return newConsumption;
  }

  async getUsageBalance(serviceId: number): Promise<{ balance: number; totalPurchased: number; totalConsumed: number }> {
    const [topupResult] = await db
      .select({
        totalPurchased: sql<number>`COALESCE(SUM(CAST(${usageTopup.amountPurchased} AS DECIMAL)), 0)`,
      })
      .from(usageTopup)
      .where(eq(usageTopup.serviceId, serviceId));

    const [consumptionResult] = await db
      .select({
        totalConsumed: sql<number>`COALESCE(SUM(CAST(${usageConsumption.amountConsumed} AS DECIMAL)), 0)`,
      })
      .from(usageConsumption)
      .where(eq(usageConsumption.serviceId, serviceId));

    const totalPurchased = topupResult?.totalPurchased || 0;
    const totalConsumed = consumptionResult?.totalConsumed || 0;
    const balance = totalPurchased - totalConsumed;

    return { balance, totalPurchased, totalConsumed };
  }

  async getLowBalanceAlerts(thresholdPercent: number): Promise<any[]> {
    const usageServices = await db
      .select({
        serviceId: service.id,
        serviceName: service.name,
        providerName: provider.name,
      })
      .from(service)
      .leftJoin(provider, eq(service.providerId, provider.id))
      .leftJoin(serviceCategory, eq(service.categoryId, serviceCategory.id))
      .where(eq(serviceCategory.name, 'Usage'));

    const alerts = [];
    for (const svc of usageServices) {
      const { balance, totalPurchased } = await this.getUsageBalance(svc.serviceId);
      if (totalPurchased > 0) {
        const percentRemaining = (balance / totalPurchased) * 100;
        if (percentRemaining < thresholdPercent) {
          alerts.push({
            serviceId: svc.serviceId,
            serviceName: svc.serviceName,
            providerName: svc.providerName,
            balance,
            totalPurchased,
            percentRemaining,
          });
        }
      }
    }

    return alerts;
  }

  async getCostForecast(): Promise<any> {
    // Get 12 months of historical data for trend analysis
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const historicalData = await db
      .select({
        month: sql<string>`TO_CHAR(${infraInvoice.invoiceMonth}, 'YYYY-MM')`,
        totalAmount: sql<number>`SUM(${infraInvoice.amount})`,
      })
      .from(infraInvoice)
      .where(gte(infraInvoice.invoiceMonth, oneYearAgo.toISOString().split('T')[0]))
      .groupBy(sql`TO_CHAR(${infraInvoice.invoiceMonth}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${infraInvoice.invoiceMonth}, 'YYYY-MM')`);

    // If no historical data, return a basic forecast
    if (historicalData.length === 0) {
      return {
        nextMonthProjection: 0,
        quarterProjection: 0,
        yearProjection: 0,
        trend: 'stable',
        trendPercentage: 0,
        forecasts: [],
        budgetAlert: null,
      };
    }

    // Calculate trend - simple linear regression
    const amounts = historicalData.map(d => d.totalAmount);
    const n = amounts.length;
    
    if (n < 2) {
      const lastAmount = amounts[0] || 0;
      return {
        nextMonthProjection: lastAmount,
        quarterProjection: lastAmount * 3,
        yearProjection: lastAmount * 12,
        trend: 'stable',
        trendPercentage: 0,
        forecasts: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toLocaleString('default', { month: 'long', year: 'numeric' }),
          projected: lastAmount,
          confidence: 'low' as const,
        })),
        budgetAlert: null,
      };
    }

    // Simple linear trend calculation
    const sumX = amounts.map((_, i) => i).reduce((a, b) => a + b, 0);
    const sumY = amounts.reduce((a, b) => a + b, 0);
    const sumXY = amounts.map((y, i) => i * y).reduce((a, b) => a + b, 0);
    const sumXX = amounts.map((_, i) => i * i).reduce((a, b) => a + b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate trend percentage
    const firstAmount = amounts[0];
    const lastAmount = amounts[amounts.length - 1];
    const trendPercentage = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0;
    
    // Determine trend direction
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(trendPercentage) > 5) {
      trend = trendPercentage > 0 ? 'increasing' : 'decreasing';
    }

    // Project future months using linear trend
    const forecasts = Array.from({ length: 6 }, (_, i) => {
      const futureIndex = n + i;
      const projected = Math.max(0, intercept + slope * futureIndex);
      const confidence = i < 2 ? 'high' : i < 4 ? 'medium' : 'low';
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i + 1);
      
      return {
        month: futureDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        projected: Math.round(projected),
        confidence,
      };
    });

    const nextMonthProjection = forecasts[0]?.projected || 0;
    const quarterProjection = forecasts.slice(0, 3).reduce((sum, f) => sum + f.projected, 0);
    const yearProjection = forecasts.reduce((sum, f) => sum + f.projected, 0) * 2; // Extend to full year

    // Generate budget alert if costs are increasing rapidly
    let budgetAlert = null;
    if (trend === 'increasing' && trendPercentage > 20) {
      budgetAlert = {
        message: `Costs trending up ${Math.round(trendPercentage)}% - consider reviewing high-impact services`,
        severity: trendPercentage > 50 ? 'critical' : 'warning',
      };
    }

    return {
      nextMonthProjection,
      quarterProjection,
      yearProjection,
      trend,
      trendPercentage: Math.round(Math.abs(trendPercentage)),
      forecasts,
      budgetAlert,
    };
  }
}

export const storage = new DatabaseStorage();

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  bigint,
  decimal,
  date,
  integer,
  boolean,
  char,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service category table - scsc (sis_costs_service_category)
export const serviceCategory = pgTable("sis_costs_service_category", {
  id: bigint("scsc_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("scsc_name", { length: 64 }).unique().notNull(),
  description: text("scsc_description"),
  createdAt: timestamp("scsc_created_at").defaultNow(),
  updatedAt: timestamp("scsc_updated_at").defaultNow(),
});

// Provider table - scp (sis_costs_provider)
export const provider = pgTable("sis_costs_provider", {
  id: bigint("scp_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("scp_name", { length: 128 }).unique().notNull(),
  website: varchar("scp_website", { length: 255 }),
  createdAt: timestamp("scp_created_at").defaultNow(),
  updatedAt: timestamp("scp_updated_at").defaultNow(),
});

// Service table - scs (sis_costs_service)
export const service = pgTable("sis_costs_service", {
  id: bigint("scs_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  providerId: bigint("scs_provider_id", { mode: "number" }).notNull(),
  categoryId: bigint("scs_category_id", { mode: "number" }).notNull(),
  name: varchar("scs_name", { length: 128 }).notNull(),
  description: text("scs_description"),
  active: boolean("scs_active").default(true),
  createdAt: timestamp("scs_created_at").defaultNow(),
  updatedAt: timestamp("scs_updated_at").defaultNow(),
});

// Infrastructure invoice table - scii (sis_costs_infra_invoice)
export const infraInvoice = pgTable("sis_costs_infra_invoice", {
  id: bigint("scii_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("scii_service_id", { mode: "number" }).notNull(),
  invoiceMonth: date("scii_invoice_month").notNull(),
  amount: decimal("scii_amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("scii_currency", { length: 3 }).default("USD"),
  createdAt: timestamp("scii_created_at").defaultNow(),
  updatedAt: timestamp("scii_updated_at").defaultNow(),
});

// License plan table - sclp (sis_costs_license_plan)
export const licensePlan = pgTable("sis_costs_license_plan", {
  id: bigint("sclp_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("sclp_service_id", { mode: "number" }).notNull(),
  monthlyUnitCost: decimal("sclp_monthly_unit_cost", { precision: 12, scale: 2 }).notNull(),
  qty: integer("sclp_qty").notNull().default(1),
  startMonth: date("sclp_start_month").notNull(),
  endMonth: date("sclp_end_month"),
  annualCommitmentEnd: date("sclp_annual_commitment_end"),
  createdAt: timestamp("sclp_created_at").defaultNow(),
  updatedAt: timestamp("sclp_updated_at").defaultNow(),
});

// Usage top-up table - scut (sis_costs_usage_topup)
export const usageTopup = pgTable("sis_costs_usage_topup", {
  id: bigint("scut_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("scut_service_id", { mode: "number" }).notNull(),
  topupDate: date("scut_topup_date").notNull(),
  amountPurchased: decimal("scut_amount_purchased", { precision: 12, scale: 2 }).notNull(),
  currency: char("scut_currency", { length: 3 }).default("USD"),
  createdAt: timestamp("scut_created_at").defaultNow(),
  updatedAt: timestamp("scut_updated_at").defaultNow(),
});

// Usage consumption table - scuc (sis_costs_usage_consumption)
export const usageConsumption = pgTable("sis_costs_usage_consumption", {
  id: bigint("scuc_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("scuc_service_id", { mode: "number" }).notNull(),
  consumptionDate: date("scuc_consumption_date").notNull(),
  amountConsumed: decimal("scuc_amount_consumed", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("scuc_created_at").defaultNow(),
  updatedAt: timestamp("scuc_updated_at").defaultNow(),
});

// Budget table - scb (sis_costs_budget)
export const budget = pgTable("sis_costs_budget", {
  id: bigint("scb_id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("scb_name", { length: 128 }).notNull(),
  categoryId: bigint("scb_category_id", { mode: "number" }),
  serviceId: bigint("scb_service_id", { mode: "number" }),
  budgetType: varchar("scb_budget_type", { length: 20 }).notNull().default("monthly"), // monthly, quarterly, yearly
  budgetAmount: decimal("scb_budget_amount", { precision: 12, scale: 2 }).notNull(),
  budgetPeriod: varchar("scb_budget_period", { length: 7 }).notNull(), // YYYY-MM format
  alertThreshold: integer("scb_alert_threshold").default(80), // percentage
  isActive: boolean("scb_is_active").default(true),
  createdAt: timestamp("scb_created_at").defaultNow(),
  updatedAt: timestamp("scb_updated_at").defaultNow(),
});

// Relations
export const serviceRelations = relations(service, ({ one, many }) => ({
  provider: one(provider, {
    fields: [service.providerId],
    references: [provider.id],
  }),
  category: one(serviceCategory, {
    fields: [service.categoryId],
    references: [serviceCategory.id],
  }),
  infraInvoices: many(infraInvoice),
  licensePlans: many(licensePlan),
  usageTopups: many(usageTopup),
  usageConsumption: many(usageConsumption),
  budgets: many(budget),
}));

export const providerRelations = relations(provider, ({ many }) => ({
  services: many(service),
}));

export const serviceCategoryRelations = relations(serviceCategory, ({ many }) => ({
  services: many(service),
  budgets: many(budget),
}));

export const infraInvoiceRelations = relations(infraInvoice, ({ one }) => ({
  service: one(service, {
    fields: [infraInvoice.serviceId],
    references: [service.id],
  }),
}));

export const licensePlanRelations = relations(licensePlan, ({ one }) => ({
  service: one(service, {
    fields: [licensePlan.serviceId],
    references: [service.id],
  }),
}));

export const usageTopupRelations = relations(usageTopup, ({ one }) => ({
  service: one(service, {
    fields: [usageTopup.serviceId],
    references: [service.id],
  }),
}));

export const usageConsumptionRelations = relations(usageConsumption, ({ one }) => ({
  service: one(service, {
    fields: [usageConsumption.serviceId],
    references: [service.id],
  }),
}));

export const budgetRelations = relations(budget, ({ one }) => ({
  service: one(service, {
    fields: [budget.serviceId],
    references: [service.id],
  }),
  category: one(serviceCategory, {
    fields: [budget.categoryId],
    references: [serviceCategory.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProviderSchema = createInsertSchema(provider).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(service).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInfraInvoiceSchema = createInsertSchema(infraInvoice).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicensePlanSchema = createInsertSchema(licensePlan).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageTopupSchema = createInsertSchema(usageTopup).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageConsumptionSchema = createInsertSchema(usageConsumption).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetSchema = createInsertSchema(budget).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategory.$inferSelect;

export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof provider.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof service.$inferSelect;

export type InsertInfraInvoice = z.infer<typeof insertInfraInvoiceSchema>;
export type InfraInvoice = typeof infraInvoice.$inferSelect;

export type InsertLicensePlan = z.infer<typeof insertLicensePlanSchema>;
export type LicensePlan = typeof licensePlan.$inferSelect;

export type InsertUsageTopup = z.infer<typeof insertUsageTopupSchema>;
export type UsageTopup = typeof usageTopup.$inferSelect;

export type InsertUsageConsumption = z.infer<typeof insertUsageConsumptionSchema>;
export type UsageConsumption = typeof usageConsumption.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budget.$inferSelect;

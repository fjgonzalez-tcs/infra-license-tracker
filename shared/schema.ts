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

// Service category table
export const serviceCategory = pgTable("service_category", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 64 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider table
export const provider = pgTable("provider", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 128 }).unique().notNull(),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service table
export const service = pgTable("service", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  providerId: bigint("provider_id", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Infrastructure invoice table
export const infraInvoice = pgTable("infra_invoice", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("service_id", { mode: "number" }).notNull(),
  invoiceMonth: date("invoice_month").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// License plan table
export const licensePlan = pgTable("license_plan", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("service_id", { mode: "number" }).notNull(),
  monthlyUnitCost: decimal("monthly_unit_cost", { precision: 12, scale: 2 }).notNull(),
  qty: integer("qty").notNull().default(1),
  startMonth: date("start_month").notNull(),
  endMonth: date("end_month"),
  annualCommitmentEnd: date("annual_commitment_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage top-up table
export const usageTopup = pgTable("usage_topup", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("service_id", { mode: "number" }).notNull(),
  topupDate: date("topup_date").notNull(),
  amountPurchased: decimal("amount_purchased", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).default("USD"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage consumption table
export const usageConsumption = pgTable("usage_consumption", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  serviceId: bigint("service_id", { mode: "number" }).notNull(),
  consumptionDate: date("consumption_date").notNull(),
  amountConsumed: decimal("amount_consumed", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
}));

export const providerRelations = relations(provider, ({ many }) => ({
  services: many(service),
}));

export const serviceCategoryRelations = relations(serviceCategory, ({ many }) => ({
  services: many(service),
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

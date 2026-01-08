import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  decimal,
  boolean,
  integer,
  uniqueIndex,
  serial,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// Enum for invoice status
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
  "partially_paid",
]);

// Enum for project status (optional)
export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "completed",
  "archived",
  "on_hold",
]);

// Users table - your app users (freelancers, agencies, etc.)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  companyName: varchar("company_name", { length: 255 }),
  address: text("address"),
  taxId: varchar("tax_id", { length: 50 }),
  currency: varchar("currency", { length: 3 }).default("NGN"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customers table
export const customers = pgTable("customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    address: text("address"),
    taxId: varchar("tax_id", { length: 50 }),
    currency: varchar("currency", { length: 3 }).default("USD"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
 (table) => [
    index("customers_user_idx").on(table.userId),
  ],
);

// Projects table
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    status: projectStatusEnum("status").default("active"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    budgetHours: decimal("budget_hours", { precision: 10, scale: 2 }),
    budgetAmount: decimal("budget_amount", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_user_idx").on(table.userId),
    index("projects_customer_idx").on(table.customerId),
  ],
);

// Time Entries table
export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    hours: decimal("hours", { precision: 8, scale: 2 }).notNull(),
    description: text("description").notNull(),
    billable: boolean("billable").default(true),
    billed: boolean("billed").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("time_entries_user_idx").on(table.userId),
    index("time_entries_project_idx").on(table.projectId),
    index("time_entries_date_idx").on(table.date),
  ],
);

// Invoices table
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(), 
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    status: invoiceStatusEnum("status").default("draft"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    terms: text("terms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoices_user_idx").on(table.userId),
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_status_idx").on(table.status),
    uniqueIndex("invoices_number_user_unique_idx").on(table.userId, table.invoiceNumber),
  ],
);

// Invoice Line Items
export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    taxable: boolean("taxable").default(true),
    order: integer("order").default(0),
  },
  (table) => [
    index("line_items_invoice_idx").on(table.invoiceId),
  ],
);

// Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    method: varchar("method", { length: 100 }),
    reference: varchar("reference", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_invoice_idx").on(table.invoiceId),
  ],
);
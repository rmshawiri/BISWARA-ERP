/**
 * Ressources Humaines — schéma Drizzle (employés, congés, présences).
 */
import { pgTable, text, uuid, integer, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

export const employees = pgTable(
  "employees",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    position: text("position"),
    department: text("department"),
    hireDate: text("hire_date"),
    annualLeaveDays: integer("annual_leave_days").notNull().default(30),
    status: status("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("employees_org_idx").on(t.organizationId)]
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("annual"), // annual | sick | personal | other
    startDate: text("start_date"),
    endDate: text("end_date"),
    days: integer("days").notNull().default(1),
    notes: text("notes"),
    status: status("pending"), // pending | approved | rejected
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("leave_requests_org_idx").on(t.organizationId)]
);

export type Employee = typeof employees.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

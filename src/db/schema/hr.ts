/**
 * Ressources Humaines — schéma Drizzle (employés, congés, présences).
 */
import { pgTable, text, uuid, integer, numeric, index } from "drizzle-orm/pg-core";
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

const money = (col: string) => numeric(col, { precision: 14, scale: 2, mode: "number" }).notNull().default(0);

export const contracts = pgTable(
  "contracts",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    contractType: text("contract_type").notNull().default("cdi"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    baseSalary: money("base_salary"),
    status: status("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("contracts_org_idx").on(t.organizationId)]
);

export const attendance = pgTable(
  "attendance",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    workDate: text("work_date"),
    clockIn: text("clock_in"),
    clockOut: text("clock_out"),
    status: status("present"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("attendance_org_idx").on(t.organizationId)]
);

export const payrolls = pgTable(
  "payrolls",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    baseSalary: money("base_salary"),
    bonus: money("bonus"),
    deductions: money("deductions"),
    gross: money("gross"),
    net: money("net"),
    status: status("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payrolls_org_idx").on(t.organizationId)]
);

/** Avances sur salaire (Portail Employé, self-service). */
export const salaryAdvances = pgTable(
  "salary_advances",
  {
    id: id(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
    amount: money("amount"),
    reason: text("reason"),
    status: status("pending"), // pending | approved | rejected | paid
    requestedAt: text("requested_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("salary_advances_org_idx").on(t.organizationId),
    index("salary_advances_emp_idx").on(t.employeeId),
  ]
);

export type Contract = typeof contracts.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Payroll = typeof payrolls.$inferSelect;
export type SalaryAdvance = typeof salaryAdvances.$inferSelect;

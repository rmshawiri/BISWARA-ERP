import { describe, it, expect } from "vitest";
import {
  products,
  productCategories,
  customers,
  opportunities,
  salesDocuments,
  payments,
  warehouses,
  stockMovements,
  inventoryCounts,
  suppliers,
  purchaseDocuments,
  accounts,
  financialTransactions,
  budgets,
  chartOfAccounts,
  journals,
  journalEntries,
  assets,
  employees,
  leaveRequests,
  contracts,
  attendance,
  payrolls,
  projects,
  projectTasks,
  vehicles,
  deliveries,
  drivers,
  routes,
  fuelLogs,
  maintenanceLogs,
  incidents,
  currencies,
  paymentMethods,
  apiKeys,
  webhooks,
} from "@/db/schema";

// Tables métier qui DOIVENT être isolées par organisation.
const ORG_TABLES = [
  products, productCategories, customers, opportunities, salesDocuments, payments,
  warehouses, stockMovements, inventoryCounts, suppliers, purchaseDocuments,
  accounts, financialTransactions, budgets, chartOfAccounts, journals, journalEntries,
  assets, employees, leaveRequests, contracts, attendance, payrolls,
  projects, projectTasks, vehicles, deliveries, drivers, routes, fuelLogs,
  maintenanceLogs, incidents, currencies, paymentMethods, apiKeys, webhooks,
];

describe("modèle multi-tenant (T4)", () => {
  it("toutes les tables métier exposent une colonne organizationId", () => {
    for (const t of ORG_TABLES) {
      expect(t.organizationId).toBeDefined();
    }
  });

  it("chaque entité a un identifiant unique (id)", () => {
    for (const t of ORG_TABLES) {
      expect(t.id).toBeDefined();
    }
  });
});

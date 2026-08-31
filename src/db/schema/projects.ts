/**
 * Gestion de Projets & Tâches — schéma Drizzle.
 */
import { pgTable, text, uuid, integer, boolean, index } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt, status } from "./helpers";
import { organizations } from "./core";

export const projects = pgTable(
  "projects",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    startDate: text("start_date"),
    dueDate: text("due_date"),
    status: status("active"), // active | done | archived
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_org_idx").on(t.organizationId)]
);

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    progress: integer("progress").notNull().default(0), // 0..100
    weight: integer("weight").notNull().default(1),
    dueDate: text("due_date"),
    done: boolean("done").notNull().default(false),
    status: text("status").notNull().default("todo"), // todo | in_progress | done | blocked
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("project_tasks_org_idx").on(t.organizationId)]
);

export type Project = typeof projects.$inferSelect;
export type ProjectTask = typeof projectTasks.$inferSelect;

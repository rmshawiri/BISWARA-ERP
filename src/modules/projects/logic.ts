/**
 * Gestion de Projets — logique métier pure (testable).
 */

export interface ProjectTask {
  id: string;
  progress: number; // 0..100
  weight: number; // poids relatif (default 1)
  done?: boolean;
}

/** Avancement pondéré d'un ensemble de tâches (0..100). */
export function aggregateProgress(tasks: ProjectTask[]): number {
  if (tasks.length === 0) return 0;
  const totalWeight = tasks.reduce((s, t) => s + (t.weight || 1), 0);
  if (totalWeight === 0) return 0;
  const sum = tasks.reduce((s, t) => s + t.progress * (t.weight || 1), 0);
  return Math.round((sum / totalWeight) * 100) / 100;
}

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

export function taskStatus(progress: number): TaskStatus {
  if (progress >= 100) return "done";
  if (progress > 0) return "in_progress";
  return "todo";
}

/** Échéance (daysUntil) / dépasse la deadline ?  */
export function isOverdue(dueDate: string, today: string): boolean {
  return new Date(dueDate).getTime() < new Date(today).getTime();
}

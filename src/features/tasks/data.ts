import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { tasks, type Task } from "@/db/schema";
import { ownsListForUser } from "@/features/lists/data";
import type { ActionResult } from "@/lib/action-result";
import type { TaskUpdate } from "./models";

const LIST_NOT_FOUND = { ok: false, error: "List not found." } as const;
const TASK_NOT_FOUND = { ok: false, error: "Task not found." } as const;

export async function createTaskForUser(
  userId: string,
  listId: string,
  title: string,
): Promise<ActionResult<Task>> {
  if (!(await ownsListForUser(userId, listId))) return LIST_NOT_FOUND;

  const [task] = await db
    .insert(tasks)
    .values({ userId, listId, title })
    .returning();

  return { ok: true, data: task };
}

export async function updateTaskForUser(
  userId: string,
  taskId: string,
  update: TaskUpdate,
): Promise<ActionResult<Task>> {
  if (update.listId && !(await ownsListForUser(userId, update.listId))) {
    return LIST_NOT_FOUND;
  }

  const [task] = await db
    .update(tasks)
    .set(update)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();
  if (!task) return TASK_NOT_FOUND;

  return { ok: true, data: task };
}

export async function deleteTaskForUser(
  userId: string,
  taskId: string,
): Promise<ActionResult> {
  const [task] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });
  if (!task) return TASK_NOT_FOUND;

  return { ok: true, data: undefined };
}

/** Most recently updated first. Unknown or foreign list IDs return no tasks. */
export function listTasksForUser(
  userId: string,
  listId: string,
): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.listId, listId)))
    .orderBy(desc(tasks.updatedAt));
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { lists, tasks, type List, type Task } from "@/db/schema";
import {
  listNameSchema,
  taskTitleSchema,
  taskUpdateSchema,
  type ActionResult,
  type TaskUpdate,
} from "@/lib/models";

const idSchema = z.uuid();

const UNAUTHORIZED = { ok: false, error: "You need to sign in." } as const;
const INVALID_INPUT = { ok: false, error: "Invalid input." } as const;
const LIST_NOT_FOUND = { ok: false, error: "List not found." } as const;
const TASK_NOT_FOUND = { ok: false, error: "Task not found." } as const;

async function ownsList(userId: string, listId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
  return row !== undefined;
}

export async function createList(name: string): Promise<ActionResult<List>> {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const parsed = listNameSchema.safeParse(name);
  if (!parsed.success) return INVALID_INPUT;

  const [list] = await db
    .insert(lists)
    .values({ userId, name: parsed.data })
    .returning();

  refresh();
  return { ok: true, data: list };
}

export async function renameList(
  listId: string,
  name: string,
): Promise<ActionResult<List>> {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const id = idSchema.safeParse(listId);
  const parsed = listNameSchema.safeParse(name);
  if (!id.success || !parsed.success) return INVALID_INPUT;

  const [list] = await db
    .update(lists)
    .set({ name: parsed.data })
    .where(and(eq(lists.id, id.data), eq(lists.userId, userId)))
    .returning();
  if (!list) return LIST_NOT_FOUND;

  refresh();
  return { ok: true, data: list };
}

/** Also deletes the list's tasks. The default list can't be deleted. */
export async function deleteList(listId: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const id = idSchema.safeParse(listId);
  if (!id.success) return INVALID_INPUT;

  const [list] = await db
    .select({ isDefault: lists.isDefault })
    .from(lists)
    .where(and(eq(lists.id, id.data), eq(lists.userId, userId)));
  if (!list) return LIST_NOT_FOUND;
  if (list.isDefault) {
    return { ok: false, error: "The default list can't be deleted." };
  }

  await db
    .delete(lists)
    .where(and(eq(lists.id, id.data), eq(lists.userId, userId)));

  refresh();
  return { ok: true, data: undefined };
}

export async function createTask(
  listId: string,
  title: string,
): Promise<ActionResult<Task>> {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const id = idSchema.safeParse(listId);
  const parsed = taskTitleSchema.safeParse(title);
  if (!id.success || !parsed.success) return INVALID_INPUT;
  if (!(await ownsList(userId, id.data))) return LIST_NOT_FOUND;

  const [task] = await db
    .insert(tasks)
    .values({ userId, listId: id.data, title: parsed.data })
    .returning();

  refresh();
  return { ok: true, data: task };
}

/** Partial update. Changing `listId` moves the task to another of the user's lists. */
export async function updateTask(
  taskId: string,
  update: TaskUpdate,
): Promise<ActionResult<Task>> {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const id = idSchema.safeParse(taskId);
  const parsed = taskUpdateSchema.safeParse(update);
  if (!id.success || !parsed.success) return INVALID_INPUT;
  if (Object.values(parsed.data).every((value) => value === undefined)) {
    return INVALID_INPUT;
  }

  if (parsed.data.listId && !(await ownsList(userId, parsed.data.listId))) {
    return LIST_NOT_FOUND;
  }

  const [task] = await db
    .update(tasks)
    .set(parsed.data)
    .where(and(eq(tasks.id, id.data), eq(tasks.userId, userId)))
    .returning();
  if (!task) return TASK_NOT_FOUND;

  refresh();
  return { ok: true, data: task };
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return UNAUTHORIZED;

  const id = idSchema.safeParse(taskId);
  if (!id.success) return INVALID_INPUT;

  const [task] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id.data), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });
  if (!task) return TASK_NOT_FOUND;

  refresh();
  return { ok: true, data: undefined };
}

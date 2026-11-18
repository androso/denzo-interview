import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { lists, tasks } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import type { ListDto } from "./models";

const LIST_NOT_FOUND = { ok: false, error: "List not found." } as const;

export async function createListForUser(
  userId: string,
  name: string,
): Promise<ActionResult<{ id: string }>> {
  const [list] = await db
    .insert(lists)
    .values({ userId, name })
    .returning({ id: lists.id });

  return { ok: true, data: list };
}

export async function renameListForUser(
  userId: string,
  listId: string,
  name: string,
): Promise<ActionResult> {
  const [list] = await db
    .update(lists)
    .set({ name })
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)))
    .returning({ id: lists.id });
  if (!list) return LIST_NOT_FOUND;

  return { ok: true, data: undefined };
}

export async function deleteListForUser(
  userId: string,
  listId: string,
): Promise<ActionResult> {
  const [list] = await db
    .select({ isDefault: lists.isDefault })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
  if (!list) return LIST_NOT_FOUND;
  if (list.isDefault) {
    return { ok: false, error: "The default list can't be deleted." };
  }

  await db
    .delete(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));

  return { ok: true, data: undefined };
}

export async function ownsListForUser(
  userId: string,
  listId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: lists.id })
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));
  return row !== undefined;
}

export function listListsForUser(userId: string): Promise<ListDto[]> {
  return db
    .select({
      id: lists.id,
      name: lists.name,
      isDefault: lists.isDefault,
      taskCount: count(tasks.id),
    })
    .from(lists)
    .leftJoin(tasks, eq(tasks.listId, lists.id))
    .where(eq(lists.userId, userId))
    .groupBy(lists.id)
    .orderBy(desc(lists.isDefault), asc(lists.createdAt));
}

export async function ensureDefaultListForUser(userId: string): Promise<void> {
  await db
    .insert(lists)
    .values({ userId, name: "My Tasks", isDefault: true })
    .onConflictDoNothing();
}

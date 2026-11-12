import { auth, currentUser } from "@clerk/nextjs/server";
import { and, asc, count, desc, eq, getTableColumns } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  lists,
  tasks,
  users,
  type List,
  type Task,
  type User,
} from "@/db/schema";

export type ListWithCount = List & { taskCount: number };

const DEFAULT_LIST_NAME = "My Tasks";

async function createUserWithDefaultList(userId: string): Promise<void> {
  const clerkUser = await currentUser();
  const name =
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    "User";

  await db.insert(users).values({ id: userId, name }).onConflictDoNothing();
  await db
    .insert(lists)
    .values({ userId, name: DEFAULT_LIST_NAME, isDefault: true })
    .onConflictDoNothing();
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth.protect();

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
}

function selectListsWithCounts(userId: string) {
  return db
    .select({ ...getTableColumns(lists), taskCount: count(tasks.id) })
    .from(lists)
    .leftJoin(tasks, eq(tasks.listId, lists.id))
    .where(eq(lists.userId, userId))
    .groupBy(lists.id)
    .orderBy(desc(lists.isDefault), asc(lists.createdAt));
}

/**
 * The default list comes first. On a new user's first call, this also creates
 * their user row (name taken from Clerk) and their "My Tasks" list.
 */
export async function listLists(): Promise<ListWithCount[]> {
  const { userId } = await auth.protect();

  const rows = await selectListsWithCounts(userId);
  if (rows.length > 0) {
    return rows;
  }

  await createUserWithDefaultList(userId);
  return selectListsWithCounts(userId);
}

/** Most recently updated first. Returns [] for unknown or foreign list ids. */
export async function listTasks(listId: string): Promise<Task[]> {
  const { userId } = await auth.protect();

  if (!z.uuid().safeParse(listId).success) {
    return [];
  }

  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.listId, listId)))
    .orderBy(desc(tasks.updatedAt));
}

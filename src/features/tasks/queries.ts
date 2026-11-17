import "server-only";

import { auth } from "@clerk/nextjs/server";

import { idSchema } from "@/lib/validation";
import { listTasksForUser } from "./data";

export async function listTasks(listId: string) {
  const { userId } = await auth.protect();
  const id = idSchema.safeParse(listId);
  if (!id.success) return [];
  return listTasksForUser(userId, id.data);
}

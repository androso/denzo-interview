import "server-only";

import { auth } from "@clerk/nextjs/server";

import { syncCurrentUser } from "@/features/users/queries";
import { ensureDefaultListForUser, listListsForUser } from "./data";
import type { ListDto } from "./models";

/** Copies the Clerk user, then creates the default list on the first read. */
export async function listLists(): Promise<ListDto[]> {
  const { userId } = await auth.protect();
  await syncCurrentUser(userId);

  const rows = await listListsForUser(userId);
  if (rows.length > 0) return rows;

  await ensureDefaultListForUser(userId);
  return listListsForUser(userId);
}

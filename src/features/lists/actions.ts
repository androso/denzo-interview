"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";

import type { List } from "@/db/schema";
import type { ActionResult } from "@/lib/action-result";
import { idSchema } from "@/lib/validation";
import {
  createListForUser,
  renameListForUser,
  deleteListForUser,
} from "./data";
import { listNameSchema } from "./models";

const INVALID_INPUT = { ok: false, error: "Invalid input." } as const;

export async function createList(name: string): Promise<ActionResult<List>> {
  const { userId } = await auth.protect();

  const parsed = listNameSchema.safeParse(name);
  if (!parsed.success) return INVALID_INPUT;

  const result = await createListForUser(userId, parsed.data);
  if (result.ok) refresh();
  return result;
}

export async function renameList(
  listId: string,
  name: string,
): Promise<ActionResult<List>> {
  const { userId } = await auth.protect();

  const id = idSchema.safeParse(listId);
  const parsed = listNameSchema.safeParse(name);
  if (!id.success || !parsed.success) return INVALID_INPUT;

  const result = await renameListForUser(userId, id.data, parsed.data);
  if (result.ok) refresh();
  return result;
}

export async function deleteList(listId: string): Promise<ActionResult> {
  const { userId } = await auth.protect();

  const id = idSchema.safeParse(listId);
  if (!id.success) return INVALID_INPUT;

  const result = await deleteListForUser(userId, id.data);
  if (result.ok) refresh();
  return result;
}
